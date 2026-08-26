import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { writeAuditLog } from '../common/utils/audit';
import { ROLE } from '../common/types/role';
import type { Prisma } from '../../generated/prisma/client';
import { AutoCheckoutPolicyService } from '../auto-checkout/auto-checkout-policy.service';

type TxClient = Prisma.TransactionClient;

/**
 * The actual "grant the thing the customer paid for" writes, extracted out of
 * ManagerService so they can run from two places:
 *  - synchronously, right after a CASH sale (Payment already PAID)
 *  - later, from the SePay webhook handler, once a PENDING VietQR Payment is
 *    confirmed PAID (see Payment.pending_action / PaymentsGatewayModule)
 */
@Injectable()
export class SalesFulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly autoCheckoutPolicy: AutoCheckoutPolicyService,
  ) {}

  async finalizeMembershipSale(
    tx: TxClient,
    params: { tenantId: string; branchId: string; userId: string; customerId: string; packageId: string; startDate?: string },
  ) {
    const pkg = await tx.membershipPackage.findFirst({
      where: { tenant_id: params.tenantId, id: params.packageId },
    });
    if (!pkg) throw new NotFoundException('Không tìm thấy gói tập.');

    const start = new Date(params.startDate || Date.now());
    const end = new Date(start);
    const durationValue = pkg.duration_value;
    const durationUnit = pkg.duration_unit.toUpperCase();
    if (durationUnit === 'DAY' || durationUnit === 'DAYS') {
      end.setDate(end.getDate() + durationValue);
    } else if (durationUnit === 'WEEK' || durationUnit === 'WEEKS') {
      end.setDate(end.getDate() + durationValue * 7);
    } else if (durationUnit === 'MONTH' || durationUnit === 'MONTHS') {
      end.setMonth(end.getMonth() + durationValue);
    } else if (durationUnit === 'YEAR' || durationUnit === 'YEARS') {
      end.setFullYear(end.getFullYear() + durationValue);
    } else {
      end.setMonth(end.getMonth() + durationValue);
    }

    const membershipNo = `HV-${Math.floor(100000 + Math.random() * 900000)}`;
    const membership = await tx.membership.create({
      data: {
        tenant_id: params.tenantId,
        customer_id: params.customerId,
        package_id: params.packageId,
        branch_id: params.branchId,
        membership_no: membershipNo,
        package_name_snapshot: pkg.name,
        price_snapshot: pkg.base_price,
        currency_snapshot: pkg.currency,
        duration_value_snapshot: pkg.duration_value,
        duration_unit_snapshot: pkg.duration_unit,
        branch_access_scope_snapshot: pkg.branch_access_scope,
        max_checkins_per_day_snapshot: pkg.max_checkins_per_day,
        start_date: start,
        end_date: end,
        status: 'ACTIVE',
        sold_by: params.userId,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: params.tenantId,
      actorUserId: params.userId,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'MEMBERSHIP',
      entityId: membership.id,
      action: 'ASSIGN_MEMBERSHIP_PACKAGE',
    });

    return membership;
  }

  async finalizePtPackageSale(
    tx: TxClient,
    params: {
      tenantId: string;
      branchId: string;
      userId: string;
      userRoles?: string[];
      customerId: string;
      planId: string;
      paymentId: string;
      startDate?: string;
    },
  ) {
    const plan = await tx.pt_package_plans.findFirst({
      where: { tenant_id: params.tenantId, id: params.planId, status: 'ACTIVE' },
      include: { pt_profiles: { include: { users: { select: { full_name: true } } } } },
    });
    if (!plan) throw new NotFoundException('Gói tập PT không tồn tại hoặc chưa được phê duyệt mở bán.');

    const activeMembership = await tx.membership.findFirst({
      where: { tenant_id: params.tenantId, customer_id: params.customerId, status: 'ACTIVE' },
    });

    const startDate = params.startDate ? new Date(params.startDate) : new Date();
    const validityDays = plan.validity_days || 60;
    const expiryDate = new Date(startDate.getTime() + validityDays * 24 * 60 * 60 * 1000);
    const packageNo = `PT-PKG-${Math.floor(100000 + Math.random() * 900000)}`;

    const customerPtPackage = await tx.customer_pt_packages.create({
      data: {
        tenant_id: params.tenantId,
        branch_id: params.branchId,
        customer_id: params.customerId,
        membership_id: activeMembership?.id || null,
        plan_id: plan.id,
        pt_user_id: plan.pt_user_id,
        plan_name_snapshot: plan.name,
        pt_name_snapshot: plan.pt_profiles?.users?.full_name || 'PT Coach',
        price_snapshot: plan.price,
        session_duration_minutes: plan.session_duration_minutes || 60,
        total_sessions: plan.session_count,
        used_sessions: 0,
        remaining_sessions: plan.session_count,
        start_date: startDate,
        expiry_date: expiryDate,
        status: 'ACTIVE',
        sold_by: params.userId,
      },
    });

    await tx.payment_items.create({
      data: {
        payment_id: params.paymentId,
        tenant_id: params.tenantId,
        item_type: 'PT_PACKAGE',
        description: `Đăng ký Gói PT ${plan.name} (${plan.session_count} buổi)`,
        quantity: 1,
        unit_price: plan.price,
        amount: plan.price,
        customer_pt_package_id: customerPtPackage.id,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: params.tenantId,
      actorUserId: params.userId,
      actorRole: params.userRoles?.[0] || ROLE.BRANCH_MANAGER,
      entityType: 'CUSTOMER_PT_PACKAGE',
      entityId: customerPtPackage.id,
      action: 'SELL_PT_PACKAGE',
    });

    return { customerPtPackage, plan };
  }

  async finalizeGuestVisitSale(
    tx: TxClient,
    params: {
      tenantId: string;
      branchId: string;
      userId: string;
      customerId: string;
      packageId: string;
      paymentId: string;
    },
  ) {
    const pkg = await tx.membershipPackage.findFirst({
      where: { tenant_id: params.tenantId, id: params.packageId },
    });
    if (!pkg) throw new NotFoundException('Không tìm thấy gói vé lượt');

    const checkInAt = new Date();
    const autoCheckoutAt = await this.autoCheckoutPolicy.computeAutoCheckoutAt(
      params.tenantId,
      params.branchId,
      checkInAt,
    );

    // BR-STAFF-002: Guest Visit paid -> Auto create attendance & set status = ACTIVE
    const visit = await tx.guest_visits.create({
      data: {
        tenant_id: params.tenantId,
        branch_id: params.branchId,
        customer_id: params.customerId,
        package_id: pkg.id,
        package_name_snapshot: pkg.name,
        price_snapshot: pkg.base_price,
        payment_id: params.paymentId,
        status: 'ACTIVE',
        created_by: params.userId,
      },
    });

    const attendance = await tx.attendances.create({
      data: {
        tenant_id: params.tenantId,
        branch_id: params.branchId,
        customer_id: params.customerId,
        attendance_type: 'GUEST',
        guest_visit_id: visit.id,
        check_in_at: checkInAt,
        check_in_method: 'MANUAL',
        check_in_by: params.userId,
        auto_checkout_at: autoCheckoutAt,
        status: 'CHECKED_IN',
        note: `Khách vãng lai vé lượt: ${pkg.name}`,
      },
    });

    await tx.guest_visits.update({
      where: { id: visit.id },
      data: { attendance_id: attendance.id },
    });

    await writeAuditLog(this.prisma, {
      tenantId: params.tenantId,
      actorUserId: params.userId,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'GUEST_VISIT',
      entityId: visit.id,
      action: 'CREATE_GUEST_VISIT_AUTO_CHECKIN',
    });

    return { visit, attendance };
  }
}
