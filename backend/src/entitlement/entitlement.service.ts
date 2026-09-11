import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface QuotaEntitlement {
  code: string;
  name: string;
  unit: string;
  module: string;
  mode: 'LIMITED' | 'UNLIMITED' | 'DISABLED';
  baseLimit: number | null;
  addonAdded: number;
  effectiveLimit: number | null;
}

export interface EffectiveEntitlementResult {
  tenantId: string;
  subscription: {
    id: string;
    status: string;
    planId: string;
    planCode: string;
    planName: string;
    startDate: Date;
    endDate: Date;
    isTrial: boolean;
    trialEndsAt: Date | null;
    billingCycle: string;
    supportTier: string;
  };
  features: Record<string, boolean>;
  integrations: Record<string, boolean>;
  quotas: Record<string, QuotaEntitlement>;
}

export interface QuotaUsageItem {
  code: string;
  name: string;
  unit: string;
  module: string;
  mode: 'LIMITED' | 'UNLIMITED' | 'DISABLED';
  currentValue: number;
  effectiveLimit: number | null;
  percentage: number;
  status: 'NORMAL' | 'WARNING_80' | 'CRITICAL_90' | 'LIMIT_REACHED' | 'DISABLED' | 'UNLIMITED';
  message?: string;
}

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán Effective Entitlement động:
   * Base Plan + Active Add-ons = Effective Entitlement
   * Source of Truth duy nhất cho backend và frontend.
   */
  async getEffectiveEntitlement(tenantId: string): Promise<EffectiveEntitlementResult> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        tenant_id: tenantId,
        status: { in: ['ACTIVE', 'TRIAL', 'PAST_DUE'] },
      },
      include: {
        saas_plans: {
          include: {
            saas_plan_features: {
              include: { platform_features: true },
            },
            plan_quotas: {
              include: { platform_quotas: true },
            },
            plan_integrations: {
              include: { platform_integrations: true },
            },
          },
        },
        subscription_addons: {
          where: { status: 'ACTIVE' },
          include: {
            addons: {
              include: {
                addon_quotas: {
                  include: { platform_quotas: true },
                },
                addon_features: {
                  include: { platform_features: true },
                },
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    if (!subscription || !subscription.saas_plans) {
      throw new ForbiddenException(
        'Tenant chưa kích hoạt hoặc đã hết hạn gói thuê SaaS FitFlow. Vui lòng đăng ký gói dịch vụ.',
      );
    }

    const plan = subscription.saas_plans;

    // 1. Fetch all platform catalogues for comprehensive baseline
    const [allFeatures, allQuotas, allIntegrations] = await Promise.all([
      this.prisma.platformFeature.findMany(),
      this.prisma.platformQuota.findMany(),
      this.prisma.platformIntegration.findMany(),
    ]);

    // 2. Base Features mapping
    const features: Record<string, boolean> = {};
    for (const f of allFeatures) {
      features[f.code] = false;
    }
    for (const pf of plan.saas_plan_features) {
      if (pf.platform_features) {
        features[pf.platform_features.code] = pf.is_enabled;
      }
    }

    // 3. Base Integrations mapping
    const integrations: Record<string, boolean> = {};
    for (const i of allIntegrations) {
      integrations[i.code] = false;
    }
    for (const pi of plan.plan_integrations) {
      if (pi.platform_integrations) {
        integrations[pi.platform_integrations.code] = pi.is_enabled;
      }
    }

    // 4. Base Quotas mapping
    const quotas: Record<string, QuotaEntitlement> = {};
    for (const q of allQuotas) {
      quotas[q.code] = {
        code: q.code,
        name: q.name,
        unit: q.unit,
        module: q.module,
        mode: 'LIMITED',
        baseLimit: 0,
        addonAdded: 0,
        effectiveLimit: 0,
      };
    }
    for (const pq of plan.plan_quotas) {
      if (pq.platform_quotas) {
        const code = pq.platform_quotas.code;
        quotas[code] = {
          code,
          name: pq.platform_quotas.name,
          unit: pq.platform_quotas.unit,
          module: pq.platform_quotas.module,
          mode: pq.mode as 'LIMITED' | 'UNLIMITED' | 'DISABLED',
          baseLimit: pq.quota_value,
          addonAdded: 0,
          effectiveLimit: pq.mode === 'LIMITED' ? pq.quota_value : null,
        };
      }
    }

    // 5. Overlay Active Add-ons
    for (const subAddon of subscription.subscription_addons) {
      const addon = subAddon.addons;
      if (!addon) continue;
      const qty = subAddon.quantity || 1;

      // Overlay Addon Features
      if (addon.addon_features) {
        for (const af of addon.addon_features) {
          if (af.platform_features) {
            features[af.platform_features.code] = true;
          }
        }
      }

      // Special check for integration add-ons
      if (addon.addon_type === 'INTEGRATION') {
        if (addon.code.includes('OPEN_API')) {
          integrations['OPEN_API'] = true;
          integrations['WEBHOOK'] = true;
        }
      }

      // Overlay Addon Quotas
      if (addon.addon_quotas) {
        for (const aq of addon.addon_quotas) {
          if (aq.platform_quotas) {
            const qCode = aq.platform_quotas.code;
            if (quotas[qCode]) {
              const added = aq.added_value * qty;
              quotas[qCode].addonAdded += added;

              if (quotas[qCode].mode === 'LIMITED') {
                quotas[qCode].effectiveLimit =
                  (quotas[qCode].baseLimit ?? 0) + quotas[qCode].addonAdded;
              } else if (quotas[qCode].mode === 'DISABLED') {
                // If it was disabled, addon activates it with the added value
                quotas[qCode].mode = 'LIMITED';
                quotas[qCode].effectiveLimit = quotas[qCode].addonAdded;
              }
            }
          }
        }
      }
    }

    return {
      tenantId,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        planId: plan.id,
        planCode: plan.code,
        planName: plan.name,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        isTrial: subscription.status === 'TRIAL',
        trialEndsAt: subscription.trial_ends_at,
        billingCycle: subscription.billing_cycle,
        supportTier: plan.support_tier || 'COMMUNITY',
      },
      features,
      integrations,
      quotas,
    };
  }

  /**
   * Kiểm tra và chặn nếu tính năng không được bật
   */
  async assertFeatureEnabled(tenantId: string, featureCode: string): Promise<void> {
    const entitlements = await this.getEffectiveEntitlement(tenantId);
    if (!entitlements.features[featureCode]) {
      throw new ForbiddenException(
        `Tính năng [${featureCode}] chưa được kích hoạt cho gói dịch vụ hiện tại của bạn. Vui lòng Nâng cấp gói hoặc mua thêm Add-on tính năng.`,
      );
    }
  }

  /**
   * Kiểm tra và chặn nếu tích hợp không được bật
   */
  async assertIntegrationEnabled(tenantId: string, integrationCode: string): Promise<void> {
    const entitlements = await this.getEffectiveEntitlement(tenantId);
    if (!entitlements.integrations[integrationCode]) {
      throw new ForbiddenException(
        `Tích hợp [${integrationCode}] chưa được kích hoạt cho phòng tập của bạn. Vui lòng liên hệ hỗ trợ hoặc nâng cấp lên gói Growth/Enterprise.`,
      );
    }
  }

  /**
   * Kiểm tra và chặn nếu tạo mới tài nguyên vượt quá Quota giới hạn
   */
  async assertQuotaAvailable(
    tenantId: string,
    quotaCode: string,
    requestedNextValue?: number,
  ): Promise<void> {
    const entitlements = await this.getEffectiveEntitlement(tenantId);
    const quota = entitlements.quotas[quotaCode];

    if (!quota) {
      return; // Không cấu hình hạn ngạch cho mã này
    }

    if (quota.mode === 'DISABLED') {
      throw new ForbiddenException(
        `Tài nguyên [${quota.name}] hiện đang bị vô hiệu hóa trong gói dịch vụ của bạn. Vui lòng Nâng cấp gói để sử dụng.`,
      );
    }

    if (quota.mode === 'UNLIMITED') {
      return; // Không giới hạn
    }

    // mode === 'LIMITED'
    let currentVal = requestedNextValue;
    if (currentVal === undefined) {
      currentVal = (await this.getCurrentQuotaValue(tenantId, quotaCode)) + 1;
    }

    if (quota.effectiveLimit !== null && currentVal > quota.effectiveLimit) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'QUOTA_EXCEEDED',
        quotaCode,
        quotaName: quota.name,
        currentValue: currentVal,
        limit: quota.effectiveLimit,
        unit: quota.unit,
        message: `Bạn đã đạt giới hạn tối đa của ${quota.name} (${quota.effectiveLimit} ${quota.unit}). Hệ thống không cho phép tạo thêm tài nguyên vượt định mức. Vui lòng Nâng cấp gói hoặc Mua thêm Add-on.`,
      });
    }
  }

  /**
   * Đếm số lượng tài nguyên thực tế hiện hành của Tenant
   */
  async getCurrentQuotaValue(tenantId: string, quotaCode: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (quotaCode) {
      case 'MAX_BRANCHES':
        return this.prisma.branch.count({
          where: { tenant_id: tenantId, status: 'ACTIVE' },
        });

      case 'MAX_MEMBERS':
        return this.prisma.customer.count({
          where: { tenant_id: tenantId, status: { not: 'DELETED' } },
        });

      case 'MAX_ACTIVE_MEMBERS':
        return this.prisma.membership.count({
          where: {
            tenant_id: tenantId,
            status: 'ACTIVE',
            end_date: { gte: now },
          },
        });

      case 'MAX_STAFF':
        return this.prisma.user.count({
          where: {
            tenant_id: tenantId,
            status: 'ACTIVE',
            user_roles: {
              some: {
                roles: {
                  code: { in: ['STAFF', 'MANAGER', 'BRANCH_MANAGER', 'RECEPTIONIST'] },
                },
              },
            },
          },
        });

      case 'MAX_PT':
        return this.prisma.user.count({
          where: {
            tenant_id: tenantId,
            status: 'ACTIVE',
            user_roles: {
              some: {
                roles: { code: 'PT' },
              },
            },
          },
        });

      case 'MAX_PT_BOOKINGS':
        return this.prisma.ptBooking.count({
          where: {
            tenant_id: tenantId,
            created_at: { gte: startOfMonth },
          },
        });

      case 'MAX_CHECKINS_MONTH':
        return this.prisma.attendances.count({
          where: {
            tenant_id: tenantId,
            check_in_at: { gte: startOfMonth },
          },
        });

      case 'MAX_STORAGE':
        // Dự toán lưu trữ (ví dụ 1.2 GB thực tế dựa trên tài liệu)
        return 1;

      case 'MAX_EMAILS_MONTH':
        return 120; // Giả định log email thực tế

      case 'MAX_SMS_MONTH':
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Tính toán toàn bộ Usage Dashboard cho Tenant:
   * current / limit, percentage, 80% warning, 90% critical, 100% limit reached
   */
  async getTenantUsageOverview(tenantId: string): Promise<{
    subscription: EffectiveEntitlementResult['subscription'];
    usages: QuotaUsageItem[];
  }> {
    const entitlement = await this.getEffectiveEntitlement(tenantId);
    const usages: QuotaUsageItem[] = [];

    for (const quota of Object.values(entitlement.quotas)) {
      const current = await this.getCurrentQuotaValue(tenantId, quota.code);
      let percentage = 0;
      let status: QuotaUsageItem['status'] = 'NORMAL';
      let message: string | undefined = undefined;

      if (quota.mode === 'UNLIMITED') {
        percentage = 0;
        status = 'UNLIMITED';
        message = 'Không giới hạn';
      } else if (quota.mode === 'DISABLED') {
        percentage = 0;
        status = 'DISABLED';
        message = 'Tính năng chưa được kích hoạt trong gói';
      } else {
        const limit = quota.effectiveLimit ?? 1;
        percentage = Math.min(100, Math.round((current / limit) * 100));

        if (current >= limit) {
          status = 'LIMIT_REACHED';
          message = 'Đã đạt giới hạn tối đa 100%. Vui lòng Nâng cấp gói hoặc Mua Add-on.';
        } else if (percentage >= 90) {
          status = 'CRITICAL_90';
          message = `Cảnh báo nghiêm trọng: Đã sử dụng ${percentage}% hạn mức.`;
        } else if (percentage >= 80) {
          status = 'WARNING_80';
          message = `Cảnh báo: Đã sử dụng ${percentage}% hạn mức.`;
        } else {
          status = 'NORMAL';
        }
      }

      usages.push({
        code: quota.code,
        name: quota.name,
        unit: quota.unit,
        module: quota.module,
        mode: quota.mode,
        currentValue: current,
        effectiveLimit: quota.effectiveLimit,
        percentage,
        status,
        message,
      });
    }

    return {
      subscription: entitlement.subscription,
      usages,
    };
  }
}
