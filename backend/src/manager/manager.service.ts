import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { writeAuditLog } from '../common/utils/audit';
import { generateTempPassword } from '../common/utils/temp-password';
import { ROLE } from '../common/types/role';
import type { RequestUser } from '../common/types/jwt-payload';
import * as bcrypt from 'bcrypt';
import {
  ManualCheckinDto,
  UndoCheckinDto,
  SellMembershipDto,
  ConfirmPaymentDto,
  FreezeMembershipDto,
  AddFreeDaysDto,
  CancelMembershipDto,
  PtBookingDto,
  CancelBookingDto,
  ManagerChangePasswordDto,
  CreateGuestVisitDto,
  ToggleGuestHoldDto,
  SellPtPackageDto,
} from './dto/manager.dto';

import { MailService } from '../mail/mail.service';
import { SalesFulfillmentService } from './sales-fulfillment.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { buildVietQrUrl, generatePaymentRef, isVietQrMethod, mapPaymentMethod } from '../common/utils/vietqr';

@Injectable()
export class ManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly salesFulfillment: SalesFulfillmentService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  /**
   * Resolves the payment_accounts row a VietQR sale should generate its QR against:
   * branch-level default first, else the tenant-level default. Throws if the Owner
   * hasn't configured any bank account yet.
   */
  private async resolvePaymentAccount(tenantId: string, branchId: string) {
    const branchDefault = await this.prisma.payment_accounts.findFirst({
      where: { tenant_id: tenantId, branch_id: branchId, status: 'ACTIVE' },
      orderBy: { is_default: 'desc' },
    });
    if (branchDefault) return branchDefault;

    const tenantDefault = await this.prisma.payment_accounts.findFirst({
      where: { tenant_id: tenantId, branch_id: null, status: 'ACTIVE' },
      orderBy: { is_default: 'desc' },
    });
    if (tenantDefault) return tenantDefault;

    throw new BadRequestException(
      'Chưa cấu hình tài khoản nhận thanh toán. Vui lòng liên hệ Owner để thêm tài khoản ở Cài đặt > Tài khoản thanh toán.',
    );
  }

  /** Creates a PENDING Payment + real dynamic VietQR for a not-yet-fulfilled sale. */
  private async createPendingQrPayment(params: {
    tenantId: string;
    branchId: string;
    userId: string;
    customerId: string;
    paymentType: string;
    amount: number;
    pendingActionType: string;
    pendingActionPayload: Record<string, any>;
  }) {
    const account = await this.resolvePaymentAccount(params.tenantId, params.branchId);
    const ref = generatePaymentRef();
    const paymentCode = `PAY-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const payment = await this.prisma.payment.create({
      data: {
        tenant_id: params.tenantId,
        branch_id: params.branchId,
        customer_id: params.customerId,
        payment_code: paymentCode,
        payment_type: params.paymentType,
        subtotal: params.amount,
        total_amount: params.amount,
        method: 'BANK_TRANSFER',
        payment_account_id: account.id,
        qr_content: ref,
        pending_action: { type: params.pendingActionType, payload: params.pendingActionPayload },
        status: 'PENDING',
        expires_at: expiresAt,
        created_by: params.userId,
      },
    });

    const qrUrl = buildVietQrUrl({
      accountNumber: account.account_number,
      bankName: account.bank_name || account.bank_code || '',
      amount: params.amount,
      content: ref,
      accountHolder: account.account_name,
      template: account.qr_template,
    });

    return {
      requiresPayment: true as const,
      paymentId: payment.id,
      qrUrl,
      amount: params.amount,
      expiresAt,
    };
  }

  async getPaymentStatus(user: RequestUser, paymentId: string) {
    const tenantId = user.tenantId!;
    const payment = await this.prisma.payment.findFirst({
      where: { tenant_id: tenantId, id: paymentId },
      select: { id: true, status: true, paid_at: true, pending_action: true },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    return payment;
  }

  async cancelPendingPayment(user: RequestUser, paymentId: string) {
    const tenantId = user.tenantId!;
    const payment = await this.prisma.payment.findFirst({
      where: { tenant_id: tenantId, id: paymentId },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Giao dịch này không còn ở trạng thái chờ thanh toán');
    }

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'CANCELLED', cancelled_at: new Date(), cancelled_by: user.id, cancel_reason: 'Nhân viên hủy QR chờ thanh toán' },
    });
    return { success: true, payment: updated };
  }

  /** Resolves active assigned branch for the user. */
  async resolveBranchId(user: RequestUser, requestedBranchId?: string): Promise<string> {
    if (!user.tenantId) throw new ForbiddenException('Tài khoản chưa thuộc về doanh nghiệp nào');

    const isOwner = user.roles?.includes(ROLE.OWNER);

    // If requested a specific branch ID
    if (requestedBranchId) {
      if (isOwner) {
        const branch = await this.prisma.branch.findFirst({
          where: { id: requestedBranchId, tenant_id: user.tenantId },
        });
        if (branch) return branch.id;
      } else {
        const ub = await this.prisma.user_branches.findFirst({
          where: { user_id: user.id, branch_id: requestedBranchId, tenant_id: user.tenantId },
        });
        if (ub) return ub.branch_id;
      }
    }

    // Check user_branches assigned by Owner
    const ub = await this.prisma.user_branches.findFirst({
      where: { user_id: user.id, tenant_id: user.tenantId },
      orderBy: { is_primary: 'desc' },
    });
    if (ub) return ub.branch_id;

    // Fallback to first branch ONLY for Owner role
    if (isOwner) {
      const firstBranch = await this.prisma.branch.findFirst({
        where: { tenant_id: user.tenantId, status: 'ACTIVE' },
      });
      if (firstBranch) return firstBranch.id;
      throw new NotFoundException('Doanh nghiệp chưa có chi nhánh nào khả dụng');
    }

    // Non-owner with no assigned branch -> Throw ForbiddenException
    throw new ForbiddenException(
      'Tài khoản Quản lý của bạn chưa được phân công phụ trách chi nhánh nào. Vui lòng liên hệ Owner để được gán chi nhánh.',
    );
  }

  async getContext(user: RequestUser, requestedBranchId?: string) {
    const branchId = await this.resolveBranchId(user, requestedBranchId);
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) throw new NotFoundException('Không tìm thấy thông tin chi nhánh');

    const currentUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, full_name: true, phone: true },
    });

    const tenant = user.tenantId
      ? await this.prisma.tenant.findUnique({
          where: { id: user.tenantId },
          select: { id: true, name: true, legal_name: true, logo_url: true },
        })
      : null;

    return {
      user: currentUser,
      tenant: tenant
        ? {
            id: tenant.id,
            name: tenant.name,
            legalName: tenant.legal_name,
            logoUrl: tenant.logo_url,
          }
        : null,
      branch: {
        id: branch.id,
        code: branch.code,
        name: branch.name,
        address: branch.address,
        openingTime: branch.opening_time,
        closingTime: branch.closing_time,
      },
    };
  }

  async getDashboardOverview(user: RequestUser, requestedBranchId?: string) {
    const branchId = await this.resolveBranchId(user, requestedBranchId);
    const tenantId = user.tenantId!;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Currently in Gym (Real-time)
    const currentlyInGym = await this.prisma.attendances.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        status: 'CHECKED_IN',
      },
    });

    const currentlyInGymMembers = await this.prisma.attendances.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        status: 'CHECKED_IN',
        attendance_type: 'MEMBER',
      },
    });

    const currentlyInGymGuests = currentlyInGym - currentlyInGymMembers;

    // 2. Today Check-ins
    const todayCheckinsCount = await this.prisma.attendances.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        check_in_at: { gte: todayStart, lte: todayEnd },
        status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
      },
    });

    const undoCheckinsCount = await this.prisma.attendances.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        check_in_at: { gte: todayStart, lte: todayEnd },
        status: 'CANCELLED',
      },
    });

    // 3. Today Revenue
    const todayPayments = await this.prisma.payment.findMany({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        paid_at: { gte: todayStart, lte: todayEnd },
        status: 'PAID',
      },
      select: { total_amount: true, payment_type: true },
    });

    const todayRevenue = todayPayments.reduce((sum, p) => sum + Number(p.total_amount), 0);

    const revenueBySource = {
      membership: todayPayments.filter(p => p.payment_type === 'MEMBERSHIP').reduce((s, p) => s + Number(p.total_amount), 0),
      pt: todayPayments.filter(p => p.payment_type === 'PT_PACKAGE').reduce((s, p) => s + Number(p.total_amount), 0),
      // payments_payment_type_check only allows MEMBERSHIP|PT_PACKAGE|GUEST_VISIT|MIXED|OTHER — 'GUEST' never matches.
      guest: todayPayments.filter(p => p.payment_type === 'GUEST_VISIT').reduce((s, p) => s + Number(p.total_amount), 0),
    };

    // 4. New / Renewed Memberships
    const newMembershipsCount = await this.prisma.membership.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        created_at: { gte: todayStart, lte: todayEnd },
        previous_membership_id: null,
      },
    });

    const renewedMembershipsCount = await this.prisma.membership.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        created_at: { gte: todayStart, lte: todayEnd },
        previous_membership_id: { not: null },
      },
    });

    // 5. Today Guests
    const todayGuestsCount = await this.prisma.guest_visits.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        created_at: { gte: todayStart, lte: todayEnd },
      },
    });

    // 6. Today PT Sessions
    const ptBookings = await this.prisma.ptBooking.findMany({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        scheduled_start: { gte: todayStart, lte: todayEnd },
      },
      select: { status: true },
    });

    const todayPtSessions = {
      total: ptBookings.length,
      completed: ptBookings.filter(b => b.status === 'COMPLETED').length,
      upcoming: ptBookings.filter(b => b.status === 'SCHEDULED').length,
      cancelled: ptBookings.filter(b => b.status === 'CANCELLED').length,
    };

    // 7. Action Center Alerts
    const pendingPaymentsCount = await this.prisma.payment.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        status: 'PENDING',
      },
    });

    const expiring3DaysCount = await this.prisma.membership.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        status: 'ACTIVE',
        end_date: {
          gte: todayStart,
          lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const atRiskMembersCount = await this.prisma.customer.count({
      where: {
        tenant_id: tenantId,
        home_branch_id: branchId,
        status: 'ACTIVE',
        attendances: {
          none: {
            check_in_at: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
          },
        },
      },
    });

    const actionCenter = [
      {
        id: 'pending-payments',
        priority: 'CRITICAL',
        title: `${pendingPaymentsCount} Giao dịch chờ xác nhận thanh toán`,
        description: 'Vui lòng kiểm tra và xác nhận thủ công nếu khách đã chuyển khoản.',
        count: pendingPaymentsCount,
      },
      {
        id: 'expiring-memberships',
        priority: 'WARNING',
        title: `${expiring3DaysCount} Gói tập sẽ hết hạn trong 3 ngày tới`,
        description: 'Liên hệ tư vấn gia hạn cho hội viên.',
        count: expiring3DaysCount,
      },
      {
        id: 'at-risk-members',
        priority: 'INFORMATION',
        title: `${atRiskMembersCount} Hội viên chưa đi tập trên 14 ngày`,
        description: 'Cần hỗ trợ chăm sóc để hạn chế rời bỏ.',
        count: atRiskMembersCount,
      },
    ];

    // 8. Hourly Check-in Chart Data (06:00 to 22:00)
    const allTodayAttendances = await this.prisma.attendances.findMany({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        check_in_at: { gte: todayStart, lte: todayEnd },
        status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
      },
      select: { check_in_at: true },
    });

    const hourlyMap: Record<number, number> = {};
    for (let h = 6; h <= 22; h++) hourlyMap[h] = 0;

    allTodayAttendances.forEach(a => {
      const hour = a.check_in_at.getHours();
      if (hour >= 6 && hour <= 22) {
        hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
      }
    });

    const hourlyCheckins = Object.entries(hourlyMap).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      count,
    }));

    // 9. Expiring Memberships List
    const expiringMemberships = await this.prisma.membership.findMany({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        status: 'ACTIVE',
        end_date: {
          gte: todayStart,
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      take: 5,
      orderBy: { end_date: 'asc' },
      include: {
        customers: { select: { full_name: true, phone: true } },
      },
    });

    return {
      kpis: {
        currentlyInGym,
        currentlyInGymMembers,
        currentlyInGymGuests,
        todayCheckins: todayCheckinsCount,
        undoCheckins: undoCheckinsCount,
        todayRevenue,
        newMembershipsCount,
        renewedMembershipsCount,
        todayGuestsCount,
        todayPtSessions,
      },
      actionCenter,
      hourlyCheckins,
      revenueBySource,
      expiringMemberships: expiringMemberships.map(m => ({
        id: m.id,
        customerName: m.customers.full_name,
        customerPhone: m.customers.phone,
        packageName: m.package_name_snapshot,
        endDate: m.end_date,
      })),
    };
  }

  async getCurrentlyInGym(user: RequestUser, requestedBranchId?: string) {
    const branchId = await this.resolveBranchId(user, requestedBranchId);

    const attendances = await this.prisma.attendances.findMany({
      where: {
        tenant_id: user.tenantId!,
        branch_id: branchId,
        status: 'CHECKED_IN',
      },
      include: {
        customers: {
          select: { id: true, full_name: true, phone: true, customer_code: true, avatar_url: true },
        },
      },
      orderBy: { check_in_at: 'desc' },
    });

    return attendances.map(a => ({
      id: a.id,
      customer: a.customers,
      // Flattened aliases — frontend/src/staff/{DashboardPage,CheckinPage}.tsx read these
      // directly (matching the convention getGuestVisits() already uses), while
      // frontend/src/manager/pages/checkin/CheckinPage.tsx reads the nested `customer`
      // object above. Keep both so neither consumer breaks.
      customerName: a.customers?.full_name,
      customerPhone: a.customers?.phone,
      attendanceType: a.attendance_type,
      checkInAt: a.check_in_at,
      checkInMethod: a.check_in_method,
      autoCheckoutAt: a.auto_checkout_at,
    }));
  }

  async manualCheckin(user: RequestUser, dto: ManualCheckinDto) {
    const branchId = await this.resolveBranchId(user);
    const tenantId = user.tenantId!;

    const existingCheckin = await this.prisma.attendances.findFirst({
      where: {
        tenant_id: tenantId,
        customer_id: dto.customerId,
        status: 'CHECKED_IN',
      },
    });
    if (existingCheckin) {
      throw new BadRequestException('Hội viên này đang ở trong phòng tập');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy thông tin hội viên');

    const autoCheckoutAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // Default 4h auto checkout

    const attendance = await this.prisma.attendances.create({
      data: {
        tenant_id: tenantId,
        branch_id: branchId,
        customer_id: dto.customerId,
        attendance_type: 'MEMBER',
        membership_id: dto.membershipId || undefined,
        check_in_at: new Date(),
        check_in_method: 'MANUAL',
        check_in_by: user.id,
        auto_checkout_at: autoCheckoutAt,
        status: 'CHECKED_IN',
        note: dto.note,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'ATTENDANCE',
      entityId: attendance.id,
      action: 'MANUAL_CHECKIN',
    });

    this.realtimeGateway.emitToBranch(tenantId, branchId, 'attendance:updated', { attendanceId: attendance.id });
    this.realtimeGateway.emitToBranch(tenantId, branchId, 'dashboard:refresh', {});

    return attendance;
  }

  async manualCheckout(user: RequestUser, attendanceId: string) {
    const attendance = await this.prisma.attendances.findUnique({
      where: { id: attendanceId },
    });
    if (!attendance || attendance.status !== 'CHECKED_IN') {
      throw new BadRequestException('Lượt check-in không còn hợp lệ');
    }

    const updated = await this.prisma.attendances.update({
      where: { id: attendanceId },
      data: {
        status: 'CHECKED_OUT',
        check_out_at: new Date(),
        check_out_method: 'MANUAL',
        check_out_by: user.id,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: user.tenantId!,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'ATTENDANCE',
      entityId: updated.id,
      action: 'MANUAL_CHECKOUT',
    });

    this.realtimeGateway.emitToBranch(updated.tenant_id, updated.branch_id, 'attendance:updated', { attendanceId: updated.id });
    this.realtimeGateway.emitToBranch(updated.tenant_id, updated.branch_id, 'dashboard:refresh', {});

    return updated;
  }

  async undoCheckin(user: RequestUser, dto: UndoCheckinDto) {
    const attendance = await this.prisma.attendances.findUnique({
      where: { id: dto.attendanceId },
    });
    if (!attendance) throw new NotFoundException('Không tìm thấy lượt check-in');

    const diffMinutes = (Date.now() - new Date(attendance.check_in_at).getTime()) / (1000 * 60);
    if (diffMinutes > 15) {
      throw new BadRequestException(
        'Chỉ được phép Hủy lượt check-in trong vòng 15 phút kể từ lúc ghi nhận (BR-STAFF-003).',
      );
    }

    const updated = await this.prisma.attendances.update({
      where: { id: dto.attendanceId },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by: user.id,
        cancel_reason: dto.reason,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: user.tenantId!,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'ATTENDANCE',
      entityId: updated.id,
      action: 'UNDO_CHECKIN',
      reason: dto.reason,
    });

    this.realtimeGateway.emitToBranch(updated.tenant_id, updated.branch_id, 'attendance:updated', { attendanceId: updated.id });
    this.realtimeGateway.emitToBranch(updated.tenant_id, updated.branch_id, 'dashboard:refresh', {});

    return updated;
  }

  async getCustomers(
    user: RequestUser,
    search?: string,
    packageId?: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const branchId = await this.resolveBranchId(user);
    const tenantId = user.tenantId!;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const isOwner = user.roles?.includes(ROLE.OWNER);

    const andConditions: any[] = [
      { tenant_id: tenantId },
      // Exclude Guest visits: Only display actual Members!
      {
        customer_code: {
          not: {
            startsWith: 'GUEST',
          },
        },
      },
    ];

    // Branch scoping for Staff/Manager (non-Owner):
    if (!isOwner && branchId) {
      andConditions.push({
        OR: [
          { home_branch_id: branchId },
          { home_branch_id: null },
          { memberships: { some: { branch_id: branchId } } },
        ],
      });
    }

    if (status) {
      andConditions.push({ status });
    }

    if (packageId) {
      andConditions.push({
        memberships: {
          some: {
            package_id: packageId,
            status: { in: ['ACTIVE', 'SCHEDULED', 'FROZEN'] },
          },
        },
      });
    }

    if (search && search.trim()) {
      const query = search.trim();
      andConditions.push({
        OR: [
          { full_name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
          { customer_code: { contains: query, mode: 'insensitive' } },
        ],
      });
    }

    const where = { AND: andConditions };

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          customer_code: true,
          full_name: true,
          phone: true,
          email: true,
          status: true,
          avatar_url: true,
          created_at: true,
          qr_token: true,
          memberships: {
            where: {
              status: { in: ['ACTIVE', 'SCHEDULED', 'FROZEN'] },
            },
            select: {
              id: true,
              package_name_snapshot: true,
              status: true,
              end_date: true,
            },
          },
          attendances: {
            where: {
              status: 'CHECKED_IN',
            },
            select: {
              id: true,
              check_in_at: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async freezeMembership(user: RequestUser, dto: FreezeMembershipDto) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: dto.membershipId },
    });
    if (!membership || membership.status !== 'ACTIVE') {
      throw new BadRequestException('Gói tập không ở trạng thái hoạt động');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    const freeze = await this.prisma.$transaction(async (tx) => {
      const created = await tx.membership_freezes.create({
        data: {
          tenant_id: user.tenantId!,
          membership_id: membership.id,
          start_date: startDate,
          end_date: endDate,
          days_count: daysCount,
          reason: dto.reason,
          status: 'ACTIVE',
          approved_by: user.id,
          created_by: user.id,
        },
      });

      await tx.membership.update({
        where: { id: membership.id },
        data: {
          status: 'FROZEN',
          frozen_days_used: { increment: daysCount },
        },
      });

      return created;
    });

    await writeAuditLog(this.prisma, {
      tenantId: user.tenantId!,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'MEMBERSHIP',
      entityId: membership.id,
      action: 'FREEZE_MEMBERSHIP',
      reason: dto.reason,
    });

    return freeze;
  }

  async addFreeDays(user: RequestUser, dto: AddFreeDaysDto) {
    const membership = await this.prisma.membership.findUnique({
      where: { id: dto.membershipId },
    });
    if (!membership) throw new NotFoundException('Không tìm thấy gói tập');

    const newEndDate = new Date(membership.end_date);
    newEndDate.setDate(newEndDate.getDate() + Number(dto.days));

    const updated = await this.prisma.membership.update({
      where: { id: dto.membershipId },
      data: { end_date: newEndDate },
    });

    await writeAuditLog(this.prisma, {
      tenantId: user.tenantId!,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'MEMBERSHIP',
      entityId: membership.id,
      action: 'ADD_FREE_DAYS',
      reason: dto.reason,
      beforeData: { endDate: membership.end_date },
      afterData: { endDate: newEndDate, addedDays: dto.days },
    });

    return updated;
  }

  async getPtBookings(user: RequestUser) {
    const branchId = await this.resolveBranchId(user);

    return this.prisma.ptBooking.findMany({
      where: {
        tenant_id: user.tenantId!,
        branch_id: branchId,
      },
      take: 50,
      orderBy: { scheduled_start: 'asc' },
      include: {
        customers: { select: { full_name: true, phone: true } },
      },
    });
  }

  async createPtBooking(user: RequestUser, dto: PtBookingDto) {
    const branchId = await this.resolveBranchId(user);

    const booking = await this.prisma.ptBooking.create({
      data: {
        tenant_id: user.tenantId!,
        branch_id: branchId,
        pt_user_id: dto.ptUserId,
        customer_id: dto.customerId,
        customer_pt_package_id: dto.customerPtPackageId,
        scheduled_start: new Date(dto.scheduledStart),
        scheduled_end: new Date(dto.scheduledEnd),
        session_note: dto.sessionNote,
        created_by: user.id,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: user.tenantId!,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'PT_BOOKING',
      entityId: booking.id,
      action: 'CREATE_PT_BOOKING',
    });

    return booking;
  }

  async cancelPtBooking(user: RequestUser, dto: CancelBookingDto) {
    const booking = await this.prisma.ptBooking.findUnique({
      where: { id: dto.bookingId },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy lịch đặt PT');

    const updated = await this.prisma.ptBooking.update({
      where: { id: dto.bookingId },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by: user.id,
        cancel_reason: dto.reason,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: user.tenantId!,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'PT_BOOKING',
      entityId: booking.id,
      action: 'CANCEL_PT_BOOKING',
      reason: dto.reason,
    });

    return updated;
  }

  async getBranchStaff(user: RequestUser) {
    const branchId = await this.resolveBranchId(user);

    const links = await this.prisma.user_branches.findMany({
      where: {
        tenant_id: user.tenantId!,
        branch_id: branchId,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            user_type: true,
            status: true,
            user_roles: {
              include: { roles: true },
            },
          },
        },
      },
    });

    return links.map(l => ({
      ...l.users,
      roles: l.users.user_roles.map(r => r.roles.code),
    }));
  }

  async listBranchPackages(user: RequestUser) {
    const branchId = await this.resolveBranchId(user);
    const tenantId = user.tenantId!;

    const packages = await this.prisma.membershipPackage.findMany({
      where: {
        tenant_id: tenantId,
        status: 'ACTIVE',
        OR: [
          { package_branches: { none: {} } },
          { package_branches: { some: { branch_id: branchId } } },
        ],
      },
      include: {
        package_branches: {
          include: { branches: { select: { id: true, name: true } } },
        },
      },
      orderBy: { display_order: 'asc' },
    });

    return packages.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      durationValue: p.duration_value,
      durationUnit: p.duration_unit,
      basePrice: p.base_price,
      branchAccessScope: p.branch_access_scope,
      appliesToAllBranches: p.package_branches.length === 0,
      branches: p.package_branches.map((pb) => pb.branches),
    }));
  }

  async getBranchAuditLogs(user: RequestUser) {
    const branchId = await this.resolveBranchId(user);

    return this.prisma.auditLog.findMany({
      where: {
        tenant_id: user.tenantId!,
      },
      take: 50,
      orderBy: { occurred_at: 'desc' },
    });
  }

  async changePassword(user: RequestUser, dto: ManagerChangePasswordDto) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.password_hash) {
      throw new BadRequestException('Tài khoản không hợp lệ');
    }

    const matches = await bcrypt.compare(dto.currentPassword, dbUser.password_hash);
    if (!matches) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash: passwordHash,
        must_change_password: false,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: user.tenantId!,
      actorUserId: user.id,
      actorRole: user.roles?.[0] || ROLE.STAFF,
      entityType: 'USER',
      entityId: user.id,
      action: 'FIRST_LOGIN_PASSWORD_CHANGED',
    });

    return { success: true, message: 'Đổi mật khẩu thành công!' };
  }

  async quickRegisterCustomer(user: RequestUser, dto: any) {
    const branchId = await this.resolveBranchId(user);
    const tenantId = user.tenantId!;

    const existing = await this.prisma.customer.findFirst({
      where: { tenant_id: tenantId, phone: dto.phone },
    });
    if (existing) {
      throw new BadRequestException('Số điện thoại này đã được đăng ký hội viên');
    }

    const customerCode = `KH-${Math.floor(100000 + Math.random() * 900000)}`;

    const customer = await this.prisma.customer.create({
      data: {
        tenant_id: tenantId,
        home_branch_id: branchId,
        customer_code: customerCode,
        full_name: dto.fullName,
        phone: dto.phone,
        email: dto.email || null,
        gender: dto.gender || null,
        status: 'ACTIVE',
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'CUSTOMER',
      entityId: customer.id,
      action: 'QUICK_REGISTER_CUSTOMER',
    });

    return customer;
  }

  async quickCreatePayment(user: RequestUser, dto: any) {
    const branchId = await this.resolveBranchId(user);
    const tenantId = user.tenantId!;

    if (isVietQrMethod(dto.paymentMethod)) {
      return this.createPendingQrPayment({
        tenantId,
        branchId,
        userId: user.id,
        customerId: dto.customerId,
        paymentType: 'OTHER',
        amount: dto.amount,
        pendingActionType: 'QUICK',
        pendingActionPayload: { title: dto.title },
      });
    }

    const paymentCode = `PAY-${Date.now()}`;

    const payment = await this.prisma.payment.create({
      data: {
        tenant_id: tenantId,
        branch_id: branchId,
        customer_id: dto.customerId,
        payment_code: paymentCode,
        payment_type: 'OTHER',
        subtotal: dto.amount,
        discount_amount: 0,
        total_amount: dto.amount,
        status: 'PAID',
        paid_at: new Date(),
        method: mapPaymentMethod(dto.paymentMethod),
        created_by: user.id,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'PAYMENT',
      entityId: payment.id,
      action: 'QUICK_CREATE_PAYMENT',
    });

    return payment;
  }

  async createBranchStaff(user: RequestUser, dto: any) {
    const branchId = await this.resolveBranchId(user);
    const tenantId = user.tenantId!;

    // Check duplicate email
    const existingEmail = await this.prisma.user.findFirst({
      where: { email: { equals: dto.email, mode: 'insensitive' } },
    });
    if (existingEmail) {
      throw new BadRequestException('Email này đã được đăng ký tài khoản trên hệ thống');
    }

    // Check duplicate phone if provided
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { tenant_id: tenantId, phone: dto.phone },
      });
      if (existingPhone) {
        throw new BadRequestException('Số điện thoại này đã được sử dụng trong doanh nghiệp');
      }
    }

    const temporaryPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const staffRoleCode = dto.role === 'PT' ? 'PT' : 'STAFF';

    // Find role in db
    const roleRecord = await this.prisma.roles.findUnique({
      where: { code: staffRoleCode },
    });

    const newStaff = await this.prisma.user.create({
      data: {
        tenant_id: tenantId,
        user_type: 'TENANT',
        full_name: dto.fullName,
        email: dto.email,
        phone: dto.phone || null,
        gender: dto.gender || null,
        password_hash: passwordHash,
        status: 'ACTIVE',
        must_change_password: true,
      },
    });

    // Assign role
    if (roleRecord) {
      await this.prisma.user_roles.create({
        data: {
          user_id: newStaff.id,
          role_id: roleRecord.id,
        },
      });
    }

    // Assign branch
    await this.prisma.user_branches.create({
      data: {
        tenant_id: tenantId,
        user_id: newStaff.id,
        branch_id: branchId,
        is_primary: true,
      },
    });

    // If PT, create PT Profile
    if (staffRoleCode === 'PT') {
      const employeeCode = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
      await this.prisma.ptProfile.create({
        data: {
          user_id: newStaff.id,
          tenant_id: tenantId,
          employee_code: employeeCode,
        },
      });
    }

    // Send credentials via email
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, legal_name: true },
    });
    const tenantName = tenant?.name || tenant?.legal_name || 'FitFlow';
    const roleTitle = staffRoleCode === 'PT' ? 'Huấn luyện viên (PT)' : 'Lễ tân / Thu ngân';

    await this.mailService.sendStaffAccountCredentialsEmail(
      dto.email,
      dto.fullName,
      tenantName,
      roleTitle,
      temporaryPassword,
    );

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'USER',
      entityId: newStaff.id,
      action: 'CREATE_BRANCH_STAFF',
    });

    return {
      success: true,
      message: `Đã khởi tạo tài khoản ${roleTitle} thành công! Mật khẩu ngẫu nhiên đã được tự động gửi trực tiếp tới email ${dto.email}.`,
      staff: newStaff,
    };
  }

  async registerCustomerWithAccount(user: RequestUser, dto: any) {
    const tenantId = user.tenantId!;
    const branchId = await this.resolveBranchId(user);

    // Validate email
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email đăng ký tài khoản đã tồn tại trên hệ thống.');
    }

    // Validate phone
    if (dto.phone) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { tenant_id: tenantId, phone: dto.phone },
      });
      if (existingCustomer) {
        throw new BadRequestException('Số điện thoại này đã được đăng ký hội viên.');
      }
    }

    const passwordHash = await bcrypt.hash(dto.defaultPassword, 10);

    const customer = await this.prisma.$transaction(async (tx) => {
      // Find CUSTOMER role
      const role = await tx.roles.findUnique({
        where: { code: 'CUSTOMER' },
      });
      if (!role) {
        throw new BadRequestException('Vai trò CUSTOMER chưa được khởi tạo trên hệ thống.');
      }

      // 1. Create User
      const newUser = await tx.user.create({
        data: {
          tenant_id: tenantId,
          user_type: 'CUSTOMER',
          email: dto.email,
          phone: dto.phone || null,
          password_hash: passwordHash,
          full_name: dto.fullName,
          gender: dto.gender || 'MALE',
          status: 'ACTIVE',
          must_change_password: true,
        },
      });

      // 2. Create user_roles
      await tx.user_roles.create({
        data: {
          user_id: newUser.id,
          role_id: role.id,
          tenant_id: tenantId,
        },
      });

      // 3. Create Customer
      const customerCode = `KH-${Math.floor(100000 + Math.random() * 900000)}`;
      const newCustomer = await tx.customer.create({
        data: {
          tenant_id: tenantId,
          user_id: newUser.id,
          customer_code: customerCode,
          full_name: dto.fullName,
          phone: dto.phone || null,
          email: dto.email,
          gender: dto.gender || 'MALE',
          home_branch_id: branchId,
          status: 'ACTIVE',
          created_by: user.id,
        },
      });

      return newCustomer;
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'CUSTOMER',
      entityId: customer.id,
      action: 'REGISTER_CUSTOMER_WITH_ACCOUNT',
    });

    return customer;
  }

  async assignMembershipPackage(user: RequestUser, dto: SellMembershipDto) {
    const tenantId = user.tenantId!;
    const branchId = await this.resolveBranchId(user);

    const customer = await this.prisma.customer.findFirst({
      where: { tenant_id: tenantId, id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy hội viên.');
    }

    const pkg = await this.prisma.membershipPackage.findFirst({
      where: { tenant_id: tenantId, id: dto.packageId },
    });
    if (!pkg) {
      throw new NotFoundException('Không tìm thấy gói tập.');
    }

    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        tenant_id: tenantId,
        customer_id: dto.customerId,
        status: { in: ['ACTIVE', 'SCHEDULED', 'FROZEN'] },
      },
    });
    if (activeMembership) {
      throw new BadRequestException('Hội viên đã có gói tập đang kích hoạt hoặc đang tạm ngưng.');
    }

    if (isVietQrMethod(dto.paymentMethod)) {
      return this.createPendingQrPayment({
        tenantId,
        branchId,
        userId: user.id,
        customerId: dto.customerId,
        paymentType: 'MEMBERSHIP',
        amount: Number(pkg.base_price),
        pendingActionType: 'MEMBERSHIP',
        pendingActionPayload: { packageId: dto.packageId, startDate: dto.startDate },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const membership = await this.salesFulfillment.finalizeMembershipSale(tx, {
        tenantId,
        branchId,
        userId: user.id,
        customerId: dto.customerId,
        packageId: dto.packageId,
        startDate: dto.startDate,
      });

      const paymentCode = `PAY-MEM-${Date.now()}`;
      await tx.payment.create({
        data: {
          tenant_id: tenantId,
          branch_id: branchId,
          customer_id: dto.customerId,
          payment_code: paymentCode,
          payment_type: 'MEMBERSHIP',
          subtotal: pkg.base_price,
          total_amount: pkg.base_price,
          status: 'PAID',
          paid_at: new Date(),
          method: mapPaymentMethod(dto.paymentMethod),
          created_by: user.id,
        },
      });

      return membership;
    });
  }

  async toggleCustomerStatus(user: RequestUser, customerId: string, dto: any) {
    const tenantId = user.tenantId!;

    const customer = await this.prisma.customer.findFirst({
      where: { tenant_id: tenantId, id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy hội viên.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.customer.update({
        where: { id: customerId },
        data: { status: dto.status },
      });

      if (customer.user_id) {
        await tx.user.update({
          where: { id: customer.user_id },
          data: { status: dto.status },
        });
      }
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'CUSTOMER',
      entityId: customerId,
      action: dto.status === 'ACTIVE' ? 'ACTIVATE_CUSTOMER' : 'DEACTIVATE_CUSTOMER',
    });

    return { success: true, message: 'Cập nhật trạng thái tài khoản thành công.' };
  }

  async getGuestVisits(user: RequestUser, status?: string) {
    const branchId = await this.resolveBranchId(user);
    const tenantId = user.tenantId!;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const visits = await this.prisma.guest_visits.findMany({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        created_at: { gte: todayStart },
        ...(status ? { status } : {}),
      },
      include: {
        customers: {
          select: { id: true, full_name: true, phone: true, customer_code: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return visits.map((v) => ({
      id: v.id,
      customerName: v.customers.full_name,
      customerPhone: v.customers.phone,
      packageName: v.package_name_snapshot,
      price: v.price_snapshot,
      status: v.status,
      heldAt: v.held_at,
      holdReason: v.hold_reason,
      createdAt: v.created_at,
    }));
  }

  async createGuestVisit(user: RequestUser, dto: CreateGuestVisitDto) {
    const branchId = await this.resolveBranchId(user);
    const tenantId = user.tenantId!;

    const pkg = await this.prisma.membershipPackage.findFirst({
      where: { tenant_id: tenantId, id: dto.packageId },
    });
    if (!pkg) throw new NotFoundException('Không tìm thấy gói vé lượt');

    // Find or create quick guest customer record
    let customer = await this.prisma.customer.findFirst({
      where: { tenant_id: tenantId, phone: dto.phone },
    });

    if (!customer) {
      const customerCode = `GUEST-${Math.floor(100000 + Math.random() * 900000)}`;
      customer = await this.prisma.customer.create({
        data: {
          tenant_id: tenantId,
          home_branch_id: branchId,
          customer_code: customerCode,
          full_name: dto.fullName,
          phone: dto.phone,
          status: 'ACTIVE',
        },
      });
    }

    if (isVietQrMethod(dto.paymentMethod)) {
      return this.createPendingQrPayment({
        tenantId,
        branchId,
        userId: user.id,
        customerId: customer.id,
        paymentType: 'GUEST_VISIT',
        amount: Number(pkg.base_price),
        pendingActionType: 'GUEST_VISIT',
        pendingActionPayload: { packageId: dto.packageId },
      });
    }

    // BR-STAFF-002: Guest Visit paid -> Auto create attendance & set status = ACTIVE
    const result = await this.prisma.$transaction(async (tx) => {
      const paymentCode = `PAY-GUEST-${Date.now()}`;
      const payment = await tx.payment.create({
        data: {
          tenant_id: tenantId,
          branch_id: branchId,
          customer_id: customer.id,
          payment_code: paymentCode,
          payment_type: 'GUEST_VISIT',
          subtotal: pkg.base_price,
          total_amount: pkg.base_price,
          status: 'PAID',
          paid_at: new Date(),
          method: mapPaymentMethod(dto.paymentMethod),
          created_by: user.id,
        },
      });

      const { visit, attendance } = await this.salesFulfillment.finalizeGuestVisitSale(tx, {
        tenantId,
        branchId,
        userId: user.id,
        customerId: customer.id,
        packageId: dto.packageId,
        paymentId: payment.id,
      });

      return { visit, payment, attendance };
    });

    this.realtimeGateway.emitToBranch(tenantId, branchId, 'guestvisit:updated', { guestVisitId: result.visit.id });
    this.realtimeGateway.emitToBranch(tenantId, branchId, 'dashboard:refresh', {});

    return result.visit;
  }

  async toggleGuestHold(user: RequestUser, dto: ToggleGuestHoldDto) {
    const tenantId = user.tenantId!;
    const visit = await this.prisma.guest_visits.findFirst({
      where: { tenant_id: tenantId, id: dto.guestVisitId },
    });
    if (!visit) throw new NotFoundException('Không tìm thấy bản ghi khách vãng lai');

    if (visit.status === 'ON_HOLD') {
      // Resume visit
      const updated = await this.prisma.guest_visits.update({
        where: { id: visit.id },
        data: {
          status: 'ACTIVE',
          resumed_at: new Date(),
        },
      });
      this.realtimeGateway.emitToBranch(tenantId, updated.branch_id, 'guestvisit:updated', { guestVisitId: updated.id });
      return { success: true, message: 'Đã mở lại lượt vé khách vãng lai', visit: updated };
    } else {
      // Hold visit
      const updated = await this.prisma.guest_visits.update({
        where: { id: visit.id },
        data: {
          status: 'ON_HOLD',
          held_at: new Date(),
          hold_reason: dto.reason || 'Khách có việc đột xuất',
        },
      });
      this.realtimeGateway.emitToBranch(tenantId, updated.branch_id, 'guestvisit:updated', { guestVisitId: updated.id });
      return { success: true, message: 'Đã chuyển lượt khách sang trạng thái tạm hoãn (ON_HOLD)', visit: updated };
    }
  }

  async getPtPackagePlans(user: RequestUser, status?: string) {
    const tenantId = user.tenantId!;
    const isOwner = user.roles?.includes(ROLE.OWNER);
    let ptUserIdFilter: any = {};

    if (!isOwner) {
      const branchId = await this.resolveBranchId(user);
      const ptUserBranches = await this.prisma.user_branches.findMany({
        where: { tenant_id: tenantId, branch_id: branchId },
        select: { user_id: true },
      });
      const allowedPtUserIds = ptUserBranches.map((ub) => ub.user_id);
      ptUserIdFilter = { pt_user_id: { in: allowedPtUserIds } };
    }

    const plans = await this.prisma.pt_package_plans.findMany({
      where: {
        tenant_id: tenantId,
        ...(status ? { status } : {}),
        ...ptUserIdFilter,
      },
      include: {
        pt_profiles: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return plans.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      sessionCount: p.session_count,
      price: p.price,
      validityDays: p.validity_days,
      sessionDurationMinutes: p.session_duration_minutes,
      status: p.status,
      approvedAt: p.approved_at,
      rejectReason: p.reject_reason,
      createdAt: p.created_at,
      ptUser: p.pt_profiles?.users
        ? {
            id: p.pt_profiles.users.id,
            fullName: p.pt_profiles.users.full_name,
            email: p.pt_profiles.users.email,
            phone: p.pt_profiles.users.phone,
          }
        : null,
    }));
  }

  async approvePtPackagePlan(user: RequestUser, planId: string) {
    const tenantId = user.tenantId!;
    const plan = await this.prisma.pt_package_plans.findFirst({
      where: { tenant_id: tenantId, id: planId },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy gói PT cần phê duyệt');

    const isOwner = user.roles?.includes(ROLE.OWNER);
    if (!isOwner) {
      const branchId = await this.resolveBranchId(user);
      const ptBranch = await this.prisma.user_branches.findFirst({
        where: { tenant_id: tenantId, user_id: plan.pt_user_id, branch_id: branchId },
      });
      if (!ptBranch) {
        throw new ForbiddenException('Bạn chỉ có quyền phê duyệt gói tập của Huấn luyện viên thuộc chi nhánh bạn quản lý');
      }
    }

    const updated = await this.prisma.pt_package_plans.update({
      where: { id: planId },
      data: {
        status: 'ACTIVE',
        approved_by: user.id,
        approved_at: new Date(),
        reject_reason: null,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: user.roles?.[0] || ROLE.BRANCH_MANAGER,
      entityType: 'PT_PACKAGE_PLAN',
      entityId: planId,
      action: 'APPROVE_PT_PACKAGE_PLAN',
    });

    return { success: true, message: 'Đã phê duyệt gói tập PT thành công!', plan: updated };
  }

  async rejectPtPackagePlan(user: RequestUser, planId: string, reason?: string) {
    const tenantId = user.tenantId!;
    const plan = await this.prisma.pt_package_plans.findFirst({
      where: { tenant_id: tenantId, id: planId },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy gói PT cần từ chối');

    const isOwner = user.roles?.includes(ROLE.OWNER);
    if (!isOwner) {
      const branchId = await this.resolveBranchId(user);
      const ptBranch = await this.prisma.user_branches.findFirst({
        where: { tenant_id: tenantId, user_id: plan.pt_user_id, branch_id: branchId },
      });
      if (!ptBranch) {
        throw new ForbiddenException('Bạn chỉ có quyền từ chối gói tập của Huấn luyện viên thuộc chi nhánh bạn quản lý');
      }
    }

    const updated = await this.prisma.pt_package_plans.update({
      where: { id: planId },
      data: {
        status: 'REJECTED',
        approved_by: user.id,
        approved_at: new Date(),
        reject_reason: reason || 'Chưa đạt tiêu chuẩn niêm yết giá',
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: user.roles?.[0] || ROLE.BRANCH_MANAGER,
      entityType: 'PT_PACKAGE_PLAN',
      entityId: planId,
      action: 'REJECT_PT_PACKAGE_PLAN',
    });

    return { success: true, message: 'Đã từ chối gói tập PT', plan: updated };
  }

  async assignPtPackage(user: RequestUser, dto: SellPtPackageDto) {
    const tenantId = user.tenantId!;
    const branchId = await this.resolveBranchId(user);

    // 1. Verify customer exists in tenant
    const customer = await this.prisma.customer.findFirst({
      where: { tenant_id: tenantId, id: dto.customerId },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin hội viên.');
    }

    // 2. Verify PT Package Plan exists & active
    const plan = await this.prisma.pt_package_plans.findFirst({
      where: { tenant_id: tenantId, id: dto.planId, status: 'ACTIVE' },
      include: {
        pt_profiles: {
          include: {
            users: {
              select: { full_name: true },
            },
          },
        },
      },
    });
    if (!plan) {
      throw new NotFoundException('Gói tập PT không tồn tại hoặc chưa được phê duyệt mở bán.');
    }

    // 3. Find active membership if any
    const activeMembership = await this.prisma.membership.findFirst({
      where: { tenant_id: tenantId, customer_id: dto.customerId, status: 'ACTIVE' },
    });

    if (isVietQrMethod(dto.paymentMethod)) {
      return this.createPendingQrPayment({
        tenantId,
        branchId,
        userId: user.id,
        customerId: dto.customerId,
        paymentType: 'PT_PACKAGE',
        amount: Number(plan.price),
        pendingActionType: 'PT_PACKAGE',
        pendingActionPayload: { planId: dto.planId, startDate: dto.startDate },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // Create Payment first so finalizePtPackageSale can attach payment_items to it
      const paymentCode = `PAY-PT-${Date.now()}`;
      const payment = await tx.payment.create({
        data: {
          tenant_id: tenantId,
          branch_id: branchId,
          customer_id: dto.customerId,
          payment_code: paymentCode,
          payment_type: 'PT_PACKAGE',
          subtotal: plan.price,
          discount_amount: 0,
          total_amount: plan.price,
          status: 'PAID',
          paid_at: new Date(),
          method: mapPaymentMethod(dto.paymentMethod),
          created_by: user.id,
        },
      });

      const { customerPtPackage } = await this.salesFulfillment.finalizePtPackageSale(tx, {
        tenantId,
        branchId,
        userId: user.id,
        userRoles: user.roles,
        customerId: dto.customerId,
        planId: dto.planId,
        paymentId: payment.id,
        startDate: dto.startDate,
      });

      return {
        success: true,
        message: `Đã đăng ký thành công gói PT ${plan.name} cho hội viên ${customer.full_name}!`,
        package: customerPtPackage,
        payment,
      };
    });
  }
}
