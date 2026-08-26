import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, parsePagination } from '../../common/utils/pagination';
import { QueryCheckinDto } from './dto/query-checkin.dto';

@Injectable()
export class OwnerCheckinService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(tenantId: string, query: QueryCheckinDto) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const where = {
      tenant_id: tenantId,
      ...(query.branchId ? { branch_id: query.branchId } : {}),
      ...(query.type ? { attendance_type: query.type } : {}),
      ...(query.method ? { check_in_method: query.method } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            customers: {
              OR: [
                { full_name: { contains: query.search, mode: 'insensitive' as const } },
                { phone: { contains: query.search } },
                { customer_code: { contains: query.search, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}),
    };

    const [totalToday, memberToday, guestToday, currentlyInGym, items, total] =
      await Promise.all([
        this.prisma.attendances.count({
          where: {
            tenant_id: tenantId,
            check_in_at: { gte: todayStart, lt: todayEnd },
            status: { not: 'CANCELLED' },
          },
        }),
        this.prisma.attendances.count({
          where: {
            tenant_id: tenantId,
            attendance_type: 'MEMBER',
            check_in_at: { gte: todayStart, lt: todayEnd },
            status: { not: 'CANCELLED' },
          },
        }),
        this.prisma.attendances.count({
          where: {
            tenant_id: tenantId,
            attendance_type: 'GUEST',
            check_in_at: { gte: todayStart, lt: todayEnd },
            status: { not: 'CANCELLED' },
          },
        }),
        this.prisma.attendances.count({
          where: { tenant_id: tenantId, status: 'CHECKED_IN' },
        }),
        this.prisma.attendances.findMany({
          where,
          orderBy: { check_in_at: 'desc' },
          include: {
            customers: { select: { id: true, full_name: true, phone: true, customer_code: true } },
            branches: { select: { id: true, name: true } },
          },
          skip,
          take,
        }),
        this.prisma.attendances.count({ where }),
      ]);

    return {
      today: {
        total: totalToday,
        members: memberToday,
        guests: guestToday,
        currentlyInGym,
      },
      list: paginate(
        items.map((a) => ({
          id: a.id,
          customerId: a.customers.id,
          customerName: a.customers.full_name,
          customerPhone: a.customers.phone,
          customerCode: a.customers.customer_code,
          branchId: a.branches.id,
          branchName: a.branches.name,
          type: a.attendance_type,
          checkInAt: a.check_in_at,
          checkOutAt: a.check_out_at,
          method: a.check_in_method,
          status: a.status,
        })),
        total,
        page,
        pageSize,
      ),
    };
  }
}
