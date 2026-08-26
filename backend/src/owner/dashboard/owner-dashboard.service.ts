import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { deriveAccessMode } from '../../common/utils/access-mode';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryRevenueDto } from './dto/query-revenue.dto';

// BR-OD-04 / SA-03 style: các feature code đại diện hạn mức đếm được.
// Trùng lặp với QUOTA_FEATURE_CODES bên super-admin/tenants — chấp nhận trùng
// lặp nhỏ này (đã có tiền lệ tương tự giữa tenants.service.ts và
// subscriptions.service.ts), chưa gộp thành hằng số dùng chung.
const QUOTA_FEATURE_CODES = ['MAX_BRANCHES', 'MAX_STAFF'] as const;

@Injectable()
export class OwnerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(tenantId: string, query: QueryDashboardDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Không tìm thấy doanh nghiệp');

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

    const { from, to } = this.resolveRange(query);
    const branchFilter = query.branchId ? { branch_id: query.branchId } : {};

    const [branchCount, staffCount, branches] = await Promise.all([
      this.prisma.branch.count({ where: { tenant_id: tenantId } }),
      this.prisma.user.count({ where: { tenant_id: tenantId } }),
      this.prisma.branch.findMany({
        where: { tenant_id: tenantId },
        select: { id: true, name: true, code: true },
      }),
    ]);

    // EC-OD-01: Tenant chưa thiết lập gì — trả empty state thay vì KPI = 0 khô khan.
    if (branchCount === 0) {
      return {
        context: { tenantId, branchId: query.branchId ?? null, from, to },
        hasBranches: false,
        accessMode: subscription
          ? deriveAccessMode({
              tenantStatus: tenant.status,
              subscriptionStatus: subscription.status,
              trialEndsAt: subscription.trial_ends_at,
              subscriptionEndDate: subscription.end_date,
            })
          : 'FULL_ACCESS',
        subscription: subscription
          ? this.buildSubscriptionWidget(subscription, 0, staffCount)
          : null,
      };
    }

    const [
      revenueAgg,
      prevRevenueAgg,
      checkinTotal,
      currentlyInGym,
      activeMembers,
      recentPayments,
      recentAttendances,
      recentMemberships,
      expiringTodayCount,
      expiringSoonCount,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: {
          tenant_id: tenantId,
          status: 'PAID',
          paid_at: { gte: from, lte: to },
          ...branchFilter,
        },
        _sum: { total_amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          tenant_id: tenantId,
          status: 'PAID',
          paid_at: { gte: this.shiftRange(from, to).from, lt: from },
          ...branchFilter,
        },
        _sum: { total_amount: true },
      }),
      // BR-OD-03: lượt Undo (CANCELLED) không tính vào KPI.
      this.prisma.attendances.count({
        where: {
          tenant_id: tenantId,
          check_in_at: { gte: from, lte: to },
          status: { not: 'CANCELLED' },
          ...branchFilter,
        },
      }),
      // BR-OD-09: tính theo thời điểm hiện tại, không phụ thuộc Date Range.
      this.prisma.attendances.count({
        where: { tenant_id: tenantId, status: 'CHECKED_IN', ...branchFilter },
      }),
      // BR-OD-04: một khách chỉ tính một lần dù có nhiều Membership.
      this.prisma.membership
        .groupBy({
          by: ['customer_id'],
          where: { tenant_id: tenantId, status: 'ACTIVE', ...branchFilter },
        })
        .then((rows) => rows.length),
      this.prisma.payment.findMany({
        where: { tenant_id: tenantId, status: 'PAID' },
        orderBy: { paid_at: 'desc' },
        take: 5,
        select: {
          id: true,
          total_amount: true,
          paid_at: true,
          payment_type: true,
          customers: { select: { full_name: true } },
        },
      }),
      this.prisma.attendances.findMany({
        where: { tenant_id: tenantId, status: { not: 'CANCELLED' } },
        orderBy: { check_in_at: 'desc' },
        take: 5,
        select: {
          id: true,
          check_in_at: true,
          check_in_method: true,
          branches: { select: { name: true } },
          customers: { select: { full_name: true } },
        },
      }),
      this.prisma.membership.findMany({
        where: { tenant_id: tenantId },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          created_at: true,
          package_name_snapshot: true,
          customers: { select: { full_name: true } },
        },
      }),
      this.prisma.membership.count({
        where: {
          tenant_id: tenantId,
          status: 'ACTIVE',
          end_date: { equals: this.startOfDay(new Date()) },
        },
      }),
      this.prisma.membership.count({
        where: {
          tenant_id: tenantId,
          status: 'ACTIVE',
          end_date: {
            gt: this.startOfDay(new Date()),
            lte: this.addDays(this.startOfDay(new Date()), 7),
          },
        },
      }),
    ]);

    const revenue = Number(revenueAgg._sum.total_amount ?? 0);
    const prevRevenue = Number(prevRevenueAgg._sum.total_amount ?? 0);

    const branchPerformance =
      branchCount >= 2
        ? await this.buildBranchPerformance(tenantId, branches, from, to)
        : [];

    const revenueChart = await this.buildRevenueChart(
      tenantId,
      from,
      to,
      query.branchId,
    );

    const alerts = this.buildAlerts({
      expiringTodayCount,
      expiringSoonCount,
      staffCount,
      branchCount,
      subscription,
    });

    const recentActivities = this.mergeRecentActivities(
      recentPayments,
      recentAttendances,
      recentMemberships,
    );

    return {
      context: { tenantId, branchId: query.branchId ?? null, from, to },
      hasBranches: true,
      kpis: {
        revenue: {
          total: revenue,
          growthPct: this.growthPct(revenue, prevRevenue),
        },
        checkins: { total: checkinTotal },
        currentlyInGym,
        activeMembers,
      },
      revenueChart,
      branchPerformance,
      alerts,
      recentActivities,
      recentCheckins: recentAttendances.map((a) => ({
        id: a.id,
        occurredAt: a.check_in_at,
        customerName: a.customers.full_name,
        branchName: a.branches.name,
        method: a.check_in_method,
      })),
      subscription: subscription
        ? this.buildSubscriptionWidget(subscription, branchCount, staffCount)
        : null,
      accessMode: subscription
        ? deriveAccessMode({
            tenantStatus: tenant.status,
            subscriptionStatus: subscription.status,
            trialEndsAt: subscription.trial_ends_at,
            subscriptionEndDate: subscription.end_date,
          })
        : 'FULL_ACCESS',
    };
  }

  private resolveRange(query: { from?: string; to?: string }) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from ? new Date(query.from) : this.startOfDay(to);
    return { from, to };
  }

  private shiftRange(from: Date, to: Date) {
    const durationMs = to.getTime() - from.getTime();
    return {
      from: new Date(from.getTime() - durationMs),
      to: new Date(from.getTime()),
    };
  }

  private growthPct(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  private startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private async buildRevenueChart(
    tenantId: string,
    from: Date,
    to: Date,
    branchId?: string,
  ) {
    const payments = await this.prisma.payment.findMany({
      where: {
        tenant_id: tenantId,
        status: 'PAID',
        paid_at: { gte: from, lte: to },
        ...(branchId ? { branch_id: branchId } : {}),
      },
      select: { total_amount: true, paid_at: true },
    });
    const byDay = new Map<string, number>();
    for (const p of payments) {
      const key = (p.paid_at ?? new Date()).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + Number(p.total_amount));
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));
  }

  async getRevenueChart(tenantId: string, query: QueryRevenueDto) {
    const { from, to } = this.resolveRange(query);
    const branchFilter = query.branchId ? { branch_id: query.branchId } : {};
    const groupBy = query.groupBy || 'day';

    const payments = await this.prisma.payment.findMany({
      where: {
        tenant_id: tenantId,
        status: 'PAID',
        paid_at: { gte: from, lte: to },
        ...branchFilter,
      },
      select: { total_amount: true, paid_at: true },
    });

    const grouped = new Map<string, number>();
    for (const p of payments) {
      const date = p.paid_at ?? new Date();
      let key = '';
      if (groupBy === 'day') {
        key = date.toISOString().slice(0, 10);
      } else if (groupBy === 'week') {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.getTime());
        monday.setDate(diff);
        key = monday.toISOString().slice(0, 10);
      } else if (groupBy === 'month') {
        key = date.toISOString().slice(0, 7);
      }
      grouped.set(key, (grouped.get(key) ?? 0) + Number(p.total_amount));
    }

    const data = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    const total = data.reduce((sum, item) => sum + item.revenue, 0);
    return { total, data };
  }

  private async buildBranchPerformance(
    tenantId: string,
    branches: { id: string; name: string; code: string }[],
    from: Date,
    to: Date,
  ) {
    return Promise.all(
      branches.map(async (b) => {
        const [revenueAgg, checkinCount] = await Promise.all([
          this.prisma.payment.aggregate({
            where: {
              tenant_id: tenantId,
              branch_id: b.id,
              status: 'PAID',
              paid_at: { gte: from, lte: to },
            },
            _sum: { total_amount: true },
          }),
          this.prisma.attendances.count({
            where: {
              tenant_id: tenantId,
              branch_id: b.id,
              check_in_at: { gte: from, lte: to },
              status: { not: 'CANCELLED' },
            },
          }),
        ]);
        return {
          branchId: b.id,
          name: b.name,
          code: b.code,
          revenue: Number(revenueAgg._sum.total_amount ?? 0),
          checkins: checkinCount,
        };
      }),
    );
  }

  private buildAlerts(params: {
    expiringTodayCount: number;
    expiringSoonCount: number;
    staffCount: number;
    branchCount: number;
    subscription: {
      saas_plans: {
        saas_plan_features: {
          is_enabled: boolean;
          quota_value: number | null;
          platform_features: { code: string };
        }[];
      };
    } | null;
  }) {
    const alerts: {
      priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      message: string;
    }[] = [];

    if (params.expiringTodayCount > 0) {
      alerts.push({
        priority: 'CRITICAL',
        message: `${params.expiringTodayCount} Membership hết hạn hôm nay`,
      });
    }
    if (params.expiringSoonCount > 0) {
      alerts.push({
        priority: 'HIGH',
        message: `${params.expiringSoonCount} Membership hết hạn trong 7 ngày`,
      });
    }

    const quotaByCode = new Map(
      (params.subscription?.saas_plans.saas_plan_features ?? []).map((f) => [
        f.platform_features.code,
        f.quota_value,
      ]),
    );
    const maxBranches = quotaByCode.get('MAX_BRANCHES');
    const maxStaff = quotaByCode.get('MAX_STAFF');

    if (
      typeof maxBranches === 'number' &&
      maxBranches > 0 &&
      params.branchCount / maxBranches >= 0.9
    ) {
      alerts.push({
        priority: 'MEDIUM',
        message: `Đã dùng ${params.branchCount}/${maxBranches} chi nhánh`,
      });
    }
    if (
      typeof maxStaff === 'number' &&
      maxStaff > 0 &&
      params.staffCount / maxStaff >= 0.9
    ) {
      alerts.push({
        priority: 'MEDIUM',
        message: `Đã dùng ${params.staffCount}/${maxStaff} nhân sự`,
      });
    }

    return alerts.slice(0, 10);
  }

  // BR-OD-07: chỉ sự kiện nghiệp vụ, không sự kiện kỹ thuật.
  private mergeRecentActivities(
    payments: {
      id: string;
      total_amount: unknown;
      paid_at: Date | null;
      payment_type: string;
      customers: { full_name: string };
    }[],
    attendances: {
      id: string;
      check_in_at: Date;
      branches: { name: string };
      customers: { full_name: string };
    }[],
    memberships: {
      id: string;
      created_at: Date;
      package_name_snapshot: string;
      customers: { full_name: string };
    }[],
  ) {
    const events = [
      ...payments.map((p) => ({
        occurredAt: p.paid_at ?? new Date(0),
        message: `Thanh toán thành công ${Number(p.total_amount).toLocaleString('vi-VN')}đ — ${p.customers.full_name}`,
      })),
      ...attendances.map((a) => ({
        occurredAt: a.check_in_at,
        message: `${a.customers.full_name} Check-in tại ${a.branches.name}`,
      })),
      ...memberships.map((m) => ({
        occurredAt: m.created_at,
        message: `Membership "${m.package_name_snapshot}" mới cho ${m.customers.full_name}`,
      })),
    ];
    return events
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, 10);
  }

  private buildSubscriptionWidget(
    subscription: {
      status: string;
      trial_ends_at: Date | null;
      end_date: Date;
      saas_plans: {
        name: string;
        saas_plan_features: {
          quota_value: number | null;
          platform_features: { code: string };
        }[];
      };
    },
    branchCount: number,
    staffCount: number,
  ) {
    const now = new Date();
    const quotaByCode = new Map(
      subscription.saas_plans.saas_plan_features.map((f) => [
        f.platform_features.code,
        f.quota_value,
      ]),
    );

    const daysRemaining =
      subscription.status === 'TRIAL' && subscription.trial_ends_at
        ? Math.ceil(
            (subscription.trial_ends_at.getTime() - now.getTime()) / 86_400_000,
          )
        : null;
    const daysUntilRenewal =
      subscription.status === 'ACTIVE'
        ? Math.ceil(
            (subscription.end_date.getTime() - now.getTime()) / 86_400_000,
          )
        : null;

    return {
      planName: subscription.saas_plans.name,
      status: subscription.status,
      daysRemaining,
      daysUntilRenewal,
      usage: QUOTA_FEATURE_CODES.map((code) => ({
        code,
        used: code === 'MAX_BRANCHES' ? branchCount : staffCount,
        limit: quotaByCode.get(code) ?? null,
      })),
    };
  }
}
