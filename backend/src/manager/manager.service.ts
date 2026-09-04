import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { writeAuditLog } from '../common/utils/audit';
import { generateTempPassword } from '../common/utils/temp-password';
import { ROLE } from '../common/types/role';
import type { RequestUser } from '../common/types/jwt-payload';
import type { QrTokenClaim } from '../customer/customer.service';
import * as bcrypt from 'bcrypt';
import {
  ManualCheckinDto,
  UndoCheckinDto,
  QrScanCheckinDto,
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
  EnrollFaceProfileDto,
  FaceCheckinDto,
} from './dto/manager.dto';

import { MailService } from '../mail/mail.service';
import { SalesFulfillmentService } from './sales-fulfillment.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { buildVietQrUrl, generatePaymentRef, isVietQrMethod, mapPaymentMethod } from '../common/utils/vietqr';
import { AutoCheckoutPolicyService } from '../auto-checkout/auto-checkout-policy.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OwnerSettingsService } from '../owner/settings/owner-settings.service';

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

@Injectable()
export class ManagerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly salesFulfillment: SalesFulfillmentService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly autoCheckoutPolicy: AutoCheckoutPolicyService,
    private readonly notifications: NotificationsService,
    private readonly jwt: JwtService,
    private readonly ownerSettings: OwnerSettingsService,
  ) {}

  /** Read-only passthrough — Staff/Manager UI (Face ID tab, kiosk) cần biết Owner có bật check-in bằng khuôn mặt/QR không, nhưng không có quyền gọi thẳng /owner/settings/checkin-config (Roles OWNER only). */
  getCheckinConfig(user: RequestUser) {
    return this.ownerSettings.getCheckinConfig(user.tenantId!);
  }

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
  private async getBranchName(branchId: string): Promise<string> {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } });
    return branch?.name ?? 'Chi nhánh';
  }

  private formatTimeStr(t: Date | string | null | undefined): string | null {
    if (!t) return null;
    if (typeof t === 'string') {
      if (t.includes('T')) {
        const d = new Date(t);
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      return t.slice(0, 5);
    }
    if (t instanceof Date) {
      const hh = String(t.getUTCHours()).padStart(2, '0');
      const mm = String(t.getUTCMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return null;
  }

  async resolveBranchId(user: RequestUser, requestedBranchId?: string): Promise<string> {
    if (!user.tenantId) throw new ForbiddenException('Tài khoản chưa thuộc về doanh nghiệp nào');

    const isOwner = user.roles?.includes(ROLE.OWNER);
    const targetBranchId = requestedBranchId || user.selectedBranchId;

    // If requested a specific branch ID
    if (targetBranchId) {
      if (isOwner) {
        const branch = await this.prisma.branch.findFirst({
          where: { id: targetBranchId, tenant_id: user.tenantId },
        });
        if (branch) return branch.id;
      } else {
        const ub = await this.prisma.user_branches.findFirst({
          where: { user_id: user.id, branch_id: targetBranchId, tenant_id: user.tenantId },
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
        orderBy: { created_at: 'asc' },
      });
      if (firstBranch) return firstBranch.id;
      throw new NotFoundException('Doanh nghiệp chưa có chi nhánh nào khả dụng');
    }

    // Non-owner with no assigned branch -> Throw ForbiddenException
    throw new ForbiddenException(
      'Tài khoản Quản lý của bạn chưa được phân công phụ trách chi nhánh nào. Vui lòng liên hệ Owner để được gán chi nhánh.',
    );
  }

  async getAvailableBranches(user: RequestUser) {
    if (!user.tenantId) throw new ForbiddenException('Tài khoản chưa thuộc về doanh nghiệp nào');
    const isOwner = user.roles?.includes(ROLE.OWNER);

    if (isOwner) {
      return this.prisma.branch.findMany({
        where: { tenant_id: user.tenantId, status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          code: true,
          address: true,
          phone: true,
        },
        orderBy: { created_at: 'asc' },
      });
    }

    const assigned = await this.prisma.user_branches.findMany({
      where: { user_id: user.id, tenant_id: user.tenantId },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            phone: true,
            status: true,
          },
        },
      },
      orderBy: { is_primary: 'desc' },
    });

    return assigned
      .filter((ub) => ub.branches && ub.branches.status === 'ACTIVE')
      .map((ub) => ub.branches);
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

    const branchManager = await this.prisma.user.findFirst({
      where: {
        tenant_id: user.tenantId,
        user_type: 'TENANT',
        user_roles: { some: { roles: { code: ROLE.BRANCH_MANAGER } } },
        user_branches: { some: { branch_id: branch.id } },
      },
      select: { full_name: true, phone: true, email: true },
    });

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
        phone: branch.phone,
        email: branch.email,
        openingTime: this.formatTimeStr(branch.opening_time),
        closingTime: this.formatTimeStr(branch.closing_time),
        managerName: branchManager?.full_name ?? null,
        managerPhone: branchManager?.phone ?? null,
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

    // 2. Today Check-ins — "Tổng lượt Check-in" (Total Check-in Events): mỗi lượt vào
    // tính riêng, một khách có thể có nhiều lượt trong ngày (check-in → check-out → check-in lại).
    const todayCheckinsCount = await this.prisma.attendances.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        check_in_at: { gte: todayStart, lte: todayEnd },
        status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
      },
    });

    // BR-STAT-001: "Khách đã đến hôm nay" (Daily Unique Visitors) — một khách chỉ tính một
    // lần trong ngày dù có nhiều lượt Check-in. Đây là chỉ số khác, không được gộp với
    // todayCheckinsCount phía trên (đó là tổng SỐ LƯỢT, không phải số NGƯỜI).
    const dailyUniqueVisitorsCount = await this.prisma.attendances
      .groupBy({
        by: ['customer_id'],
        where: {
          tenant_id: tenantId,
          branch_id: branchId,
          check_in_at: { gte: todayStart, lte: todayEnd },
          status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
        },
      })
      .then((rows) => rows.length);

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
    const branchUserRows = await this.prisma.user_branches.findMany({
      where: { tenant_id: tenantId, branch_id: branchId },
      select: { user_id: true },
    });
    const branchUserIds = branchUserRows.map((ub) => ub.user_id);

    const pendingPaymentsCount = await this.prisma.payment.count({
      where: {
        tenant_id: tenantId,
        branch_id: branchId,
        status: 'PENDING',
      },
    });

    const pendingPtPlansCount = await this.prisma.pt_package_plans.count({
      where: {
        tenant_id: tenantId,
        status: 'PENDING_APPROVAL',
        pt_user_id: { in: branchUserIds },
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

    // Notification.md - Inactivity Detection: Fetch active candidate customers at home branch
    const now = new Date();
    const nowMs = now.getTime();
    const activeBranchCustomers = await this.prisma.customer.findMany({
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
      },
      select: {
        id: true,
        full_name: true,
        phone: true,
        created_at: true,
        memberships: {
          where: { status: 'ACTIVE', end_date: { gte: todayStart } },
          take: 1,
          select: { start_date: true, end_date: true, package_name_snapshot: true },
        },
        attendances: {
          where: { status: { in: ['CHECKED_IN', 'CHECKED_OUT'] } },
          orderBy: { check_in_at: 'desc' },
          take: 1,
          select: { check_in_at: true },
        },
      },
    });

    const atRiskMembersList = activeBranchCustomers
      .map((c) => {
        const activeMembership = c.memberships[0];
        const latestCheckIn = c.attendances[0]?.check_in_at;
        // Notification.md Section 4:
        // Case 1: Had valid check-in => lastActivityAt = latest check_in_at
        // Case 2: Never checked in => lastActivityAt = Membership.start_date
        const lastActivityAt = latestCheckIn
          ? new Date(latestCheckIn)
          : activeMembership?.start_date
          ? new Date(activeMembership.start_date)
          : new Date(c.created_at);

        const diffTime = Math.max(0, nowMs - lastActivityAt.getTime());
        const inactiveDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const isNeverAttended = !latestCheckIn;

        return {
          id: c.id,
          customerName: c.full_name,
          customerPhone: c.phone,
          packageName: activeMembership?.package_name_snapshot ?? 'Gói tập',
          startDate: activeMembership?.start_date ?? c.created_at,
          endDate: activeMembership?.end_date,
          lastVisitAt: latestCheckIn ? latestCheckIn : null,
          lastActivityAt: lastActivityAt.toISOString(),
          inactiveDays,
          isNeverAttended,
        };
      })
      .filter((item) => item.inactiveDays >= 15)
      .sort((a, b) => b.inactiveDays - a.inactiveDays);

    const atRiskMembersCount = atRiskMembersList.length;
    const hasCriticalInactivity = atRiskMembersList.some((item) => item.inactiveDays >= 30);

    // Chi tiết cho từng mục hàng đợi — cho phép FE mở modal "xem chi tiết" thay vì chỉ
    // hiện con số. Giới hạn 20 dòng/mục để tránh trả về danh sách không giới hạn.
    const DETAIL_LIMIT = 20;
    const [
      pendingPaymentsDetail,
      expiringMembershipsDetail,
      pendingPtPlansDetail,
    ] = await Promise.all([
      this.prisma.payment.findMany({
        where: { tenant_id: tenantId, branch_id: branchId, status: 'PENDING' },
        take: DETAIL_LIMIT,
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
        take: DETAIL_LIMIT,
        orderBy: { end_date: 'asc' },
        include: { customers: { select: { full_name: true, phone: true } } },
      }),
      this.prisma.pt_package_plans.findMany({
        where: {
          tenant_id: tenantId,
          status: 'PENDING_APPROVAL',
          pt_user_id: { in: branchUserIds },
        },
        take: DETAIL_LIMIT,
        orderBy: { created_at: 'desc' },
        include: {
          pt_profiles: {
            include: {
              users: { select: { full_name: true, phone: true } },
            },
          },
        },
      }),
    ]);

    const atRiskMembersDetail = atRiskMembersList.slice(0, DETAIL_LIMIT);

    const actionCenter = [
      {
        id: 'pending-payments',
        priority: 'CRITICAL',
        title: `${pendingPaymentsCount} Giao dịch chờ xác nhận thanh toán`,
        description: 'Vui lòng kiểm tra và xác nhận thủ công nếu khách đã chuyển khoản.',
        count: pendingPaymentsCount,
        items: pendingPaymentsDetail.map((p) => ({
          id: p.id,
          customerName: p.customers.full_name,
          customerPhone: p.customers.phone,
          amount: Number(p.total_amount),
          method: p.method,
          createdAt: p.created_at,
        })),
      },
      {
        id: 'pending-pt-plans',
        priority: 'CRITICAL',
        title: `${pendingPtPlansCount} Đề xuất gói tập PT do HLV tạo chờ duyệt`,
        description: 'Các gói tập PT do Huấn luyện viên khởi tạo cần Manager phê duyệt trước khi mở bán.',
        count: pendingPtPlansCount,
        items: pendingPtPlansDetail.map((p) => ({
          id: p.id,
          ptName: p.pt_profiles?.users?.full_name ?? 'Huấn luyện viên',
          ptPhone: p.pt_profiles?.users?.phone ?? '—',
          name: p.name,
          sessionCount: p.session_count,
          price: Number(p.price),
          createdAt: p.created_at,
        })),
      },
      {
        id: 'expiring-memberships',
        priority: 'WARNING',
        title: `${expiring3DaysCount} Gói tập sẽ hết hạn trong 3 ngày tới`,
        description: 'Liên hệ tư vấn gia hạn cho hội viên.',
        count: expiring3DaysCount,
        items: expiringMembershipsDetail.map((m) => ({
          id: m.id,
          customerName: m.customers.full_name,
          customerPhone: m.customers.phone,
          packageName: m.package_name_snapshot,
          startDate: m.start_date,
          endDate: m.end_date,
        })),
      },
      {
        id: 'at-risk-members',
        priority: hasCriticalInactivity ? 'WARNING' : 'INFORMATION',
        title: `${atRiskMembersCount} Hội viên không đi tập ≥ 15 ngày`,
        description: 'Tự động tính từ lần check-in hợp lệ gần nhất (hoặc ngày kích hoạt thẻ).',
        count: atRiskMembersCount,
        items: atRiskMembersDetail,
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
        dailyUniqueVisitors: dailyUniqueVisitorsCount,
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

  private growthPct(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }

  private shiftRange(from: Date, to: Date) {
    const durationMs = to.getTime() - from.getTime();
    return { from: new Date(from.getTime() - durationMs), to: new Date(from.getTime()) };
  }

  // "Tầng 2 · Hiệu suất theo kỳ" trên dashboard Manager — mirror của
  // OwnerDashboardService.getRevenueChart + overview() growth calc (tenant-wide),
  // nhưng scope theo đúng 1 chi nhánh của Manager và gộp thêm breakdown Hội
  // viên/PT cùng lúc để FE chỉ cần 1 request cho cả 3 tab.
  async getDashboardPerformance(
    user: RequestUser,
    requestedBranchId: string | undefined,
    query: { from?: string; to?: string; groupBy?: 'day' | 'week' | 'month' },
  ) {
    const branchId = await this.resolveBranchId(user, requestedBranchId);
    const tenantId = user.tenantId!;

    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : (() => {
          const d = new Date(to);
          d.setHours(0, 0, 0, 0);
          return d;
        })();
    const groupBy = query.groupBy ?? 'day';
    const prevRange = this.shiftRange(from, to);

    const [
      payments,
      prevRevenueAgg,
      newCount,
      renewedCount,
      prevNewCount,
      expiredCount,
      atRiskCount,
      ptBookingsInRange,
      prevPtBookingsCount,
    ] = await Promise.all([
      this.prisma.payment.findMany({
        where: { tenant_id: tenantId, branch_id: branchId, status: 'PAID', paid_at: { gte: from, lte: to } },
        select: { total_amount: true, paid_at: true, payment_type: true },
      }),
      this.prisma.payment.aggregate({
        where: { tenant_id: tenantId, branch_id: branchId, status: 'PAID', paid_at: { gte: prevRange.from, lt: from } },
        _sum: { total_amount: true },
      }),
      this.prisma.membership.count({
        where: { tenant_id: tenantId, branch_id: branchId, created_at: { gte: from, lte: to }, previous_membership_id: null },
      }),
      this.prisma.membership.count({
        where: { tenant_id: tenantId, branch_id: branchId, created_at: { gte: from, lte: to }, previous_membership_id: { not: null } },
      }),
      this.prisma.membership.count({
        where: { tenant_id: tenantId, branch_id: branchId, created_at: { gte: prevRange.from, lt: from }, previous_membership_id: null },
      }),
      this.prisma.membership.count({
        where: { tenant_id: tenantId, branch_id: branchId, status: 'EXPIRED', end_date: { gte: from, lte: to } },
      }),
      // BR: real-time "hiện tại", không phụ thuộc date range — cùng công thức với getDashboardOverview (không check-in >= 15 ngày kể từ check-in gần nhất hoặc ngày thẻ).
      this.prisma.customer.findMany({
        where: {
          tenant_id: tenantId,
          home_branch_id: branchId,
          status: 'ACTIVE',
          memberships: {
            some: {
              status: 'ACTIVE',
              end_date: { gte: from },
            },
          },
        },
        select: {
          created_at: true,
          memberships: {
            where: { status: 'ACTIVE', end_date: { gte: from } },
            take: 1,
            select: { start_date: true },
          },
          attendances: {
            where: { status: { in: ['CHECKED_IN', 'CHECKED_OUT'] } },
            orderBy: { check_in_at: 'desc' },
            take: 1,
            select: { check_in_at: true },
          },
        },
      }).then((customers) => {
        const nowMs = new Date().getTime();
        return customers.filter((c) => {
          const latestCheckIn = c.attendances[0]?.check_in_at;
          const lastActivityAt = latestCheckIn
            ? new Date(latestCheckIn)
            : c.memberships[0]?.start_date
            ? new Date(c.memberships[0].start_date)
            : new Date(c.created_at);
          const diffDays = Math.floor(Math.max(0, nowMs - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24));
          return diffDays >= 15;
        }).length;
      }),
      this.prisma.ptBooking.findMany({
        where: { tenant_id: tenantId, branch_id: branchId, scheduled_start: { gte: from, lte: to } },
        select: { status: true, pt_user_id: true },
      }),
      this.prisma.ptBooking.count({
        where: { tenant_id: tenantId, branch_id: branchId, scheduled_start: { gte: prevRange.from, lt: from } },
      }),
    ]);

    const grouped = new Map<string, number>();
    for (const p of payments) {
      const date = p.paid_at ?? new Date();
      let key: string;
      if (groupBy === 'week') {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(date.getTime());
        monday.setDate(diff);
        key = monday.toISOString().slice(0, 10);
      } else if (groupBy === 'month') {
        key = date.toISOString().slice(0, 7);
      } else {
        key = date.toISOString().slice(0, 10);
      }
      grouped.set(key, (grouped.get(key) ?? 0) + Number(p.total_amount));
    }
    const trend = Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    const totalRevenue = payments.reduce((s, p) => s + Number(p.total_amount), 0);
    const prevRevenue = Number(prevRevenueAgg._sum.total_amount ?? 0);
    // payments_payment_type_check chỉ cho phép MEMBERSHIP|PT_PACKAGE|GUEST_VISIT|MIXED|OTHER.
    const bySource = {
      membership: payments.filter((p) => p.payment_type === 'MEMBERSHIP').reduce((s, p) => s + Number(p.total_amount), 0),
      pt: payments.filter((p) => p.payment_type === 'PT_PACKAGE').reduce((s, p) => s + Number(p.total_amount), 0),
      guest: payments.filter((p) => p.payment_type === 'GUEST_VISIT').reduce((s, p) => s + Number(p.total_amount), 0),
    };

    const totalPtSessions = ptBookingsInRange.length;
    const completedSessions = ptBookingsInRange.filter((b) => b.status === 'COMPLETED').length;
    const cancelledSessions = ptBookingsInRange.filter((b) => b.status === 'CANCELLED').length;
    const activeTrainersCount = new Set(ptBookingsInRange.map((b) => b.pt_user_id)).size;
    const cancelRate = totalPtSessions > 0 ? Math.round((cancelledSessions / totalPtSessions) * 1000) / 10 : 0;

    return {
      range: { from, to },
      revenue: {
        total: totalRevenue,
        growthPct: this.growthPct(totalRevenue, prevRevenue),
        trend,
        bySource,
      },
      members: {
        newCount,
        renewedCount,
        expiredCount,
        atRiskCount,
        growthPct: this.growthPct(newCount, prevNewCount),
      },
      pt: {
        totalSessions: totalPtSessions,
        completedSessions,
        cancelledSessions,
        cancelRate,
        activeTrainersCount,
        growthPct: this.growthPct(totalPtSessions, prevPtBookingsCount),
      },
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
      include: {
        memberships: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            status: true,
            branch_id: true,
            branch_access_scope_snapshot: true,
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy thông tin hội viên');

    const activeMembership = customer.memberships.find(
      (m) => m.status === 'ACTIVE' || m.status === 'FROZEN',
    );
    if (!activeMembership) {
      const activePtPackage = await this.prisma.customer_pt_packages.findFirst({
        where: {
          tenant_id: tenantId,
          customer_id: dto.customerId,
          status: { in: ['ACTIVE', 'SCHEDULED'] },
        },
      });
      if (activePtPackage) {
        throw new BadRequestException(
          'Khách hàng hiện chỉ có gói PT, chưa đăng ký gói hội viên gym. Bắt buộc phải đăng ký gói hội viên gym mới được check-in.',
        );
      }
      if (customer.memberships.length > 0) {
        throw new BadRequestException(
          'Gói hội viên gym của khách hàng đã hết hạn hoặc không còn hiệu lực. Vui lòng gia hạn gói hội viên để check-in.',
        );
      }
      throw new BadRequestException(
        'Khách hàng chưa đăng ký gói hội viên gym. Vui lòng đăng ký gói hội viên gym để check-in.',
      );
    }

    if (
      activeMembership.branch_access_scope_snapshot === 'HOME_BRANCH' &&
      activeMembership.branch_id !== branchId
    ) {
      throw new ForbiddenException(
        'ACCESS_DENIED: Gói tập của hội viên chỉ áp dụng tại chi nhánh đã đăng ký',
      );
    }

    return this.createCheckInRecord({
      tenantId,
      branchId,
      customerId: dto.customerId,
      method: 'MANUAL',
      checkInBy: user.id,
      membershipId: activeMembership.id,
      note: dto.note,
    });
  }

  /**
   * Shared "create the attendance row" body for both staff-driven manual check-in
   * and the customer's dynamic-QR check-in (`checkInOrOutViaQr`) — auto-checkout-at
   * computation, audit log, and realtime emit stay identical either way.
   */
  private async createCheckInRecord(params: {
    tenantId: string;
    branchId: string;
    customerId: string;
    method: 'MANUAL' | 'QR' | 'FACE';
    checkInBy?: string | null;
    membershipId?: string | null;
    note?: string;
    faceMatchScore?: number;
  }) {
    const checkInAt = new Date();
    const autoCheckoutAt = await this.autoCheckoutPolicy.computeAutoCheckoutAt(
      params.tenantId,
      params.branchId,
      checkInAt,
    );

    let membershipId = params.membershipId ?? null;
    if (!membershipId) {
      const activeMem = await this.prisma.membership.findFirst({
        where: {
          tenant_id: params.tenantId,
          customer_id: params.customerId,
          status: { in: ['ACTIVE', 'SCHEDULED', 'FROZEN'] },
        },
        orderBy: { created_at: 'desc' },
        select: { id: true },
      });
      if (activeMem) membershipId = activeMem.id;
    }

    const attendance = await this.prisma.attendances.create({
      data: {
        tenant_id: params.tenantId,
        branch_id: params.branchId,
        customer_id: params.customerId,
        attendance_type: 'MEMBER',
        membership_id: membershipId,
        check_in_at: checkInAt,
        check_in_method: params.method,
        check_in_by: params.checkInBy ?? null,
        auto_checkout_at: autoCheckoutAt,
        status: 'CHECKED_IN',
        note: params.note,
        face_match_score: params.faceMatchScore ?? null,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId: params.tenantId,
      actorUserId: params.checkInBy ?? null,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'ATTENDANCE',
      entityId: attendance.id,
      action: params.method === 'QR' ? 'QR_CHECKIN' : params.method === 'FACE' ? 'FACE_CHECKIN' : 'MANUAL_CHECKIN',
    });

    this.realtimeGateway.emitToBranch(params.tenantId, params.branchId, 'attendance:updated', { attendanceId: attendance.id });
    this.realtimeGateway.emitToBranch(params.tenantId, params.branchId, 'dashboard:refresh', {});

    return attendance;
  }

  /**
   * Consumes a customer's dynamic QR (see customer.service.ts#getQrToken) at a staff/kiosk
   * scan station. Toggles: checks the member out if they're currently CHECKED_IN, otherwise
   * checks them in — enforcing BR-CUST-002 (HOME_BRANCH-scoped membership can't check in at
   * a different branch) and BR-CUST-004 (token must be fresh and match the customer's current
   * qr_token_version, so an old screenshotted QR can't be replayed).
   */
  async checkInOrOutViaQr(user: RequestUser, dto: QrScanCheckinDto) {
    const tenantId = user.tenantId!;
    const branchId = await this.resolveBranchId(user);

    let claim: QrTokenClaim;
    try {
      claim = await this.jwt.verifyAsync<QrTokenClaim>(dto.token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
    } catch {
      throw new BadRequestException('Mã QR đã hết hạn hoặc không hợp lệ, vui lòng thử lại');
    }

    // Fetch everything the staff-side scan popup / "xem chi tiết" (MemberDetailModal)
    // needs in one round trip — memberships included so BR-CUST-002 below re-uses
    // this same query instead of a second one.
    const customer = await this.prisma.customer.findFirst({
      where: { id: claim.sub, tenant_id: tenantId },
      include: {
        memberships: {
          select: {
            id: true,
            package_name_snapshot: true,
            status: true,
            start_date: true,
            end_date: true,
            branch_id: true,
            branch_access_scope_snapshot: true,
          },
          orderBy: { created_at: 'desc' },
        },
        customer_pt_packages: {
          select: {
            id: true,
            plan_name_snapshot: true,
            pt_name_snapshot: true,
            total_sessions: true,
            used_sessions: true,
            remaining_sessions: true,
            start_date: true,
            expiry_date: true,
            status: true,
          },
          orderBy: { created_at: 'desc' },
        },
      },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy hội viên ứng với mã QR này');
    if (customer.qr_token_version !== claim.v) {
      throw new BadRequestException('Mã QR đã cũ, vui lòng mở lại ứng dụng để lấy mã mới');
    }

    // Same shape as ManagerService.getCustomers()'s list items / what
    // MemberDetailModal.tsx already expects, so the scan popup can pass this straight
    // through to "Xem chi tiết" with no extra fetch.
    const customerDetail = {
      id: customer.id,
      customer_code: customer.customer_code,
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email,
      gender: customer.gender,
      avatar_url: customer.avatar_url,
      status: customer.status,
      date_of_birth: customer.date_of_birth,
      address: customer.address,
      emergency_contact_name: customer.emergency_contact_name,
      emergency_contact_phone: customer.emergency_contact_phone,
      face_consent_at: customer.face_consent_at,
      memberships: customer.memberships,
      customer_pt_packages: customer.customer_pt_packages,
    };

    const existingCheckin = await this.prisma.attendances.findFirst({
      where: { tenant_id: tenantId, customer_id: customer.id, status: 'CHECKED_IN' },
    });

    if (existingCheckin) {
      const updated = await this.prisma.attendances.update({
        where: { id: existingCheckin.id },
        data: {
          status: 'CHECKED_OUT',
          check_out_at: new Date(),
          check_out_method: 'QR',
          check_out_by: user.id,
        },
      });

      await this.syncGuestVisitAfterCheckout(updated, 'COMPLETED');
      await writeAuditLog(this.prisma, {
        tenantId,
        actorUserId: user.id,
        actorRole: ROLE.BRANCH_MANAGER,
        entityType: 'ATTENDANCE',
        entityId: updated.id,
        action: 'QR_CHECKOUT',
      });

      this.realtimeGateway.emitToBranch(tenantId, updated.branch_id, 'attendance:updated', { attendanceId: updated.id });
      this.realtimeGateway.emitToBranch(tenantId, updated.branch_id, 'dashboard:refresh', {});

      return { action: 'CHECKED_OUT' as const, attendance: updated, customer: customerDetail };
    }

    // BR-CUST-002: a HOME_BRANCH-scoped membership can only check in at its own branch.
    const membership = customer.memberships.find((m) => m.status === 'ACTIVE' || m.status === 'FROZEN');
    if (!membership) {
      const activePtPackage = await this.prisma.customer_pt_packages.findFirst({
        where: {
          tenant_id: tenantId,
          customer_id: customer.id,
          status: { in: ['ACTIVE', 'SCHEDULED'] },
        },
      });
      if (activePtPackage) {
        throw new BadRequestException(
          'Khách hàng hiện chỉ có gói PT, chưa đăng ký gói hội viên gym. Bắt buộc phải đăng ký gói hội viên gym mới được check-in.',
        );
      }
      if (customer.memberships.length > 0) {
        throw new BadRequestException(
          'Gói hội viên gym của khách hàng đã hết hạn hoặc không còn hiệu lực. Vui lòng gia hạn gói hội viên để check-in.',
        );
      }
      throw new BadRequestException(
        'Khách hàng chưa đăng ký gói hội viên gym. Vui lòng đăng ký gói hội viên gym để check-in.',
      );
    }
    if (membership.branch_access_scope_snapshot === 'HOME_BRANCH' && membership.branch_id !== branchId) {
      throw new ForbiddenException('ACCESS_DENIED: Gói tập của hội viên chỉ áp dụng tại chi nhánh đã đăng ký');
    }

    const attendance = await this.createCheckInRecord({
      tenantId,
      branchId,
      customerId: customer.id,
      method: 'QR',
      checkInBy: user.id,
      membershipId: membership.id,
    });

    return { action: 'CHECKED_IN' as const, attendance, customer: customerDetail };
  }

  // ─────────────────────────────── Face check-in (backend/docs/face-checkin.md) ───────────

  /**
   * Staff chụp ảnh tại quầy (backend/docs/face-checkin.md §2.2). Descriptor (128 số/ảnh) đã
   * được tính sẵn trên trình duyệt bằng @vladmandic/face-api — backend chỉ validate hình dạng
   * dữ liệu rồi lưu, không xử lý ảnh. Enroll lại (khách đã có hồ sơ ACTIVE) sẽ thu hồi hồ sơ
   * cũ và tạo hồ sơ mới, giữ nguyên `face_embeddings` cũ để audit (không xoá vật lý).
   */
  async enrollFaceProfile(user: RequestUser, customerId: string, dto: EnrollFaceProfileDto, ip?: string) {
    const tenantId = user.tenantId!;

    if (!dto.consentGiven) {
      throw new BadRequestException('Cần được khách hàng đồng ý trước khi đăng ký dữ liệu khuôn mặt');
    }
    if (!Array.isArray(dto.descriptors) || dto.descriptors.length === 0) {
      throw new BadRequestException('Chưa có dữ liệu khuôn mặt nào được chụp');
    }
    if (dto.descriptors.some((d) => !Array.isArray(d) || d.length !== 128)) {
      throw new BadRequestException('Dữ liệu khuôn mặt không hợp lệ');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenant_id: tenantId },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');

    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Thu hồi hồ sơ ACTIVE cũ (nếu có) trước khi tạo hồ sơ mới — cột customer_id chỉ
      // được unique khi status='ACTIVE' (uq_face_profile_active).
      await tx.face_profiles.updateMany({
        where: { tenant_id: tenantId, customer_id: customerId, status: 'ACTIVE' },
        data: { status: 'REVOKED', revoked_at: now },
      });

      const profile = await tx.face_profiles.create({
        data: {
          tenant_id: tenantId,
          customer_id: customerId,
          status: 'ACTIVE',
          provider: '@vladmandic/face-api',
          registered_by: user.id,
          registered_at: now,
        },
      });

      await tx.face_embeddings.createMany({
        data: dto.descriptors.map((descriptor, i) => ({
          face_profile_id: profile.id,
          tenant_id: tenantId,
          // Lưu descriptor toán học (128 số float), KHÔNG lưu ảnh gốc — giảm tối đa dữ liệu
          // sinh trắc học nhạy cảm phải lưu trữ (Nghị định 13/2023/NĐ-CP).
          embedding_raw: Buffer.from(Float32Array.from(descriptor).buffer),
          model_version: 'face_recognition_model_v1',
          quality_score: dto.qualityScores?.[i] ?? null,
        })),
      });

      // Customer.face_consent_at cũng được set bởi luồng khách tự chụp ảnh đại diện qua app
      // (POST /customer/me/face-consent, customer.service.ts#submitFaceConsent) — dùng chung
      // 1 cột vì cùng ý nghĩa "khách đã đồng ý cung cấp dữ liệu khuôn mặt", chỉ khác kênh thu
      // thập. Không ghi đè nếu đã có, để giữ đúng thời điểm đồng ý sớm nhất.
      if (!customer.face_consent_at) {
        await tx.customer.update({
          where: { id: customerId },
          data: { face_consent_at: now, face_consent_ip: ip ?? null },
        });
      }
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'FACE_PROFILE',
      entityId: customerId,
      action: 'FACE_PROFILE_ENROLLED',
      afterData: { descriptorsCount: dto.descriptors.length },
    });

    this.realtimeGateway.emitToBranch(tenantId, await this.resolveBranchId(user), 'face:updated', { customerId });

    return { success: true };
  }

  /** Trạng thái hồ sơ khuôn mặt hiện tại của 1 khách — cho UI enroll (MemberDetailModal) biết có cần chụp lại hay không. */
  async getFaceProfileStatus(user: RequestUser, customerId: string) {
    const tenantId = user.tenantId!;
    const profile = await this.prisma.face_profiles.findFirst({
      where: { tenant_id: tenantId, customer_id: customerId, status: 'ACTIVE' },
      select: { registered_at: true },
    });
    return { active: Boolean(profile), registeredAt: profile?.registered_at ?? null };
  }

  /** Thu hồi hồ sơ khuôn mặt — soft-revoke, giữ lịch sử embeddings để audit. */
  async revokeFaceProfile(user: RequestUser, customerId: string) {
    const tenantId = user.tenantId!;
    const profile = await this.prisma.face_profiles.findFirst({
      where: { tenant_id: tenantId, customer_id: customerId, status: 'ACTIVE' },
    });
    if (!profile) throw new NotFoundException('Khách hàng chưa đăng ký dữ liệu khuôn mặt');

    await this.prisma.face_profiles.update({
      where: { id: profile.id },
      data: { status: 'REVOKED', revoked_at: new Date() },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'FACE_PROFILE',
      entityId: customerId,
      action: 'FACE_PROFILE_REVOKED',
    });

    this.realtimeGateway.emitToBranch(tenantId, await this.resolveBranchId(user), 'face:updated', { customerId });

    return { success: true };
  }

  /**
   * Danh sách descriptor cho kiosk tự tải về và so khớp ngay trên trình duyệt (matching hoàn
   * toàn client-side — backend không bao giờ nhận ảnh/descriptor "lạ" để so, chỉ nhận kết quả
   * cuối cùng qua checkInOrOutViaFace). Chỉ trả khách đang có membership hợp lệ tại chi nhánh,
   * y hệt điều kiện `manualCheckin` — khách hết hạn gói sẽ không còn được kiosk nhận diện.
   */
  async getFaceDescriptors(user: RequestUser, requestedBranchId?: string) {
    const tenantId = user.tenantId!;
    const branchId = await this.resolveBranchId(user, requestedBranchId);

    const profiles = await this.prisma.face_profiles.findMany({
      where: {
        tenant_id: tenantId,
        status: 'ACTIVE',
        customers: {
          status: 'ACTIVE',
          // Chỉ tải descriptor của khách hợp lệ TẠI CHI NHÁNH NÀY — giống điều kiện branch
          // scope thật ở checkInOrOutViaFace/manualCheckin (HOME_BRANCH chỉ check-in được ở
          // đúng chi nhánh đã đăng ký; các scope khác như ALL_BRANCHES thì ở đâu cũng được).
          // Không lọc branch ở đây sẽ tải nhầm descriptor của khách chi nhánh khác về kiosk,
          // vừa sai nguyên tắc thiết kế (chỉ tải dữ liệu sinh trắc học cần thiết), vừa tốn băng thông.
          memberships: {
            some: {
              status: { in: ['ACTIVE', 'FROZEN'] },
              OR: [{ branch_access_scope_snapshot: { not: 'HOME_BRANCH' } }, { branch_id: branchId }],
            },
          },
        },
      },
      select: {
        customer_id: true,
        customers: { select: { full_name: true } },
        face_embeddings: { select: { embedding_raw: true } },
      },
    });

    return {
      customers: profiles
        .filter((p) => p.face_embeddings.length > 0)
        .map((p) => ({
          customerId: p.customer_id,
          fullName: p.customers.full_name,
          descriptors: p.face_embeddings
            .filter((e) => e.embedding_raw)
            .map((e) => {
              // embedding_raw đến từ pg driver dưới dạng Node Buffer, có thể là view lệch
              // offset trên 1 ArrayBuffer dùng chung (pooled) — phải dùng byteOffset/byteLength
              // tường minh, không được đọc thẳng `.buffer` (dễ đọc nhầm sang vùng nhớ khác).
              const buf = Buffer.from(e.embedding_raw!);
              return Array.from(new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4));
            }),
        })),
      branchId,
    };
  }

  /**
   * Kiosk tự nhận diện + so khớp khuôn mặt ngay trên trình duyệt (backend/docs/face-checkin.md
   * §3.3) rồi chỉ gửi customerId + điểm khớp lên đây — khác với QR (chữ ký JWT tự chứng minh
   * danh tính khách), `customerId` ở đây do trình duyệt/kiosk tự claim nên KHÔNG được tin
   * tưởng tuyệt đối: verify lại phải có face_profiles ACTIVE thật cho customer đó trước khi
   * cho check-in, chặn 1 kiosk bị lỗi/giả mạo tự ý gửi customerId bất kỳ. Toggle giống QR: nếu
   * khách đang CHECKED_IN thì đứng trước camera lần nữa nghĩa là muốn check-out.
   */
  async checkInOrOutViaFace(user: RequestUser, dto: FaceCheckinDto) {
    const tenantId = user.tenantId!;
    const branchId = await this.resolveBranchId(user);

    const faceProfile = await this.prisma.face_profiles.findFirst({
      where: { tenant_id: tenantId, customer_id: dto.customerId, status: 'ACTIVE' },
    });
    if (!faceProfile) {
      await this.prisma.access_denied_logs.create({
        data: {
          tenant_id: tenantId,
          branch_id: branchId,
          customer_id: dto.customerId,
          method: 'FACE',
          reason_code: 'NO_FACE_PROFILE',
          detail: { matchScore: dto.matchScore },
        },
      });
      throw new BadRequestException('Không tìm thấy hồ sơ khuôn mặt hợp lệ cho khách hàng này');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenant_id: tenantId },
      include: {
        memberships: {
          orderBy: { created_at: 'desc' },
          select: { id: true, status: true, branch_id: true, branch_access_scope_snapshot: true },
        },
      },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy thông tin hội viên');

    const existingCheckin = await this.prisma.attendances.findFirst({
      where: { tenant_id: tenantId, customer_id: customer.id, status: 'CHECKED_IN' },
    });

    if (existingCheckin) {
      const updated = await this.prisma.attendances.update({
        where: { id: existingCheckin.id },
        data: {
          status: 'CHECKED_OUT',
          check_out_at: new Date(),
          check_out_method: 'FACE',
          check_out_by: user.id,
        },
      });

      await this.syncGuestVisitAfterCheckout(updated, 'COMPLETED');
      await writeAuditLog(this.prisma, {
        tenantId,
        actorUserId: user.id,
        actorRole: ROLE.BRANCH_MANAGER,
        entityType: 'ATTENDANCE',
        entityId: updated.id,
        action: 'FACE_CHECKOUT',
      });

      this.realtimeGateway.emitToBranch(tenantId, updated.branch_id, 'attendance:updated', { attendanceId: updated.id });
      this.realtimeGateway.emitToBranch(tenantId, updated.branch_id, 'dashboard:refresh', {});

      return { action: 'CHECKED_OUT' as const, attendance: updated, customerName: customer.full_name };
    }

    const membership = customer.memberships.find((m) => m.status === 'ACTIVE' || m.status === 'FROZEN');
    if (!membership) {
      await this.prisma.access_denied_logs.create({
        data: {
          tenant_id: tenantId,
          branch_id: branchId,
          customer_id: customer.id,
          method: 'FACE',
          reason_code: 'MEMBERSHIP_EXPIRED',
          detail: { matchScore: dto.matchScore },
        },
      });
      throw new BadRequestException('Gói hội viên gym đã hết hạn hoặc chưa đăng ký. Vui lòng ra quầy lễ tân.');
    }
    if (membership.branch_access_scope_snapshot === 'HOME_BRANCH' && membership.branch_id !== branchId) {
      await this.prisma.access_denied_logs.create({
        data: {
          tenant_id: tenantId,
          branch_id: branchId,
          customer_id: customer.id,
          method: 'FACE',
          reason_code: 'WRONG_BRANCH',
          detail: { matchScore: dto.matchScore },
        },
      });
      throw new ForbiddenException('ACCESS_DENIED: Gói tập của hội viên chỉ áp dụng tại chi nhánh đã đăng ký');
    }

    const attendance = await this.createCheckInRecord({
      tenantId,
      branchId,
      customerId: customer.id,
      method: 'FACE',
      checkInBy: user.id,
      membershipId: membership.id,
      faceMatchScore: dto.matchScore,
    });

    return { action: 'CHECKED_IN' as const, attendance, customerName: customer.full_name };
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

    await this.syncGuestVisitAfterCheckout(updated, 'COMPLETED');

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

  /**
   * A guest's visit is a separate record (guest_visits) from its attendance — checking out
   * (or undoing) the attendance must also close out the linked visit, or Guest Visits keeps
   * showing them as still checked in forever. Shared by manualCheckout, undoCheckin, and the
   * auto-checkout sweep (AutoCheckoutSchedulerService).
   */
  private async syncGuestVisitAfterCheckout(
    attendance: { attendance_type: string; guest_visit_id: string | null; tenant_id: string; branch_id: string },
    targetStatus: 'COMPLETED' | 'CANCELLED',
  ) {
    if (attendance.attendance_type !== 'GUEST' || !attendance.guest_visit_id) return;

    await this.prisma.guest_visits.updateMany({
      where: { id: attendance.guest_visit_id, status: { in: ['ACTIVE', 'ON_HOLD'] } },
      data: {
        status: targetStatus,
        ...(targetStatus === 'COMPLETED' ? { completed_at: new Date() } : {}),
      },
    });
    this.realtimeGateway.emitToBranch(attendance.tenant_id, attendance.branch_id, 'guestvisit:updated', {
      guestVisitId: attendance.guest_visit_id,
    });
  }

  /**
   * Auto-checks-out one CHECKED_IN attendance whose auto_checkout_at has passed. Called by
   * AutoCheckoutSchedulerService's periodic sweep — see backend/src/auto-checkout/. Silently
   * no-ops if the attendance was already handled (manually checked out/undone) since the sweep
   * queried it, avoiding a race with a staff action happening at the same moment.
   */
  async autoCheckoutAttendance(attendanceId: string): Promise<void> {
    const attendance = await this.prisma.attendances.findUnique({ where: { id: attendanceId } });
    if (!attendance || attendance.status !== 'CHECKED_IN') return;

    const updated = await this.prisma.attendances.update({
      where: { id: attendanceId },
      data: {
        status: 'CHECKED_OUT',
        check_out_at: new Date(),
        check_out_method: 'AUTO',
      },
    });

    await this.syncGuestVisitAfterCheckout(updated, 'COMPLETED');

    await writeAuditLog(this.prisma, {
      tenantId: updated.tenant_id,
      actorUserId: null,
      actorRole: 'SYSTEM',
      entityType: 'ATTENDANCE',
      entityId: updated.id,
      action: 'AUTO_CHECKOUT',
    });

    this.realtimeGateway.emitToBranch(updated.tenant_id, updated.branch_id, 'attendance:updated', { attendanceId: updated.id });
    this.realtimeGateway.emitToBranch(updated.tenant_id, updated.branch_id, 'dashboard:refresh', {});

    // Doc §2.4 "Nhận thông báo tự động khi Auto Check-out" — only fires when the
    // customer actually has a Customer Portal account (user_id set).
    const customer = await this.prisma.customer.findUnique({
      where: { id: updated.customer_id },
      select: { user_id: true },
    });
    if (customer?.user_id) {
      await this.notifications.notifyCustomerUser({
        tenantId: updated.tenant_id,
        recipientUserId: customer.user_id,
        eventCode: 'AUTO_CHECKOUT',
        entityId: updated.id,
        title: 'Bạn đã được tự động check-out',
        body: 'Hệ thống đã tự động check-out cho bạn theo chính sách của phòng tập.',
        targetPath: '/attendance',
      });
    }
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

    await this.syncGuestVisitAfterCheckout(updated, 'CANCELLED');

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
              start_date: true,
              end_date: true,
            },
          },
          customer_pt_packages: {
            select: {
              id: true,
              plan_name_snapshot: true,
              pt_name_snapshot: true,
              total_sessions: true,
              used_sessions: true,
              remaining_sessions: true,
              start_date: true,
              expiry_date: true,
              status: true,
            },
            orderBy: { created_at: 'desc' },
          },
          attendances: {
            where: {
              status: { not: 'CANCELLED' },
            },
            select: {
              id: true,
              check_in_at: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    const mappedItems = items.map((c) => {
      const activeCheckins = c.attendances.filter((a) => a.status === 'CHECKED_IN');
      const uniqueDays = new Set(
        c.attendances.map((a) => a.check_in_at.toISOString().slice(0, 10)),
      ).size;

      return {
        id: c.id,
        customer_code: c.customer_code,
        full_name: c.full_name,
        phone: c.phone,
        email: c.email,
        status: c.status,
        avatar_url: c.avatar_url,
        created_at: c.created_at,
        qr_token: c.qr_token,
        memberships: c.memberships,
        customer_pt_packages: c.customer_pt_packages,
        gym_attendance_days: uniqueDays,
        attendances: activeCheckins,
      };
    });

    return {
      items: mappedItems,
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
    const isOwner = user.roles?.includes(ROLE.OWNER) || user.roles?.includes('OWNER');

    if (isOwner) {
      // Owner view: ONLY show logs of Managers (BRANCH_MANAGER or MANAGER)
      const rows = await this.prisma.auditLog.findMany({
        where: {
          tenant_id: user.tenantId!,
          actor_role: { in: [ROLE.BRANCH_MANAGER, 'BRANCH_MANAGER', 'MANAGER'] },
        },
        take: 50,
        orderBy: { occurred_at: 'desc' },
      });

      return rows.map((row) => ({ ...row, id: row.id.toString() }));
    }

    // Branch Manager view: ONLY show logs of users assigned to this branch,
    // excluding OWNER or SUPER_ADMIN actions.
    const branchId = await this.resolveBranchId(user);

    const branchUserAssignments = await this.prisma.user_branches.findMany({
      where: { branch_id: branchId },
      select: { user_id: true },
    });

    const branchUserIds = Array.from(
      new Set([...branchUserAssignments.map((a) => a.user_id), user.id]),
    );

    const rows = await this.prisma.auditLog.findMany({
      where: {
        tenant_id: user.tenantId!,
        actor_user_id: { in: branchUserIds },
        actor_role: { notIn: [ROLE.OWNER, 'OWNER', 'SUPER_ADMIN'] },
      },
      take: 50,
      orderBy: { occurred_at: 'desc' },
    });

    return rows.map((row) => ({ ...row, id: row.id.toString() }));
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

    if (dto.email) {
      const existingEmailCustomer = await this.prisma.customer.findFirst({
        where: { tenant_id: tenantId, email: { equals: dto.email, mode: 'insensitive' } },
      });
      if (existingEmailCustomer) {
        throw new BadRequestException('Email này đã được đăng ký hội viên');
      }
    }

    // Check if phone or email belongs to an existing Staff/PT/Manager/Owner user account
    const existingStaffPhone = await this.prisma.user.findFirst({
      where: { tenant_id: tenantId, phone: dto.phone },
    });
    if (existingStaffPhone) {
      throw new BadRequestException('Số điện thoại này thuộc về tài khoản Nhân sự / PT của phòng tập, không thể đăng ký thành Khách hàng');
    }

    if (dto.email) {
      const existingStaffEmail = await this.prisma.user.findFirst({
        where: { email: { equals: dto.email, mode: 'insensitive' } },
      });
      if (existingStaffEmail) {
        throw new BadRequestException('Email này thuộc về tài khoản Nhân sự / PT của phòng tập, không thể đăng ký thành Khách hàng');
      }
    }

    const customerCode = `KH-${Math.floor(100000 + Math.random() * 900000)}`;

    let createdUserId: string | null = null;
    let tempPassword: string | null = null;

    if (dto.email && dto.email.trim()) {
      tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const roleRecord = await this.prisma.roles.findUnique({
        where: { code: 'CUSTOMER' },
      });

      const newUser = await this.prisma.user.create({
        data: {
          tenant_id: tenantId,
          user_type: 'CUSTOMER',
          email: dto.email.trim(),
          phone: dto.phone || null,
          password_hash: passwordHash,
          full_name: dto.fullName,
          gender: dto.gender || 'MALE',
          status: 'ACTIVE',
          must_change_password: true,
        },
      });
      createdUserId = newUser.id;

      if (roleRecord) {
        await this.prisma.user_roles.create({
          data: {
            user_id: newUser.id,
            role_id: roleRecord.id,
            tenant_id: tenantId,
          },
        });
      }
    }

    const customer = await this.prisma.customer.create({
      data: {
        tenant_id: tenantId,
        user_id: createdUserId,
        home_branch_id: branchId,
        customer_code: customerCode,
        full_name: dto.fullName,
        phone: dto.phone,
        email: dto.email || null,
        gender: dto.gender || null,
        status: 'ACTIVE',
      },
    });

    if (dto.email && dto.email.trim() && tempPassword) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, legal_name: true },
      });
      const tenantName = tenant?.name || tenant?.legal_name || 'FitFlow';

      await this.mailService.sendCustomerAccountCredentialsEmail(
        dto.email.trim(),
        dto.fullName,
        tenantName,
        tempPassword,
      );
    }

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

  async resetCustomerPassword(user: RequestUser, customerId: string) {
    const tenantId = user.tenantId!;
    const customer = await this.prisma.customer.findFirst({
      where: { tenant_id: tenantId, id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin hội viên');
    }
    if (!customer.email || !customer.email.trim()) {
      throw new BadRequestException('Hội viên chưa có thông tin Email. Vui lòng cập nhật Email cho hội viên trước khi cấp lại mật khẩu.');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    let userId = customer.user_id;

    if (!userId) {
      const existingUser = await this.prisma.user.findFirst({
        where: { email: { equals: customer.email.trim(), mode: 'insensitive' } },
      });
      if (existingUser) {
        userId = existingUser.id;
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            password_hash: passwordHash,
            must_change_password: true,
            status: 'ACTIVE',
          },
        });
      } else {
        const role = await this.prisma.roles.findUnique({
          where: { code: 'CUSTOMER' },
        });
        const newUser = await this.prisma.user.create({
          data: {
            tenant_id: tenantId,
            user_type: 'CUSTOMER',
            email: customer.email.trim(),
            phone: customer.phone || null,
            password_hash: passwordHash,
            full_name: customer.full_name,
            gender: customer.gender || 'MALE',
            status: 'ACTIVE',
            must_change_password: true,
          },
        });
        if (role) {
          await this.prisma.user_roles.create({
            data: {
              user_id: newUser.id,
              role_id: role.id,
              tenant_id: tenantId,
            },
          });
        }
        userId = newUser.id;
      }
      await this.prisma.customer.update({
        where: { id: customer.id },
        data: { user_id: userId },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password_hash: passwordHash,
          must_change_password: true,
        },
      });
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, legal_name: true },
    });
    const tenantName = tenant?.name || tenant?.legal_name || 'FitFlow';

    await this.mailService.sendCustomerPasswordResetEmail(
      customer.email.trim(),
      customer.full_name,
      tenantName,
      tempPassword,
    );

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: user.id,
      actorRole: ROLE.BRANCH_MANAGER,
      entityType: 'CUSTOMER',
      entityId: customer.id,
      action: 'RESET_CUSTOMER_PASSWORD',
    });

    return {
      success: true,
      message: `Đã cấp lại mật khẩu tạm thời thành công! Mật khẩu mới đã được tự động gửi tới Gmail ${customer.email}.`,
    };
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

    const [branchName, customer] = await Promise.all([
      this.getBranchName(branchId),
      this.prisma.customer.findUnique({ where: { id: dto.customerId }, select: { full_name: true, phone: true } }),
    ]);
    await this.notifications.notifyOnce({
      tenantId,
      branchId,
      branchName,
      eventCode: 'PAYMENT_CONFIRMED',
      entityId: payment.id,
      title: `Thanh toán ${formatVnd(Number(dto.amount))} từ ${customer?.full_name ?? 'khách hàng'} đã được xác nhận`,
      body: `${dto.title || 'Thanh toán nhanh'}.`,
      targetPath: '/customers',
      extraPayload: {
        items: [
          {
            id: payment.id,
            customerName: customer?.full_name ?? 'Khách hàng',
            customerPhone: customer?.phone ?? null,
            amount: Number(dto.amount),
            method: payment.method,
          },
        ],
      },
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

    // Check if email is used by a Customer
    const existingCustomerEmail = await this.prisma.customer.findFirst({
      where: { tenant_id: tenantId, email: { equals: dto.email, mode: 'insensitive' } },
    });
    if (existingCustomerEmail) {
      throw new BadRequestException('Email này đã được sử dụng bởi một Khách hàng / Hội viên phòng tập');
    }

    // Check duplicate phone if provided
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { tenant_id: tenantId, phone: dto.phone },
      });
      if (existingPhone) {
        throw new BadRequestException('Số điện thoại này đã được sử dụng trong doanh nghiệp');
      }

      const existingCustomerPhone = await this.prisma.customer.findFirst({
        where: { tenant_id: tenantId, phone: dto.phone },
      });
      if (existingCustomerPhone) {
        throw new BadRequestException('Số điện thoại này đã được sử dụng bởi một Khách hàng / Hội viên phòng tập');
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

    const rawPassword = dto.defaultPassword && dto.defaultPassword.trim() ? dto.defaultPassword.trim() : generateTempPassword();
    const passwordHash = await bcrypt.hash(rawPassword, 10);

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

    // Send high-end luxury credentials email to customer
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, legal_name: true },
    });
    const tenantName = tenant?.name || tenant?.legal_name || 'FitFlow';

    await this.mailService.sendCustomerAccountCredentialsEmail(
      dto.email,
      dto.fullName,
      tenantName,
      rawPassword,
    );

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
      const payment = await tx.payment.create({
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

      return { membership, payment };
    }).then(async ({ membership, payment }) => {
      const branchName = await this.getBranchName(branchId);
      const detailItem = {
        id: membership.id,
        customerName: customer.full_name,
        customerPhone: customer.phone,
        amount: Number(pkg.base_price),
        method: payment.method,
        packageName: pkg.name,
        endDate: membership.end_date.toISOString(),
      };
      await this.notifications.notifyOnce({
        tenantId,
        branchId,
        branchName,
        eventCode: 'MEMBERSHIP_SOLD',
        entityId: membership.id,
        title: `${customer.full_name} vừa đăng ký gói ${pkg.name}`,
        body: `${formatVnd(Number(pkg.base_price))}.`,
        targetPath: '/memberships',
        extraPayload: { items: [detailItem] },
      });
      await this.notifications.notifyOnce({
        tenantId,
        branchId,
        branchName,
        eventCode: 'PAYMENT_CONFIRMED',
        entityId: payment.id,
        title: `Thanh toán ${formatVnd(Number(pkg.base_price))} từ ${customer.full_name} đã được xác nhận`,
        body: `Gói tập ${pkg.name}.`,
        targetPath: '/memberships',
        extraPayload: { items: [{ ...detailItem, id: payment.id }] },
      });
      return membership;
    });
  }

  async cancelCustomerMembership(
    user: RequestUser,
    customerId: string,
    dto?: { membershipId?: string; reason?: string },
  ) {
    const tenantId = user.tenantId!;
    const branchId = await this.resolveBranchId(user);

    const customer = await this.prisma.customer.findFirst({
      where: { tenant_id: tenantId, id: customerId },
    });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy hội viên.');
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        tenant_id: tenantId,
        customer_id: customerId,
        ...(dto?.membershipId ? { id: dto.membershipId } : { status: { in: ['ACTIVE', 'FROZEN', 'SCHEDULED'] } }),
      },
    });

    if (!membership) {
      throw new NotFoundException('Hội viên không có gói tập nào đang có hiệu lực để gỡ.');
    }

    await this.prisma.membership.update({
      where: { id: membership.id },
      data: {
        status: 'CANCELLED',
      },
    });

    this.realtimeGateway.emitToBranch(tenantId, branchId, 'dashboard:refresh', {});

    return {
      success: true,
      message: `Đã gỡ thành công gói tập ${membership.package_name_snapshot} của hội viên ${customer.full_name}.`,
    };
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

    {
      const branchName = await this.getBranchName(branchId);
      const detailItem = {
        id: result.visit.id,
        customerName: customer.full_name,
        customerPhone: customer.phone,
        amount: Number(pkg.base_price),
        method: result.payment.method,
        packageName: pkg.name,
      };
      await this.notifications.notifyOnce({
        tenantId,
        branchId,
        branchName,
        eventCode: 'GUEST_VISIT_CREATED',
        entityId: result.visit.id,
        title: `Khách vãng lai ${customer.full_name} vừa đăng ký vé lượt`,
        body: `${pkg.name}.`,
        targetPath: '/guest-visits',
        extraPayload: { items: [detailItem] },
      });
      await this.notifications.notifyOnce({
        tenantId,
        branchId,
        branchName,
        eventCode: 'PAYMENT_CONFIRMED',
        entityId: result.payment.id,
        title: `Thanh toán ${formatVnd(Number(pkg.base_price))} từ ${customer.full_name} đã được xác nhận`,
        body: `Vé lượt ${pkg.name}.`,
        targetPath: '/guest-visits',
        extraPayload: { items: [{ ...detailItem, id: result.payment.id }] },
      });
    }

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

    // 3. Verify active gym membership exists before assigning PT package
    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        tenant_id: tenantId,
        customer_id: dto.customerId,
        status: { in: ['ACTIVE', 'FROZEN'] },
      },
    });
    if (!activeMembership) {
      throw new BadRequestException(
        'Khách hàng cần phải đăng ký gói hội viên gym trước khi đăng ký gói tập PT.',
      );
    }

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
    }).then(async (result) => {
      const branchName = await this.getBranchName(branchId);
      await this.notifications.notifyOnce({
        tenantId,
        branchId,
        branchName,
        eventCode: 'PAYMENT_CONFIRMED',
        entityId: result.payment.id,
        title: `Thanh toán ${formatVnd(Number(plan.price))} từ ${customer.full_name} đã được xác nhận`,
        body: `Gói PT ${plan.name}.`,
        targetPath: '/pt',
        extraPayload: {
          items: [
            {
              id: result.payment.id,
              customerName: customer.full_name,
              customerPhone: customer.phone,
              amount: Number(plan.price),
              method: result.payment.method,
              packageName: plan.name,
            },
          ],
        },
      });
      return result;
    });
  }
}
