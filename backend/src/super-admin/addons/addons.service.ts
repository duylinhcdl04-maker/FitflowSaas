import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import type { RequestUser } from '../../common/types/jwt-payload';
import { CreateAddonDto } from './dto/create-addon.dto';
import { UpdateAddonDto } from './dto/update-addon.dto';
import { AttachAddonDto } from './dto/attach-addon.dto';
import { CancelAddonDto } from './dto/cancel-addon.dto';

// Marks a tenant_feature_overrides row as auto-computed from active add-ons,
// so recomputeEntitlement() only ever touches rows it owns — it must never
// silently overwrite an override a Super Admin set by hand for another reason
// (e.g. a VIP one-off deal). See recomputeEntitlement() below.
const AUTO_OVERRIDE_NOTE = 'AUTO:ADDON';

@Injectable()
export class AddonsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const [addons, usage] = await Promise.all([
      this.prisma.addon.findMany({ orderBy: { created_at: 'asc' } }),
      this.prisma.subscriptionAddon.groupBy({
        by: ['addon_id'],
        where: { status: 'ACTIVE' },
        _count: { _all: true },
      }),
    ]);
    const usageByAddon = new Map(usage.map((u) => [u.addon_id, u._count._all]));
    return addons.map((a) => ({
      ...a,
      activeSubscriptions: usageByAddon.get(a.id) ?? 0,
    }));
  }

  async get(id: string) {
    const addon = await this.prisma.addon.findUnique({ where: { id } });
    if (!addon) throw new NotFoundException('Không tìm thấy Add-on');
    return addon;
  }

  async create(dto: CreateAddonDto, actor: RequestUser) {
    const exists = await this.prisma.addon.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('Mã Add-on đã tồn tại');

    const addon = await this.prisma.addon.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        pricing_model: dto.pricingModel,
        price: dto.price,
        currency: dto.currency ?? 'VND',
        effect_feature_code: dto.effectFeatureCode,
        effect_type: dto.effectType,
        effect_amount: dto.effectAmount,
        compatible_plan_codes: dto.compatiblePlanCodes ?? [],
      },
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'ADDON',
      entityId: addon.id,
      action: 'ADDON_CREATED',
      afterData: dto,
    });

    return addon;
  }

  // BR-FEATURE-01 style: `code` is never forwarded here, same convention as
  // PlansService.updatePlan (see UpdateAddonDto doc comment).
  async update(id: string, dto: UpdateAddonDto, actor: RequestUser) {
    const before = await this.prisma.addon.findUnique({ where: { id } });
    if (!before) throw new NotFoundException('Không tìm thấy Add-on');

    const addon = await this.prisma.addon.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        pricing_model: dto.pricingModel,
        price: dto.price,
        currency: dto.currency,
        effect_feature_code: dto.effectFeatureCode,
        effect_type: dto.effectType,
        effect_amount: dto.effectAmount,
        compatible_plan_codes: dto.compatiblePlanCodes,
        status: dto.status,
        updated_at: new Date(),
      },
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'ADDON',
      entityId: id,
      action: 'ADDON_UPDATED',
      beforeData: before,
      afterData: dto,
    });

    return addon;
  }

  /** SA-03-style tenant view: add-ons currently attached to this Tenant's subscription. */
  async listForTenant(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenant_id: tenantId },
    });
    if (!subscription) return [];

    return this.prisma.subscriptionAddon.findMany({
      where: { subscription_id: subscription.id },
      include: { addons: true },
      orderBy: { added_at: 'desc' },
    });
  }

  async attach(tenantId: string, dto: AttachAddonDto, actor: RequestUser) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenant_id: tenantId },
      include: { saas_plans: true },
    });
    if (!subscription)
      throw new BadRequestException(
        'Tenant chưa có Subscription để gắn Add-on',
      );

    const addon = await this.prisma.addon.findUnique({
      where: { code: dto.addonCode },
    });
    if (!addon || addon.status !== 'ACTIVE') {
      throw new BadRequestException('Add-on không tồn tại hoặc đã ngừng bán');
    }
    if (
      addon.compatible_plan_codes.length > 0 &&
      !addon.compatible_plan_codes.includes(subscription.saas_plans.code)
    ) {
      throw new BadRequestException(
        `Add-on này không áp dụng cho gói ${subscription.saas_plans.code}`,
      );
    }

    const quantity = dto.quantity ?? 1;
    const attached = await this.prisma.subscriptionAddon.upsert({
      where: {
        subscription_id_addon_id: {
          subscription_id: subscription.id,
          addon_id: addon.id,
        },
      },
      create: {
        subscription_id: subscription.id,
        addon_id: addon.id,
        quantity,
        price_snapshot: addon.price,
        pricing_model_snapshot: addon.pricing_model,
        status: 'ACTIVE',
        added_by: actor.id,
      },
      update: {
        quantity,
        price_snapshot: addon.price,
        pricing_model_snapshot: addon.pricing_model,
        status: 'ACTIVE',
        added_by: actor.id,
        added_at: new Date(),
        cancelled_by: null,
        cancelled_at: null,
        cancel_reason: null,
      },
      include: { addons: true },
    });

    await this.recomputeEntitlement(
      tenantId,
      subscription.id,
      addon.effect_feature_code,
    );

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SUBSCRIPTION_ADDON',
      entityId: addon.id,
      action: 'ADDON_ATTACHED',
      afterData: {
        addonCode: addon.code,
        quantity,
        priceSnapshot: addon.price.toString(),
      },
    });

    return attached;
  }

  async cancel(
    tenantId: string,
    addonId: string,
    dto: CancelAddonDto,
    actor: RequestUser,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenant_id: tenantId },
    });
    if (!subscription)
      throw new NotFoundException('Tenant chưa có Subscription');

    const existing = await this.prisma.subscriptionAddon.findUnique({
      where: {
        subscription_id_addon_id: {
          subscription_id: subscription.id,
          addon_id: addonId,
        },
      },
      include: { addons: true },
    });
    if (!existing || existing.status !== 'ACTIVE') {
      throw new NotFoundException(
        'Tenant chưa gắn Add-on này hoặc đã gỡ trước đó',
      );
    }

    const cancelled = await this.prisma.subscriptionAddon.update({
      where: {
        subscription_id_addon_id: {
          subscription_id: subscription.id,
          addon_id: addonId,
        },
      },
      data: {
        status: 'CANCELLED',
        cancelled_by: actor.id,
        cancelled_at: new Date(),
        cancel_reason: dto.reason,
      },
      include: { addons: true },
    });

    await this.recomputeEntitlement(
      tenantId,
      subscription.id,
      existing.addons.effect_feature_code,
    );

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SUBSCRIPTION_ADDON',
      entityId: addonId,
      action: 'ADDON_CANCELLED',
      reason: dto.reason,
    });

    return cancelled;
  }

  /**
   * BR-SA-12 "Add-on có thể làm thay đổi Entitlement". Recomputes the
   * tenant_feature_overrides row for one feature_code from every currently
   * ACTIVE add-on that targets it, then writes (or clears) that single row.
   *
   * Safety rule: this method only ever creates/updates/deletes an override row
   * it marked itself with `note = 'AUTO:ADDON'` on a previous write. If a
   * Super Admin later ships a manual "Tenant Override" editor writing to the
   * same table for unrelated reasons (e.g. a one-off VIP deal), this must
   * check that marker before touching the row — never blindly overwrite
   * whatever is there. There is no manual-override writer in this codebase
   * yet (verified: no other code path writes to tenant_feature_overrides), so
   * this is a forward-looking guard, not a currently-exercised conflict.
   */
  private async recomputeEntitlement(
    tenantId: string,
    subscriptionId: string,
    featureCode: string | null,
  ) {
    if (!featureCode) return;

    const existingOverride =
      await this.prisma.tenant_feature_overrides.findUnique({
        where: {
          tenant_id_feature_code: {
            tenant_id: tenantId,
            feature_code: featureCode,
          },
        },
      });
    if (existingOverride && existingOverride.note !== AUTO_OVERRIDE_NOTE) {
      // A manual override already governs this feature for this Tenant —
      // don't let an add-on silently change what a Super Admin explicitly set.
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        saas_plans: {
          include: {
            saas_plan_features: { include: { platform_features: true } },
          },
        },
      },
    });
    if (!subscription) return;

    const planFeature = subscription.saas_plans.saas_plan_features.find(
      (f) => f.platform_features.code === featureCode,
    );
    const baseQuota = planFeature?.quota_value ?? null;
    const baseIsEnabled = planFeature?.is_enabled ?? false;

    const activeAddons = await this.prisma.subscriptionAddon.findMany({
      where: { subscription_id: subscriptionId, status: 'ACTIVE' },
      include: { addons: true },
    });
    const relevant = activeAddons.filter(
      (a) => a.addons.effect_feature_code === featureCode,
    );
    const enabledByAddon = relevant.some(
      (a) => a.addons.effect_type === 'ENABLE_FEATURE',
    );
    const quotaDelta = relevant
      .filter((a) => a.addons.effect_type === 'QUOTA_DELTA')
      .reduce((sum, a) => sum + (a.addons.effect_amount ?? 0) * a.quantity, 0);

    const noEffectRemaining = relevant.length === 0;
    // Plan already unlimited on this feature — an add-on's quota bump has
    // nothing to add; only ENABLE_FEATURE can still matter.
    const quotaBumpMeaningless = baseQuota === null && !enabledByAddon;

    if (noEffectRemaining || quotaBumpMeaningless) {
      if (existingOverride) {
        await this.prisma.tenant_feature_overrides.delete({
          where: {
            tenant_id_feature_code: {
              tenant_id: tenantId,
              feature_code: featureCode,
            },
          },
        });
      }
      return;
    }

    await this.prisma.tenant_feature_overrides.upsert({
      where: {
        tenant_id_feature_code: {
          tenant_id: tenantId,
          feature_code: featureCode,
        },
      },
      create: {
        tenant_id: tenantId,
        feature_code: featureCode,
        is_enabled: baseIsEnabled || enabledByAddon,
        quota_value: baseQuota !== null ? baseQuota + quotaDelta : null,
        note: AUTO_OVERRIDE_NOTE,
      },
      update: {
        is_enabled: baseIsEnabled || enabledByAddon,
        quota_value: baseQuota !== null ? baseQuota + quotaDelta : null,
        note: AUTO_OVERRIDE_NOTE,
        updated_at: new Date(),
      },
    });
  }
}
