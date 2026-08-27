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
      dailyUniqueVisitors,
      currentlyInGym,
      activeMembers,
      recentPayments,
      recentAttendances,
      recentMemberships,
      expiringTodayCount,
      expiringSoonCount,
      expiringMembershipsList,
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
      // BR-OD-03: lượt Undo (CANCELLED) không tính vào KPI. "Tổng lượt Check-in"
      // (Total Check-in Events) — mỗi lượt vào tính riêng, một khách có thể có nhiều lượt.
      this.prisma.attendances.count({
        where: {
          tenant_id: tenantId,
          check_in_at: { gte: from, lte: to },
          status: { not: 'CANCELLED' },
          ...branchFilter,
        },
      }),
      // BR-STAT-001: "Khách đã đến" (Daily Unique Visitors) — một khách chỉ tính một lần
      // trong kỳ dù check-in nhiều lượt (check-in → check-out → check-in lại). Không được
      // gộp chung với "Tổng lượt Check-in" phía trên — đó là hai chỉ số khác nhau.
      this.prisma.attendances
        .groupBy({
          by: ['customer_id'],
          where: {
            tenant_id: tenantId,
            check_in_at: { gte: from, lte: to },
            status: { not: 'CANCELLED' },
            ...branchFilter,
          },
        })
        .then((rows) => rows.length),
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
          method: true,
          payment_code: true,
          customers: { select: { id: true, full_name: true, phone: true, customer_code: true } },
          branches: { select: { id: true, name: true } },
        },
      }),
      this.prisma.attendances.findMany({
        where: { tenant_id: tenantId, status: { not: 'CANCELLED' } },
        orderBy: { check_in_at: 'desc' },
        take: 10,
        select: {
          id: true,
          check_in_at: true,
          check_in_method: true,
          status: true,
          branches: { select: { id: true, name: true } },
          customers: { select: { id: true, full_name: true, phone: true, customer_code: true } },
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
          start_date: true,
          end_date: true,
          status: true,
          customers: { select: { id: true, full_name: true, phone: true, customer_code: true } },
          branches: { select: { id: true, name: true } },
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
      this.prisma.membership.findMany({
        where: {
          tenant_id: tenantId,
          status: 'ACTIVE',
          end_date: {
            gte: this.startOfDay(new Date()),
            lte: this.addDays(this.startOfDay(new Date()), 7),
          },
          ...branchFilter,
        },
        orderBy: { end_date: 'asc' },
        take: 20,
        select: {
          id: true,
          package_name_snapshot: true,
          start_date: true,
          end_date: true,
          status: true,
          customers: { select: { id: true, full_name: true, phone: true, customer_code: true } },
          branches: { select: { id: true, name: true } },
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
      expiringMembershipsList,
      staffCount,
      branchCount,
      subscription,
    });

    const recentActivities = this.mergeRecentActivities(
      recentPayments,
      recentAttendances,
      recentMemberships,
    );

    const [activeMemCount, expiringSoonMemCount, expiredMemCount, totalMemCount] = await Promise.all([
      this.prisma.membership.count({
        where: { tenant_id: tenantId, status: 'ACTIVE', end_date: { gt: this.addDays(this.startOfDay(new Date()), 7) }, ...branchFilter },
      }),
      this.prisma.membership.count({
        where: {
          tenant_id: tenantId,
          status: 'ACTIVE',
          end_date: { gte: this.startOfDay(new Date()), lte: this.addDays(this.startOfDay(new Date()), 7) },
          ...branchFilter,
        },
      }),
      this.prisma.membership.count({
        where: { tenant_id: tenantId, status: 'EXPIRED', ...branchFilter },
      }),
      this.prisma.membership.count({
        where: { tenant_id: tenantId, ...branchFilter },
      }),
    ]);

    const membershipStatusBreakdown = [
      { label: 'Đang hoạt động', count: activeMemCount, pct: totalMemCount ? Math.round((activeMemCount / totalMemCount) * 100) : 0, color: 'bg-emerald-500' },
      { label: 'Sắp hết hạn (7 ngày)', count: expiringSoonMemCount, pct: totalMemCount ? Math.round((expiringSoonMemCount / totalMemCount) * 100) : 0, color: 'bg-amber-500' },
      { label: 'Hết hạn', count: expiredMemCount, pct: totalMemCount ? Math.round((expiredMemCount / totalMemCount) * 100) : 0, color: 'bg-rose-500' },
    ];

    const paymentsWithItems = await this.prisma.payment.findMany({
      where: { tenant_id: tenantId, status: 'PAID', paid_at: { gte: from, lte: to }, ...branchFilter },
      select: { total_amount: true, payment_type: true },
    });

    const pkgMap = new Map<string, number>();
    for (const p of paymentsWithItems) {
      const label = p.payment_type === 'MEMBERSHIP' ? 'Gói Membership' : p.payment_type === 'PT' ? 'Gói PT' : 'Vé lượt / Khác';
      pkgMap.set(label, (pkgMap.get(label) ?? 0) + Number(p.total_amount));
    }

    const totalRev = Array.from(pkgMap.values()).reduce((sum, v) => sum + v, 0);
    const revenueByPackageBreakdown = Array.from(pkgMap.entries()).map(([name, amount]) => ({
      name,
      amount,
      pct: totalRev > 0 ? Math.round((amount / totalRev) * 100) : 0,
    }));

    const membershipGrowthChart = await this.buildMembershipGrowthChart(tenantId, from, to, query.branchId);
    const peakCheckinHours = await this.buildPeakCheckinHours(tenantId, from, to, query.branchId);
    const peakCheckinDaysOfWeek = await this.buildPeakCheckinDaysOfWeek(tenantId, from, to, query.branchId);

    return {
      context: { tenantId, branchId: query.branchId ?? null, from, to },
      hasBranches: true,
      kpis: {
        revenue: {
          total: revenue,
          growthPct: this.growthPct(revenue, prevRevenue),
        },
        checkins: { total: checkinTotal, dailyUniqueVisitors },
        currentlyInGym,
        activeMembers,
      },
      revenueChart,
      branchPerformance,
      membershipStatusBreakdown,
      revenueByPackageBreakdown,
      membershipGrowthChart,
      peakCheckinHours,
      peakCheckinDaysOfWeek,
      alerts,
      recentActivities,
      recentCheckins: recentAttendances.map((a) => ({
        id: a.id,
        occurredAt: a.check_in_at,
        customerId: a.customers?.id,
        customerName: a.customers?.full_name || 'Khách hàng',
        customerPhone: a.customers?.phone || '',
        customerCode: a.customers?.customer_code || '',
        branchName: a.branches?.name || 'Chi nhánh',
        method: a.check_in_method,
        status: a.status,
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
    expiringMembershipsList: any[];
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
      id: string;
      type: 'MEMBERSHIP_EXPIRING_TODAY' | 'MEMBERSHIP_EXPIRING_SOON' | 'QUOTA_BRANCH' | 'QUOTA_STAFF';
      priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      message: string;
      targetUrl?: string;
      items?: any[];
      details?: any;
    }[] = [];

    if (params.expiringTodayCount > 0) {
      const todayItems = params.expiringMembershipsList.filter(
        (m) => new Date(m.end_date).toDateString() === new Date().toDateString(),
      );
      alerts.push({
        id: 'alert-expiring-today',
        type: 'MEMBERSHIP_EXPIRING_TODAY',
        priority: 'CRITICAL',
        message: `${params.expiringTodayCount} Membership hết hạn hôm nay`,
        targetUrl: '/owner/customers',
        items: (todayItems.length > 0 ? todayItems : params.expiringMembershipsList).map((m) => ({
          id: m.id,
          customerId: m.customers?.id,
          customerName: m.customers?.full_name || 'Hội viên',
          customerPhone: m.customers?.phone || '',
          customerCode: m.customers?.customer_code || '',
          packageName: m.package_name_snapshot,
          branchName: m.branches?.name || '',
          endDate: m.end_date,
          daysRemaining: 0,
        })),
      });
    }
    if (params.expiringSoonCount > 0) {
      const now = new Date();
      alerts.push({
        id: 'alert-expiring-soon',
        type: 'MEMBERSHIP_EXPIRING_SOON',
        priority: 'HIGH',
        message: `${params.expiringSoonCount} Membership hết hạn trong 7 ngày`,
        targetUrl: '/owner/customers',
        items: params.expiringMembershipsList.map((m) => {
          const days = Math.ceil((new Date(m.end_date).getTime() - now.getTime()) / 86_400_000);
          return {
            id: m.id,
            customerId: m.customers?.id,
            customerName: m.customers?.full_name || 'Hội viên',
            customerPhone: m.customers?.phone || '',
            customerCode: m.customers?.customer_code || '',
            packageName: m.package_name_snapshot,
            branchName: m.branches?.name || '',
            endDate: m.end_date,
            daysRemaining: Math.max(0, days),
          };
        }),
      });
    }

    const quotaByCode = new Map(
      (params.subscription?.saas_plans.saas_plan_features ?? []).map((f: any) => [
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
        id: 'alert-quota-branch',
        type: 'QUOTA_BRANCH',
        priority: 'MEDIUM',
        message: `Đã dùng ${params.branchCount}/${maxBranches} chi nhánh`,
        targetUrl: '/owner/branches',
        details: { used: params.branchCount, limit: maxBranches },
      });
    }
    if (
      typeof maxStaff === 'number' &&
      maxStaff > 0 &&
      params.staffCount / maxStaff >= 0.9
    ) {
      alerts.push({
        id: 'alert-quota-staff',
        type: 'QUOTA_STAFF',
        priority: 'MEDIUM',
        message: `Đã dùng ${params.staffCount}/${maxStaff} nhân sự`,
        targetUrl: '/owner/branch-managers',
        details: { used: params.staffCount, limit: maxStaff },
      });
    }

    return alerts.slice(0, 10);
  }

  // BR-OD-07: chỉ sự kiện nghiệp vụ, không sự kiện kỹ thuật.
  private mergeRecentActivities(
    payments: any[],
    attendances: any[],
    memberships: any[],
  ) {
    const events = [
      ...payments.map((p) => ({
        id: p.id,
        type: 'PAYMENT' as const,
        occurredAt: p.paid_at ?? new Date(0),
        message: `Thanh toán thành công ${Number(p.total_amount).toLocaleString('vi-VN')}đ — ${p.customers?.full_name || 'Khách hàng'}`,
        details: {
          id: p.id,
          amount: Number(p.total_amount),
          paymentType: p.payment_type,
          paymentMethod: p.method,
          invoiceCode: p.payment_code,
          customerId: p.customers?.id,
          customerName: p.customers?.full_name,
          customerPhone: p.customers?.phone,
          customerCode: p.customers?.customer_code,
          branchName: p.branches?.name,
        },
      })),
      ...attendances.map((a) => ({
        id: a.id,
        type: 'CHECKIN' as const,
        occurredAt: a.check_in_at,
        message: `${a.customers?.full_name || 'Hội viên'} Check-in tại ${a.branches?.name || 'Chi nhánh'}`,
        details: {
          id: a.id,
          customerId: a.customers?.id,
          customerName: a.customers?.full_name,
          customerPhone: a.customers?.phone,
          customerCode: a.customers?.customer_code,
          branchName: a.branches?.name,
          checkInMethod: a.check_in_method,
          status: a.status,
        },
      })),
      ...memberships.map((m) => ({
        id: m.id,
        type: 'MEMBERSHIP' as const,
        occurredAt: m.created_at,
        message: `Membership "${m.package_name_snapshot}" mới cho ${m.customers?.full_name || 'Hội viên'}`,
        details: {
          id: m.id,
          customerId: m.customers?.id,
          customerName: m.customers?.full_name,
          customerPhone: m.customers?.phone,
          customerCode: m.customers?.customer_code,
          packageName: m.package_name_snapshot,
          startDate: m.start_date,
          endDate: m.end_date,
          branchName: m.branches?.name,
          status: m.status,
        },
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

  private async buildMembershipGrowthChart(
    tenantId: string,
    from: Date,
    to: Date,
    branchId?: string,
  ) {
    const branchFilter = branchId ? { branch_id: branchId } : {};
    const memberships = await this.prisma.membership.findMany({
      where: { tenant_id: tenantId, created_at: { gte: from, lte: to }, ...branchFilter },
      select: { created_at: true },
    });

    const dateMap = new Map<string, number>();
    const curr = new Date(from);
    while (curr <= to) {
      const dStr = curr.toISOString().split('T')[0];
      dateMap.set(dStr, 0);
      curr.setDate(curr.getDate() + 1);
    }

    for (const m of memberships) {
      const dStr = m.created_at.toISOString().split('T')[0];
      if (dateMap.has(dStr)) {
        dateMap.set(dStr, (dateMap.get(dStr) ?? 0) + 1);
      }
    }

    return Array.from(dateMap.entries()).map(([date, count]) => ({ date, count }));
  }

  private async buildPeakCheckinHours(
    tenantId: string,
    from: Date,
    to: Date,
    branchId?: string,
  ) {
    const branchFilter = branchId ? { branch_id: branchId } : {};
    const attendances = await this.prisma.attendances.findMany({
      where: { tenant_id: tenantId, check_in_at: { gte: from, lte: to }, ...branchFilter },
      select: { check_in_at: true },
    });

    const hourMap = new Map<number, number>();
    for (let h = 6; h <= 21; h++) hourMap.set(h, 0);

    for (const a of attendances) {
      const h = new Date(a.check_in_at).getHours();
      if (hourMap.has(h)) {
        hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
      }
    }

    return Array.from(hourMap.entries()).map(([h, count]) => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      count,
    }));
  }

  private async buildPeakCheckinDaysOfWeek(
    tenantId: string,
    from: Date,
    to: Date,
    branchId?: string,
  ) {
    const branchFilter = branchId ? { branch_id: branchId } : {};
    const attendances = await this.prisma.attendances.findMany({
      where: { tenant_id: tenantId, check_in_at: { gte: from, lte: to }, ...branchFilter },
      select: { check_in_at: true },
    });

    const DAY_LABELS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayMap = new Map<number, number>();
    for (let d = 0; d <= 6; d++) dayMap.set(d, 0);

    for (const a of attendances) {
      const dayIdx = new Date(a.check_in_at).getDay();
      dayMap.set(dayIdx, (dayMap.get(dayIdx) ?? 0) + 1);
    }

    const orderedIndices = [1, 2, 3, 4, 5, 6, 0];
    return orderedIndices.map((idx) => ({
      day: DAY_LABELS[idx],
      count: dayMap.get(idx) ?? 0,
    }));
  }
}
