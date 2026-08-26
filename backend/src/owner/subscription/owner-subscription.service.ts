import { randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import { deriveAccessMode } from '../../common/utils/access-mode';
import type { RequestUser } from '../../common/types/jwt-payload';
import { SubscriptionsService } from '../../super-admin/subscriptions/subscriptions.service';
import { SelectPlanDto } from './dto/select-plan.dto';
import { MarkTransferredDto } from './dto/mark-transferred.dto';

// Trùng với owner-dashboard.service.ts (chấp nhận trùng lặp nhỏ, đã có tiền lệ).
import { ROLE } from '../../common/types/role';

const QUOTA_FEATURE_CODES = [
  'MAX_BRANCHES',
  'MAX_STAFF',
  'MAX_PT',
  'MAX_CUSTOMERS',
] as const;
const INVOICE_DUE_DAYS = 3;

@Injectable()
export class OwnerSubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async getCurrent(tenantId: string) {
    const [tenant, subscription] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.subscription.findUnique({
        where: { tenant_id: tenantId },
        include: {
          saas_plans: {
            include: {
              saas_plan_features: { include: { platform_features: true } },
            },
          },
        },
      }),
    ]);

    if (!tenant || !subscription)
      throw new NotFoundException('Không tìm thấy Subscription');

    const [branchCount, staffCount, ptCount, customerCount] = await Promise.all([
      this.prisma.branch.count({ where: { tenant_id: tenantId } }),
      this.prisma.user.count({
        where: { tenant_id: tenantId, user_type: 'TENANT' },
      }),
      this.prisma.user_roles.count({
        where: { tenant_id: tenantId, roles: { code: ROLE.PT } },
      }),
      this.prisma.customer.count({ where: { tenant_id: tenantId } }),
    ]);

    const now = new Date();
    const quotaByCode = new Map(
      subscription.saas_plans.saas_plan_features.map((f) => [
        f.platform_features.code,
        f.quota_value,
      ]),
    );

    const usageByCode: Record<(typeof QUOTA_FEATURE_CODES)[number], number> = {
      MAX_BRANCHES: branchCount,
      MAX_STAFF: staffCount,
      MAX_PT: ptCount,
      MAX_CUSTOMERS: customerCount,
    };

    return {
      planCode: subscription.saas_plans.code,
      planName: subscription.saas_plans.name,
      status: subscription.status,
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      trialEndsAt: subscription.trial_ends_at,
      daysRemaining:
        subscription.status === 'TRIAL' && subscription.trial_ends_at
          ? Math.ceil(
              (subscription.trial_ends_at.getTime() - now.getTime()) /
                86_400_000,
            )
          : null,
      daysUntilRenewal:
        subscription.status === 'ACTIVE'
          ? Math.ceil(
              (subscription.end_date.getTime() - now.getTime()) / 86_400_000,
            )
          : null,
      usage: QUOTA_FEATURE_CODES.map((code) => ({
        code,
        used: usageByCode[code],
        limit: quotaByCode.get(code) ?? null,
      })),
      accessMode: deriveAccessMode({
        tenantStatus: tenant.status,
        subscriptionStatus: subscription.status,
        trialEndsAt: subscription.trial_ends_at,
        subscriptionEndDate: subscription.end_date,
      }),
    };
  }

  async listPlans(tenantId: string) {
    const [subscription, plans] = await Promise.all([
      this.prisma.subscription.findUnique({ where: { tenant_id: tenantId } }),
      this.prisma.saasPlan.findMany({
        where: { status: 'ACTIVE', is_public: true },
        include: {
          saas_plan_features: { include: { platform_features: true } },
        },
        orderBy: { display_order: 'asc' },
      }),
    ]);

    return plans.map((p) => ({
      code: p.code,
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency,
      billingCycle: p.billing_cycle,
      billingCycleMonths: p.billing_cycle_months,
      isCurrent: subscription?.plan_id === p.id,
      features: p.saas_plan_features
        .filter((f) => f.is_enabled)
        .map((f) => ({
          code: f.platform_features.code,
          name: f.platform_features.name,
          quota: f.quota_value,
        })),
    }));
  }

  /** OW-07/OW-08 bước 1 — Owner chọn gói, hệ thống phát hành hoá đơn chờ thanh toán. */
  async requestPlanInvoice(
    tenantId: string,
    dto: SelectPlanDto,
    actor: RequestUser,
  ) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenant_id: tenantId },
      include: { saas_plans: true },
    });
    if (!subscription)
      throw new NotFoundException('Không tìm thấy Subscription');

    const plan = await this.prisma.saasPlan.findUnique({
      where: { code: dto.planCode },
    });
    if (!plan || plan.status !== 'ACTIVE' || !plan.is_public) {
      throw new BadRequestException('Gói không tồn tại hoặc đã ngừng bán');
    }
    if (subscription.plan_id === plan.id && subscription.status === 'ACTIVE') {
      throw new BadRequestException('Bạn đang sử dụng gói này rồi');
    }

    // Tái sử dụng đúng logic kiểm tra hạn mức của SA-08 — không nhân bản luật.
    const conflictCheck =
      await this.subscriptionsService.checkPlanChangeConflicts(
        tenantId,
        dto.planCode,
      );
    if (!conflictCheck.canProceed) {
      throw new BadRequestException(
        `Không thể chuyển sang gói ${plan.name}: đang vượt hạn mức ở ${conflictCheck.quotaConflicts
          .map((c) => `${c.label} (${c.used}/${c.limit})`)
          .join(', ')}`,
      );
    }

    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + (plan.billing_cycle_months ?? 1));
    const dueDate = new Date(periodStart);
    dueDate.setDate(dueDate.getDate() + INVOICE_DUE_DAYS);

    const invoice = await this.prisma.saas_invoices.create({
      data: {
        tenant_id: tenantId,
        subscription_id: subscription.id,
        invoice_no: this.generateInvoiceNo(),
        period_start: periodStart,
        period_end: periodEnd,
        subtotal: plan.price,
        tax_amount: 0,
        total_amount: plan.price,
        currency: plan.currency,
        status: 'ISSUED',
        due_date: dueDate,
        issued_at: new Date(),
        target_plan_id: plan.id,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_INVOICE',
      entityId: invoice.id,
      action: 'OWNER_PLAN_INVOICE_REQUESTED',
      afterData: {
        planCode: plan.code,
        totalAmount: invoice.total_amount.toString(),
      },
    });

    return invoice;
  }

  /** OW-08 bước 2 — Owner tự khai đã chuyển khoản; chờ SuperAdmin xác nhận (SA-10). */
  async markTransferred(
    tenantId: string,
    invoiceId: string,
    dto: MarkTransferredDto,
    actor: RequestUser,
  ) {
    const invoice = await this.prisma.saas_invoices.findFirst({
      where: { id: invoiceId, tenant_id: tenantId },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn');
    if (invoice.status === 'PAID' || invoice.status === 'VOID') {
      throw new BadRequestException(
        `Hoá đơn đang ở trạng thái ${invoice.status}`,
      );
    }

    const existingPending = await this.prisma.saas_payments.findFirst({
      where: { invoice_id: invoiceId, status: 'PENDING' },
    });
    if (existingPending) {
      throw new BadRequestException(
        'Đã ghi nhận yêu cầu — vui lòng chờ FitFlow xác nhận',
      );
    }

    const payment = await this.prisma.saas_payments.create({
      data: {
        invoice_id: invoiceId,
        tenant_id: tenantId,
        amount: invoice.total_amount,
        currency: invoice.currency,
        method: dto.method ?? 'BANK_TRANSFER',
        status: 'PENDING',
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_INVOICE',
      entityId: invoiceId,
      action: 'OWNER_PAYMENT_DECLARED',
      afterData: { method: payment.method, amount: payment.amount.toString() },
      reason: dto.note ?? null,
    });

    return payment;
  }

  listInvoices(tenantId: string) {
    return this.subscriptionsService.invoices(tenantId);
  }

  private generateInvoiceNo() {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `HD-${ymd}-${suffix}`;
  }
}
