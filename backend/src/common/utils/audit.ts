import { PrismaService } from '../../prisma/prisma.service';

interface AuditParams {
  tenantId?: string | null;
  actorUserId?: string | null;
  actorRole?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  beforeData?: unknown;
  afterData?: unknown;
  reason?: string | null;
  // SA-17: ties this entry to the support session it was performed under, so a
  // session's history can eventually be reconstructed from audit_logs.
  supportSessionId?: string | null;
}

/** BR-GLOBAL-004 / BR-SA: sensitive platform changes must leave an audit trail, never a silent update. */
export function writeAuditLog(prisma: PrismaService, params: AuditParams) {
  return prisma.auditLog.create({
    data: {
      tenant_id: params.tenantId ?? null,
      actor_user_id: params.actorUserId ?? null,
      actor_role: params.actorRole ?? null,
      entity_type: params.entityType,
      entity_id: params.entityId ?? null,
      action: params.action,
      before_data: params.beforeData ?? undefined,
      after_data: params.afterData ?? undefined,
      reason: params.reason ?? null,
      support_session_id: params.supportSessionId ?? null,
    },
  });
}
