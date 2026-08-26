import { randomBytes } from 'crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import { paginate, parsePagination } from '../../common/utils/pagination';
import type { RequestUser } from '../../common/types/jwt-payload';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RecordInvoicePaymentDto } from './dto/record-invoice-payment.dto';
import { VoidInvoiceDto } from './dto/void-invoice.dto';

const INVOICE_INCLUDE = {
  tenants: { select: { id: true, name: true, code: true } },
  subscriptions: {
    include: { saas_plans: { select: { code: true, name: true } } },
  },
} as const;

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async list(query: QueryInvoicesDto) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.tenantId ? { tenant_id: query.tenantId } : {}),
      ...(query.dueFrom || query.dueTo
        ? {
            due_date: {
              ...(query.dueFrom ? { gte: new Date(query.dueFrom) } : {}),
              ...(query.dueTo ? { lte: new Date(query.dueTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.saas_invoices.findMany({
        where,
        include: INVOICE_INCLUDE,
        orderBy: { due_date: 'asc' },
        skip,
        take,
      }),
      this.prisma.saas_invoices.count({ where }),
    ]);

    return paginate(items, total, page, pageSize);
  }

  async get(id: string) {
    const invoice = await this.prisma.saas_invoices.findUnique({
      where: { id },
      include: {
        ...INVOICE_INCLUDE,
        saas_payments: { orderBy: { created_at: 'desc' } },
      },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn');
    return invoice;
  }

  /**
   * SA-09 nền tảng chưa có job tự động phát hành hoá đơn theo chu kỳ (không có
   * cron/queue nào đang chạy trong codebase này) — nên trước mắt SuperAdmin
   * phát hành thủ công. BR-SA-004: chỉ ghi vào saas_invoices, không đụng tới
   * bảng payments (thanh toán khách hàng của Tenant).
   */
  async create(dto: CreateInvoiceDto, actor: RequestUser) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenant_id: dto.tenantId },
    });
    if (!subscription) {
      throw new BadRequestException(
        'Tenant chưa có Subscription để phát hành hoá đơn',
      );
    }

    const subtotal = dto.subtotal;
    const taxAmount = dto.taxAmount ?? 0;
    const invoiceNo = this.generateInvoiceNo();

    const invoice = await this.prisma.saas_invoices.create({
      data: {
        tenant_id: dto.tenantId,
        subscription_id: subscription.id,
        invoice_no: invoiceNo,
        period_start: new Date(dto.periodStart),
        period_end: new Date(dto.periodEnd),
        subtotal,
        tax_amount: taxAmount,
        total_amount: subtotal + taxAmount,
        currency: subscription.currency,
        status: 'ISSUED',
        due_date: new Date(dto.dueDate),
        issued_at: new Date(),
      },
      include: INVOICE_INCLUDE,
    });

    await writeAuditLog(this.prisma, {
      tenantId: dto.tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_INVOICE',
      entityId: invoice.id,
      action: 'INVOICE_CREATED',
      afterData: { invoiceNo, totalAmount: invoice.total_amount.toString() },
    });

    return invoice;
  }

  async recordPayment(
    id: string,
    dto: RecordInvoicePaymentDto,
    actor: RequestUser,
  ) {
    const invoice = await this.prisma.saas_invoices.findUnique({
      where: { id },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn');
    if (invoice.status === 'PAID' || invoice.status === 'VOID') {
      throw new BadRequestException(
        `Hoá đơn đang ở trạng thái ${invoice.status}, không thể ghi nhận thêm thanh toán`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.saas_payments.create({
        data: {
          invoice_id: id,
          tenant_id: invoice.tenant_id,
          amount: dto.amount,
          currency: invoice.currency,
          method: dto.method,
          provider_ref: dto.providerRef,
          status: 'PAID',
          paid_at: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          recorded_by: actor.id,
        },
      });

      const paidAgg = await tx.saas_payments.aggregate({
        where: { invoice_id: id, status: 'PAID' },
        _sum: { amount: true },
      });
      const totalPaid = paidAgg._sum.amount ?? 0;

      const updatedInvoice =
        Number(totalPaid) >= Number(invoice.total_amount)
          ? await tx.saas_invoices.update({
              where: { id },
              data: { status: 'PAID', paid_at: new Date() },
              include: INVOICE_INCLUDE,
            })
          : await tx.saas_invoices.findUniqueOrThrow({
              where: { id },
              include: INVOICE_INCLUDE,
            });

      return { payment, invoice: updatedInvoice };
    });

    await writeAuditLog(this.prisma, {
      tenantId: invoice.tenant_id,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_INVOICE',
      entityId: id,
      action: 'INVOICE_PAYMENT_RECORDED',
      beforeData: { status: invoice.status },
      afterData: {
        amount: dto.amount,
        method: dto.method,
        resultingStatus: result.invoice.status,
      },
      reason: dto.note ?? null,
    });

    // OW-08: nếu hoá đơn này phát sinh từ yêu cầu đổi gói của Owner
    // (target_plan_id) và vừa đủ PAID, kích hoạt Subscription lên gói đó.
    if (result.invoice.status === 'PAID' && invoice.target_plan_id) {
      await this.subscriptionsService.activateForInvoice(
        invoice.subscription_id,
        invoice.target_plan_id,
        actor,
      );
    }

    return result;
  }

  async void(id: string, dto: VoidInvoiceDto, actor: RequestUser) {
    const invoice = await this.prisma.saas_invoices.findUnique({
      where: { id },
    });
    if (!invoice) throw new NotFoundException('Không tìm thấy hoá đơn');
    if (invoice.status === 'PAID') {
      throw new BadRequestException(
        'Không thể huỷ hoá đơn đã thanh toán (BR-PAY-005)',
      );
    }
    if (invoice.status === 'VOID') {
      throw new BadRequestException('Hoá đơn đã ở trạng thái Huỷ');
    }

    const updated = await this.prisma.saas_invoices.update({
      where: { id },
      data: { status: 'VOID' },
      include: INVOICE_INCLUDE,
    });

    await writeAuditLog(this.prisma, {
      tenantId: invoice.tenant_id,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SAAS_INVOICE',
      entityId: id,
      action: 'INVOICE_VOIDED',
      beforeData: { status: invoice.status },
      afterData: { status: 'VOID' },
      reason: dto.reason,
    });

    return updated;
  }

  private generateInvoiceNo() {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const suffix = randomBytes(3).toString('hex').toUpperCase();
    return `HD-${ymd}-${suffix}`;
  }
}
