import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { paginate, parsePagination } from '../common/utils/pagination';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import type { RequestUser } from '../common/types/jwt-payload';
import {
  CancelPtBookingDto,
  CreatePtBookingDto,
  CustomerChangePasswordDto,
  FaceConsentDto,
  QueryAttendanceDto,
  QueryPaymentsDto,
  UpdateCustomerProfileDto,
} from './dto/customer.dto';

// BR-CUST-004: dynamic QR — each token is only valid this many seconds, forcing
// the customer app to keep re-fetching (and re-rendering) a fresh code so a
// screenshot handed to someone else goes stale almost immediately.
const QR_TOKEN_TTL_SECONDS = 45;

// Doc §2.3 "chính sách hủy đặt trước" — a customer can only self-cancel a PT
// session this far ahead of its scheduled start.
const PT_CANCEL_CUTOFF_HOURS = 2;

const WEEKDAY_LABELS = [
  'CN',
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
];

export interface QrTokenClaim {
  sub: string; // customer id
  tenantId: string;
  v: number; // qr_token_version at issue time
}

@Injectable()
export class CustomerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  /** Every endpoint operates on "my own data" — resolve the caller's Customer row from their User id. */
  async resolveCustomer(user: RequestUser) {
    if (!user.tenantId)
      throw new ForbiddenException('Tài khoản chưa thuộc về doanh nghiệp nào');
    const customer = await this.prisma.customer.findFirst({
      where: { tenant_id: user.tenantId, user_id: user.id },
    });
    if (!customer)
      throw new NotFoundException(
        'Không tìm thấy hồ sơ hội viên gắn với tài khoản này',
      );
    return customer;
  }

  // ---------------------------------------------------------------------
  // 2.1 Member Identity & Personal Profile
  // ---------------------------------------------------------------------

  async changePassword(user: RequestUser, dto: CustomerChangePasswordDto) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });
    if (!dbUser || !dbUser.password_hash) {
      throw new BadRequestException('Tài khoản không hợp lệ');
    }

    const matches = await bcrypt.compare(
      dto.currentPassword,
      dbUser.password_hash,
    );
    if (!matches) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu cũ',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    // The one place `must_change_password` ever flips back to false for a customer —
    // once they've set their own password, the forced-change gate never reappears
    // unless staff resets it again (resetCustomerPassword sets it back to true).
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password_hash: passwordHash, must_change_password: false },
    });

    return { success: true };
  }

  async getProfile(user: RequestUser) {
    const customer = await this.resolveCustomer(user);
    const [branch, tenant] = await Promise.all([
      customer.home_branch_id
        ? this.prisma.branch.findUnique({
            where: { id: customer.home_branch_id },
            select: { id: true, name: true },
          })
        : null,
      this.prisma.tenant.findUnique({
        where: { id: customer.tenant_id },
        select: { name: true },
      }),
    ]);

    return {
      id: customer.id,
      customerCode: customer.customer_code,
      fullName: customer.full_name,
      phone: customer.phone,
      email: customer.email,
      dateOfBirth: customer.date_of_birth,
      gender: customer.gender,
      address: customer.address,
      avatarUrl: customer.avatar_url,
      tenantName: tenant?.name || 'FitFlow',
      homeBranch: branch,
      faceConsentAt: customer.face_consent_at,
      emergencyContactName: customer.emergency_contact_name,
      emergencyContactPhone: customer.emergency_contact_phone,
      createdAt: customer.created_at,
    };
  }

  async updateProfile(user: RequestUser, dto: UpdateCustomerProfileDto) {
    const customer = await this.resolveCustomer(user);
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        phone: dto.phone ?? undefined,
        address: dto.address ?? undefined,
        gender: dto.gender ?? undefined,
        date_of_birth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        emergency_contact_name: dto.emergencyContactName ?? undefined,
        emergency_contact_phone: dto.emergencyContactPhone ?? undefined,
      },
    });
    return this.getProfile(user);
  }

  async submitFaceConsent(user: RequestUser, dto: FaceConsentDto, ip?: string) {
    const customer = await this.resolveCustomer(user);
    // Uploaded to Cloudinary (not stored inline) — Customer.avatar_url is read as a
    // plain <img src> elsewhere (manager.service.ts, pt.service.ts), so it must stay
    // a real hosted URL rather than a multi-MB base64 blob in the DB row.
    const avatarUrl = await this.cloudinary.uploadImage(
      dto.imageDataUrl,
      `fitflow/${customer.tenant_id}/customers`,
    );
    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        avatar_url: avatarUrl,
        face_consent_at: new Date(),
        face_consent_ip: ip ?? undefined,
      },
    });
    return { success: true, avatarUrl };
  }

  // ---------------------------------------------------------------------
  // 2.4 Dynamic QR (BR-CUST-004)
  // ---------------------------------------------------------------------

  async getQrToken(user: RequestUser) {
    const customer = await this.resolveCustomer(user);
    const token = this.jwt.sign(
      {
        sub: customer.id,
        tenantId: customer.tenant_id,
        v: customer.qr_token_version,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: QR_TOKEN_TTL_SECONDS,
      },
    );
    return { token, expiresInSeconds: QR_TOKEN_TTL_SECONDS };
  }

  // ---------------------------------------------------------------------
  // 2.2 My Memberships & Benefits
  // ---------------------------------------------------------------------

  async getCurrentMembership(user: RequestUser) {
    const customer = await this.resolveCustomer(user);
    const membership = await this.prisma.membership.findFirst({
      where: {
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
        status: { in: ['SCHEDULED', 'ACTIVE', 'FROZEN'] },
      },
      orderBy: { created_at: 'desc' },
      include: { branches: { select: { id: true, name: true } } },
    });
    if (!membership) return null;

    // Count unique active gym check-in days
    const gymCheckins = await this.prisma.attendances.findMany({
      where: {
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
        status: { not: 'CANCELLED' },
      },
      select: { check_in_at: true },
    });
    const uniqueGymDays = new Set(
      gymCheckins.map((a) => this.toLocalDateStr(a.check_in_at)),
    ).size;

    // Fetch active PT package summary if any
    const ptPkg = await this.prisma.customer_pt_packages.findFirst({
      where: {
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
        status: 'ACTIVE',
      },
      orderBy: { created_at: 'desc' },
    });

    let ptSummary: any = null;
    if (ptPkg) {
      const completedPtSessions = await this.prisma.ptBooking.count({
        where: {
          tenant_id: customer.tenant_id,
          customer_pt_package_id: ptPkg.id,
          status: 'COMPLETED',
        },
      });
      ptSummary = {
        id: ptPkg.id,
        planName: ptPkg.plan_name_snapshot,
        ptName: ptPkg.pt_name_snapshot,
        totalSessions: ptPkg.total_sessions,
        completedSessions: completedPtSessions,
        remainingSessions: Math.max(
          0,
          ptPkg.total_sessions - completedPtSessions,
        ),
      };
    }

    return {
      ...this.mapMembership(membership),
      gymAttendanceDays: uniqueGymDays,
      ptSummary,
    };
  }

  async getMembershipHistory(user: RequestUser) {
    const customer = await this.resolveCustomer(user);
    const memberships = await this.prisma.membership.findMany({
      where: { tenant_id: customer.tenant_id, customer_id: customer.id },
      orderBy: { created_at: 'desc' },
      include: { branches: { select: { id: true, name: true } } },
      take: 100,
    });
    return memberships.map((m) => this.mapMembership(m));
  }

  private mapMembership(m: {
    id: string;
    package_name_snapshot: string;
    price_snapshot: unknown;
    currency_snapshot: string;
    duration_value_snapshot: number;
    duration_unit_snapshot: string;
    branch_access_scope_snapshot: string;
    max_checkins_per_day_snapshot: number | null;
    start_date: Date;
    end_date: Date;
    status: string;
    frozen_days_used: number;
    branches: { id: string; name: string } | null;
  }) {
    return {
      id: m.id,
      packageName: m.package_name_snapshot,
      price: m.price_snapshot,
      currency: m.currency_snapshot,
      durationValue: m.duration_value_snapshot,
      durationUnit: m.duration_unit_snapshot,
      branchAccessScope: m.branch_access_scope_snapshot,
      maxCheckinsPerDay: m.max_checkins_per_day_snapshot,
      startDate: m.start_date,
      endDate: m.end_date,
      status: m.status,
      frozenDaysUsed: m.frozen_days_used,
      branch: m.branches,
    };
  }

  // ---------------------------------------------------------------------
  // 2.3 PT Training & Booking Service
  // ---------------------------------------------------------------------

  async getMyPtPackage(user: RequestUser) {
    const customer = await this.resolveCustomer(user);
    const pkg = await this.prisma.customer_pt_packages.findFirst({
      where: {
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
        status: 'ACTIVE',
      },
      orderBy: { created_at: 'desc' },
    });
    if (!pkg) return null;

    const completedSessions = await this.prisma.ptBooking.count({
      where: {
        tenant_id: customer.tenant_id,
        customer_pt_package_id: pkg.id,
        status: 'COMPLETED',
      },
    });

    const remainingSessions = Math.max(0, pkg.total_sessions - completedSessions);

    return {
      id: pkg.id,
      planName: pkg.plan_name_snapshot,
      ptName: pkg.pt_name_snapshot,
      ptUserId: pkg.pt_user_id,
      totalSessions: pkg.total_sessions,
      completedSessions,
      remainingSessions,
      startDate: pkg.start_date,
      expiryDate: pkg.expiry_date,
      sessionDurationMinutes: pkg.session_duration_minutes || 60,
      status: pkg.status,
    };
  }

  async getPtAvailability(user: RequestUser, dateStr?: string) {
    const customer = await this.resolveCustomer(user);
    const pkg = await this.prisma.customer_pt_packages.findFirst({
      where: {
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
        status: 'ACTIVE',
      },
    });
    if (!pkg) {
      throw new BadRequestException(
        'Bạn chưa có gói PT đang hoạt động để đặt lịch',
      );
    }

    const day = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date();
    if (Number.isNaN(day.getTime()))
      throw new BadRequestException('Ngày không hợp lệ');
    const dayStart = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      0,
      0,
      0,
    );
    const dayEnd = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      23,
      59,
      59,
      999,
    );
    // pt_working_hours.weekday: 1 (Mon) .. 7 (Sun) — see pt.dto.ts WorkingHourItemDto.
    const isoWeekday = ((dayStart.getDay() + 6) % 7) + 1;

    const [workingHours, existingPtBookings, existingCustomerBookings, branch, reservedBookingsCount, completedCount] = await Promise.all([
      this.prisma.pt_working_hours.findMany({
        where: {
          tenant_id: customer.tenant_id,
          pt_user_id: pkg.pt_user_id,
          weekday: isoWeekday,
        },
      }),
      this.prisma.ptBooking.findMany({
        where: {
          tenant_id: customer.tenant_id,
          pt_user_id: pkg.pt_user_id,
          scheduled_start: { gte: dayStart, lte: dayEnd },
          status: { in: ['PENDING', 'CONFIRMED', 'SCHEDULED'] },
        },
        select: { scheduled_start: true, scheduled_end: true },
      }),
      this.prisma.ptBooking.findMany({
        where: {
          tenant_id: customer.tenant_id,
          customer_id: customer.id,
          scheduled_start: { gte: dayStart, lte: dayEnd },
          status: { in: ['PENDING', 'CONFIRMED', 'SCHEDULED'] },
        },
        select: { scheduled_start: true, scheduled_end: true },
      }),
      this.prisma.branch.findUnique({
        where: { id: pkg.branch_id },
        select: { opening_time: true, closing_time: true },
      }),
      this.prisma.ptBooking.count({
        where: {
          tenant_id: customer.tenant_id,
          customer_pt_package_id: pkg.id,
          status: { in: ['PENDING', 'CONFIRMED', 'SCHEDULED'] },
        },
      }),
      this.prisma.ptBooking.count({
        where: {
          tenant_id: customer.tenant_id,
          customer_pt_package_id: pkg.id,
          status: 'COMPLETED',
        },
      }),
    ]);

    const sessionDuration = pkg.session_duration_minutes || 60;
    const availableToBook = Math.max(0, pkg.total_sessions - completedCount - reservedBookingsCount);

    const durationMs = sessionDuration * 60_000;
    const now = new Date();
    const slots: { start: string; end: string }[] = [];

    const allOccupiedRanges = [...existingPtBookings, ...existingCustomerBookings];

    if (availableToBook > 0) {
      for (const wh of workingHours) {
        const start = new Date(dayStart);
        start.setHours(
          wh.start_time.getHours(),
          wh.start_time.getMinutes(),
          0,
          0,
        );
        const end = new Date(dayStart);
        end.setHours(wh.end_time.getHours(), wh.end_time.getMinutes(), 0, 0);

        // Constrain by Branch Opening/Closing hours if available
        if (branch?.opening_time) {
          const branchStart = new Date(dayStart);
          branchStart.setHours(branch.opening_time.getHours(), branch.opening_time.getMinutes(), 0, 0);
          if (start < branchStart) start.setTime(branchStart.getTime());
        }
        if (branch?.closing_time) {
          const branchEnd = new Date(dayStart);
          branchEnd.setHours(branch.closing_time.getHours(), branch.closing_time.getMinutes(), 0, 0);
          if (end > branchEnd) end.setTime(branchEnd.getTime());
        }

        for (
          let slotStart = new Date(start);
          slotStart.getTime() + durationMs <= end.getTime();
          slotStart = new Date(slotStart.getTime() + durationMs)
        ) {
          const slotEnd = new Date(slotStart.getTime() + durationMs);
          if (slotStart < now) continue;
          const overlaps = allOccupiedRanges.some(
            (b) => slotStart < b.scheduled_end && slotEnd > b.scheduled_start,
          );
          if (!overlaps)
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
            });
        }
      }
    }

    return {
      weekdayLabel: WEEKDAY_LABELS[dayStart.getDay()],
      sessionDurationMinutes: sessionDuration,
      packageSummary: {
        packageName: pkg.plan_name_snapshot,
        totalSessions: pkg.total_sessions,
        completedSessions: completedCount,
        reservedSessions: reservedBookingsCount,
        availableToBook,
      },
      slots,
    };
  }

  async createPtBooking(user: RequestUser, dto: CreatePtBookingDto) {
    const customer = await this.resolveCustomer(user);

    // BR-PTB-001: Active Membership check
    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
        status: 'ACTIVE',
      },
    });
    if (!activeMembership) {
      throw new BadRequestException(
        'Bạn cần có thẻ Membership Gym đang hoạt động để đặt lịch PT.',
      );
    }

    // BR-PTB-002: Active PT Package check
    const pkg = await this.prisma.customer_pt_packages.findFirst({
      where: {
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
        status: 'ACTIVE',
      },
    });
    if (!pkg)
      throw new BadRequestException('Bạn chưa có gói PT đang hoạt động');

    if (pkg.expiry_date && new Date() > new Date(pkg.expiry_date)) {
      throw new BadRequestException('Gói PT của bạn đã hết thời hạn sử dụng');
    }

    const sessionDuration = pkg.session_duration_minutes || 60;

    // BR-PTB-006: Session capacity check (Completed + Pending + Scheduled <= Total)
    const [reservedBookingsCount, completedCount] = await Promise.all([
      this.prisma.ptBooking.count({
        where: {
          tenant_id: customer.tenant_id,
          customer_pt_package_id: pkg.id,
          status: { in: ['PENDING', 'CONFIRMED', 'SCHEDULED'] },
        },
      }),
      this.prisma.ptBooking.count({
        where: {
          tenant_id: customer.tenant_id,
          customer_pt_package_id: pkg.id,
          status: 'COMPLETED',
        },
      }),
    ]);
    const availableToBook = pkg.total_sessions - completedCount - reservedBookingsCount;
    if (availableToBook <= 0) {
      throw new BadRequestException(
        `Bạn đã giữ chỗ hết số buổi khả dụng của gói PT (${pkg.total_sessions} buổi: ${completedCount} đã hoàn thành, ${reservedBookingsCount} đang giữ chỗ/chờ duyệt).`,
      );
    }

    const scheduledStart = new Date(dto.scheduledStart);
    if (Number.isNaN(scheduledStart.getTime()) || scheduledStart < new Date()) {
      throw new BadRequestException('Thời gian bắt đầu đặt lịch không hợp lệ hoặc đã thuộc quá khứ');
    }

    const scheduledEnd = dto.scheduledEnd
      ? new Date(dto.scheduledEnd)
      : new Date(scheduledStart.getTime() + sessionDuration * 60_000);

    if (Number.isNaN(scheduledEnd.getTime()) || scheduledEnd <= scheduledStart) {
      throw new BadRequestException('Thời gian kết thúc phải lớn hơn thời gian bắt đầu');
    }

    // Validate Branch Opening / Closing hours
    const branch = await this.prisma.branch.findUnique({
      where: { id: pkg.branch_id },
      select: { opening_time: true, closing_time: true, name: true },
    });
    if (branch?.opening_time && branch?.closing_time) {
      const dayBase = new Date(scheduledStart.getFullYear(), scheduledStart.getMonth(), scheduledStart.getDate(), 0, 0, 0, 0);
      const branchStart = new Date(dayBase);
      branchStart.setHours(branch.opening_time.getHours(), branch.opening_time.getMinutes(), 0, 0);
      const branchEnd = new Date(dayBase);
      branchEnd.setHours(branch.closing_time.getHours(), branch.closing_time.getMinutes(), 0, 0);

      if (scheduledStart < branchStart || scheduledEnd > branchEnd) {
        const startStr = `${String(branch.opening_time.getHours()).padStart(2, '0')}:${String(branch.opening_time.getMinutes()).padStart(2, '0')}`;
        const endStr = `${String(branch.closing_time.getHours()).padStart(2, '0')}:${String(branch.closing_time.getMinutes()).padStart(2, '0')}`;
        throw new BadRequestException(
          `Thời gian đặt lịch phải nằm trong giờ mở cửa của chi nhánh (${startStr} - ${endStr})`,
        );
      }
    }

    // Validate PT Working Hours for that day
    const isoWeekday = ((scheduledStart.getDay() + 6) % 7) + 1;
    const workingHours = await this.prisma.pt_working_hours.findMany({
      where: {
        tenant_id: customer.tenant_id,
        pt_user_id: pkg.pt_user_id,
        weekday: isoWeekday,
      },
    });
    if (workingHours.length > 0) {
      const isWithinWh = workingHours.some((wh) => {
        const whStart = new Date(scheduledStart.getFullYear(), scheduledStart.getMonth(), scheduledStart.getDate(), wh.start_time.getHours(), wh.start_time.getMinutes(), 0, 0);
        const whEnd = new Date(scheduledStart.getFullYear(), scheduledStart.getMonth(), scheduledStart.getDate(), wh.end_time.getHours(), wh.end_time.getMinutes(), 0, 0);
        return scheduledStart >= whStart && scheduledEnd <= whEnd;
      });
      if (!isWithinWh) {
        throw new BadRequestException(
          'Thời gian đặt lịch nằm ngoài khung giờ làm việc của HLV vào ngày này',
        );
      }
    }

    // BR-PTB-004 & BR-PTB-014: Overlap checks for PT and Customer
    const ptConflict = await this.prisma.ptBooking.findFirst({
      where: {
        tenant_id: customer.tenant_id,
        pt_user_id: pkg.pt_user_id,
        status: { in: ['PENDING', 'CONFIRMED', 'SCHEDULED'] },
        scheduled_start: { lt: scheduledEnd },
        scheduled_end: { gt: scheduledStart },
      },
    });
    if (ptConflict)
      throw new BadRequestException(
        'Huấn luyện viên đã có lịch tập khác trong khung giờ này, vui lòng chọn giờ khác',
      );

    const customerConflict = await this.prisma.ptBooking.findFirst({
      where: {
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
        status: { in: ['PENDING', 'CONFIRMED', 'SCHEDULED'] },
        scheduled_start: { lt: scheduledEnd },
        scheduled_end: { gt: scheduledStart },
      },
    });
    if (customerConflict)
      throw new BadRequestException(
        'Bạn đã có một ca tập PT khác trong khung giờ này',
      );

    // Customer-initiated booking is a request -> status: PENDING
    return this.prisma.ptBooking.create({
      data: {
        tenant_id: customer.tenant_id,
        branch_id: pkg.branch_id,
        pt_user_id: pkg.pt_user_id,
        customer_id: customer.id,
        customer_pt_package_id: pkg.id,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        status: 'PENDING',
        session_note: dto.note,
        created_by: user.id,
      },
    });
  }

  async cancelPtBooking(
    user: RequestUser,
    bookingId: string,
    dto: CancelPtBookingDto,
  ) {
    const customer = await this.resolveCustomer(user);
    const booking = await this.prisma.ptBooking.findFirst({
      where: {
        id: bookingId,
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
      },
    });
    if (!booking) throw new NotFoundException('Không tìm thấy lịch hẹn');
    if (!['PENDING', 'SCHEDULED'].includes(booking.status)) {
      throw new BadRequestException('Lịch hẹn này không thể hủy');
    }
    const hoursUntilStart =
      (booking.scheduled_start.getTime() - Date.now()) / 3_600_000;
    if (hoursUntilStart < PT_CANCEL_CUTOFF_HOURS) {
      throw new BadRequestException(
        `Chỉ có thể hủy lịch trước ít nhất ${PT_CANCEL_CUTOFF_HOURS} giờ`,
      );
    }

    return this.prisma.ptBooking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelled_at: new Date(),
        cancelled_by: user.id,
        cancel_reason: dto.reason || 'Khách hàng tự hủy lịch',
      },
    });
  }

  async getMyPtBookings(user: RequestUser) {
    const customer = await this.resolveCustomer(user);
    const bookings = await this.prisma.ptBooking.findMany({
      where: { tenant_id: customer.tenant_id, customer_id: customer.id },
      orderBy: { scheduled_start: 'desc' },
      take: 100,
    });
    const now = new Date();
    return {
      upcoming: bookings
        .filter((b) => b.scheduled_start >= now && b.status !== 'CANCELLED')
        .reverse(),
      past: bookings.filter(
        (b) => b.scheduled_start < now || b.status === 'CANCELLED',
      ),
    };
  }

  // ---------------------------------------------------------------------
  // 2.4 Attendance & Access History
  // ---------------------------------------------------------------------

  async getAttendanceHistory(user: RequestUser, query: QueryAttendanceDto) {
    const customer = await this.resolveCustomer(user);
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = { tenant_id: customer.tenant_id, customer_id: customer.id };
    const [items, total] = await Promise.all([
      this.prisma.attendances.findMany({
        where,
        orderBy: { check_in_at: 'desc' },
        include: { branches: { select: { id: true, name: true } } },
        skip,
        take,
      }),
      this.prisma.attendances.count({ where }),
    ]);

    return paginate(
      items.map((a) => ({
        id: a.id,
        branch: a.branches,
        checkInAt: a.check_in_at,
        checkInMethod: a.check_in_method,
        checkOutAt: a.check_out_at,
        checkOutMethod: a.check_out_method,
        status: a.status,
      })),
      total,
      page,
      pageSize,
    );
  }

  /**
   * Timetable-style view for the "Điểm danh" tab — one Mon-Sun week of attendance,
   * grouped by day, plus 3 headline stats. `stats` always reflects the REAL current
   * week/month (as of now), independent of which week the customer is browsing via
   * `weekStartStr` — matches the mockup where the stat cards don't change while
   * navigating the calendar strip below them.
   */
  async getAttendanceCalendar(user: RequestUser, weekStartStr?: string) {
    const customer = await this.resolveCustomer(user);

    const requestedMonday = weekStartStr
      ? this.mondayOf(new Date(`${weekStartStr}T00:00:00`))
      : this.mondayOf(new Date());
    if (Number.isNaN(requestedMonday.getTime())) {
      throw new BadRequestException('Ngày không hợp lệ');
    }
    const requestedWeekEnd = new Date(requestedMonday);
    requestedWeekEnd.setDate(requestedWeekEnd.getDate() + 7);

    const now = new Date();
    const thisWeekMonday = this.mondayOf(now);
    const thisWeekEnd = new Date(thisWeekMonday);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const baseWhere = {
      tenant_id: customer.tenant_id,
      customer_id: customer.id,
      status: { not: 'CANCELLED' as const },
    };

    const [weekRows, thisWeekAttendanceRows, thisMonthAttendanceRows, checkedOutAll] =
      await Promise.all([
        this.prisma.attendances.findMany({
          where: {
            ...baseWhere,
            check_in_at: { gte: requestedMonday, lt: requestedWeekEnd },
          },
          orderBy: { check_in_at: 'asc' },
          include: { branches: { select: { id: true, name: true } } },
        }),
        this.prisma.attendances.findMany({
          where: {
            ...baseWhere,
            check_in_at: { gte: thisWeekMonday, lt: thisWeekEnd },
          },
          select: { check_in_at: true },
        }),
        this.prisma.attendances.findMany({
          where: {
            ...baseWhere,
            check_in_at: { gte: monthStart, lt: monthEnd },
          },
          select: { check_in_at: true },
        }),
        this.prisma.attendances.findMany({
          where: { ...baseWhere, check_out_at: { not: null } },
          select: { check_in_at: true, check_out_at: true },
        }),
      ]);

    // Multiple check-ins on the same calendar day count as 1 training day (1 unique active day)
    const uniqueWeekDays = new Set(thisWeekAttendanceRows.map((a) => this.toLocalDateStr(a.check_in_at))).size;
    const uniqueMonthDays = new Set(thisMonthAttendanceRows.map((a) => this.toLocalDateStr(a.check_in_at))).size;

    const totalMinutes = checkedOutAll.reduce(
      (sum, a) =>
        sum + (a.check_out_at!.getTime() - a.check_in_at.getTime()) / 60_000,
      0,
    );

    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(requestedMonday);
      date.setDate(date.getDate() + i);
      const dayEntries = weekRows.filter((a) =>
        this.isSameDay(a.check_in_at, date),
      );
      return {
        date: this.toLocalDateStr(date),
        isToday: this.isSameDay(date, now),
        count: dayEntries.length,
        entries: dayEntries.map((a) => ({
          id: a.id,
          branchName: a.branches?.name ?? 'Chi nhánh',
          checkInAt: a.check_in_at,
          checkOutAt: a.check_out_at,
          status: a.status,
          method: a.check_in_method,
        })),
      };
    });

    const lastDay = new Date(requestedWeekEnd);
    lastDay.setDate(lastDay.getDate() - 1);

    return {
      stats: {
        thisWeekSessions: uniqueWeekDays,
        thisMonthSessions: uniqueMonthDays,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      },
      weekStart: this.toLocalDateStr(requestedMonday),
      weekEnd: this.toLocalDateStr(lastDay),
      days,
    };
  }

  /**
   * Month heatmap for the "Điểm danh" tab's grid view — activity count per calendar day
   * for one month, used to shade each cell by intensity (0 / 1 / 2 / 3+ sessions).
   */
  async getAttendanceMonthSummary(user: RequestUser, monthStr?: string) {
    const customer = await this.resolveCustomer(user);

    const now = new Date();
    let year = now.getFullYear();
    let monthIndex = now.getMonth();
    if (monthStr) {
      const match = /^(\d{4})-(\d{2})$/.exec(monthStr);
      if (!match) throw new BadRequestException('Tháng không hợp lệ');
      year = Number(match[1]);
      monthIndex = Number(match[2]) - 1;
      if (monthIndex < 0 || monthIndex > 11) {
        throw new BadRequestException('Tháng không hợp lệ');
      }
    }

    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 1);

    const rows = await this.prisma.attendances.findMany({
      where: {
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
        status: { not: 'CANCELLED' },
        check_in_at: { gte: monthStart, lt: monthEnd },
      },
      select: { check_in_at: true },
    });

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, monthIndex, i + 1);
      const count = rows.filter((r) =>
        this.isSameDay(r.check_in_at, date),
      ).length;
      return {
        date: this.toLocalDateStr(date),
        isToday: this.isSameDay(date, now),
        count,
      };
    });

    return {
      month: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      // Monday-first offset of day 1 (0 = Monday .. 6 = Sunday) — the grid view uses
      // this to pad leading empty cells so day-of-week columns line up correctly.
      firstWeekday: (monthStart.getDay() + 6) % 7,
      daysWithActivity: days.filter((d) => d.count > 0).length,
      days,
    };
  }

  private mondayOf(date: Date): Date {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const weekday = d.getDay(); // 0 (Sun) .. 6 (Sat)
    const diff = weekday === 0 ? -6 : 1 - weekday;
    d.setDate(d.getDate() + diff);
    return d;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  /**
   * Formats a Date as a local-calendar YYYY-MM-DD string. Deliberately NOT
   * `date.toISOString().slice(0, 10)` — that converts to UTC first, which silently
   * shifts the date back a day for any timezone ahead of UTC (e.g. Asia/Ho_Chi_Minh,
   * UTC+7 — exactly where this app runs) when the Date holds a local-midnight instant.
   */
  private toLocalDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ---------------------------------------------------------------------
  // 2.5 Billing & Transaction History
  // ---------------------------------------------------------------------

  async getPayments(user: RequestUser, query: QueryPaymentsDto) {
    const customer = await this.resolveCustomer(user);
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = {
      tenant_id: customer.tenant_id,
      customer_id: customer.id,
      ...(query.status ? { status: query.status } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return paginate(
      items.map((p) => ({
        id: p.id,
        paymentCode: p.payment_code,
        paymentType: p.payment_type,
        totalAmount: p.total_amount,
        currency: p.currency,
        method: p.method,
        status: p.status,
        paidAt: p.paid_at,
        createdAt: p.created_at,
      })),
      total,
      page,
      pageSize,
    );
  }

  async getPaymentDetail(user: RequestUser, paymentId: string) {
    const customer = await this.resolveCustomer(user);
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        tenant_id: customer.tenant_id,
        customer_id: customer.id,
      },
      include: {
        payment_items: true,
        branches: { select: { id: true, name: true } },
      },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy hoá đơn');
    return payment;
  }
}
