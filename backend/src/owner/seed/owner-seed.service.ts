import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE } from '../../common/types/role';

/**
 * OW-03b. Dữ liệu mẫu cho Owner mới chọn "bắt đầu có sẵn dữ liệu" ở bước đăng
 * ký (xem OwnerAuthService#verify) — mục đích thuần tuý để Owner khám phá
 * giao diện (Dashboard, Khách hàng, Check-in, Membership, PT...) ngay mà
 * không phải tự nhập liệu trước. Toàn bộ số điện thoại dùng đầu số 0900000xxx
 * rõ ràng là dữ liệu giả, không trùng với số thật của khách hàng.
 *
 * Tôn trọng đúng hạn mức Trial (1 chi nhánh, xem BR-TRIAL-03) — chỉ tạo one
 * branch. Không tạo tài khoản đăng nhập được (PT ở đây chỉ là hồ sơ hiển
 * thị, email/password đều null) — tránh mọi rủi ro gửi nhầm email thật.
 */
@Injectable()
export class OwnerSeedService {
  private readonly logger = new Logger(OwnerSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async clearAllDemoSeedData() {
    this.logger.log('Bắt đầu xoá toàn bộ dữ liệu mẫu (seed demo data)...');

    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        ALTER TABLE attendances DISABLE TRIGGER ALL;
        ALTER TABLE payments DISABLE TRIGGER ALL;
        ALTER TABLE customer_pt_packages DISABLE TRIGGER ALL;
        ALTER TABLE pt_bookings DISABLE TRIGGER ALL;
        ALTER TABLE memberships DISABLE TRIGGER ALL;
        ALTER TABLE customers DISABLE TRIGGER ALL;
        ALTER TABLE pt_package_plans DISABLE TRIGGER ALL;
        ALTER TABLE pt_profiles DISABLE TRIGGER ALL;
        ALTER TABLE user_roles DISABLE TRIGGER ALL;
        ALTER TABLE users DISABLE TRIGGER ALL;

        DELETE FROM attendances WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '090000%' OR customer_code LIKE 'KH-%');
        DELETE FROM payments WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '090000%' OR customer_code LIKE 'KH-%');
        DELETE FROM customer_pt_packages WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '090000%' OR customer_code LIKE 'KH-%');
        DELETE FROM pt_bookings WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '090000%' OR customer_code LIKE 'KH-%');
        DELETE FROM memberships WHERE customer_id IN (SELECT id FROM customers WHERE phone LIKE '090000%' OR customer_code LIKE 'KH-%');
        DELETE FROM customers WHERE phone LIKE '090000%' OR customer_code LIKE 'KH-%';
        DELETE FROM notifications;

        DELETE FROM pt_package_plans WHERE pt_user_id IN (SELECT id FROM users WHERE full_name = 'Nguyễn Đức Thắng');
        DELETE FROM pt_profiles WHERE user_id IN (SELECT id FROM users WHERE full_name = 'Nguyễn Đức Thắng');
        DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE full_name = 'Nguyễn Đức Thắng');
        DELETE FROM users WHERE full_name = 'Nguyễn Đức Thắng';

        ALTER TABLE attendances ENABLE TRIGGER ALL;
        ALTER TABLE payments ENABLE TRIGGER ALL;
        ALTER TABLE customer_pt_packages ENABLE TRIGGER ALL;
        ALTER TABLE pt_bookings ENABLE TRIGGER ALL;
        ALTER TABLE memberships ENABLE TRIGGER ALL;
        ALTER TABLE customers ENABLE TRIGGER ALL;
        ALTER TABLE pt_package_plans ENABLE TRIGGER ALL;
        ALTER TABLE pt_profiles ENABLE TRIGGER ALL;
        ALTER TABLE user_roles ENABLE TRIGGER ALL;
        ALTER TABLE users ENABLE TRIGGER ALL;
      END $$;
    `);

    this.logger.log('Đã xoá sạch 100% dữ liệu mẫu demo khỏi CSDL!');

    return { success: true };
  }

  async seedDemoData(
    tenantId: string,
    ownerUserId: string,
    businessName: string,
  ) {
    try {
      await this.run(tenantId, ownerUserId, businessName);
    } catch (err) {
      // Không được để việc tạo dữ liệu mẫu chặn luồng xác thực OTP — Owner
      // vẫn phải vào được tài khoản dù seed lỗi, chỉ log lại để xử lý sau.
      this.logger.error(
        `Seed dữ liệu mẫu cho tenant ${tenantId} thất bại: ${(err as Error).message}`,
      );
    }
  }

  private async run(
    tenantId: string,
    ownerUserId: string,
    businessName: string,
  ) {
    const today = this.startOfDay(new Date());

    const branch = await this.prisma.branch.create({
      data: {
        tenant_id: tenantId,
        code: 'chi-nhanh-chinh',
        name: `${businessName} - Chi nhánh chính`,
        status: 'ACTIVE',
      },
    });

    await this.prisma.service.createMany({
      data: [
        {
          tenant_id: tenantId,
          code: 'gym-co-ban',
          name: 'Gym cơ bản',
          description: 'Khu vực tập luyện tự do với đầy đủ máy móc',
        },
        {
          tenant_id: tenantId,
          code: 'yoga',
          name: 'Yoga',
          description: 'Lớp Yoga theo nhóm, lịch cố định hàng tuần',
        },
        {
          tenant_id: tenantId,
          code: 'personal-training-1-1',
          name: 'Personal Training 1-1',
          description: 'Huấn luyện cá nhân cùng PT riêng',
        },
      ],
    });

    const packageDefs = [
      {
        code: 'goi-1-thang',
        name: 'Gói 1 tháng',
        durationValue: 1,
        price: 500_000,
      },
      {
        code: 'goi-3-thang',
        name: 'Gói 3 tháng',
        durationValue: 3,
        price: 1_350_000,
      },
      {
        code: 'goi-6-thang',
        name: 'Gói 6 tháng',
        durationValue: 6,
        price: 2_400_000,
      },
    ] as const;

    const packages = await Promise.all(
      packageDefs.map((def) =>
        this.prisma.membershipPackage.create({
          data: {
            tenant_id: tenantId,
            code: def.code,
            name: def.name,
            package_type: 'MEMBERSHIP',
            duration_value: def.durationValue,
            duration_unit: 'MONTH',
            branch_access_scope: 'HOME_BRANCH',
            base_price: def.price,
            status: 'ACTIVE',
            created_by: ownerUserId,
          },
        }),
      ),
    );
    const [pkg1Month, pkg3Month] = packages;

    // PT mẫu — chỉ là hồ sơ hiển thị, không có email/mật khẩu (không thể
    // đăng nhập), tránh mọi rủi ro liên quan tới tài khoản/email thật.
    const ptRole = await this.prisma.roles.findUnique({
      where: { code: ROLE.PT },
    });
    const ptUser = await this.prisma.user.create({
      data: {
        tenant_id: tenantId,
        user_type: 'TENANT',
        full_name: 'Nguyễn Đức Thắng',
        status: 'ACTIVE',
        created_by: ownerUserId,
      },
    });
    if (ptRole) {
      await this.prisma.user_roles.create({
        data: {
          user_id: ptUser.id,
          role_id: ptRole.id,
          tenant_id: tenantId,
          assigned_by: ownerUserId,
        },
      });
    }
    await this.prisma.ptProfile.create({
      data: {
        user_id: ptUser.id,
        tenant_id: tenantId,
        employee_code: 'PT-01',
        bio: 'Huấn luyện viên thể hình, 5 năm kinh nghiệm.',
        specialties: ['Tăng cơ', 'Giảm mỡ'],
        experience_years: 5,
      },
    });

    const ptPlanActive = await this.prisma.pt_package_plans.create({
      data: {
        tenant_id: tenantId,
        pt_user_id: ptUser.id,
        name: 'Gói PT 10 buổi',
        session_count: 10,
        price: 2_000_000,
        validity_days: 90,
        status: 'ACTIVE',
        approved_by: ownerUserId,
        approved_at: new Date(),
      },
    });
    // Cố ý để một gói ở trạng thái "chờ duyệt" để Owner thấy ngay tính năng
    // duyệt/từ chối gói PT (OW-15) khi mới vào hệ thống.
    await this.prisma.pt_package_plans.create({
      data: {
        tenant_id: tenantId,
        pt_user_id: ptUser.id,
        name: 'Gói PT 20 buổi',
        session_count: 20,
        price: 3_600_000,
        validity_days: 180,
        status: 'PENDING_APPROVAL',
      },
    });

    const customerNames = [
      'Nguyễn Văn An',
      'Trần Thị Bình',
      'Lê Hoàng Cường',
      'Phạm Thị Dung',
      'Hoàng Văn Em',
      'Vũ Thị Hoa',
      'Đặng Văn Khoa',
      'Bùi Thị Lan',
      'Đỗ Văn Minh',
      'Ngô Thị Nga',
      'Dương Văn Phúc',
      'Lý Thị Quyên',
    ];
    const customers = await Promise.all(
      customerNames.map((name, i) =>
        this.prisma.customer.create({
          data: {
            tenant_id: tenantId,
            customer_code: `KH-${String(i + 1).padStart(3, '0')}`,
            full_name: name,
            phone: `090000${String(i + 1).padStart(4, '0')}`,
            home_branch_id: branch.id,
            status: 'ACTIVE',
            created_by: ownerUserId,
          },
        }),
      ),
    );

    let membershipSeq = 0;
    let paymentSeq = 0;
    const nextMembershipNo = () =>
      `HV-${String(++membershipSeq).padStart(3, '0')}`;
    const nextPaymentCode = () => `TT-${String(++paymentSeq).padStart(3, '0')}`;

    const createMembershipWithPayment = async (params: {
      customer: (typeof customers)[number];
      pkg: typeof pkg1Month;
      startDate: Date;
      status: 'SCHEDULED' | 'ACTIVE' | 'FROZEN' | 'EXPIRED';
      frozenDaysUsed?: number;
    }) => {
      const endDate = this.addMonths(
        params.startDate,
        params.pkg.duration_value,
      );
      const membership = await this.prisma.membership.create({
        data: {
          tenant_id: tenantId,
          customer_id: params.customer.id,
          package_id: params.pkg.id,
          branch_id: branch.id,
          membership_no: nextMembershipNo(),
          package_name_snapshot: params.pkg.name,
          price_snapshot: params.pkg.base_price,
          duration_value_snapshot: params.pkg.duration_value,
          duration_unit_snapshot: params.pkg.duration_unit,
          branch_access_scope_snapshot: params.pkg.branch_access_scope,
          start_date: params.startDate,
          end_date: endDate,
          status: params.status,
          frozen_days_used: params.frozenDaysUsed ?? 0,
          sold_by: ownerUserId,
          activated_at: params.status === 'SCHEDULED' ? null : params.startDate,
        },
      });

      await this.prisma.payment.create({
        data: {
          tenant_id: tenantId,
          branch_id: branch.id,
          customer_id: params.customer.id,
          payment_code: nextPaymentCode(),
          payment_type: 'MEMBERSHIP',
          subtotal: params.pkg.base_price,
          total_amount: params.pkg.base_price,
          method: 'CASH',
          status: 'PAID',
          paid_at: params.startDate,
          created_by: ownerUserId,
        },
      });

      return membership;
    };

    const createAttendance = async (params: {
      customer: (typeof customers)[number];
      membershipId: string;
      checkInAt: Date;
      checkedOut: boolean;
    }) => {
      const checkOutAt = params.checkedOut
        ? new Date(params.checkInAt.getTime() + 75 * 60_000)
        : null;
      await this.prisma.attendances.create({
        data: {
          tenant_id: tenantId,
          branch_id: branch.id,
          customer_id: params.customer.id,
          attendance_type: 'MEMBER',
          membership_id: params.membershipId,
          check_in_at: params.checkInAt,
          check_in_method: 'QR',
          check_in_by: ownerUserId,
          check_out_at: checkOutAt,
          check_out_method: checkOutAt ? 'QR' : null,
          check_out_by: checkOutAt ? ownerUserId : null,
          status: params.checkedOut ? 'CHECKED_OUT' : 'CHECKED_IN',
        },
      });
    };

    // customer 1 — ACTIVE, đang check-in (để lên KPI "Đang tập")
    const m1 = await createMembershipWithPayment({
      customer: customers[0],
      pkg: pkg1Month,
      startDate: this.addDays(today, -10),
      status: 'ACTIVE',
    });
    await createAttendance({
      customer: customers[0],
      membershipId: m1.id,
      checkInAt: this.addDays(today, -4),
      checkedOut: true,
    });
    await createAttendance({
      customer: customers[0],
      membershipId: m1.id,
      checkInAt: this.addDays(today, -2),
      checkedOut: true,
    });
    await createAttendance({
      customer: customers[0],
      membershipId: m1.id,
      checkInAt: today,
      checkedOut: false,
    });

    // customer 2 — ACTIVE, gói 3 tháng
    const m2 = await createMembershipWithPayment({
      customer: customers[1],
      pkg: pkg3Month,
      startDate: this.addDays(today, -20),
      status: 'ACTIVE',
    });
    await createAttendance({
      customer: customers[1],
      membershipId: m2.id,
      checkInAt: this.addDays(today, -6),
      checkedOut: true,
    });
    await createAttendance({
      customer: customers[1],
      membershipId: m2.id,
      checkInAt: this.addDays(today, -1),
      checkedOut: true,
    });

    // customer 3 — ACTIVE, mới mua
    const m3 = await createMembershipWithPayment({
      customer: customers[2],
      pkg: pkg1Month,
      startDate: this.addDays(today, -5),
      status: 'ACTIVE',
    });
    await createAttendance({
      customer: customers[2],
      membershipId: m3.id,
      checkInAt: today,
      checkedOut: true,
    });

    // customer 4 — ACTIVE, gói 3 tháng, đã dùng được một thời gian
    const m4 = await createMembershipWithPayment({
      customer: customers[3],
      pkg: pkg3Month,
      startDate: this.addDays(today, -40),
      status: 'ACTIVE',
    });
    await createAttendance({
      customer: customers[3],
      membershipId: m4.id,
      checkInAt: this.addDays(today, -8),
      checkedOut: true,
    });
    await createAttendance({
      customer: customers[3],
      membershipId: m4.id,
      checkInAt: this.addDays(today, -3),
      checkedOut: true,
    });

    // customer 5 — ACTIVE, vừa mua hôm nay
    const m5 = await createMembershipWithPayment({
      customer: customers[4],
      pkg: pkg1Month,
      startDate: this.addDays(today, -2),
      status: 'ACTIVE',
    });
    await createAttendance({
      customer: customers[4],
      membershipId: m5.id,
      checkInAt: today,
      checkedOut: true,
    });

    // customer 6 — FROZEN (đóng băng)
    await createMembershipWithPayment({
      customer: customers[5],
      pkg: pkg3Month,
      startDate: this.addDays(today, -15),
      status: 'FROZEN',
      frozenDaysUsed: 5,
    });

    // customer 7, 8 — EXPIRED (đã hết hạn)
    const m7 = await createMembershipWithPayment({
      customer: customers[6],
      pkg: pkg1Month,
      startDate: this.addDays(today, -60),
      status: 'EXPIRED',
    });
    await createAttendance({
      customer: customers[6],
      membershipId: m7.id,
      checkInAt: this.addDays(today, -55),
      checkedOut: true,
    });
    const m8 = await createMembershipWithPayment({
      customer: customers[7],
      pkg: pkg3Month,
      startDate: this.addDays(today, -150),
      status: 'EXPIRED',
    });
    await createAttendance({
      customer: customers[7],
      membershipId: m8.id,
      checkInAt: this.addDays(today, -140),
      checkedOut: true,
    });

    // customer 9 — SCHEDULED (sắp bắt đầu, thanh toán trước)
    await createMembershipWithPayment({
      customer: customers[8],
      pkg: pkg1Month,
      startDate: this.addDays(today, 3),
      status: 'SCHEDULED',
    });

    // customer 10 — ACTIVE membership + gói PT đang dùng + lịch tập
    const m10 = await createMembershipWithPayment({
      customer: customers[9],
      pkg: pkg3Month,
      startDate: this.addDays(today, -8),
      status: 'ACTIVE',
    });
    await createAttendance({
      customer: customers[9],
      membershipId: m10.id,
      checkInAt: this.addDays(today, -1),
      checkedOut: true,
    });

    const ptPackage = await this.prisma.customer_pt_packages.create({
      data: {
        tenant_id: tenantId,
        customer_id: customers[9].id,
        pt_user_id: ptUser.id,
        plan_id: ptPlanActive.id,
        branch_id: branch.id,
        plan_name_snapshot: ptPlanActive.name,
        pt_name_snapshot: ptUser.full_name,
        price_snapshot: ptPlanActive.price,
        total_sessions: ptPlanActive.session_count,
        used_sessions: 2,
        start_date: this.addDays(today, -8),
        expiry_date: this.addDays(today, 82),
        status: 'ACTIVE',
        sold_by: ownerUserId,
      },
    });
    await this.prisma.payment.create({
      data: {
        tenant_id: tenantId,
        branch_id: branch.id,
        customer_id: customers[9].id,
        payment_code: nextPaymentCode(),
        payment_type: 'PT_PACKAGE',
        subtotal: ptPlanActive.price,
        total_amount: ptPlanActive.price,
        method: 'BANK_TRANSFER',
        status: 'PAID',
        paid_at: this.addDays(today, -8),
        created_by: ownerUserId,
      },
    });
    await this.prisma.ptBooking.create({
      data: {
        tenant_id: tenantId,
        branch_id: branch.id,
        pt_user_id: ptUser.id,
        customer_id: customers[9].id,
        customer_pt_package_id: ptPackage.id,
        scheduled_start: this.addDays(today, -3),
        scheduled_end: this.addHours(this.addDays(today, -3), 1),
        status: 'COMPLETED',
        completed_at: this.addDays(today, -3),
        completed_by: ownerUserId,
        created_by: ownerUserId,
      },
    });
    await this.prisma.ptBooking.create({
      data: {
        tenant_id: tenantId,
        branch_id: branch.id,
        pt_user_id: ptUser.id,
        customer_id: customers[9].id,
        customer_pt_package_id: ptPackage.id,
        scheduled_start: this.addHours(this.addDays(today, 1), 9),
        scheduled_end: this.addHours(this.addDays(today, 1), 10),
        status: 'SCHEDULED',
        created_by: ownerUserId,
      },
    });

    // customer 11 — ACTIVE, mới tập vài hôm
    const m11 = await createMembershipWithPayment({
      customer: customers[10],
      pkg: pkg1Month,
      startDate: this.addDays(today, -1),
      status: 'ACTIVE',
    });
    await createAttendance({
      customer: customers[10],
      membershipId: m11.id,
      checkInAt: this.addDays(today, -1),
      checkedOut: true,
    });
    await createAttendance({
      customer: customers[10],
      membershipId: m11.id,
      checkInAt: today,
      checkedOut: true,
    });

    // customer 12 — khách mới, chưa mua gói (để thấy trạng thái "chưa có Membership")
  }

  private startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  private addMonths(date: Date, months: number) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  }

  private addHours(date: Date, hours: number) {
    const d = new Date(date);
    d.setHours(d.getHours() + hours);
    return d;
  }
}
