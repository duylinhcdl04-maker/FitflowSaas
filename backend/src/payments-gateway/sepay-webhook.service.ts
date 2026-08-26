import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalesFulfillmentService } from '../manager/sales-fulfillment.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

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

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: match.id },
          data: { status: 'PAID', paid_at: new Date() },
        });

        switch (pendingAction.type) {
          case 'MEMBERSHIP':
            await this.salesFulfillment.finalizeMembershipSale(tx, {
              tenantId,
              branchId: match.branch_id,
              userId: match.created_by,
              customerId: match.customer_id,
              packageId: pendingAction.payload?.packageId,
              startDate: pendingAction.payload?.startDate,
            });
            break;
          case 'PT_PACKAGE':
            await this.salesFulfillment.finalizePtPackageSale(tx, {
              tenantId,
              branchId: match.branch_id,
              userId: match.created_by,
              customerId: match.customer_id,
              planId: pendingAction.payload?.planId,
              paymentId: match.id,
              startDate: pendingAction.payload?.startDate,
            });
            break;
          case 'GUEST_VISIT':
            await this.salesFulfillment.finalizeGuestVisitSale(tx, {
              tenantId,
              branchId: match.branch_id,
              userId: match.created_by,
              customerId: match.customer_id,
              packageId: pendingAction.payload?.packageId,
              paymentId: match.id,
            });
            break;
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

    return { success: true };
  }
}
