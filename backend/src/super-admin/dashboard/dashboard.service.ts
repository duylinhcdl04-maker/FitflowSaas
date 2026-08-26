import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [
      tenantGroups,
      subscriptionGroups,
      activeSubs,
      churnedRecently,
      faceEmbeddingsCount,
    ] = await Promise.all([
      this.prisma.tenant.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.subscription.findMany({
        where: { status: 'ACTIVE' },
        select: {
          price: true,
          billing_cycle: true,
          billing_cycle_months: true,
        },
      }),
      this.prisma.subscription.count({
        where: {
          status: { in: ['CANCELLED', 'EXPIRED'] },
          updated_at: { gte: new Date(Date.now() - THIRTY_DAYS_MS) },
        },
      }),
      this.prisma.face_embeddings.count(),
    ]);

    const tenantsByStatus = toStatusMap(tenantGroups);
    const subscriptionsByStatus = toStatusMap(subscriptionGroups);

    let mrr = 0;
    let customBillingCount = 0;
    for (const sub of activeSubs) {
      const price = Number(sub.price);
      // billing_cycle_months (1-12) is the real source of truth since the
      // configurable billing cycle feature (SA-06) shipped — exact division
      // instead of guessing from the MONTHLY/QUARTERLY/YEARLY/CUSTOM enum
      // bucket. Rows from before that migration without a month count set
      // fall back to the legacy enum, then finally to "can't normalize".
      if (sub.billing_cycle_months) {
        mrr += price / sub.billing_cycle_months;
      } else if (sub.billing_cycle === 'MONTHLY') mrr += price;
      else if (sub.billing_cycle === 'QUARTERLY') mrr += price / 3;
      else if (sub.billing_cycle === 'YEARLY') mrr += price / 12;
      else customBillingCount += 1; // CUSTOM cycles can't be normalized generically
    }

    const activeCount = subscriptionsByStatus.ACTIVE ?? 0;
    const churnRate =
      activeCount + churnedRecently > 0
        ? churnedRecently / (activeCount + churnedRecently)
        : 0;

    return {
      tenants: {
        total: tenantGroups.reduce((sum, g) => sum + g._count._all, 0),
        byStatus: tenantsByStatus,
      },
      subscriptions: {
        byStatus: subscriptionsByStatus,
        customBillingCount,
      },
      revenue: {
        currency: 'VND',
        mrr: Math.round(mrr),
        arr: Math.round(mrr * 12),
      },
      churn: {
        // Approximation: churned-in-last-30-days / (currently-active + churned-in-window).
        // A precise cohort-based churn rate needs a period-snapshot table this schema doesn't have yet.
        ratio: Number(churnRate.toFixed(4)),
        churnedLast30Days: churnedRecently,
      },
      platformUsage: {
        faceEmbeddingsRegistered: faceEmbeddingsCount,
        // Not tracked anywhere in the current schema — reported as unavailable rather than guessed.
        storageUsageBytes: null,
        faceApiCallsThisMonth: null,
      },
    };
  }
}

function toStatusMap(
  groups: { status: string; _count: { _all: number } }[],
): Record<string, number> {
  return Object.fromEntries(groups.map((g) => [g.status, g._count._all]));
}
