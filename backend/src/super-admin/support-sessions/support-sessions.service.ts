import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import { paginate, parsePagination } from '../../common/utils/pagination';
import type { RequestUser } from '../../common/types/jwt-payload';
import { QuerySupportSessionsDto } from './dto/query-support-sessions.dto';
import { EndSupportSessionDto } from './dto/end-support-session.dto';

const SESSION_INCLUDE = {
  tenants: { select: { id: true, name: true, code: true } },
} as const;

/**
 * SA-17 hardening (BR-SA-003/004/005). This service owns the *lifecycle and
 * history* of a support session — persistence, expiry, early end, listing so
 * an Owner-facing surface can eventually read it back.
 *
 * What this deliberately does NOT do: enforce read-only at the DB/route layer
 * (the doc's "chặn ở tầng DB, không phải tầng ứng dụng"). This codebase has no
 * tenant-facing API yet (no Owner/Staff/PT controllers exist to protect —
 * only auth + super-admin/* exist today), so there is nothing for a
 * least-privilege Postgres role or a read-only guard to actually gate. Wiring
 * that enforcement now would be dead code with no caller. Build it once the
 * tenant-facing API ships; until then the doc's own fallback applies (§VI):
 * discipline via a recorded, time-boxed, reasoned session is better than no
 * boundary at all.
 */
@Injectable()
export class SupportSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: {
    tenantId: string;
    actorUserId: string;
    targetUserId: string;
    readOnly: boolean;
    scope: string[];
    reason: string;
    expiresAt: Date;
  }) {
    return this.prisma.supportSession.create({
      data: {
        tenant_id: params.tenantId,
        actor_user_id: params.actorUserId,
        target_user_id: params.targetUserId,
        access_level: params.readOnly ? 'READ_ONLY' : 'WRITE',
        scope: params.scope,
        reason: params.reason,
        status: 'ACTIVE',
        expires_at: params.expiresAt,
      },
    });
  }

  async list(query: QuerySupportSessionsDto) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = query.tenantId ? { tenant_id: query.tenantId } : {};

    const [rows, total] = await Promise.all([
      this.prisma.supportSession.findMany({
        where,
        include: SESSION_INCLUDE,
        orderBy: { started_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.supportSession.count({ where }),
    ]);

    return paginate(
      await Promise.all(rows.map((r) => this.withLiveStatus(r))),
      total,
      page,
      pageSize,
    );
  }

  async get(id: string) {
    const session = await this.prisma.supportSession.findUnique({
      where: { id },
      include: SESSION_INCLUDE,
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên hỗ trợ');
    return this.withLiveStatus(session);
  }

  async end(id: string, dto: EndSupportSessionDto, actor: RequestUser) {
    const session = await this.prisma.supportSession.findUnique({
      where: { id },
    });
    if (!session) throw new NotFoundException('Không tìm thấy phiên hỗ trợ');
    if (session.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Phiên hỗ trợ này đã kết thúc hoặc đã hết hạn',
      );
    }

    const updated = await this.prisma.supportSession.update({
      where: { id },
      data: {
        status: 'ENDED',
        ended_at: new Date(),
        ended_by: actor.id,
        end_reason: dto.reason ?? null,
      },
      include: SESSION_INCLUDE,
    });

    await writeAuditLog(this.prisma, {
      tenantId: session.tenant_id,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SUPPORT_SESSION',
      entityId: id,
      action: 'SUPPORT_SESSION_ENDED',
      reason: dto.reason ?? null,
      supportSessionId: id,
    });

    return updated;
  }

  /** Lazily flips ACTIVE -> EXPIRED once past expires_at, so history stays accurate without a background job. */
  private async withLiveStatus<
    T extends { id: string; status: string; expires_at: Date },
  >(session: T): Promise<T> {
    if (
      session.status === 'ACTIVE' &&
      session.expires_at.getTime() < Date.now()
    ) {
      await this.prisma.supportSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      return { ...session, status: 'EXPIRED' };
    }
    return session;
  }
}
