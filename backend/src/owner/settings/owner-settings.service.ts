import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import type { RequestUser } from '../../common/types/jwt-payload';
import { UpdateCheckinConfigDto } from './dto/update-checkin-config.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreatePaymentAccountDto } from './dto/create-payment-account.dto';
import { UpdatePaymentAccountDto } from './dto/update-payment-account.dto';
import { UpdateAutoCheckoutPolicyDto } from './dto/update-auto-checkout-policy.dto';
import { AutoCheckoutPolicyService } from '../../auto-checkout/auto-checkout-policy.service';

const CHECKIN_CONFIG_KEY = 'checkin_methods';
const DEFAULT_CHECKIN_CONFIG = { qr: true, manual: true, face: false };
const BANK_LIST_TTL_MS = 24 * 60 * 60 * 1000; // VietQR's bank list barely ever changes.

export interface VietQrBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

@Injectable()
export class OwnerSettingsService {
  private bankListCache: { data: VietQrBank[]; fetchedAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly autoCheckoutPolicy: AutoCheckoutPolicyService,
  ) {}

  // Auto check-out policy (OW-xx): forgotten check-ins/guest visits get closed automatically,
  // either N hours after check-in or at the branch's configured closing time. Actual
  // computation/storage lives in AutoCheckoutPolicyService — this is a thin passthrough so
  // the route surface stays consistent with the rest of Owner Settings.
  async getAutoCheckoutPolicy(tenantId: string) {
    return this.autoCheckoutPolicy.getPolicy(tenantId);
  }

  async updateAutoCheckoutPolicy(tenantId: string, dto: UpdateAutoCheckoutPolicyDto, actor: RequestUser) {
    const policy = dto.mode === 'DURATION' ? { mode: 'DURATION' as const, hours: dto.hours! } : { mode: 'CLOSING_TIME' as const };
    return this.autoCheckoutPolicy.setPolicy(tenantId, policy, actor);
  }

  /** Free, public, unauthenticated — VietQR's list of NAPAS-member banks (bin/code/shortName/logo). */
  async listBanks(): Promise<VietQrBank[]> {
    if (this.bankListCache && Date.now() - this.bankListCache.fetchedAt < BANK_LIST_TTL_MS) {
      return this.bankListCache.data;
    }

    try {
      const res = await fetch('https://api.vietqr.io/v2/banks');
      const json = await res.json();
      const banks = (json?.data as VietQrBank[]) || [];
      this.bankListCache = { data: banks, fetchedAt: Date.now() };
      return banks;
    } catch {
      // Serve stale cache rather than fail the whole Settings page if VietQR is briefly down.
      if (this.bankListCache) return this.bankListCache.data;
      throw new BadRequestException('Không thể tải danh sách ngân hàng từ VietQR. Vui lòng thử lại.');
    }
  }

  /**
   * Auto-fills the real account holder name from bank BIN + account number, via
   * VietQR.io's lookup API (https://api.vietqr.io/v2/lookup). Requires the SaaS
   * platform's own VIETQR_CLIENT_ID/VIETQR_API_KEY (shared across all tenants —
   * distinct from each tenant's own SePay webhook key).
   */
  async lookupAccountName(bin: string, accountNumber: string): Promise<{ accountName: string }> {
    const clientId = process.env.VIETQR_CLIENT_ID;
    const apiKey = process.env.VIETQR_API_KEY;
    if (!clientId || !apiKey) {
      throw new BadRequestException(
        'Tính năng tự động tra tên chủ tài khoản chưa được cấu hình trên hệ thống. Vui lòng nhập tên chủ tài khoản thủ công.',
      );
    }

    const res = await fetch('https://api.vietqr.io/v2/lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': clientId,
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ bin, accountNumber }),
    });
    const json = await res.json();

    if (json?.code !== '00' || !json?.data?.accountName) {
      throw new BadRequestException(
        json?.desc || 'Không tìm thấy chủ tài khoản. Vui lòng kiểm tra lại số tài khoản hoặc nhập tên thủ công.',
      );
    }

    return { accountName: json.data.accountName };
  }

  async getCheckinConfig(tenantId: string) {
    const row = await this.prisma.tenantSettings.findUnique({
      where: {
        tenant_id_setting_key: {
          tenant_id: tenantId,
          setting_key: CHECKIN_CONFIG_KEY,
        },
      },
    });
    return (
      (row?.setting_value as typeof DEFAULT_CHECKIN_CONFIG | undefined) ??
      DEFAULT_CHECKIN_CONFIG
    );
  }

  /** OW-04d. Không có feature code riêng cho Manual — luôn cho phép (đúng Bussinessrule_PackageSaas.md: gói Basic đã có Manual Check-in). */
  async updateCheckinConfig(
    tenantId: string,
    dto: UpdateCheckinConfigDto,
    actor: RequestUser,
  ) {
    if (dto.qr)
      await this.assertFeatureEnabled(
        tenantId,
        'QR_CHECKIN',
        'Check-in bằng QR',
      );
    if (dto.face)
      await this.assertFeatureEnabled(
        tenantId,
        'FACE_RECOGNITION',
        'Nhận diện khuôn mặt',
      );

    const value = { qr: dto.qr, manual: true, face: dto.face };
    await this.prisma.tenantSettings.upsert({
      where: {
        tenant_id_setting_key: {
          tenant_id: tenantId,
          setting_key: CHECKIN_CONFIG_KEY,
        },
      },
      create: {
        tenant_id: tenantId,
        setting_key: CHECKIN_CONFIG_KEY,
        setting_value: value,
        updated_by: actor.id,
      },
      update: {
        setting_value: value,
        updated_by: actor.id,
        updated_at: new Date(),
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'TENANT_SETTINGS',
      action: 'CHECKIN_CONFIG_UPDATED',
      afterData: value,
    });

    return value;
  }

  /** OW-04. Tiến độ tính trực tiếp từ dữ liệu thật — không lưu cờ riêng để tránh lệch trạng thái. */
  async getOnboardingProgress(tenantId: string) {
    const [
      branchCount,
      staffCount,
      pendingInvitations,
      packageCount,
      checkinConfigured,
    ] = await Promise.all([
      this.prisma.branch.count({ where: { tenant_id: tenantId } }),
      this.prisma.user.count({
        where: {
          tenant_id: tenantId,
          user_type: 'TENANT',
          NOT: { user_roles: { some: { roles: { code: 'OWNER' } } } },
        },
      }),
      this.prisma.invitation.count({
        where: { tenant_id: tenantId, status: 'PENDING' },
      }),
      this.prisma.membershipPackage.count({ where: { tenant_id: tenantId } }),
      this.prisma.tenantSettings.count({
        where: { tenant_id: tenantId, setting_key: CHECKIN_CONFIG_KEY },
      }),
    ]);

    return {
      branchCreated: branchCount > 0,
      staffInvited: staffCount > 0 || pendingInvitations > 0,
      packageCreated: packageCount > 0,
      checkinConfigured: checkinConfigured > 0,
    };
  }

  private async assertFeatureEnabled(
    tenantId: string,
    featureCode: string,
    label: string,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenant_id: tenantId },
      include: {
        saas_plans: {
          include: {
            saas_plan_features: { include: { platform_features: true } },
          },
        },
      },
    });
    const enabled = subscription?.saas_plans.saas_plan_features.some(
      (f) => f.platform_features.code === featureCode && f.is_enabled,
    );
    if (!enabled) {
      throw new BadRequestException(
        `Gói hiện tại chưa mở khoá tính năng "${label}"`,
      );
    }
  }

  // Tenant settings
  async getTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        code: true,
        name: true,
        contact_email: true,
        contact_phone: true,
        address: true,
        logo_url: true,
      },
    });
    if (!tenant) throw new NotFoundException('Không tìm thấy doanh nghiệp');
    return tenant;
  }

  async updateTenant(tenantId: string, dto: UpdateTenantDto, actor: RequestUser) {
    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: dto.name,
        contact_email: dto.contact_email,
        contact_phone: dto.contact_phone,
        address: dto.address,
        logo_url: dto.logo_url,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'TENANT',
      action: 'TENANT_BRAND_UPDATED',
      afterData: dto,
    });

    return updated;
  }

  // Payment accounts settings

  /** Never leak the raw SePay key back to the client; mask it and attach the webhook URL to paste into SePay's dashboard. */
  private presentPaymentAccount<T extends { id: string; tenant_id: string; sepay_api_key: string | null }>(account: T) {
    const { sepay_api_key, ...rest } = account;
    const base = process.env.PUBLIC_APP_URL || 'http://localhost:5000';
    const prefix = (process.env.API_PREFIX || '/api/v1').replace(/^\/?/, '/');
    return {
      ...rest,
      sepayApiKeyMasked: sepay_api_key ? `••••${sepay_api_key.slice(-4)}` : null,
      webhookUrl: `${base}${prefix}/webhooks/sepay/${account.tenant_id}/${account.id}`,
    };
  }

  async listPaymentAccounts(tenantId: string) {
    const accounts = await this.prisma.payment_accounts.findMany({
      where: { tenant_id: tenantId, status: 'ACTIVE' },
      orderBy: { created_at: 'desc' },
    });
    return accounts.map((a) => this.presentPaymentAccount(a));
  }

  async createPaymentAccount(tenantId: string, dto: CreatePaymentAccountDto, actor: RequestUser) {
    // Nếu thiết lập default = true, bỏ default ở các tài khoản khác của cùng tenant
    if (dto.isDefault) {
      await this.prisma.payment_accounts.updateMany({
        where: { tenant_id: tenantId, is_default: true },
        data: { is_default: false },
      });
    }

    const account = await this.prisma.payment_accounts.create({
      data: {
        tenant_id: tenantId,
        branch_id: dto.branchId || null,
        bank_code: dto.bankCode,
        bank_name: dto.bankName,
        account_number: dto.accountNumber,
        account_name: dto.accountName,
        qr_template: dto.qrTemplate || 'compact2',
        is_default: dto.isDefault || false,
        sepay_api_key: dto.sepayApiKey || null,
        status: 'ACTIVE',
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PAYMENT_ACCOUNT',
      action: 'PAYMENT_ACCOUNT_CREATED',
      afterData: { ...account, sepay_api_key: account.sepay_api_key ? '(set)' : null },
    });

    return this.presentPaymentAccount(account);
  }

  async updatePaymentAccount(tenantId: string, id: string, dto: UpdatePaymentAccountDto, actor: RequestUser) {
    const existing = await this.prisma.payment_accounts.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy tài khoản thanh toán');

    if (dto.isDefault) {
      await this.prisma.payment_accounts.updateMany({
        where: { tenant_id: tenantId, is_default: true, NOT: { id } },
        data: { is_default: false },
      });
    }

    const updated = await this.prisma.payment_accounts.update({
      where: { id },
      data: {
        branch_id: dto.branchId !== undefined ? (dto.branchId || null) : undefined,
        bank_code: dto.bankCode,
        bank_name: dto.bankName,
        account_number: dto.accountNumber,
        account_name: dto.accountName,
        qr_template: dto.qrTemplate,
        is_default: dto.isDefault,
        status: dto.status,
        sepay_api_key: dto.sepayApiKey !== undefined ? dto.sepayApiKey || null : undefined,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PAYMENT_ACCOUNT',
      action: 'PAYMENT_ACCOUNT_UPDATED',
      afterData: { ...updated, sepay_api_key: updated.sepay_api_key ? '(set)' : null },
    });

    return this.presentPaymentAccount(updated);
  }

  async deletePaymentAccount(tenantId: string, id: string, actor: RequestUser) {
    const existing = await this.prisma.payment_accounts.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!existing) throw new NotFoundException('Không tìm thấy tài khoản thanh toán');

    // Soft delete: chuyển status sang INACTIVE
    const updated = await this.prisma.payment_accounts.update({
      where: { id },
      data: { status: 'INACTIVE', is_default: false },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PAYMENT_ACCOUNT',
      action: 'PAYMENT_ACCOUNT_DELETED',
      afterData: { id },
    });

    return updated;
  }
}
