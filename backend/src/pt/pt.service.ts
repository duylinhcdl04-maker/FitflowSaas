import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ConfirmBookingDto,
  RejectBookingDto,
  CompleteSessionDto,
  CreateWorkoutLogDto,
  CreatePtPackagePlanDto,
  UpdatePtProfileDto,
  UpdateWorkingHoursDto,
  CreatePtBookingByPtDto,
  MarkNoShowDto,
} from './dto/pt.dto';

function formatBookingTime(d: Date): string {
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

@Injectable()
export class PtService {
  constructor(
    private prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Best-effort — a customer without a Customer Portal account (no linked User row)
   * simply gets no push, same "only if user_id is set" guard used for AUTO_CHECKOUT
   * (manager.service.ts#autoCheckoutAttendance). */
  private async notifyCustomerOfBooking(
    tenantId: string,
    customerId: string,
    input: {
      eventCode: string;
      entityId: string;
      title: string;
      body: string;
      targetPath: string;
    },
  ) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { user_id: true },
    });
    if (!customer?.user_id) return;
    await this.notifications.notifyCustomerUser({
      tenantId,
      recipientUserId: customer.user_id,
      ...input,
    });
  }

  private getTenantId(user: any): string {
    const tenantId = user.tenantId || user.tenant_id;
    if (!tenantId) {
      throw new BadRequestException(
        'Không tìm thấy thông tin doanh nghiệp (tenant_id) của tài khoản người dùng.',
      );
    }
    return tenantId;
  }

  private async ensurePtProfile(tenantId: string, ptUserId: string) {
    const existing = await this.prisma.ptProfile.findUnique({
      where: { user_id: ptUserId },
    });
    if (!existing) {
      const employeeCode = `PT-${Math.floor(10000 + Math.random() * 90000)}`;
      await this.prisma.ptProfile.create({
        data: {
          user_id: ptUserId,
          tenant_id: tenantId,
          employee_code: employeeCode,
        },
      });
    }
  }

  private async getPtUserBranch(user: any) {
    const tenantId = this.getTenantId(user);
    const userBranch = await this.prisma.user_branches.findFirst({
      where: { user_id: user.id, tenant_id: tenantId },
      orderBy: { is_primary: 'desc' },
    });
    if (userBranch?.branch_id) return userBranch.branch_id;
    if (user.branch_id || user.branchId) return user.branch_id || user.branchId;

    const firstBranch = await this.prisma.branch.findFirst({
      where: { tenant_id: tenantId, status: 'ACTIVE' },
      select: { id: true },
    });
    return firstBranch?.id || null;
  }

  async getDashboardOverview(user: any) {
    const ptUserId = user.id;
    const tenantId = this.getTenantId(user);
    const now = new Date();

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
    );

    // 1. Today's bookings (active / non-cancelled)
    const todayBookings = await this.prisma.ptBooking.findMany({
      where: {
        tenant_id: tenantId,
        pt_user_id: ptUserId,
        scheduled_start: { gte: startOfDay, lte: endOfDay },
        status: { not: 'CANCELLED' },
      },
      include: {
        customers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            avatar_url: true,
          },
        },
        customer_pt_packages: true,
      },
      orderBy: { scheduled_start: 'asc' },
    });

    // 2. Next Session
    const nextSession = await this.prisma.ptBooking.findFirst({
      where: {
        tenant_id: tenantId,
        pt_user_id: ptUserId,
        scheduled_start: { gte: now },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'PENDING'] },
      },
      include: {
        customers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            avatar_url: true,
          },
        },
        customer_pt_packages: true,
      },
      orderBy: { scheduled_start: 'asc' },
    });

    // 3. Pending bookings count
    const pendingBookingsCount = await this.prisma.ptBooking.count({
      where: {
        tenant_id: tenantId,
        pt_user_id: ptUserId,
        status: 'PENDING',
      },
    });

    // 4. Low session clients (remaining_sessions <= 2)
    const lowSessionClients = await this.prisma.customer_pt_packages.findMany({
      where: {
        tenant_id: tenantId,
        pt_user_id: ptUserId,
        status: 'ACTIVE',
        remaining_sessions: { lte: 2 },
      },
      include: {
        customers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
          },
        },
      },
    });

    return {
      todaySessionsCount: todayBookings.length,
      nextSession,
      pendingBookingsCount,
      lowSessionClientsCount: lowSessionClients.length,
      lowSessionClients,
      todaySessionsList: todayBookings,
    };
  }

  async getSchedule(user: any, startDate?: string, endDate?: string) {
    const ptUserId = user.id;
    const tenantId = this.getTenantId(user);

    let dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter = {
        scheduled_start: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }

    const bookings = await this.prisma.ptBooking.findMany({
      where: {
        tenant_id: tenantId,
        pt_user_id: ptUserId,
        ...dateFilter,
      },
      include: {
        customers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            avatar_url: true,
          },
        },
        customer_pt_packages: {
          select: {
            id: true,
            plan_name_snapshot: true,
            total_sessions: true,
            used_sessions: true,
            remaining_sessions: true,
          },
        },
      },
      orderBy: { scheduled_start: 'asc' },
    });

    return bookings;
  }

  async confirmBooking(user: any, dto: ConfirmBookingDto) {
    const tenantId = this.getTenantId(user);
    const booking = await this.prisma.ptBooking.findFirst({
      where: { id: dto.bookingId, tenant_id: tenantId, pt_user_id: user.id },
    });

    if (!booking) {
      throw new NotFoundException(
        'Không tìm thấy lịch hẹn hoặc bạn không có quyền xác nhận',
      );
    }

    const updated = await this.prisma.ptBooking.update({
      where: { id: dto.bookingId },
      data: { status: 'SCHEDULED' },
    });

    await this.notifyCustomerOfBooking(tenantId, updated.customer_id, {
      eventCode: 'PT_BOOKING_CONFIRMED',
      entityId: updated.id,
      title: 'PT đã xác nhận lịch hẹn của bạn',
      body: `Buổi tập lúc ${formatBookingTime(updated.scheduled_start)} đã được xác nhận.`,
      targetPath: '/pt',
    });

    return updated;
  }

  async rejectBooking(user: any, dto: RejectBookingDto) {
    const tenantId = this.getTenantId(user);
    const booking = await this.prisma.ptBooking.findFirst({
      where: { id: dto.bookingId, tenant_id: tenantId, pt_user_id: user.id },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    // Doc's requirement: if the PT doesn't confirm, the reason must be recorded — falls back
    // to a default note rather than leaving cancel_reason blank when the PT skips the field.
    const reason = dto.reason || 'PT bận ca làm việc';

    const updated = await this.prisma.ptBooking.update({
      where: { id: dto.bookingId },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by: user.id,
        cancel_reason: reason,
      },
    });

    await this.notifyCustomerOfBooking(tenantId, updated.customer_id, {
      eventCode: 'PT_BOOKING_REJECTED',
      entityId: updated.id,
      title: 'PT không thể nhận lịch hẹn này',
      body: `Buổi tập lúc ${formatBookingTime(updated.scheduled_start)} đã bị từ chối. Lý do: ${reason}`,
      targetPath: '/pt',
    });

    return updated;
  }

  // BR-PT-002: Session Deduction Trigger — Only deduct when status is COMPLETED
  async completeSession(user: any, dto: CompleteSessionDto) {
    const tenantId = this.getTenantId(user);
    const booking = await this.prisma.ptBooking.findFirst({
      where: { id: dto.bookingId, tenant_id: tenantId, pt_user_id: user.id },
      include: { customer_pt_packages: true },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    if (booking.status === 'COMPLETED') {
      throw new BadRequestException(
        'Buổi tập này đã được đánh dấu hoàn thành trước đó',
      );
    }

    const pkg = booking.customer_pt_packages;
    if (!pkg) {
      throw new BadRequestException('Gói PT của học viên không hợp lệ');
    }

    // BR-PT-REL-006: No Future Completion — Chặn xác nhận hoàn thành trước thời gian bắt đầu dự kiến (cho phép tối đa 30 phút trước giờ tập)
    const earlyWindowMs = 30 * 60 * 1000;
    if (
      new Date().getTime() <
      new Date(booking.scheduled_start).getTime() - earlyWindowMs
    ) {
      throw new BadRequestException(
        'Buổi tập chưa đến thời gian diễn ra. Không thể xác nhận hoàn thành trước thời hạn!',
      );
    }

    // BR-PT-REL-002: Valid Membership for PT Session — Hội viên phải có thẻ Gym đang hoạt động tại thời điểm tập PT
    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        tenant_id: tenantId,
        customer_id: booking.customer_id,
        status: 'ACTIVE',
        end_date: { gte: new Date() },
      },
    });

    if (!activeMembership) {
      throw new BadRequestException(
        'Hội viên chưa có thẻ tập Gym (Membership) đang hoạt động hoặc thẻ đã hết hạn. Không thể hoàn thành buổi tập PT!',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark booking as COMPLETED
      const updatedBooking = await tx.ptBooking.update({
        where: { id: dto.bookingId },
        data: {
          status: 'COMPLETED',
          completed_at: new Date(),
          completed_by: user.id,
          session_note: dto.sessionNote,
        },
      });

      // 2. Sync used_sessions & remaining_sessions with actual COMPLETED PtBookings count
      const completedCount = await tx.ptBooking.count({
        where: {
          tenant_id: tenantId,
          customer_pt_package_id: pkg.id,
          status: 'COMPLETED',
        },
      });

      const newUsed = completedCount;
      const newRemaining = Math.max(0, pkg.total_sessions - completedCount);
      const newStatus = newRemaining <= 0 ? 'COMPLETED' : pkg.status;

      await tx.customer_pt_packages.update({
        where: { id: pkg.id },
        data: {
          used_sessions: newUsed,
          remaining_sessions: newRemaining,
          status: newStatus,
          completed_at: newRemaining <= 0 ? new Date() : pkg.completed_at,
        },
      });

      // 3. Create session log
      await tx.pt_session_logs.create({
        data: {
          tenant_id: tenantId,
          customer_pt_package_id: pkg.id,
          booking_id: booking.id,
          delta: -1,
          reason: 'SESSION_COMPLETED',
          note: dto.sessionNote || 'PT xác nhận hoàn thành buổi dạy',
          created_by: user.id,
        },
      });

      return {
        booking: updatedBooking,
        remaining_sessions: newRemaining,
        used_sessions: newUsed,
      };
    });
  }

  async markNoShow(user: any, dto: MarkNoShowDto) {
    const tenantId = this.getTenantId(user);
    const booking = await this.prisma.ptBooking.findFirst({
      where: { id: dto.bookingId, tenant_id: tenantId, pt_user_id: user.id },
    });
    if (!booking) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }
    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Lịch hẹn này đã hoàn thành, không thể báo vắng mặt');
    }

    const updated = await this.prisma.ptBooking.update({
      where: { id: dto.bookingId },
      data: {
        status: 'NO_SHOW',
        session_note: dto.reason || booking.session_note || 'Học viên không đến ca dạy',
      },
    });

    await this.notifyCustomerOfBooking(tenantId, updated.customer_id, {
      eventCode: 'PT_BOOKING_NO_SHOW',
      entityId: updated.id,
      title: 'Xác nhận vắng mặt ca tập PT',
      body: `Ca tập lúc ${formatBookingTime(updated.scheduled_start)} đã được ghi nhận vắng mặt.`,
      targetPath: '/pt',
    });

    return updated;
  }

  async createBookingForCustomer(user: any, dto: CreatePtBookingByPtDto) {
    const tenantId = this.getTenantId(user);
    await this.ensurePtProfile(tenantId, user.id);

    const branchId = await this.getPtUserBranch(user);
    if (!branchId) {
      throw new BadRequestException('Không tìm thấy chi nhánh làm việc của PT');
    }

    const pkg = await this.prisma.customer_pt_packages.findFirst({
      where: {
        id: dto.customerPtPackageId,
        tenant_id: tenantId,
        pt_user_id: user.id,
        customer_id: dto.customerId,
        status: 'ACTIVE',
      },
    });

    if (!pkg) {
      throw new BadRequestException('Gói PT của học viên không hợp lệ hoặc đã hết hạn/không phải do bạn phụ trách');
    }

    if (pkg.expiry_date && new Date() > new Date(pkg.expiry_date)) {
      throw new BadRequestException('Gói PT của học viên đã hết hạn sử dụng');
    }

    // BR-PTB-001: Active Membership check
    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        tenant_id: tenantId,
        customer_id: dto.customerId,
        status: 'ACTIVE',
      },
    });
    if (!activeMembership) {
      throw new BadRequestException('Học viên chưa có thẻ Membership Gym đang hoạt động để đặt lịch PT');
    }

    // BR-PTB-006: Session capacity check
    const reservedBookingsCount = await this.prisma.ptBooking.count({
      where: {
        tenant_id: tenantId,
        customer_pt_package_id: pkg.id,
        status: { in: ['PENDING', 'CONFIRMED', 'SCHEDULED'] },
      },
    });
    const completedCount = pkg.used_sessions ?? 0;
    const availableToBook = pkg.total_sessions - completedCount - reservedBookingsCount;
    if (availableToBook <= 0) {
      throw new BadRequestException(
        `Học viên đã giữ chỗ hết số buổi của gói PT (${pkg.total_sessions} buổi: ${completedCount} đã hoàn thành, ${reservedBookingsCount} đang xếp lịch).`,
      );
    }

    const scheduledStart = new Date(dto.scheduledStart);
    const scheduledEnd = new Date(dto.scheduledEnd);
    if (Number.isNaN(scheduledStart.getTime()) || Number.isNaN(scheduledEnd.getTime()) || scheduledStart >= scheduledEnd) {
      throw new BadRequestException('Thời gian bắt đầu và kết thúc không hợp lệ');
    }
    if (scheduledStart < new Date()) {
      throw new BadRequestException('Không thể đặt lịch tập trong quá khứ');
    }

    // BR-PTB-004 & BR-PTB-014: Overlap checks
    const ptConflict = await this.prisma.ptBooking.findFirst({
      where: {
        tenant_id: tenantId,
        pt_user_id: user.id,
        status: { in: ['PENDING', 'CONFIRMED', 'SCHEDULED'] },
        scheduled_start: { lt: scheduledEnd },
        scheduled_end: { gt: scheduledStart },
      },
    });
    if (ptConflict) {
      throw new BadRequestException('Bạn đã có một ca dạy khác trùng với khung giờ này');
    }

    const customerConflict = await this.prisma.ptBooking.findFirst({
      where: {
        tenant_id: tenantId,
        customer_id: dto.customerId,
        status: { in: ['PENDING', 'CONFIRMED', 'SCHEDULED'] },
        scheduled_start: { lt: scheduledEnd },
        scheduled_end: { gt: scheduledStart },
      },
    });
    if (customerConflict) {
      throw new BadRequestException('Học viên đã có một ca tập PT khác trùng khung giờ này');
    }

    // PT-initiated booking is created directly as SCHEDULED
    const booking = await this.prisma.ptBooking.create({
      data: {
        tenant_id: tenantId,
        branch_id: branchId,
        pt_user_id: user.id,
        customer_id: dto.customerId,
        customer_pt_package_id: pkg.id,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        status: 'SCHEDULED',
        session_note: dto.sessionNote,
        created_by: user.id,
      },
    });

    await this.notifyCustomerOfBooking(tenantId, dto.customerId, {
      eventCode: 'PT_BOOKING_CREATED_BY_PT',
      entityId: booking.id,
      title: 'PT đã xếp lịch tập mới cho bạn',
      body: `Lịch tập lúc ${formatBookingTime(scheduledStart)} đã được tạo thành công.`,
      targetPath: '/pt',
    });

    return booking;
  }

  // BR-PT-004: Client Data Privacy — PT only sees clients assigned to them
  async getMyClients(user: any, search?: string) {
    const ptUserId = user.id;
    const tenantId = this.getTenantId(user);

    const packages = await this.prisma.customer_pt_packages.findMany({
      where: {
        tenant_id: tenantId,
        pt_user_id: ptUserId,
        ...(search
          ? {
              customers: {
                full_name: { contains: search, mode: 'insensitive' },
              },
            }
          : {}),
      },
      include: {
        customers: {
          select: {
            id: true,
            full_name: true,
            phone: true,
            email: true,
            avatar_url: true,
            status: true,
            memberships: {
              where: { status: 'ACTIVE' },
              take: 1,
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const completedCounts = await this.prisma.ptBooking.groupBy({
      by: ['customer_pt_package_id'],
      where: {
        tenant_id: tenantId,
        pt_user_id: ptUserId,
        status: 'COMPLETED',
      },
      _count: { id: true },
    });
    const completedMap = new Map(
      completedCounts.map((c) => [c.customer_pt_package_id, c._count.id]),
    );

    return packages.map((pkg) => {
      const usedSessions = completedMap.get(pkg.id) ?? 0;
      const remainingSessions = Math.max(0, pkg.total_sessions - usedSessions);
      return {
        packageId: pkg.id,
        planName: pkg.plan_name_snapshot,
        totalSessions: pkg.total_sessions,
        usedSessions,
        remainingSessions,
        startDate: pkg.start_date,
        expiryDate: pkg.expiry_date,
        packageStatus: pkg.status,
        customer: {
          ...pkg.customers,
          isMembershipActive: pkg.customers.memberships.length > 0, // BR-PT-003
        },
      };
    });
  }

  async getClientDetail(user: any, customerId: string) {
    const ptUserId = user.id;
    const tenantId = this.getTenantId(user);

    // BR-PT-004: Ensure client is assigned to this PT
    const ptPackage = await this.prisma.customer_pt_packages.findFirst({
      where: {
        tenant_id: tenantId,
        pt_user_id: ptUserId,
        customer_id: customerId,
      },
      include: {
        customers: true,
        pt_session_logs: {
          orderBy: { created_at: 'desc' },
        },
        pt_bookings: {
          orderBy: { scheduled_start: 'desc' },
          take: 10,
        },
      },
    });

    if (!ptPackage) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thông tin học viên này',
      );
    }

    return ptPackage;
  }

  async createWorkoutLog(user: any, dto: CreateWorkoutLogDto) {
    const tenantId = this.getTenantId(user);
    const pkg = await this.prisma.customer_pt_packages.findFirst({
      where: {
        id: dto.customerPtPackageId,
        tenant_id: tenantId,
        pt_user_id: user.id,
      },
    });

    if (!pkg) {
      throw new ForbiddenException(
        'Bạn không có quyền ghi nhật ký cho gói tập này',
      );
    }

    const notePayload = JSON.stringify({
      workoutContent: dto.workoutContent,
      mainExercises: dto.mainExercises,
      progressAssessment: dto.progressAssessment,
      customNotes: dto.notes,
    });

    return this.prisma.pt_session_logs.create({
      data: {
        tenant_id: tenantId,
        customer_pt_package_id: pkg.id,
        booking_id: dto.bookingId || null,
        delta: 0,
        reason: 'WORKOUT_LOG',
        note: notePayload,
        created_by: user.id,
      },
    });
  }

  async getMyPtPackages(user: any) {
    const tenantId = this.getTenantId(user);
    return this.prisma.pt_package_plans.findMany({
      where: { tenant_id: tenantId, pt_user_id: user.id },
      orderBy: { created_at: 'desc' },
    });
  }

  async createPtPackagePlan(user: any, dto: CreatePtPackagePlanDto) {
    const tenantId = this.getTenantId(user);
    await this.ensurePtProfile(tenantId, user.id);

    return this.prisma.pt_package_plans.create({
      data: {
        tenant_id: tenantId,
        pt_user_id: user.id,
        name: dto.name,
        description: dto.description,
        session_count: dto.sessionCount,
        price: dto.price,
        validity_days: dto.validityDays || 60,
        session_duration_minutes: dto.sessionDurationMinutes || 60,
        status: 'PENDING_APPROVAL',
      },
    });
  }

  async getWorkingHours(user: any) {
    const tenantId = this.getTenantId(user);
    return this.prisma.pt_working_hours.findMany({
      where: { tenant_id: tenantId, pt_user_id: user.id },
      orderBy: { weekday: 'asc' },
    });
  }

  async updateWorkingHours(user: any, dto: UpdateWorkingHoursDto) {
    const tenantId = this.getTenantId(user);
    await this.ensurePtProfile(tenantId, user.id);

    const branchId = await this.getPtUserBranch(user);
    if (!branchId) {
      throw new BadRequestException('Không tìm thấy chi nhánh làm việc của PT');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.pt_working_hours.deleteMany({
        where: { tenant_id: tenantId, pt_user_id: user.id },
      });

      const createData = dto.hours.map((item) => {
        const [sH, sM] = item.startTime.split(':').map(Number);
        const [eH, eM] = item.endTime.split(':').map(Number);

        const startTime = new Date(1970, 0, 1, sH, sM, 0);
        const endTime = new Date(1970, 0, 1, eH, eM, 0);

        return {
          tenant_id: tenantId,
          pt_user_id: user.id,
          branch_id: branchId,
          weekday: item.weekday,
          start_time: startTime,
          end_time: endTime,
        };
      });

      return tx.pt_working_hours.createMany({
        data: createData,
      });
    });
  }

  async getProfile(user: any) {
    const tenantId = this.getTenantId(user);
    const userObj = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        avatar_url: true,
        created_at: true,
      },
    });

    const certs = await this.prisma.pt_certificates.findMany({
      where: { pt_user_id: user.id, tenant_id: tenantId },
    });

    return {
      ...userObj,
      certificates: certs,
    };
  }

  async updateProfile(user: any, dto: UpdatePtProfileDto) {
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        // preserve basic info
      },
    });
  }
}
