import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConfirmBookingDto,
  RejectBookingDto,
  CompleteSessionDto,
  CreateWorkoutLogDto,
  CreatePtPackagePlanDto,
  UpdatePtProfileDto,
  UpdateWorkingHoursDto,
} from './dto/pt.dto';

@Injectable()
export class PtService {
  constructor(private prisma: PrismaService) {}

  private getTenantId(user: any): string {
    const tenantId = user.tenantId || user.tenant_id;
    if (!tenantId) {
      throw new BadRequestException('Không tìm thấy thông tin doanh nghiệp (tenant_id) của tài khoản người dùng.');
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
    return userBranch?.branch_id || user.branch_id || user.branchId;
  }

  async getDashboardOverview(user: any) {
    const ptUserId = user.id;
    const tenantId = this.getTenantId(user);
    const now = new Date();

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // 1. Today's bookings
    const todayBookings = await this.prisma.ptBooking.findMany({
      where: {
        tenant_id: tenantId,
        pt_user_id: ptUserId,
        scheduled_start: { gte: startOfDay, lte: endOfDay },
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
      throw new NotFoundException('Không tìm thấy lịch hẹn hoặc bạn không có quyền xác nhận');
    }

    return this.prisma.ptBooking.update({
      where: { id: dto.bookingId },
      data: { status: 'SCHEDULED' },
    });
  }

  async rejectBooking(user: any, dto: RejectBookingDto) {
    const tenantId = this.getTenantId(user);
    const booking = await this.prisma.ptBooking.findFirst({
      where: { id: dto.bookingId, tenant_id: tenantId, pt_user_id: user.id },
    });

    if (!booking) {
      throw new NotFoundException('Không tìm thấy lịch hẹn');
    }

    return this.prisma.ptBooking.update({
      where: { id: dto.bookingId },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by: user.id,
        cancel_reason: dto.reason || 'PT bận ca làm việc',
      },
    });
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
      throw new BadRequestException('Buổi tập này đã được đánh dấu hoàn thành trước đó');
    }

    const pkg = booking.customer_pt_packages;
    if (!pkg) {
      throw new BadRequestException('Gói PT của học viên không hợp lệ');
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

      // 2. Deduct 1 session from customer_pt_packages (BR-PT-002)
      const newUsed = pkg.used_sessions + 1;
      const newRemaining = Math.max(0, (pkg.remaining_sessions ?? pkg.total_sessions) - 1);
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

    return packages.map((pkg) => ({
      packageId: pkg.id,
      planName: pkg.plan_name_snapshot,
      totalSessions: pkg.total_sessions,
      usedSessions: pkg.used_sessions,
      remainingSessions: pkg.remaining_sessions ?? (pkg.total_sessions - pkg.used_sessions),
      startDate: pkg.start_date,
      expiryDate: pkg.expiry_date,
      packageStatus: pkg.status,
      customer: {
        ...pkg.customers,
        isMembershipActive: pkg.customers.memberships.length > 0, // BR-PT-003
      },
    }));
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
      throw new ForbiddenException('Bạn không có quyền truy cập thông tin học viên này');
    }

    return ptPackage;
  }

  async createWorkoutLog(user: any, dto: CreateWorkoutLogDto) {
    const tenantId = this.getTenantId(user);
    const pkg = await this.prisma.customer_pt_packages.findFirst({
      where: { id: dto.customerPtPackageId, tenant_id: tenantId, pt_user_id: user.id },
    });

    if (!pkg) {
      throw new ForbiddenException('Bạn không có quyền ghi nhật ký cho gói tập này');
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
