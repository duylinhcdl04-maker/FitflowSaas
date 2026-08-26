import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { MailService } from '../../mail/mail.service';
import { writeAuditLog } from '../../common/utils/audit';
import { generateOtp } from '../../common/utils/otp';
import { ROLE } from '../../common/types/role';
import { OwnerSeedService } from '../seed/owner-seed.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResendOtpByEmailDto } from './dto/resend-otp-by-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const OTP_PURPOSE = 'REGISTER_VERIFY';
const FORGOT_PASSWORD_OTP_PURPOSE = 'FORGOT_PASSWORD';
const CHANGE_PASSWORD_OTP_PURPOSE = 'CHANGE_PASSWORD';
const OTP_TTL_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const TRIAL_PLAN_CODE = 'TRIAL';
const DEMO_DATA_SETTING_KEY = 'demo_data';

/**
 * OW-00/OW-01/OW-02. Mã OTP được gửi qua email thật (MailService, SMTP cấu
 * hình ở .env) — KHÔNG trả mã trong response API.
 *
 * `register()` tạo User + Tenant + Subscription (Trial) trong CÙNG MỘT giao
 * dịch: `users` có CHECK constraint `ck_user_tenant_scope` ở DB —
 * `user_type = 'TENANT'` bắt buộc `tenant_id IS NOT NULL` ngay từ khi tạo
 * row, nên không thể tạo Account "chờ tạo Tenant sau" như thiết kế ban đầu
 * (BE_Owner.md viết trước khi biết ràng buộc này). Frontend vẫn hiển thị đây
 * là 2 bước (thông tin cá nhân → thông tin doanh nghiệp) nhưng chỉ gọi API
 * một lần ở bước cuối.
 */
@Injectable()
export class OwnerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
    private readonly ownerSeedService: OwnerSeedService,
  ) {}

  /**
   * Bước 1 của đăng nhập (kiểu KiotViet "tên cửa hàng → .fitflow.vn"). Trả về
   * thông tin công khai tối thiểu (tên hiển thị) để cá nhân hoá bước 2 —
   * không phải cổng xác thực, chỉ để định tuyến/hiển thị.
   */
  async lookupTenant(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { code: slug },
      select: { code: true, name: true, status: true },
    });
    if (!tenant)
      throw new NotFoundException('Không tìm thấy cửa hàng với địa chỉ này');
    if (tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE') {
      throw new NotFoundException('Cửa hàng này hiện không hoạt động');
    }
    return { code: tenant.code, name: tenant.name };
  }

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
    });
    if (existingEmail) throw new ConflictException('Email này đã được sử dụng');

    const existingSlug = await this.prisma.tenant.findUnique({
      where: { code: dto.brandSlug },
    });
    if (existingSlug)
      throw new ConflictException('Địa chỉ truy cập này đã được sử dụng');

    const trialPlan = await this.prisma.saasPlan.findUnique({
      where: { code: TRIAL_PLAN_CODE },
    });
    if (!trialPlan || trialPlan.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Thiếu cấu hình gói Dùng thử trong hệ thống',
      );
    }
    const ownerRole = await this.prisma.roles.findUnique({
      where: { code: ROLE.OWNER },
    });
    if (!ownerRole)
      throw new BadRequestException('Thiếu cấu hình role OWNER trong hệ thống');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const startDate = new Date();
    const trialEndsAt = new Date(startDate);
    trialEndsAt.setDate(trialEndsAt.getDate() + (trialPlan.trial_days || 7));

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          code: dto.brandSlug,
          name: dto.businessName,
          contact_email: dto.contactEmail,
          contact_phone: dto.contactPhone,
          address: dto.address,
          status: 'ACTIVE',
        },
      });

      // BR-TENANT-SCOPE-01 (ck_user_tenant_scope ở DB): user_type=TENANT bắt
      // buộc tenant_id khác null ngay từ khi tạo, nên Tenant phải có trước.
      const user = await tx.user.create({
        data: {
          tenant_id: tenant.id,
          user_type: 'TENANT',
          email: dto.email,
          phone: dto.phone,
          full_name: dto.fullName,
          password_hash: passwordHash,
          status: 'PENDING',
          has_used_trial: true,
        },
      });

      await tx.tenant.update({
        where: { id: tenant.id },
        data: { created_by: user.id },
      });

      if (dto.businessType) {
        await tx.tenantSettings.create({
          data: {
            tenant_id: tenant.id,
            setting_key: 'business_type',
            setting_value: { value: dto.businessType },
            updated_by: user.id,
          },
        });
      }

      // OW-03b: chỉ ghi lại lựa chọn ở đây — dữ liệu mẫu thực sự được tạo ở
      // verify() (chỉ tài khoản đã xác thực OTP mới nhận dữ liệu mẫu).
      await tx.tenantSettings.create({
        data: {
          tenant_id: tenant.id,
          setting_key: DEMO_DATA_SETTING_KEY,
          setting_value: { requested: !!dto.seedSampleData, seededAt: null },
          updated_by: user.id,
        },
      });

      await tx.user_roles.create({
        data: {
          user_id: user.id,
          role_id: ownerRole.id,
          tenant_id: tenant.id,
          assigned_by: user.id,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          tenant_id: tenant.id,
          plan_id: trialPlan.id,
          status: 'TRIAL',
          start_date: startDate,
          end_date: trialEndsAt,
          trial_ends_at: trialEndsAt,
          billing_cycle: trialPlan.billing_cycle,
          billing_cycle_months: trialPlan.billing_cycle_months,
          price: 0,
          currency: trialPlan.currency,
          created_by: user.id,
        },
      });

      await tx.trialHistory.create({
        data: {
          user_id: user.id,
          tenant_id: tenant.id,
          start_at: startDate,
          end_at: trialEndsAt,
          status: 'ACTIVE',
        },
      });

      return { tenant, user, subscription };
    });

    await writeAuditLog(this.prisma, {
      tenantId: result.tenant.id,
      actorUserId: result.user.id,
      actorRole: ROLE.OWNER,
      entityType: 'TENANT',
      entityId: result.tenant.id,
      action: 'TENANT_CREATED',
      afterData: {
        code: dto.brandSlug,
        name: dto.businessName,
        planCode: TRIAL_PLAN_CODE,
      },
    });

    await this.issueOtp(result.user.id, dto.email);

    return {
      userId: result.user.id,
      email: dto.email,
      expiresInSeconds: OTP_TTL_MINUTES * 60,
    };
  }

  async resend(dto: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    if (user.status !== 'PENDING') {
      throw new BadRequestException('Tài khoản đã được xác thực');
    }

    return this.resendForUser(user);
  }

  /**
   * OW-01b. Khôi phục cho tài khoản PENDING "mồ côi" — Owner đăng ký xong bỏ
   * dở bước OTP (đóng tab, mất state `userId` chỉ tồn tại trong bộ nhớ trình
   * duyệt), sau đó không đăng ký lại được (email đã dùng) và cũng không đăng
   * nhập được (chưa kích hoạt). Tra theo email để họ tự khôi phục mà không
   * cần userId. Trả về cùng userId để điều hướng thẳng vào VerifyOtpPage.
   */
  async resendByEmail(dto: ResendOtpByEmailDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        user_type: 'TENANT',
        email: { equals: dto.email, mode: 'insensitive' },
      },
    });
    if (!user || user.status !== 'PENDING') {
      throw new BadRequestException(
        'Không tìm thấy tài khoản đang chờ kích hoạt với email này. Nếu tài khoản đã kích hoạt, hãy đăng nhập.',
      );
    }

    return this.resendForUser(user);
  }

  private async resendForUser(
    user: { id: string; email: string | null },
    purpose = OTP_PURPOSE,
  ) {
    const lastOtp = await this.prisma.otpCode.findFirst({
      where: { user_id: user.id, purpose },
      orderBy: { created_at: 'desc' },
    });
    if (lastOtp) {
      const secondsSinceLast =
        (Date.now() - lastOtp.created_at.getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        throw new BadRequestException(
          `Vui lòng đợi ${Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast)} giây trước khi gửi lại mã`,
        );
      }
    }

    await this.issueOtp(user.id, user.email!, purpose);
    return {
      userId: user.id,
      email: user.email,
      expiresInSeconds: OTP_TTL_MINUTES * 60,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        user_type: 'TENANT',
        email: { equals: dto.email, mode: 'insensitive' },
      },
    });
    if (!user) {
      throw new NotFoundException('Không tìm thấy tài khoản với email này');
    }
    if (user.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Tài khoản chưa được kích hoạt hoặc đã bị tạm ngưng',
      );
    }

    return this.resendForUser(user, FORGOT_PASSWORD_OTP_PURPOSE);
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    const otp = await this.prisma.otpCode.findFirst({
      where: { user_id: user.id, purpose: FORGOT_PASSWORD_OTP_PURPOSE },
      orderBy: { created_at: 'desc' },
    });
    if (!otp) {
      throw new BadRequestException(
        'Chưa yêu cầu mã xác nhận khôi phục mật khẩu, vui lòng gửi lại mã',
      );
    }
    if (otp.consumed_at) {
      throw new BadRequestException(
        'Mã đã được sử dụng, vui lòng gửi lại mã mới',
      );
    }
    if (otp.expires_at < new Date()) {
      throw new BadRequestException('Mã đã hết hạn, vui lòng gửi lại mã mới');
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Đã nhập sai quá số lần cho phép, vui lòng gửi lại mã mới',
      );
    }

    const matches = await bcrypt.compare(dto.code, otp.code_hash);
    if (!matches) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Mã xác nhận không đúng');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumed_at: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { password_hash: passwordHash },
      }),
    ]);

    if (user.tenant_id) {
      await writeAuditLog(this.prisma, {
        tenantId: user.tenant_id,
        actorUserId: user.id,
        actorRole: ROLE.OWNER,
        entityType: 'USER',
        entityId: user.id,
        action: 'PASSWORD_RESET',
      });
    }

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.',
    };
  }

  async requestChangePasswordOtp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    if (!user.email) {
      throw new BadRequestException('Tài khoản chưa đăng ký email');
    }

    return this.resendForUser(user, CHANGE_PASSWORD_OTP_PURPOSE);
  }

  async changePasswordWithOtp(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');

    if (dto.currentPassword && user.password_hash) {
      const isCurrentPasswordValid = await bcrypt.compare(
        dto.currentPassword,
        user.password_hash,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Mật khẩu hiện tại không đúng');
      }
    }

    const otp = await this.prisma.otpCode.findFirst({
      where: { user_id: user.id, purpose: CHANGE_PASSWORD_OTP_PURPOSE },
      orderBy: { created_at: 'desc' },
    });
    if (!otp) {
      throw new BadRequestException(
        'Chưa yêu cầu mã xác nhận đổi mật khẩu, vui lòng bấm gửi mã OTP',
      );
    }
    if (otp.consumed_at) {
      throw new BadRequestException(
        'Mã OTP đã được sử dụng, vui lòng gửi lại mã mới',
      );
    }
    if (otp.expires_at < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn, vui lòng gửi lại mã mới');
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Đã nhập sai quá số lần cho phép, vui lòng gửi lại mã mới',
      );
    }

    const matches = await bcrypt.compare(dto.code, otp.code_hash);
    if (!matches) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Mã xác nhận không đúng');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumed_at: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { password_hash: passwordHash },
      }),
    ]);

    if (user.tenant_id) {
      await writeAuditLog(this.prisma, {
        tenantId: user.tenant_id,
        actorUserId: user.id,
        actorRole: ROLE.OWNER,
        entityType: 'USER',
        entityId: user.id,
        action: 'PASSWORD_CHANGED',
      });
    }

    return {
      success: true,
      message: 'Đổi mật khẩu thành công.',
    };
  }

  async verify(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    if (user.status !== 'PENDING') {
      throw new BadRequestException('Tài khoản đã được xác thực');
    }

    const otp = await this.prisma.otpCode.findFirst({
      where: { user_id: user.id, purpose: OTP_PURPOSE },
      orderBy: { created_at: 'desc' },
    });
    if (!otp)
      throw new BadRequestException(
        'Chưa yêu cầu mã xác nhận, vui lòng gửi lại mã',
      );
    if (otp.consumed_at)
      throw new BadRequestException(
        'Mã đã được sử dụng, vui lòng gửi lại mã mới',
      );
    if (otp.expires_at < new Date())
      throw new BadRequestException('Mã đã hết hạn, vui lòng gửi lại mã mới');
    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Đã nhập sai quá số lần cho phép, vui lòng gửi lại mã mới',
      );
    }

    const matches = await bcrypt.compare(dto.code, otp.code_hash);
    if (!matches) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Mã xác nhận không đúng');
    }

    await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumed_at: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { status: 'ACTIVE' },
      }),
    ]);

    const session = await this.authService.issueSessionForUser(user.id);

    // OW-03 Welcome cần biết Tenant/Trial vừa tạo — tenant_id luôn có sẵn từ register().
    const subscription = user.tenant_id
      ? await this.prisma.subscription.findUnique({
          where: { tenant_id: user.tenant_id },
        })
      : null;

    const seeded = user.tenant_id
      ? await this.maybeSeedDemoData(user.tenant_id, user.id)
      : false;

    return {
      ...session,
      tenant: user.tenant_id ? { id: user.tenant_id } : null,
      subscription: subscription
        ? { trialEndsAt: subscription.trial_ends_at }
        : null,
      seededSampleData: seeded,
    };
  }

  /** OW-03b: chỉ chạy đúng một lần — đánh dấu seededAt ngay sau khi tạo xong. */
  private async maybeSeedDemoData(
    tenantId: string,
    ownerUserId: string,
  ): Promise<boolean> {
    const setting = await this.prisma.tenantSettings.findUnique({
      where: {
        tenant_id_setting_key: {
          tenant_id: tenantId,
          setting_key: DEMO_DATA_SETTING_KEY,
        },
      },
    });
    const value = setting?.setting_value as
      { requested?: boolean; seededAt?: string | null } | undefined;
    if (!value?.requested || value.seededAt) return false;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    await this.ownerSeedService.seedDemoData(
      tenantId,
      ownerUserId,
      tenant?.name ?? 'FitFlow',
    );

    await this.prisma.tenantSettings.update({
      where: {
        tenant_id_setting_key: {
          tenant_id: tenantId,
          setting_key: DEMO_DATA_SETTING_KEY,
        },
      },
      data: {
        setting_value: { requested: true, seededAt: new Date().toISOString() },
        updated_by: ownerUserId,
      },
    });

    return true;
  }

  private async issueOtp(userId: string, email: string, purpose = OTP_PURPOSE) {
    const code = generateOtp();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.otpCode.create({
      data: {
        user_id: userId,
        purpose,
        code_hash: codeHash,
        expires_at: expiresAt,
      },
    });

    await this.mailService.sendOtpEmail(email, code, purpose);

    return { expiresAt };
  }
}
