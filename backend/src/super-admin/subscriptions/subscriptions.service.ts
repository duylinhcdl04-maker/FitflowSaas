import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

// The four countable quotas tracked today (mirrors tenants.service.ts's
// QUOTA_FEATURE_CODES for SA-03 Tab "Hạn mức" — kept in sync manually since
// this module doesn't depend on TenantsService).
const QUOTA_FEATURE_CODES = [
  'MAX_BRANCHES',
  'MAX_STAFF',
  'MAX_PT',
  'MAX_CUSTOMERS',
] as const;
const QUOTA_LABELS: Record<(typeof QUOTA_FEATURE_CODES)[number], string> = {
  MAX_BRANCHES: 'Chi nhánh',
  MAX_STAFF: 'Nhân sự',
  MAX_PT: 'Huấn luyện viên',
  MAX_CUSTOMERS: 'Hội viên',
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.subscription.findMany({
      include: { tenants: true, saas_plans: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async getByTenant(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenant_id: tenantId },
      include: { tenants: true, saas_plans: true, subscription_features: true },
    });
    if (!subscription)
      throw new NotFoundException('Tenant chưa có Subscription');
    return subscription;
  }

  async invoices(tenantId: string) {
    await this.getByTenant(tenantId);
    return this.prisma.saas_invoices.findMany({
      where: { tenant_id: tenantId },
      include: { saas_payments: true },
      orderBy: { period_start: 'desc' },
    });
  }

  /**
   * SA-08 wizard step 2. Only ever blocks on a quota the *target* plan has
   * explicitly configured (a non-null quota_value) — today's saas_plan_features
   * data is still sparse (no plan has any rows configured yet), so treating an
   * absent row as "0 allowed" would incorrectly block nearly every change.
   * Absent or unlimited (null) rows are read as "chưa giới hạn", matching the
   * "để trống = không giới hạn" convention already used in the plan editor.
   */
  async checkPlanChangeConflicts(tenantId: string, targetPlanCode: string) {
    const [tenant, targetPlan, ptCount, current] = await Promise.all([
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          _count: { select: { branches: true, users: true, customers: true } },
        },
      }),
      this.prisma.saasPlan.findUnique({
        where: { code: targetPlanCode },
        include: {
          saas_plan_features: { include: { platform_features: true } },
        },
      }),
      this.prisma.user_roles.count({
        where: { tenant_id: tenantId, roles: { code: ROLE.PT } },
      }),
      this.getByTenant(tenantId),
    ]);

    if (!tenant) throw new NotFoundException('Không tìm thấy Tenant');
    if (!targetPlan || targetPlan.status !== 'ACTIVE') {
      throw new BadRequestException(
        'SaaS Plan không tồn tại hoặc đã ngừng bán',
      );
    }

    const usageByCode: Record<(typeof QUOTA_FEATURE_CODES)[number], number> = {
      MAX_BRANCHES: tenant._count.branches,
      MAX_STAFF: tenant._count.users,
      MAX_PT: ptCount,
      MAX_CUSTOMERS: tenant._count.customers,
    };

    const targetByCode = new Map(
      targetPlan.saas_plan_features.map((f) => [
        f.platform_features.code,
        {
          name: f.platform_features.name,
          isEnabled: f.is_enabled,
          quota: f.quota_value,
          type: f.platform_features.feature_type,
        },
      ]),
    );

    const quotaConflicts = QUOTA_FEATURE_CODES.map((code) => {
      const used = usageByCode[code];
      const target = targetByCode.get(code);
      const limit = target?.quota ?? null;
      return { code, label: QUOTA_LABELS[code], used, limit };
    }).filter((row) => row.limit !== null && row.used > row.limit);

    // Currently-effective enabled BOOLEAN features (prefer the signed snapshot;
    // fall back to the current plan's definition if no snapshot row exists yet)
    // that the target plan does not also provide.
    const currentSnapshotByCode = new Map(
      current.subscription_features.map((f) => [f.feature_code, f.is_enabled]),
    );
    const featuresLost: { code: string; name: string }[] = [];

    const currentPlanFull = await this.prisma.saasPlan.findUnique({
      where: { id: current.plan_id },
      include: { saas_plan_features: { include: { platform_features: true } } },
    });
    const currentlyEnabledBooleans = (currentPlanFull?.saas_plan_features ?? [])
      .filter((f) => f.platform_features.feature_type === 'BOOLEAN')
      .map((f) => ({
        code: f.platform_features.code,
        name: f.platform_features.name,
        // Snapshot overrides the plan's current definition when present.
        isEnabled:
          currentSnapshotByCode.get(f.platform_features.code) ?? f.is_enabled,
      }))
      .filter((f) => f.isEnabled);

    for (const feature of currentlyEnabledBooleans) {
      const target = targetByCode.get(feature.code);
      if (!target || !target.isEnabled) {
        featuresLost.push({ code: feature.code, name: feature.name });
      }
    }

    return {
      currentPlan: { code: currentPlanFull?.code, name: currentPlanFull?.name },
      targetPlan: { code: targetPlan.code, name: targetPlan.name },
      quotaConflicts,
      featuresLost,
      canProceed: quotaConflicts.length === 0,
    };
  }

  async update(
    tenantId: string,
    dto: UpdateSubscriptionDto,
    actor: RequestUser,
  ) {
    const before = await this.getByTenant(tenantId);

    let planId = before.plan_id;
    let price = before.price;
    let billingCycle = before.billing_cycle;
    let billingCycleMonths = before.billing_cycle_months;
    let currency = before.currency;

    if (dto.planCode) {
      const plan = await this.prisma.saasPlan.findUnique({
        where: { code: dto.planCode },
      });
      if (!plan || plan.status !== 'ACTIVE') {
        throw new BadRequestException(
          'SaaS Plan không tồn tại hoặc đã ngừng bán',
        );
      }

      // BR mirrored from SA-08: refuse a downgrade that would leave the Tenant
      // over the target plan's configured quotas. Upgrades never hit this path
      // (a wider plan can't be "exceeded" by definition of the check above).
      const conflictCheck = await this.checkPlanChangeConflicts(
        tenantId,
        dto.planCode,
      );
      if (!conflictCheck.canProceed) {
        throw new BadRequestException(
          `Không thể đổi sang gói ${plan.name}: đang vượt hạn mức ở ${conflictCheck.quotaConflicts
            .map((c) => `${c.label} (${c.used}/${c.limit})`)
            .join(', ')}`,
        );
      }

      planId = plan.id;
      price = plan.price;
      billingCycle = plan.billing_cycle;
      billingCycleMonths = plan.billing_cycle_months;
      currency = plan.currency;
    }

    let endDate = before.end_date;
    if (dto.renewDays) {
      const base = before.end_date > new Date() ? before.end_date : new Date();
      endDate = new Date(base);
      endDate.setDate(endDate.getDate() + dto.renewDays);
    }

    if (dto.status === 'CANCELLED' && !dto.cancelReason) {
      throw new BadRequestException('Cần nêu lý do khi huỷ Subscription');
    }

    const updated = await this.prisma.subscription.update({
      where: { tenant_id: tenantId },
      data: {
        plan_id: planId,
        price,
        billing_cycle: billingCycle,
        billing_cycle_months: billingCycleMonths,
        currency,
        end_date: endDate,
        status: dto.status ?? undefined,
        cancelled_at: dto.status === 'CANCELLED' ? new Date() : undefined,
        cancel_reason:
          dto.status === 'CANCELLED' ? dto.cancelReason : undefined,
      },
      include: { tenants: true, saas_plans: true },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SUBSCRIPTION',
      entityId: updated.id,
      action: 'SUBSCRIPTION_UPDATED',
      beforeData: {
        planId: before.plan_id,
        status: before.status,
        endDate: before.end_date,
      },
      afterData: dto,
    });

    return updated;
  }

  /**
   * OW-08 / BR-TRIAL-05: gọi khi một hoá đơn có `target_plan_id` được SuperAdmin
   * xác nhận thanh toán đủ (SA-10 `InvoicesService.recordPayment`). Không cộng
   * dồn thời gian Trial/gói cũ còn lại — Subscription mới bắt đầu tính từ ngày
   * thanh toán thành công, đúng khuyến nghị trong BE_Owner.md.
   */
  async activateForInvoice(
    subscriptionId: string,
    targetPlanId: string,
    actor: RequestUser,
  ) {
    const [subscription, plan] = await Promise.all([
      this.prisma.subscription.findUnique({ where: { id: subscriptionId } }),
      this.prisma.saasPlan.findUnique({ where: { id: targetPlanId } }),
    ]);
    if (!subscription || !plan) return null;

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + (plan.billing_cycle_months ?? 1));

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        plan_id: plan.id,
        status: 'ACTIVE',
        start_date: startDate,
        end_date: endDate,
        trial_ends_at: null,
        billing_cycle: plan.billing_cycle,
        billing_cycle_months: plan.billing_cycle_months,
        price: plan.price,
        currency: plan.currency,
      },
      include: { tenants: true, saas_plans: true },
    });

    await writeAuditLog(this.prisma, {
      tenantId: subscription.tenant_id,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SUBSCRIPTION',
      entityId: subscriptionId,
      action: 'SUBSCRIPTION_ACTIVATED_FROM_PAYMENT',
      beforeData: { planId: subscription.plan_id, status: subscription.status },
      afterData: { planId: plan.id, status: 'ACTIVE' },
    });

    return updated;
  }
}
