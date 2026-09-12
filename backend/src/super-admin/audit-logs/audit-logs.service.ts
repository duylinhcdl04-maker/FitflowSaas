import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate, parsePagination } from '../../common/utils/pagination';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';

const EXCLUDED_INTERNAL_ENTITIES = [
  'Attendance',
  'attendances',
  'Customer',
  'customers',
  'Membership',
  'memberships',
  'PtBooking',
  'pt_bookings',
  'CustomerInbody',
  'customer_inbody_records',
  'PtPackage',
  'customer_pt_packages',
  'GuestVisit',
  'guest_visits',
  'Payment',
  'payments',
  'Checkin',
  'checkins',
];

const EXCLUDED_INTERNAL_ACTIONS = [
  'FACE_CHECKIN',
  'MANUAL_CHECKIN',
  'MANUAL_CHECKOUT',
  'FACE_CHECKOUT',
  'QR_CHECKIN',
  'QR_CHECKOUT',
  'CHECKIN',
  'CHECKOUT',
];

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: QueryAuditLogsDto) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const where: any = {
      NOT: [
        { entity_type: { in: EXCLUDED_INTERNAL_ENTITIES } },
        { action: { in: EXCLUDED_INTERNAL_ACTIONS } },
      ],
      ...(query.tenantId
        ? {
            tenant_id: query.tenantId,
            OR: [
              { actor_role: 'SUPER_ADMIN' },
              {
                entity_type: {
                  in: [
                    'Tenant',
                    'SaasPlan',
                    'Subscription',
                    'SaasSubscription',
                    'SupportSession',
                  ],
                },
              },
            ],
          }
        : {
            OR: [{ tenant_id: null }, { actor_role: 'SUPER_ADMIN' }],
          }),
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
