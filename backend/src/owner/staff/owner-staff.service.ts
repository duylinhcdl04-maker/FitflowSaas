import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { writeAuditLog } from '../../common/utils/audit';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';

const INVITE_TTL_DAYS = 7;

@Injectable()
export class OwnerStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async list(tenantId: string) {
    const [users, invitations] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenant_id: tenantId, user_type: 'TENANT' },
        include: {
          user_roles: { include: { roles: true } },
          user_branches: { include: { branches: true } },
        },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.invitation.findMany({
        where: { tenant_id: tenantId, status: 'PENDING' },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      // BRANCH_MANAGER giờ có trang riêng (owner/branch-managers) — không hiện
      // trùng ở đây nữa.
      staff: users
        .filter(
          (u) =>
            !u.user_roles.some(
              (ur) =>
                ur.roles.code === ROLE.OWNER ||
                ur.roles.code === ROLE.BRANCH_MANAGER,
            ),
        )
        .map((u) => ({
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          status: u.status,
          roles: u.user_roles.map((ur) => ur.roles.code),
          branches: u.user_branches.map((ub) => ub.branches.name),
          lastLoginAt: u.last_login_at,
        })),
      pendingInvitations: invitations.map((i) => ({
        id: i.id,
        roleCode: i.role_code,
        expiresAt: i.expires_at,
        createdAt: i.created_at,
      })),
    };
  }

  /** OW-04b. BR-INVITE-01: nhân sự tự đặt mật khẩu qua link mời, Owner không đặt hộ. */
  async invite(tenantId: string, dto: InviteStaffDto, actor: RequestUser) {
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
    });
    if (existing) throw new ConflictException('Email này đã được sử dụng');

    const role = await this.prisma.roles.findUnique({
      where: { code: dto.roleCode },
    });
    if (!role)
      throw new BadRequestException(
        `Thiếu cấu hình role ${dto.roleCode} trong hệ thống`,
      );

    if (dto.branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, tenant_id: tenantId },
      });
      if (!branch) throw new BadRequestException('Không tìm thấy chi nhánh');
    }

    const rawToken = randomBytes(24).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(
      Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      // Tạo user PENDING ngay — chưa có mật khẩu, nhân sự tự đặt khi chấp nhận.
      const user = await tx.user.create({
        data: {
          tenant_id: tenantId,
          user_type: 'TENANT',
          email: dto.email,
          full_name: dto.fullName,
          status: 'PENDING',
          created_by: actor.id,
        },
      });

      await tx.user_roles.create({
        data: {
          user_id: user.id,
          role_id: role.id,
          tenant_id: tenantId,
          assigned_by: actor.id,
        },
      });

      if (dto.branchId) {
        await tx.user_branches.create({
          data: {
            user_id: user.id,
            branch_id: dto.branchId,
            tenant_id: tenantId,
            is_primary: true,
            assigned_by: actor.id,
          },
        });
      }

      const invitation = await tx.invitation.create({
        data: {
          tenant_id: tenantId,
          user_id: user.id,
          role_code: dto.roleCode,
          branch_id: dto.branchId,
          token_hash: tokenHash,
          status: 'PENDING',
          invited_by: actor.id,
          expires_at: expiresAt,
        },
      });

      return { user, invitation };
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    const acceptUrl = `${process.env.FRONTEND_URL}/owner/invite/${result.invitation.id}?token=${rawToken}`;
    await this.mailService.sendInvitationEmail(
      dto.email,
      dto.fullName,
      tenant?.name ?? 'FitFlow',
      acceptUrl,
    );

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'USER',
      entityId: result.user.id,
      action: 'STAFF_INVITED',
      afterData: {
        email: dto.email,
        roleCode: dto.roleCode,
        branchId: dto.branchId,
      },
    });

    return { invitationId: result.invitation.id, email: dto.email };
  }

  /** Public — người được mời chưa có phiên đăng nhập. */
  async acceptInvite(dto: AcceptInviteDto) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: dto.invitationId },
    });
    if (!invitation) throw new NotFoundException('Không tìm thấy lời mời');
    if (invitation.status !== 'PENDING') {
      throw new BadRequestException(
        'Lời mời này đã được sử dụng hoặc đã bị thu hồi',
      );
    }
    if (invitation.expires_at < new Date()) {
      throw new BadRequestException(
        'Lời mời đã hết hạn, vui lòng liên hệ chủ doanh nghiệp để được mời lại',
      );
    }

    const matches = await bcrypt.compare(dto.token, invitation.token_hash);
    if (!matches) throw new BadRequestException('Liên kết không hợp lệ');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: invitation.user_id },
        data: { password_hash: passwordHash, status: 'ACTIVE' },
      }),
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'ACCEPTED', accepted_at: new Date() },
      }),
    ]);

    // Chưa có ứng dụng riêng cho Branch Manager/Staff/PT trong repo này — chỉ
    // kích hoạt tài khoản, không cấp phiên đăng nhập vì chưa có nơi để vào.
    return { activated: true, roleCode: invitation.role_code };
  }
}
