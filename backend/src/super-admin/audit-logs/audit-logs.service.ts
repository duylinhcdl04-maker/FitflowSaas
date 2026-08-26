import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, parsePagination } from '../../common/utils/pagination';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryAuditLogsDto) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where = {
      ...(query.tenantId ? { tenant_id: query.tenantId } : {}),
      ...(query.entityType ? { entity_type: query.entityType } : {}),
      ...(query.actorUserId ? { actor_user_id: query.actorUserId } : {}),
      ...(query.from || query.to
        ? {
            occurred_at: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { occurred_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    // AuditLog.id is a BigInt (autoincrement) — stringify it, Express/JSON can't serialize BigInt.
    const items = rows.map((row) => ({ ...row, id: row.id.toString() }));

    return paginate(items, total, page, pageSize);
  }
}
