import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import { paginate, parsePagination } from '../../common/utils/pagination';
import { generateTempPassword } from '../../common/utils/temp-password';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  ChangeTenantStatusDto,
  TenantStatus,
} from './dto/change-tenant-status.dto';
import { QueryTenantsDto } from './dto/query-tenants.dto';
import { ResetOwnerPasswordDto } from './dto/reset-owner-password.dto';

// BR-SA-001: no hard delete, ever. Terminal states only move forward except a
// SUSPENDED tenant can be reinstated once the underlying issue is resolved.
const ALLOWED_TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  TRIAL: ['ACTIVE', 'SUSPENDED', 'INACTIVE'],
  ACTIVE: ['SUSPENDED', 'INACTIVE'],
  SUSPENDED: ['ACTIVE', 'INACTIVE'],
  INACTIVE: [],
};

// SA-03 Tab "Hạn mức": which platform_features codes represent a countable quota,
// and how each maps to a live count on this tenant.
const QUOTA_FEATURE_CODES = [
  'MAX_BRANCHES',
  'MAX_STAFF',
  'MAX_PT',
  'MAX_CUSTOMERS',
] as const;

const TENANT_SUMMARY_INCLUDE = {
  subscriptions: { include: { saas_plans: true } },
  _count: { select: { branches: true, users: true, customers: true } },
} as const;

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryTenantsDto) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              {
                name: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                code: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                contact_email: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: TENANT_SUMMARY_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return paginate(items, total, page, pageSize);
  }

  async get(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        ...TENANT_SUMMARY_INCLUDE,
        subscriptions: {
          include: {
            saas_plans: {
              include: {
                saas_plan_features: { include: { platform_features: true } },
              },
            },
            subscription_features: true,
          },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Không tìm thấy Tenant');

    const overrides = await this.prisma.tenant_feature_overrides.findMany({
      where: { tenant_id: id },
    });

    const featureMatrix = this.buildFeatureMatrix(tenant, overrides);
    const [quotas, timeline] = await Promise.all([
      this.buildQuotas(id, tenant, featureMatrix),
      this.buildTimeline(id, tenant.created_at),
    ]);

    return { ...tenant, featureMatrix, quotas, timeline };
  }

  /** SA-03 Tab 2: three-layer feature table — gói hiện tại / snapshot khi ký / điều chỉnh riêng / hiệu lực. */
  private buildFeatureMatrix(
    tenant: {
      subscriptions: {
        saas_plans: {
          saas_plan_features: {
            is_enabled: boolean;
            quota_value: number | null;
            platform_features: { code: string; name: string };
          }[];
        };
        subscription_features: {
          feature_code: string;
          is_enabled: boolean;
          quota_value: number | null;
        }[];
      } | null;
    },
    overrides: {
      feature_code: string;
      is_enabled: boolean | null;
      quota_value: number | null;
      valid_until: Date | null;
    }[],
  ) {
    const subscription = tenant.subscriptions;
    if (!subscription) return [];

    const planByCode = new Map(
      subscription.saas_plans.saas_plan_features.map((f) => [
        f.platform_features.code,
        {
          name: f.platform_features.name,
          isEnabled: f.is_enabled,
          quota: f.quota_value,
        },
      ]),
    );
    const snapshotByCode = new Map(
      subscription.subscription_features.map((f) => [
        f.feature_code,
        { isEnabled: f.is_enabled, quota: f.quota_value },
      ]),
    );
    const today = new Date();
    const overrideByCode = new Map(
      overrides
        .filter((o) => !o.valid_until || o.valid_until >= today)
        .map((o) => [
          o.feature_code,
          { isEnabled: o.is_enabled, quota: o.quota_value },
        ]),
    );

    const allCodes = new Set([
      ...planByCode.keys(),
      ...snapshotByCode.keys(),
      ...overrideByCode.keys(),
    ]);

    return Array.from(allCodes).map((code) => {
      const plan = planByCode.get(code) ?? null;
      const snapshot = snapshotByCode.get(code) ?? null;
      const override = overrideByCode.get(code) ?? null;
      const effective = override ?? snapshot ?? plan;
      return {
        code,
        name: plan?.name ?? code,
        plan: plan ? { isEnabled: plan.isEnabled, quota: plan.quota } : null,
        snapshot,
        override,
        effective: effective
          ? { isEnabled: effective.isEnabled, quota: effective.quota }
          : null,
        // Doc's ⓘ case: plan now includes it, but the signed snapshot doesn't yet.
        outOfSyncWithPlan: Boolean(
          plan && snapshot && plan.isEnabled !== snapshot.isEnabled,
        ),
      };
    });
  }

  /** SA-03 Tab 3: usage vs effective quota for the four countable feature codes. */
  private async buildQuotas(
    tenantId: string,
    tenant: { _count?: { branches: number; users: number; customers: number } },
    featureMatrix: ReturnType<TenantsService['buildFeatureMatrix']>,
  ) {
    const ptCount = await this.prisma.user_roles.count({
      where: { tenant_id: tenantId, roles: { code: ROLE.PT } },
    });

    const effectiveByCode = new Map(
      featureMatrix.map((f) => [f.code, f.effective]),
    );
    const usageByCode: Record<(typeof QUOTA_FEATURE_CODES)[number], number> = {
      MAX_BRANCHES: tenant._count?.branches ?? 0,
      MAX_STAFF: tenant._count?.users ?? 0,
      MAX_PT: ptCount,
      MAX_CUSTOMERS: tenant._count?.customers ?? 0,
    };
    return QUOTA_FEATURE_CODES.map((code) => ({
      code,
      used: usageByCode[code],
      limit: effectiveByCode.get(code)?.quota ?? null, // null = unlimited
    }));
  }

  /** SA-03 Tab 2 timeline: tenant creation + every status/plan change on record. */
  private async buildTimeline(tenantId: string, createdAt: Date) {
    const rows = await this.prisma.auditLog.findMany({
      where: {
        tenant_id: tenantId,
        action: { in: ['TENANT_STATUS_CHANGED', 'SUBSCRIPTION_UPDATED'] },
      },
      orderBy: { occurred_at: 'asc' },
    });

    return [
      {
        at: createdAt,
        label: 'Bắt đầu dùng thử',
        actorRole: null as string | null,
        reason: null as string | null,
      },
      ...rows.map((r) => ({
        at: r.occurred_at,
        label:
          r.action === 'TENANT_STATUS_CHANGED'
            ? 'Đổi trạng thái Tenant'
            : 'Đổi gói / gia hạn Subscription',
        actorRole: r.actor_role,
        reason: r.reason,
      })),
    ];
  }

  async listUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenant_id: tenantId },
      include: { user_roles: { include: { roles: true } } },
      orderBy: { created_at: 'asc' },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      phone: u.phone,
      status: u.status,
      lastLoginAt: u.last_login_at,
      roles: u.user_roles.map((ur) => ur.roles.code),
    }));
  }

  async listBranches(tenantId: string) {
    const [branches, customerCounts] = await Promise.all([
      this.prisma.branch.findMany({
        where: { tenant_id: tenantId },
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.customer.groupBy({
        by: ['home_branch_id'],
        where: { tenant_id: tenantId, status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ]);
    const countByBranch = new Map(
      customerCounts.map((c) => [c.home_branch_id, c._count._all]),
    );
    return branches.map((b) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      address: b.address,
      status: b.status,
      activeCustomers: b.id ? (countByBranch.get(b.id) ?? 0) : 0,
    }));
  }

  async create(dto: CreateTenantDto, actor: RequestUser) {
    const plan = await this.prisma.saasPlan.findUnique({
      where: { code: dto.planCode },
    });
    if (!plan || plan.status !== 'ACTIVE') {
      throw new BadRequestException(
        'SaaS Plan không tồn tại hoặc đã ngừng bán',
      );
    }

    const existing = await this.prisma.tenant.findUnique({
      where: { code: dto.code },
    });
    if (existing) throw new ConflictException('Mã Tenant đã được sử dụng');

    const ownerRole = await this.prisma.roles.findUnique({
      where: { code: ROLE.OWNER },
    });
    if (!ownerRole) {
      throw new BadRequestException('Thiếu cấu hình role OWNER trong hệ thống');
    }

    const passwordHash = await bcrypt.hash(dto.owner.password, 10);
    const trialDays = plan.trial_days || 14;
    const startDate = new Date();
    const trialEndsAt = new Date(startDate);
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          code: dto.code,
          legal_name: dto.legalName,
          tax_code: dto.taxCode,
          contact_email: dto.contactEmail,
          contact_phone: dto.contactPhone,
          address: dto.address,
          status: 'TRIAL',
          created_by: actor.id,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          tenant_id: tenant.id,
          plan_id: plan.id,
          status: 'TRIAL',
          start_date: startDate,
          end_date: trialEndsAt,
          trial_ends_at: trialEndsAt,
          billing_cycle: plan.billing_cycle,
          billing_cycle_months: plan.billing_cycle_months,
          price: plan.price,
          currency: plan.currency,
          created_by: actor.id,
        },
      });

      const owner = await tx.user.create({
        data: {
          tenant_id: tenant.id,
          user_type: 'TENANT',
          email: dto.owner.email,
          phone: dto.owner.phone,
          password_hash: passwordHash,
          full_name: dto.owner.fullName,
          status: 'ACTIVE',
          created_by: actor.id,
        },
      });

      await tx.user_roles.create({
        data: {
          user_id: owner.id,
          role_id: ownerRole.id,
          tenant_id: tenant.id,
          assigned_by: actor.id,
        },
      });

      return { tenant, subscription, owner };
    });

    await writeAuditLog(this.prisma, {
      tenantId: result.tenant.id,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'TENANT',
      entityId: result.tenant.id,
      action: 'TENANT_CREATED',
      afterData: { code: dto.code, name: dto.name, planCode: dto.planCode },
    });

    return {
      tenant: result.tenant,
      subscription: result.subscription,
      owner: {
        id: result.owner.id,
        email: result.owner.email,
        fullName: result.owner.full_name,
      },
    };
  }

  async update(id: string, dto: UpdateTenantDto, actor: RequestUser) {
    const before = await this.prisma.tenant.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Không tìm thấy Tenant');

    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: {
        name: dto.name,
        legal_name: dto.legalName,
        tax_code: dto.taxCode,
        contact_email: dto.contactEmail,
        contact_phone: dto.contactPhone,
        address: dto.address,
        logo_url: dto.logoUrl,
        data_retention_days: dto.dataRetentionDays,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: id,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'TENANT',
      entityId: id,
      action: 'TENANT_UPDATED',
      beforeData: before,
      afterData: dto,
    });

    return tenant;
  }

  async changeStatus(
    id: string,
    dto: ChangeTenantStatusDto,
    actor: RequestUser,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Không tìm thấy Tenant');

    const currentStatus = tenant.status as TenantStatus;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
    if (currentStatus === dto.status) {
      throw new BadRequestException(`Tenant đã ở trạng thái ${dto.status}`);
    }
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${currentStatus} sang ${dto.status}`,
      );
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        status: dto.status,
        suspended_at: dto.status === 'SUSPENDED' ? new Date() : null,
        suspended_reason: dto.status === 'SUSPENDED' ? dto.reason : null,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: id,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'TENANT',
      entityId: id,
      action: 'TENANT_STATUS_CHANGED',
      beforeData: { status: currentStatus },
      afterData: { status: dto.status, reason: dto.reason },
      reason: dto.reason,
    });

    return updated;
  }

  /**
   * SA-03 Tab "Người dùng" exception path. Issues a brand-new temporary
   * password directly rather than emailing a self-service reset link: this
   * codebase has no mail service wired up yet, and no tenant-side login/reset
   * page exists either (see AuthService's login() doc comment) — a link would
   * point nowhere. The temp password is returned once in the API response for
   * the operator to relay to the Owner through whatever channel the support
   * ticket used. Migrate to a real emailed reset flow once tenant-side auth
   * ships (doc section VII, point 6).
   */
  async resetOwnerPassword(
    tenantId: string,
    dto: ResetOwnerPasswordDto,
    actor: RequestUser,
  ) {
    const owner = await this.prisma.user.findFirst({
      where: {
        tenant_id: tenantId,
        status: 'ACTIVE',
        user_roles: { some: { roles: { code: ROLE.OWNER } } },
      },
    });
    if (!owner) {
      throw new NotFoundException(
        'Tenant chưa có tài khoản Owner đang hoạt động',
      );
    }

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.user.update({
      where: { id: owner.id },
      data: { password_hash: passwordHash },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'USER',
      entityId: owner.id,
      action: 'OWNER_PASSWORD_RESET',
      reason: dto.reason,
    });

    return {
      ownerEmail: owner.email,
      ownerFullName: owner.full_name,
      temporaryPassword,
    };
  }
}
