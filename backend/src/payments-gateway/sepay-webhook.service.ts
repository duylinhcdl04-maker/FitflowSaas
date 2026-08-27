import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesFulfillmentService } from '../manager/sales-fulfillment.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

interface SepayIpnPayload {
  id: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  subAccount?: string | null;
  code?: string | null;
  content?: string;
  transferType?: 'in' | 'out';
  description?: string;
  transferAmount?: number;
  accumulated?: number;
  referenceCode?: string;
}

/**
 * Handles SePay's IPN (webhook) — see https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook
 * and https://developer.sepay.vn/en/sepay-webhooks/xac-thuc (API Key auth: header
 * `Authorization: Apikey <key>`).
 */
@Injectable()
export class SepayWebhookService {
  private readonly logger = new Logger(SepayWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly salesFulfillment: SalesFulfillmentService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async handleIpn(
    tenantId: string,
    paymentAccountId: string,
    authorizationHeader: string | undefined,
    payload: SepayIpnPayload,
  ) {
    const account = await this.prisma.payment_accounts.findFirst({
      where: { id: paymentAccountId, tenant_id: tenantId },
    });

    const providedKey = (authorizationHeader || '').replace(/^Apikey\s+/i, '').trim();
    if (!account || !account.sepay_api_key || providedKey !== account.sepay_api_key) {
      throw new UnauthorizedException('Invalid SePay webhook credentials');
    }

    const providerTxnId = String(payload.id ?? '');
    if (!providerTxnId) {
      return { success: true };
    }

    // Idempotency: SePay retries on non-2xx / timeout. @@unique([provider, provider_txn_id])
    // guarantees we only ever process a given transaction once.
    let txnRow;
    try {
      txnRow = await this.prisma.payment_transactions.create({
        data: {
          tenant_id: tenantId,
          provider: 'SEPAY',
          provider_txn_id: providerTxnId,
          amount: payload.transferAmount ?? 0,
          status: 'PENDING',
          raw_payload: payload as any,
        },
      });
    } catch {
      // Duplicate delivery of a transaction already recorded — ack and stop.
      return { success: true };
    }

    if (payload.transferType !== 'in') {
      await this.prisma.payment_transactions.update({
        where: { id: txnRow.id },
        data: { status: 'UNMATCHED' },
      });
      return { success: true };
    }

    const candidates = await this.prisma.payment.findMany({
      where: {
        tenant_id: tenantId,
        payment_account_id: paymentAccountId,
        status: 'PENDING',
        total_amount: payload.transferAmount ?? undefined,
      },
      orderBy: { created_at: 'desc' },
    });

    const content = payload.content || '';
    const match = candidates.find((p) => p.qr_content && content.includes(p.qr_content));

    if (!match) {
      await this.prisma.payment_transactions.update({
        where: { id: txnRow.id },
        data: { status: 'UNMATCHED' },
      });
      this.logger.warn(
        `SePay IPN #${providerTxnId}: no matching PENDING payment (tenant=${tenantId}, account=${paymentAccountId}, amount=${payload.transferAmount})`,
      );
      return { success: true };
    }

    const pendingAction = (match.pending_action as { type?: string; payload?: Record<string, any> } | null) || {};
    let fulfilledEntityId: string | null = null;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: match.id },
          data: { status: 'PAID', paid_at: new Date() },
        });

        switch (pendingAction.type) {
          case 'MEMBERSHIP': {
            const membership = await this.salesFulfillment.finalizeMembershipSale(tx, {
              tenantId,
              branchId: match.branch_id,
              userId: match.created_by,
              customerId: match.customer_id,
              packageId: pendingAction.payload?.packageId,
              startDate: pendingAction.payload?.startDate,
            });
            fulfilledEntityId = membership.id;
            break;
          }
          case 'PT_PACKAGE': {
            const { customerPtPackage } = await this.salesFulfillment.finalizePtPackageSale(tx, {
              tenantId,
              branchId: match.branch_id,
              userId: match.created_by,
              customerId: match.customer_id,
              planId: pendingAction.payload?.planId,
              paymentId: match.id,
              startDate: pendingAction.payload?.startDate,
            });
            fulfilledEntityId = customerPtPackage.id;
            break;
          }
          case 'GUEST_VISIT': {
            const { visit } = await this.salesFulfillment.finalizeGuestVisitSale(tx, {
              tenantId,
              branchId: match.branch_id,
              userId: match.created_by,
              customerId: match.customer_id,
              packageId: pendingAction.payload?.packageId,
              paymentId: match.id,
            });
            fulfilledEntityId = visit.id;
            break;
          }
          case 'QUICK':
          default:
            // Standalone quick charge — marking the Payment PAID above is the whole job.
            break;
        }
      });
    } catch (err) {
      this.logger.error(`SePay IPN #${providerTxnId}: failed to finalize payment ${match.id}`, err as Error);
      await this.prisma.payment_transactions.update({
        where: { id: txnRow.id },
        data: { status: 'FAILED' },
      });
      // Still ack 200 — SePay's bank-side transaction succeeded regardless; retrying the
      // webhook would not fix an application-side error. Ops needs to reconcile manually.
      return { success: true };
    }

    await this.prisma.payment_transactions.update({
      where: { id: txnRow.id },
      data: { status: 'SUCCESS', payment_id: match.id },
    });

    this.realtimeGateway.emitToBranch(tenantId, match.branch_id, 'payment:confirmed', {
      paymentId: match.id,
      type: pendingAction.type,
    });
    if (pendingAction.type === 'GUEST_VISIT') {
      this.realtimeGateway.emitToBranch(tenantId, match.branch_id, 'guestvisit:updated', { paymentId: match.id });
    }
    this.realtimeGateway.emitToBranch(tenantId, match.branch_id, 'dashboard:refresh', {});

    await this.notifyFulfilled(tenantId, match, pendingAction, fulfilledEntityId);

    return { success: true };
  }

  /**
   * Mirrors ManagerService's cash-sale notifications (MEMBERSHIP_SOLD /
   * GUEST_VISIT_CREATED / PAYMENT_CONFIRMED) for the async VietQR path — same
   * business events, just confirmed by the bank webhook instead of at the counter.
   * Best-effort: swallow errors, never let a notification failure surface as a
   * webhook failure (SePay would retry a non-2xx and re-process the transaction).
   */
  private async notifyFulfilled(
    tenantId: string,
    match: { id: string; branch_id: string; customer_id: string; total_amount: any },
    pendingAction: { type?: string; payload?: Record<string, any> },
    fulfilledEntityId: string | null,
  ) {
    try {
      const [branch, customer] = await Promise.all([
        this.prisma.branch.findUnique({ where: { id: match.branch_id }, select: { name: true } }),
        this.prisma.customer.findUnique({ where: { id: match.customer_id }, select: { full_name: true, phone: true } }),
      ]);
      const branchName = branch?.name ?? 'Chi nhánh';
      const customerName = customer?.full_name ?? 'Khách hàng';
      const customerPhone = customer?.phone ?? null;
      const amountNum = Number(match.total_amount);
      const amount = formatVnd(amountNum);

      let packageName: string | null = null;
      if ((pendingAction.type === 'MEMBERSHIP' || pendingAction.type === 'GUEST_VISIT') && pendingAction.payload?.packageId) {
        const pkg = await this.prisma.membershipPackage.findUnique({ where: { id: pendingAction.payload.packageId }, select: { name: true } });
        packageName = pkg?.name ?? null;
      } else if (pendingAction.type === 'PT_PACKAGE' && pendingAction.payload?.planId) {
        const plan = await this.prisma.pt_package_plans.findUnique({ where: { id: pendingAction.payload.planId }, select: { name: true } });
        packageName = plan?.name ?? null;
      }

      if (pendingAction.type === 'MEMBERSHIP' && fulfilledEntityId) {
        await this.notifications.notifyOnce({
          tenantId,
          branchId: match.branch_id,
          branchName,
          eventCode: 'MEMBERSHIP_SOLD',
          entityId: fulfilledEntityId,
          title: `${customerName} vừa đăng ký gói ${packageName ?? 'tập'}`,
          body: `${amount} (chuyển khoản VietQR).`,
          targetPath: '/memberships',
          extraPayload: {
            items: [{ id: fulfilledEntityId, customerName, customerPhone, amount: amountNum, method: 'VIETQR', packageName: packageName ?? undefined }],
          },
        });
      } else if (pendingAction.type === 'GUEST_VISIT' && fulfilledEntityId) {
        await this.notifications.notifyOnce({
          tenantId,
          branchId: match.branch_id,
          branchName,
          eventCode: 'GUEST_VISIT_CREATED',
          entityId: fulfilledEntityId,
          title: `Khách vãng lai ${customerName} vừa đăng ký vé lượt`,
          body: `${packageName ?? 'Vé lượt'} (chuyển khoản VietQR).`,
          targetPath: '/guest-visits',
          extraPayload: {
            items: [{ id: fulfilledEntityId, customerName, customerPhone, amount: amountNum, method: 'VIETQR', packageName: packageName ?? undefined }],
          },
        });
      }

      await this.notifications.notifyOnce({
        tenantId,
        branchId: match.branch_id,
        branchName,
        eventCode: 'PAYMENT_CONFIRMED',
        entityId: match.id,
        title: `Thanh toán ${amount} từ ${customerName} đã được xác nhận`,
        body: `Chuyển khoản VietQR.`,
        targetPath: pendingAction.type === 'GUEST_VISIT' ? '/guest-visits' : pendingAction.type === 'PT_PACKAGE' ? '/pt' : '/memberships',
        extraPayload: {
          items: [{ id: match.id, customerName, customerPhone, amount: amountNum, method: 'VIETQR', packageName: packageName ?? undefined }],
        },
      });
    } catch (err) {
      this.logger.error('Failed to send SePay-confirmed notifications', err as Error);
    }
  }
}
