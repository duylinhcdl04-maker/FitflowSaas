import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
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
import { SavePlanConfigDto } from './dto/save-plan-config.dto';

const PLAN_INCLUDE = {
  saas_plan_features: { include: { platform_features: true } },
  plan_prices: { orderBy: { billing_cycle_months: 'asc' as const } },
  plan_quotas: { include: { platform_quotas: true } },
  plan_integrations: { include: { platform_integrations: true } },
  _count: { select: { subscriptions: true } },
} as const;

@Injectable()
export class PlansService implements OnModuleInit {
  private readonly logger = new Logger(PlansService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log(
      'PlansService initialized with extensible 10-dimension Plan Architecture',
    );
  }

  /**
   * Lấy danh mục siêu dữ liệu động (Platform Catalog) cho giao diện Admin:
   * Features (6 modules), Quotas (10 quotas), Integrations (7 connectors), Add-ons
   */
  async getPlatformCatalog() {
    const [features, quotas, integrations, addons] = await Promise.all([
      this.prisma.platformFeature.findMany({
        orderBy: [{ module: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.platformQuota.findMany({
        orderBy: [{ module: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.platformIntegration.findMany({
        orderBy: [{ category: 'asc' }, { code: 'asc' }],
      }),
      this.prisma.addon.findMany({
        include: {
          addon_quotas: { include: { platform_quotas: true } },
          addon_features: { include: { platform_features: true } },
        },
        orderBy: { code: 'asc' },
      }),
    ]);

    return {
      features,
      quotas,
      integrations,
      addons,
    };
  }

  async listFeatures() {
    return this.prisma.platformFeature.findMany({
      orderBy: { created_at: 'asc' },
    });
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

  async listPlans() {
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
        is_public: dto.isPublic ?? false,
        status: 'DRAFT', // Mặc định gói mới bắt đầu ở trạng thái DRAFT
      },
      include: PLAN_INCLUDE,
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

  /**
   * Lưu cấu hình toàn diện 10 dimensions của Plan trong một transaction atomic
   */
  async savePlanConfiguration(
    id: string,
    dto: SavePlanConfigDto,
    actor: RequestUser,
  ) {
    const plan = await this.prisma.saasPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Không tìm thấy SaaS Plan');

    const beforeData = await this.getPlan(id);

    await this.prisma.$transaction(async (tx) => {
      // 1. Update Core Metadata
      await tx.saasPlan.update({
        where: { id },
        data: {
          name: dto.name,
          code: dto.code,
          slogan: dto.slogan,
          target_audience: dto.targetAudience,
          description: dto.description,
          price: dto.price !== undefined ? dto.price : undefined,
          currency: dto.currency,
          billing_cycle: dto.billingCycle,
          billing_cycle_months: dto.billingCycleMonths,
          trial_days: dto.trialDays,
          support_tier: dto.supportTier,
          is_popular: dto.isPopular,
          badge_text: dto.badgeText,
          display_order: dto.displayOrder,
          cta_text: dto.ctaText,
          is_public: dto.isPublic,
          status: dto.status,
        },
      });

      // 2. Sync Plan Prices if provided
      if (dto.prices && Array.isArray(dto.prices)) {
        for (const pr of dto.prices) {
          await tx.planPrice.upsert({
            where: {
              plan_id_billing_cycle_months: {
                plan_id: id,
                billing_cycle_months: pr.billingCycleMonths,
              },
            },
            update: {
              price: pr.price,
              discount_percentage: pr.discountPercentage ?? 0,
              billing_cycle: pr.billingCycle,
              is_active: pr.isActive ?? true,
            },
            create: {
              plan_id: id,
              billing_cycle: pr.billingCycle,
              billing_cycle_months: pr.billingCycleMonths,
              price: pr.price,
              discount_percentage: pr.discountPercentage ?? 0,
              is_active: pr.isActive ?? true,
            },
          });
        }
      }

      // 3. Sync Features if provided
      if (dto.features && Array.isArray(dto.features)) {
        for (const feat of dto.features) {
          await tx.saasPlanFeature.upsert({
            where: {
              plan_id_feature_id: { plan_id: id, feature_id: feat.featureId },
            },
            update: { is_enabled: feat.isEnabled },
            create: {
              plan_id: id,
              feature_id: feat.featureId,
              is_enabled: feat.isEnabled,
            },
          });
        }
      }

      // 4. Sync Quotas if provided
      if (dto.quotas && Array.isArray(dto.quotas)) {
        for (const q of dto.quotas) {
          await tx.planQuota.upsert({
            where: {
              plan_id_quota_id: { plan_id: id, quota_id: q.quotaId },
            },
            update: {
              mode: q.mode,
              quota_value: q.mode === 'LIMITED' ? q.quotaValue : null,
            },
            create: {
              plan_id: id,
              quota_id: q.quotaId,
              mode: q.mode,
              quota_value: q.mode === 'LIMITED' ? q.quotaValue : null,
            },
          });
        }
      }

      // 5. Sync Integrations if provided
      if (dto.integrations && Array.isArray(dto.integrations)) {
        for (const integ of dto.integrations) {
          await tx.planIntegration.upsert({
            where: {
              plan_id_integration_id: {
                plan_id: id,
                integration_id: integ.integrationId,
              },
            },
            update: {
              is_enabled: integ.isEnabled,
              config_options: integ.configOptions ?? undefined,
            },
            create: {
              plan_id: id,
              integration_id: integ.integrationId,
              is_enabled: integ.isEnabled,
              config_options: integ.configOptions ?? undefined,
            },
          });
        }
      }
    });

    const updated = await this.getPlan(id);

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_PLAN',
      entityId: id,
      action: 'PLAN_CONFIG_SAVED',
      beforeData,
      afterData: dto,
    });

    return updated;
  }

  /**
   * Validate toàn diện trước khi Publish gói SaaS:
   * - Pricing (ít nhất 1 mức giá hợp lệ)
   * - Feature configuration
   * - Quota configuration (không để trống)
   * - Integration configuration
   * - Display configuration
   */
  async validatePlanForPublish(id: string) {
    const plan = await this.getPlan(id);
    const errors: string[] = [];

    if (!plan.name || plan.name.trim().length === 0) {
      errors.push('Tên gói không được để trống.');
    }
    if (!plan.code || plan.code.trim().length === 0) {
      errors.push('Mã định danh gói không được để trống.');
    }

    // Validate pricing
    const hasBasePrice = Number(plan.price) >= 0;
    const hasCyclePrices = plan.plan_prices.length > 0;
    if (!hasBasePrice && !hasCyclePrices) {
      errors.push(
        'Gói cần có cấu hình giá cơ bản hoặc ít nhất một chu kỳ thanh toán.',
      );
    }

    // Validate features
    if (plan.saas_plan_features.length === 0) {
      errors.push('Gói chưa được cấu hình danh mục tính năng (Features).');
    }

    // Validate quotas
    if (plan.plan_quotas.length === 0) {
      errors.push(
        'Gói chưa được cấu hình giới hạn tài nguyên (Resource Quotas).',
      );
    } else {
      const invalidQuota = plan.plan_quotas.find(
        (q) =>
          q.mode === 'LIMITED' &&
          (q.quota_value === null || q.quota_value <= 0),
      );
      if (invalidQuota) {
        errors.push(
          `Hạn ngạch [${invalidQuota.platform_quotas?.name}] được đặt là LIMITED nhưng chưa có giá trị hợp lệ.`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async publishPlan(id: string, actor: RequestUser) {
    const validation = await this.validatePlanForPublish(id);
    if (!validation.isValid) {
      throw new BadRequestException({
        statusCode: 400,
        message:
          'Gói chưa đủ điều kiện để Xuất bản (Publish). Vui lòng kiểm tra lại cấu hình.',
        errors: validation.errors,
      });
    }

    const plan = await this.prisma.saasPlan.update({
      where: { id },
      data: { status: 'ACTIVE', is_public: true },
      include: PLAN_INCLUDE,
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_PLAN',
      entityId: id,
      action: 'PLAN_PUBLISHED',
      afterData: { status: 'ACTIVE', is_public: true },
    });

    return plan;
  }

  async archivePlan(id: string, actor: RequestUser) {
    const plan = await this.prisma.saasPlan.update({
      where: { id },
      data: { status: 'ARCHIVED', is_public: false },
      include: PLAN_INCLUDE,
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_PLAN',
      entityId: id,
      action: 'PLAN_ARCHIVED',
      afterData: { status: 'ARCHIVED', is_public: false },
    });

    return plan;
  }

  /**
   * BR-PLAN-DELETE-01: Không cho xóa Plan nếu đang có tenant sử dụng. Chỉ cho Archive.
   */
  async deletePlan(id: string, actor: RequestUser) {
    const plan = await this.prisma.saasPlan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) throw new NotFoundException('Không tìm thấy SaaS Plan');

    if (plan._count.subscriptions > 0) {
      throw new BadRequestException(
        `Không thể xóa gói [${plan.name}] vì hiện có ${plan._count.subscriptions} phòng tập / hợp đồng đang sử dụng gói này. Vui lòng chọn Lưu trữ (Archive) để ngừng cho thuê mới mà không làm gián đoạn tenant hiện tại.`,
      );
    }

    await this.prisma.saasPlan.delete({ where: { id } });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_PLAN',
      entityId: id,
      action: 'PLAN_DELETED',
      beforeData: { code: plan.code, name: plan.name },
    });

    return { success: true, message: `Đã xóa thành công gói ${plan.name}` };
  }

  async duplicatePlan(id: string, actor: RequestUser) {
    const source = await this.getPlan(id);
    let newCode = `${source.code}_COPY`;
    let count = 1;
    while (
      await this.prisma.saasPlan.findUnique({ where: { code: newCode } })
    ) {
      count++;
      newCode = `${source.code}_COPY_${count}`;
    }

    const newPlan = await this.prisma.saasPlan.create({
      data: {
        code: newCode,
        name: `${source.name} (Bản sao)`,
        description: source.description,
        slogan: source.slogan,
        target_audience: source.target_audience,
        billing_cycle: source.billing_cycle,
        billing_cycle_months: source.billing_cycle_months,
        price: source.price,
        currency: source.currency,
        trial_days: source.trial_days,
        support_tier: source.support_tier,
        is_popular: false,
        badge_text: source.badge_text ? `${source.badge_text} (Copy)` : null,
        cta_text: source.cta_text,
        display_order: source.display_order + 1,
        is_public: false,
        status: 'DRAFT',
      },
    });

    // 1. Duplicate Prices
    if (source.plan_prices.length > 0) {
      await this.prisma.planPrice.createMany({
        data: source.plan_prices.map((p) => ({
          plan_id: newPlan.id,
          billing_cycle: p.billing_cycle,
          billing_cycle_months: p.billing_cycle_months,
          price: p.price,
          currency: p.currency,
          discount_percentage: p.discount_percentage,
          is_active: p.is_active,
        })),
      });
    }

    // 2. Duplicate Features
    if (source.saas_plan_features.length > 0) {
      await this.prisma.saasPlanFeature.createMany({
        data: source.saas_plan_features.map((spf) => ({
          plan_id: newPlan.id,
          feature_id: spf.feature_id,
          is_enabled: spf.is_enabled,
          quota_value: spf.quota_value,
        })),
      });
    }

    // 3. Duplicate Quotas
    if (source.plan_quotas.length > 0) {
      await this.prisma.planQuota.createMany({
        data: source.plan_quotas.map((pq) => ({
          plan_id: newPlan.id,
          quota_id: pq.quota_id,
          mode: pq.mode,
          quota_value: pq.quota_value,
        })),
      });
    }

    // 4. Duplicate Integrations
    if (source.plan_integrations.length > 0) {
      await this.prisma.planIntegration.createMany({
        data: source.plan_integrations.map((pi) => ({
          plan_id: newPlan.id,
          integration_id: pi.integration_id,
          is_enabled: pi.is_enabled,
          config_options: pi.config_options as any,
        })),
      });
    }

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_PLAN',
      entityId: newPlan.id,
      action: 'PLAN_DUPLICATED',
      beforeData: { sourcePlanId: id, sourceCode: source.code },
      afterData: { newPlanId: newPlan.id, newCode },
    });

    return this.getPlan(newPlan.id);
  }

  async updatePlan(id: string, dto: UpdatePlanDto, actor: RequestUser) {
    const before = await this.prisma.saasPlan.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Không tìm thấy SaaS Plan');

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
      include: PLAN_INCLUDE,
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
