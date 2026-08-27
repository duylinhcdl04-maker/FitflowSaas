import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { ROLE } from '../common/types/role';

const LIST_LIMIT = 50;

/** Per-record detail shown in the notification's "xem chi tiết" drill-down —
 * same shape whether the notification covers 1 record (a sale just confirmed)
 * or several (recurring "cần chú ý" alerts), so the frontend renders both with
 * one table component. */
export interface NotificationDetailItem {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  amount?: number;
  method?: string;
  packageName?: string;
  startDate?: string;
  endDate?: string;
  lastVisitAt?: string | null;
}

export interface NotifyOnceInput {
  tenantId: string;
  branchId: string;
  branchName: string;
  eventCode: string;
  /** Id of the underlying record (paymentId/membershipId/visitId, ...) — makes this event instance unique. */
  entityId: string;
  title: string;
  body?: string;
  targetPath?: string;
  extraPayload?: Record<string, unknown>;
}

export interface UpsertNotificationInput {
  tenantId: string;
  recipientUserId: string;
  eventCode: string;
  title: string;
  body?: string;
  /** Folded into `dedupe_key` (unique per tenant) so re-running the scanner updates this row in place. */
  dedupeSuffix: string;
  /** Comparable snapshot (e.g. the count driving the alert) — used to decide whether a resolved-then-read
   * notification should resurface as unread again because the underlying situation actually changed. */
  payload?: Record<string, unknown>;
  targetPath?: string;
}

// BR-NOTIF-01: một thông báo chỉ được xoá khi đã đọc — người dùng phải thấy nó trước khi nó biến mất.
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async list(tenantId: string, userId: string) {
    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { tenant_id: tenantId, recipient_user_id: userId },
        // read_at IS NULL (chưa đọc) trước, rồi mới tới mới nhất — chưa đọc luôn nổi lên đầu.
        orderBy: [
          { read_at: { sort: 'asc', nulls: 'first' } },
          { created_at: 'desc' },
        ],
        take: LIST_LIMIT,
      }),
      this.prisma.notification.count({
        where: {
          tenant_id: tenantId,
          recipient_user_id: userId,
          read_at: null,
        },
      }),
    ]);

    const items = rows.map((n) => ({
      id: n.id,
      eventCode: n.event_code,
      title: n.title,
      body: n.body,
      payload: n.payload as {
        targetPath?: string;
        [key: string]: unknown;
      } | null,
      readAt: n.read_at,
      createdAt: n.created_at,
    }));

    return { items, unreadCount };
  }

  async markRead(tenantId: string, userId: string, id: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, tenant_id: tenantId, recipient_user_id: userId },
    });
    if (!notif) throw new NotFoundException('Không tìm thấy thông báo');
    if (notif.read_at) return notif;
    return this.prisma.notification.update({
      where: { id },
      data: { read_at: new Date() },
    });
  }

  async markAllRead(tenantId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { tenant_id: tenantId, recipient_user_id: userId, read_at: null },
      data: { read_at: new Date() },
    });
    return { success: true };
  }

  async remove(tenantId: string, userId: string, id: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, tenant_id: tenantId, recipient_user_id: userId },
    });
    if (!notif) throw new NotFoundException('Không tìm thấy thông báo');
    if (!notif.read_at) {
      throw new BadRequestException('Chỉ có thể xoá thông báo đã đọc');
    }
    await this.prisma.notification.delete({ where: { id } });
    return { success: true };
  }

  async removeAllRead(tenantId: string, userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        tenant_id: tenantId,
        recipient_user_id: userId,
        read_at: { not: null },
      },
    });
    return { success: true, count: result.count };
  }

  /**
   * Create-or-update-in-place a recurring, per-recipient notification (used by
   * NotificationsScannerService). `dedupeSuffix` should already be unique per
   * (event, branch, recipient) so re-scanning the same situation updates this
   * one row instead of spamming a new row every tick.
   */
  async upsertForRecipient(input: UpsertNotificationInput) {
    const dedupeKey = `${input.eventCode}:${input.dedupeSuffix}:${input.recipientUserId}`;
    const existing = await this.prisma.notification.findFirst({
      where: { tenant_id: input.tenantId, dedupe_key: dedupeKey },
    });

    const payloadWithTarget = {
      ...(input.payload ?? {}),
      targetPath: input.targetPath,
    };
    const situationChanged = existing
      ? JSON.stringify(existing.payload) !== JSON.stringify(payloadWithTarget)
      : true;

    let row;
    if (!existing) {
      row = await this.prisma.notification.create({
        data: {
          tenant_id: input.tenantId,
          recipient_user_id: input.recipientUserId,
          event_code: input.eventCode,
          channel: 'IN_APP',
          title: input.title,
          body: input.body,
          payload: payloadWithTarget,
          dedupe_key: dedupeKey,
          status: 'SENT',
          sent_at: new Date(),
        },
      });
    } else {
      row = await this.prisma.notification.update({
        where: { id: existing.id },
        data: {
          title: input.title,
          body: input.body,
          payload: payloadWithTarget,
          // Re-surface as unread only if the situation actually changed since it was read —
          // don't nag the user with the exact same alert every 5 minutes.
          ...(existing.read_at && situationChanged ? { read_at: null } : {}),
        },
      });
    }

    if (!existing || situationChanged) {
      this.realtimeGateway.emitToUser(
        input.recipientUserId,
        'notification:new',
        { id: row.id },
      );
    }
    return row;
  }

  /**
   * One-shot notification straight to a single known user — used for events with a single,
   * already-known recipient (e.g. a customer's own auto-checkout), unlike `notifyOnce`'s
   * branch-wide staff fan-out. Best-effort, same as `notifyOnce`.
   */
  async notifyCustomerUser(input: {
    tenantId: string;
    recipientUserId: string;
    eventCode: string;
    entityId: string;
    title: string;
    body?: string;
    targetPath?: string;
  }) {
    try {
      const dedupeKey = `${input.eventCode}:${input.entityId}:${input.recipientUserId}`;
      const row = await this.prisma.notification.create({
        data: {
          tenant_id: input.tenantId,
          recipient_user_id: input.recipientUserId,
          event_code: input.eventCode,
          channel: 'IN_APP',
          title: input.title,
          body: input.body,
          payload: { targetPath: input.targetPath },
          dedupe_key: dedupeKey,
          status: 'SENT',
          sent_at: new Date(),
        },
      });
      this.realtimeGateway.emitToUser(
        input.recipientUserId,
        'notification:new',
        { id: row.id },
      );
    } catch {
      // Dedupe collision or write failure — never let a notification break the caller's flow.
    }
  }

  /** Resolved — the underlying condition no longer applies, so drop the notification entirely. */
  async resolveByDedupe(
    tenantId: string,
    eventCode: string,
    dedupeSuffix: string,
    recipientUserId: string,
  ) {
    const dedupeKey = `${eventCode}:${dedupeSuffix}:${recipientUserId}`;
    await this.prisma.notification.deleteMany({
      where: { tenant_id: tenantId, dedupe_key: dedupeKey },
    });
  }

  /** Owner(s) of the tenant (tenant-wide) + Manager/Staff/PT actually assigned to this branch.
   * Shared by NotificationsScannerService (recurring alerts) and notifyOnce (one-shot events). */
  async getBranchRecipients(
    tenantId: string,
    branchId: string,
  ): Promise<string[]> {
    const [owners, branchStaff] = await Promise.all([
      this.prisma.user_roles.findMany({
        where: { tenant_id: tenantId, roles: { code: ROLE.OWNER } },
        select: { user_id: true },
      }),
      this.prisma.user_branches.findMany({
        where: { tenant_id: tenantId, branch_id: branchId },
        select: { user_id: true },
      }),
    ]);
    return [
      ...new Set([
        ...owners.map((o) => o.user_id),
        ...branchStaff.map((b) => b.user_id),
      ]),
    ];
  }

  /**
   * One-shot event notification (payment confirmed, membership sold, guest visit
   * created, ...) — unlike `upsertForRecipient`, each call is a distinct instance
   * (dedupe_key includes `entityId`), not a recurring condition to keep in sync.
   * Best-effort: failures here must never break the sale/webhook that triggered them.
   */
  async notifyOnce(input: NotifyOnceInput) {
    try {
      const recipients = await this.getBranchRecipients(
        input.tenantId,
        input.branchId,
      );
      await Promise.all(
        recipients.map(async (recipientUserId) => {
          const dedupeKey = `${input.eventCode}:${input.entityId}:${recipientUserId}`;
          const row = await this.prisma.notification.create({
            data: {
              tenant_id: input.tenantId,
              recipient_user_id: recipientUserId,
              event_code: input.eventCode,
              channel: 'IN_APP',
              title: input.title,
              body: input.body,
              payload: {
                branchId: input.branchId,
                branchName: input.branchName,
                targetPath: input.targetPath,
                ...input.extraPayload,
              },
              dedupe_key: dedupeKey,
              status: 'SENT',
              sent_at: new Date(),
            },
          });
          this.realtimeGateway.emitToUser(recipientUserId, 'notification:new', {
            id: row.id,
          });
        }),
      );
    } catch {
      // Dedupe key collision (e.g. a retried webhook re-processing the same paymentId) or
      // any other write failure — never let a notification-side error break the actual sale.
    }
  }
}
