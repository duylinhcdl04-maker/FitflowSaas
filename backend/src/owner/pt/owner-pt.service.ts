import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import { paginate, parsePagination } from '../../common/utils/pagination';
import type { RequestUser } from '../../common/types/jwt-payload';
import { RejectPackageDto } from './dto/reject-package.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';

const ACTIVE_BOOKING_STATUSES = ['SCHEDULED', 'COMPLETED'] as const;

// OW-15. Owner "nhìn tổng thể, không nhất thiết trực tiếp thao tác lịch cho
// từng buổi" (BE_Owner.md mục XIV) — mọi thứ ở đây là đọc, TRỪ approve/reject
// PT Package (BR-PT-APPROVE-01: gói PT cần Owner duyệt giá trước khi bán).
@Injectable()
export class OwnerPtService {
  constructor(private readonly prisma: PrismaService) {}

  async listPts(tenantId: string) {
    const profiles = await this.prisma.ptProfile.findMany({
      where: { tenant_id: tenantId },
      include: {
        users: { select: { id: true, full_name: true, status: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    return Promise.all(
      profiles.map(async (p) => {
        const [activeCustomers, todaySessions] = await Promise.all([
          this.prisma.customer_pt_packages.count({
            where: {
              tenant_id: tenantId,
              pt_user_id: p.user_id,
              status: 'ACTIVE',
            },
          }),
          this.prisma.ptBooking.count({
            where: {
              tenant_id: tenantId,
              pt_user_id: p.user_id,
              scheduled_start: { gte: todayStart, lt: todayEnd },
              status: { in: [...ACTIVE_BOOKING_STATUSES] },
            },
          }),
        ]);
        return {
          userId: p.user_id,
          fullName: p.users.full_name,
          status: p.users.status,
          specialties: p.specialties,
          experienceYears: p.experience_years,
          activeCustomers,
          todaySessions,
        };
      }),
    );
  }

  listPackagePlans(tenantId: string, status?: string) {
    return this.prisma.pt_package_plans
      .findMany({
        where: { tenant_id: tenantId, ...(status ? { status } : {}) },
        include: {
          pt_profiles: { include: { users: { select: { full_name: true } } } },
        },
        orderBy: { created_at: 'desc' },
      })
      .then((plans) =>
        plans.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          ptName: p.pt_profiles.users.full_name,
          sessionCount: p.session_count,
          price: p.price,
          validityDays: p.validity_days,
          status: p.status,
          rejectReason: p.reject_reason,
          createdAt: p.created_at,
        })),
      );
  }

  async approvePackagePlan(tenantId: string, id: string, actor: RequestUser) {
    const plan = await this.prisma.pt_package_plans.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy gói PT');
    if (plan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Chỉ có thể duyệt gói đang chờ duyệt');
    }

    const updated = await this.prisma.pt_package_plans.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        approved_by: actor.id,
        approved_at: new Date(),
        reject_reason: null,
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PT_PACKAGE_PLAN',
      entityId: id,
      action: 'PT_PACKAGE_APPROVED',
      beforeData: { status: plan.status },
      afterData: { status: 'ACTIVE' },
    });

    return updated;
  }

  async rejectPackagePlan(
    tenantId: string,
    id: string,
    dto: RejectPackageDto,
    actor: RequestUser,
  ) {
    const plan = await this.prisma.pt_package_plans.findFirst({
      where: { id, tenant_id: tenantId },
    });
    if (!plan) throw new NotFoundException('Không tìm thấy gói PT');
    if (plan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Chỉ có thể từ chối gói đang chờ duyệt');
    }

    const updated = await this.prisma.pt_package_plans.update({
      where: { id },
      data: { status: 'REJECTED', reject_reason: dto.reason },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PT_PACKAGE_PLAN',
      entityId: id,
      action: 'PT_PACKAGE_REJECTED',
      beforeData: { status: plan.status },
      afterData: { status: 'REJECTED' },
      reason: dto.reason,
    });

    return updated;
  }

  async listBookings(tenantId: string, query: QueryBookingsDto) {
    const { page, pageSize, skip, take } = parsePagination(query);

    let dateFilter: { gte: Date; lt: Date } | undefined;
    if (query.date) {
      const start = new Date(query.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      dateFilter = { gte: start, lt: end };
    }

    const where = {
      tenant_id: tenantId,
      ...(query.branchId ? { branch_id: query.branchId } : {}),
      ...(query.ptUserId ? { pt_user_id: query.ptUserId } : {}),
      ...(dateFilter ? { scheduled_start: dateFilter } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.ptBooking.findMany({
        where,
        include: {
          customers: { select: { full_name: true } },
          branches: { select: { name: true } },
        },
        orderBy: { scheduled_start: 'asc' },
        skip,
        take,
      }),
      this.prisma.ptBooking.count({ where }),
    ]);

    const ptUserIds = [...new Set(items.map((b) => b.pt_user_id))];
    const ptUsers = ptUserIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: ptUserIds } },
          select: { id: true, full_name: true },
        })
      : [];
    const ptNameById = new Map(ptUsers.map((u) => [u.id, u.full_name]));

    return paginate(
      items.map((b) => ({
        id: b.id,
        customerName: b.customers.full_name,
        branchName: b.branches.name,
        ptName: ptNameById.get(b.pt_user_id) ?? '—',
        scheduledStart: b.scheduled_start,
        scheduledEnd: b.scheduled_end,
        status: b.status,
      })),
      total,
      page,
      pageSize,
    );
  }
}
