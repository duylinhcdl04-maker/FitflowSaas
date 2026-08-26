import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import { deriveBillingCycleLabel } from '../../common/utils/billing-cycle';
import type { RequestUser } from '../../common/types/jwt-payload';
import { CreateFeatureDto } from './dto/create-feature.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { UpsertPlanFeaturesDto } from './dto/upsert-plan-features.dto';
import { ApplyPlanToSubscriptionsDto } from './dto/apply-plan-to-subscriptions.dto';

const PLAN_INCLUDE = {
  saas_plan_features: { include: { platform_features: true } },
  _count: { select: { subscriptions: true } },
} as const;

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  listFeatures() {
    return this.prisma.platformFeature.findMany({ orderBy: { module: 'asc' } });
  }

  async createFeature(dto: CreateFeatureDto) {
    const exists = await this.prisma.platformFeature.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('Mã feature đã tồn tại');

    return this.prisma.platformFeature.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        feature_type: dto.featureType,
        module: dto.module,
      },
    });
  }

  listPlans() {
    return this.prisma.saasPlan.findMany({
      include: PLAN_INCLUDE,
      orderBy: { display_order: 'asc' },
    });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.saasPlan.findUnique({
      where: { id },
      include: PLAN_INCLUDE,
    });
    if (!plan) throw new NotFoundException('Không tìm thấy SaaS Plan');
    return plan;
  }

  async createPlan(dto: CreatePlanDto, actor: RequestUser) {
    const exists = await this.prisma.saasPlan.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('Mã gói đã tồn tại');

    const plan = await this.prisma.saasPlan.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        billing_cycle: deriveBillingCycleLabel(dto.billingCycleMonths),
        billing_cycle_months: dto.billingCycleMonths,
        price: dto.price,
        currency: dto.currency ?? 'VND',
        trial_days: dto.trialDays ?? 0,
        display_order: dto.displayOrder ?? 0,
        is_public: dto.isPublic ?? true,
      },
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_PLAN',
      entityId: plan.id,
      action: 'PLAN_CREATED',
      afterData: dto,
    });

    return plan;
  }

  async updatePlan(id: string, dto: UpdatePlanDto, actor: RequestUser) {
    const before = await this.prisma.saasPlan.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Không tìm thấy SaaS Plan');

    // Deactivating a plan only stops new subscriptions; existing tenants keep
    // their current subscription until Super Admin migrates them (BR-SA-001 spirit:
    // no destructive action on a plan already tied to live subscriptions).
    const plan = await this.prisma.saasPlan.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        billing_cycle:
          dto.billingCycleMonths !== undefined
            ? deriveBillingCycleLabel(dto.billingCycleMonths)
            : undefined,
        billing_cycle_months: dto.billingCycleMonths,
        price: dto.price,
        currency: dto.currency,
        trial_days: dto.trialDays,
        display_order: dto.displayOrder,
        is_public: dto.isPublic,
        status: dto.status,
      },
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_PLAN',
      entityId: id,
      action: 'PLAN_UPDATED',
      beforeData: before,
      afterData: dto,
    });

    return plan;
  }

  async upsertPlanFeatures(
    planId: string,
    dto: UpsertPlanFeaturesDto,
    actor: RequestUser,
  ) {
    const plan = await this.prisma.saasPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy SaaS Plan');

    const codes = dto.features.map((f) => f.featureCode);
    const features = await this.prisma.platformFeature.findMany({
      where: { code: { in: codes } },
    });
    const featureByCode = new Map(features.map((f) => [f.code, f]));

    const missing = codes.filter((code) => !featureByCode.has(code));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Feature không tồn tại: ${missing.join(', ')}`,
      );
    }

    await this.prisma.$transaction(
      dto.features.map((item) => {
        const feature = featureByCode.get(item.featureCode)!;
        return this.prisma.saasPlanFeature.upsert({
          where: {
            plan_id_feature_id: { plan_id: planId, feature_id: feature.id },
          },
          create: {
            plan_id: planId,
            feature_id: feature.id,
            is_enabled: item.isEnabled,
            quota_value: item.quotaValue,
          },
          update: {
            is_enabled: item.isEnabled,
            quota_value: item.quotaValue,
          },
        });
      }),
    );

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_PLAN',
      entityId: planId,
      action: 'PLAN_FEATURES_UPDATED',
      afterData: dto.features,
    });

    return this.getPlan(planId);
  }

  /** SA-06 banner "16 doanh nghiệp đang dùng — Xem danh sách". */
  async listSubscribers(planId: string) {
    const plan = await this.prisma.saasPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy SaaS Plan');

    return this.prisma.subscription.findMany({
      where: {
        plan_id: planId,
        status: { in: ['TRIAL', 'ACTIVE', 'PAST_DUE'] },
      },
      include: { tenants: true },
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * SA-06 "Áp dụng cho doanh nghiệp hiện tại": overwrites subscription_features
   * (the per-Tenant snapshot) with the plan's *current* saas_plan_features for
   * only the subscriptions explicitly chosen. This is the one deliberate way
   * to break the snapshot isolation described in Tab 2 of SA-03 — everything
   * else in the system respects "snapshot at signing time" as gospel.
   */
  async applyPlanToSubscriptions(
    planId: string,
    dto: ApplyPlanToSubscriptionsDto,
    actor: RequestUser,
  ) {
    const plan = await this.getPlan(planId);

    const subscriptions = await this.prisma.subscription.findMany({
      where: { id: { in: dto.subscriptionIds }, plan_id: planId },
    });
    if (subscriptions.length === 0) {
      throw new BadRequestException(
        'Không có Subscription hợp lệ nào thuộc gói này trong danh sách đã chọn',
      );
    }

    await this.prisma.$transaction(
      subscriptions.flatMap((sub) =>
        plan.saas_plan_features.map((pf) =>
          this.prisma.subscription_features.upsert({
            where: {
              subscription_id_feature_code: {
                subscription_id: sub.id,
                feature_code: pf.platform_features.code,
              },
            },
            create: {
              subscription_id: sub.id,
              feature_code: pf.platform_features.code,
              is_enabled: pf.is_enabled,
              quota_value: pf.quota_value,
            },
            update: {
              is_enabled: pf.is_enabled,
              quota_value: pf.quota_value,
            },
          }),
        ),
      ),
    );

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_PLAN',
      entityId: planId,
      action: 'PLAN_APPLIED_TO_SUBSCRIPTIONS',
      afterData: { subscriptionIds: subscriptions.map((s) => s.id) },
    });

    return { updatedCount: subscriptions.length };
  }
}
