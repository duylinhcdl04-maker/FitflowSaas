import { NotFoundException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from '../../auth/auth.service';
import { SupportSessionsService } from '../support-sessions/support-sessions.service';
import { writeAuditLog } from '../../common/utils/audit';
import { ROLE } from '../../common/types/role';
import type { JwtPayload, RequestUser } from '../../common/types/jwt-payload';
import { StartImpersonationDto } from './dto/start-impersonation.dto';

const DEFAULT_DURATION_MINUTES = 30;

@Injectable()
export class ImpersonationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly supportSessionsService: SupportSessionsService,
  ) {}

  async start(
    tenantId: string,
    dto: StartImpersonationDto,
    actor: RequestUser,
  ) {
    const readOnly = dto.readOnly ?? true;
    const durationMinutes = dto.durationMinutes ?? DEFAULT_DURATION_MINUTES;
    const scope = dto.scope ?? [];

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Không tìm thấy Tenant');

    const target = dto.targetUserId
      ? await this.prisma.user.findFirst({
          where: { id: dto.targetUserId, tenant_id: tenantId },
        })
      : await this.findOwner(tenantId);

    if (!target) {
      throw new NotFoundException(
        dto.targetUserId
          ? 'Không tìm thấy người dùng trong Tenant này'
          : 'Tenant chưa có tài khoản Owner để hỗ trợ',
      );
    }

    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const session = await this.supportSessionsService.create({
      tenantId,
      actorUserId: actor.id,
      targetUserId: target.id,
      readOnly,
      scope,
      reason: dto.reason,
      expiresAt,
    });

    const roles = await this.authService.rolesFor(target.id);

    const payload: JwtPayload = {
      sub: target.id,
      tenantId: target.tenant_id,
      userType: target.user_type as JwtPayload['userType'],
      roles,
      impersonation: {
        by: actor.id,
        reason: dto.reason,
        readOnly,
        sessionId: session.id,
      },
    };
    const accessToken = this.authService.signImpersonationToken(
      payload,
      `${durationMinutes}m`,
    );

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'SUPPORT_SESSION',
      entityId: session.id,
      action: 'IMPERSONATION_STARTED',
      reason: dto.reason,
      afterData: {
        targetUserId: target.id,
        targetEmail: target.email,
        readOnly,
        scope,
        durationMinutes,
      },
      supportSessionId: session.id,
    });

    return {
      sessionId: session.id,
      accessToken,
      expiresInMinutes: durationMinutes,
      readOnly,
      scope,
      target: {
        id: target.id,
        fullName: target.full_name,
        email: target.email,
        roles,
      },
    };
  }

  private findOwner(tenantId: string) {
    return this.prisma.user.findFirst({
      where: {
        tenant_id: tenantId,
        status: 'ACTIVE',
        user_roles: { some: { roles: { code: ROLE.OWNER } } },
      },
    });
  }
}
