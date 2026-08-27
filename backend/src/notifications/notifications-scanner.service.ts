import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService, type NotificationDetailItem } from './notifications.service';

// Cap the per-notification detail list — a notification bell entry is a preview,
// not a full report (the "Tới trang xử lý" button in the detail modal is where
// you see everything). Mirrors DETAIL_LIMIT in ManagerService's own queue widget.
const ITEM_DETAIL_LIMIT = 10;

/**
 * Periodic sweep that turns the same 3 "cần chú ý" conditions already shown live
 * on the Owner/Manager dashboards (pending payments, memberships expiring in 3
 * days, members inactive 14+ days) into persistent, per-recipient Notification
 * rows — so they survive as a real inbox (unread badge, mark-read, delete-read)
 * instead of only existing as a number recomputed on every dashboard load.
 *
 * Recomputing here is deliberate small duplication against
 * ManagerService.getDashboardOverview / OwnerDashboardService.buildAlerts (same
 * tolerance already accepted elsewhere in this codebase) rather than threading
 * this scanner through those request-path services.
 */
@Injectable()
export class NotificationsScannerService {
  private readonly logger = new Logger(NotificationsScannerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async scan() {
    const branches = await this.prisma.branch.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, tenant_id: true, name: true },
    });

    for (const branch of branches) {
      try {
        await this.scanBranch(branch.id, branch.tenant_id, branch.name);
      } catch (err) {
        this.logger.error(`Notification scan failed for branch ${branch.id}`, err as Error);
      }
    }
  }

  private async scanBranch(branchId: string, tenantId: string, branchName: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [pendingPayments, expiringMemberships, atRiskCustomers, recipients] = await Promise.all([
      this.prisma.payment.findMany({
        where: { tenant_id: tenantId, branch_id: branchId, status: 'PENDING' },
        take: ITEM_DETAIL_LIMIT,
        orderBy: { created_at: 'desc' },
        include: { customers: { select: { full_name: true, phone: true } } },
      }),
      this.prisma.membership.findMany({
        where: {
          tenant_id: tenantId,
          branch_id: branchId,
          status: 'ACTIVE',
          end_date: { gte: todayStart, lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
        },
        take: ITEM_DETAIL_LIMIT,
        orderBy: { end_date: 'asc' },
        include: { customers: { select: { full_name: true, phone: true } } },
      }),
      this.prisma.customer.findMany({
        where: {
          tenant_id: tenantId,
          home_branch_id: branchId,
          status: 'ACTIVE',
          memberships: {
            some: {
              status: 'ACTIVE',
              end_date: { gte: todayStart },
            },
          },
          attendances: { none: { check_in_at: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
        },
        take: ITEM_DETAIL_LIMIT,
        orderBy: { created_at: 'asc' },
        select: {
          id: true,
          full_name: true,
          phone: true,
          created_at: true,
          memberships: {
            where: { status: 'ACTIVE', end_date: { gte: todayStart } },
            take: 1,
            select: { start_date: true, package_name_snapshot: true },
          },
          attendances: { orderBy: { check_in_at: 'desc' }, take: 1, select: { check_in_at: true } },
        },
      }),
      this.notifications.getBranchRecipients(tenantId, branchId),
    ]);

    const pendingPaymentsItems: NotificationDetailItem[] = pendingPayments.map((p) => ({
      id: p.id,
      customerName: p.customers.full_name,
      customerPhone: p.customers.phone,
      amount: Number(p.total_amount),
      method: p.method,
    }));
    const expiringMembershipsItems: NotificationDetailItem[] = expiringMemberships.map((m) => ({
      id: m.id,
      customerName: m.customers.full_name,
      customerPhone: m.customers.phone,
      packageName: m.package_name_snapshot,
      startDate: m.start_date.toISOString(),
      endDate: m.end_date.toISOString(),
    }));
    const atRiskItems: NotificationDetailItem[] = atRiskCustomers.map((c) => ({
      id: c.id,
      customerName: c.full_name,
      customerPhone: c.phone,
      packageName: c.memberships[0]?.package_name_snapshot,
      startDate: c.memberships[0]?.start_date?.toISOString() ?? c.created_at.toISOString(),
      lastVisitAt: c.attendances[0]?.check_in_at.toISOString() ?? null,
    }));

    for (const recipientUserId of recipients) {
      await this.syncOne({
        tenantId,
        branchId,
        branchName,
        recipientUserId,
        eventCode: 'PENDING_PAYMENTS',
        count: pendingPayments.length,
        items: pendingPaymentsItems,
        title: (n) => `${n} giao dịch chờ xác nhận thanh toán`,
        body: `Vui lòng kiểm tra và xác nhận thủ công nếu khách đã chuyển khoản.`,
        targetPath: '/memberships',
      });
      await this.syncOne({
        tenantId,
        branchId,
        branchName,
        recipientUserId,
        eventCode: 'MEMBERSHIP_EXPIRING_SOON',
        count: expiringMemberships.length,
        items: expiringMembershipsItems,
        title: (n) => `${n} gói tập sẽ hết hạn trong 3 ngày tới`,
        body: `Liên hệ tư vấn gia hạn cho hội viên.`,
        targetPath: '/customers',
      });
      await this.syncOne({
        tenantId,
        branchId,
        branchName,
        recipientUserId,
        eventCode: 'MEMBERS_AT_RISK',
        count: atRiskCustomers.length,
        items: atRiskItems,
        title: (n) => `${n} hội viên chưa đi tập trên 14 ngày`,
        body: `Cần hỗ trợ chăm sóc để hạn chế rời bỏ.`,
        targetPath: '/customers',
      });
    }
  }

  private async syncOne(opts: {
    tenantId: string;
    branchId: string;
    branchName: string;
    recipientUserId: string;
    eventCode: string;
    count: number;
    items: NotificationDetailItem[];
    title: (n: number) => string;
    body: string;
    targetPath: string;
  }) {
    const dedupeSuffix = opts.branchId;
    if (opts.count === 0) {
      await this.notifications.resolveByDedupe(opts.tenantId, opts.eventCode, dedupeSuffix, opts.recipientUserId);
      return;
    }
    await this.notifications.upsertForRecipient({
      tenantId: opts.tenantId,
      recipientUserId: opts.recipientUserId,
      eventCode: opts.eventCode,
      dedupeSuffix,
      title: opts.title(opts.count),
      body: opts.body,
      payload: { branchId: opts.branchId, branchName: opts.branchName, count: opts.count, items: opts.items },
      targetPath: opts.targetPath,
    });
  }
}
