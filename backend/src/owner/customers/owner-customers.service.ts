import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, parsePagination } from '../../common/utils/pagination';
import { QueryCustomersDto } from './dto/query-customers.dto';

const LIVE_MEMBERSHIP_STATUSES = ['SCHEDULED', 'ACTIVE', 'FROZEN'] as const;

@Injectable()
export class OwnerCustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, query: QueryCustomersDto) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const typeFilter =
      query.type === 'GUEST'
        ? { customer_code: { startsWith: 'GUEST' } }
        : query.type === 'MEMBER'
        ? { NOT: { customer_code: { startsWith: 'GUEST' } } }
        : {};

    const where = {
      tenant_id: tenantId,
      ...typeFilter,
      ...(query.status ? { status: query.status } : {}),
      ...(query.branchId ? { home_branch_id: query.branchId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                full_name: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              { phone: { contains: query.search } },
              { customer_code: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [items, total, memberCount, guestCount, newThisMonth] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        include: {
          branches: { select: { name: true } },
          memberships: {
            where: { status: { in: [...LIVE_MEMBERSHIP_STATUSES] } },
            orderBy: { created_at: 'desc' },
            take: 1,
            select: {
              package_name_snapshot: true,
              status: true,
              start_date: true,
              end_date: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.customer.count({ where }),
      this.prisma.customer.count({
        where: { tenant_id: tenantId, NOT: { customer_code: { startsWith: 'GUEST' } } },
      }),
      this.prisma.customer.count({
        where: { tenant_id: tenantId, customer_code: { startsWith: 'GUEST' } },
      }),
      this.prisma.customer.count({
        where: {
          tenant_id: tenantId,
          created_at: { gte: startOfMonth },
        },
      }),
    ]);

    const paginated = paginate(
      items.map((c) => ({
        id: c.id,
        customerCode: c.customer_code,
        fullName: c.full_name,
        phone: c.phone,
        status: c.status,
        homeBranchName: c.branches?.name ?? null,
        currentMembership: c.memberships[0]
          ? {
              packageName: c.memberships[0].package_name_snapshot,
              status: c.memberships[0].status,
              startDate: c.memberships[0].start_date,
              endDate: c.memberships[0].end_date,
            }
          : null,
      })),
      total,
      page,
      pageSize,
    );

    return {
      ...paginated,
      stats: {
        total: memberCount + guestCount,
        memberCount,
        guestCount,
        newThisMonth,
      },
    };
  }

  async get(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenant_id: tenantId },
      include: { branches: { select: { name: true } } },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');

    const [memberships, ptPackages, attendances, payments] = await Promise.all([
      this.prisma.membership.findMany({
        where: { tenant_id: tenantId, customer_id: id },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          package_name_snapshot: true,
          start_date: true,
          end_date: true,
          status: true,
          price_snapshot: true,
        },
      }),
      this.prisma.customer_pt_packages.findMany({
        where: { tenant_id: tenantId, customer_id: id },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          plan_name_snapshot: true,
          pt_name_snapshot: true,
          total_sessions: true,
          used_sessions: true,
          status: true,
        },
      }),
      this.prisma.attendances.findMany({
        where: { tenant_id: tenantId, customer_id: id },
        orderBy: { check_in_at: 'desc' },
        take: 10,
        include: { branches: { select: { name: true } } },
      }),
      this.prisma.payment.findMany({
        where: { tenant_id: tenantId, customer_id: id },
        orderBy: { created_at: 'desc' },
        take: 10,
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
      status: customer.status,
      homeBranchName: customer.branches?.name ?? null,
      createdAt: customer.created_at,
      memberships: memberships.map((m) => ({
        id: m.id,
        packageName: m.package_name_snapshot,
        startDate: m.start_date,
        endDate: m.end_date,
        status: m.status,
        price: m.price_snapshot,
      })),
      ptPackages: ptPackages.map((p) => ({
        id: p.id,
        planName: p.plan_name_snapshot,
        ptName: p.pt_name_snapshot,
        totalSessions: p.total_sessions,
        usedSessions: p.used_sessions,
        status: p.status,
      })),
      recentCheckins: attendances.map((a) => ({
        id: a.id,
        branchName: a.branches.name,
        checkInAt: a.check_in_at,
        checkOutAt: a.check_out_at,
        method: a.check_in_method,
        status: a.status,
      })),
      recentPayments: payments.map((p) => ({
        id: p.id,
        paymentCode: p.payment_code,
        totalAmount: p.total_amount,
        status: p.status,
        paidAt: p.paid_at,
      })),
    };
  }
}
