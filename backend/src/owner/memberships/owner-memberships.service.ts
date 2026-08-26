import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, parsePagination } from '../../common/utils/pagination';
import { QueryMembershipsDto } from './dto/query-memberships.dto';

@Injectable()
export class OwnerMembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, query: QueryMembershipsDto) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = {
      tenant_id: tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.branchId ? { branch_id: query.branchId } : {}),
      ...(query.search
        ? {
            customers: {
              full_name: {
                contains: query.search,
                mode: 'insensitive' as const,
              },
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.membership.findMany({
        where,
        include: {
          customers: { select: { id: true, full_name: true } },
          branches: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.membership.count({ where }),
    ]);

    return paginate(
      items.map((m) => ({
        id: m.id,
        membershipNo: m.membership_no,
        customerId: m.customers.id,
        customerName: m.customers.full_name,
        branchName: m.branches.name,
        packageName: m.package_name_snapshot,
        startDate: m.start_date,
        endDate: m.end_date,
        status: m.status,
        price: m.price_snapshot,
      })),
      total,
      page,
      pageSize,
    );
  }
}
