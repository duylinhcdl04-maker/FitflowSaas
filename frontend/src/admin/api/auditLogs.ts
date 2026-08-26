import { apiClient } from './client';
import type { Paginated } from './types';

export interface AuditLogEntry {
  id: string;
  tenant_id: string | null;
  actor_user_id: string | null;
  actor_role: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  before_data: unknown;
  after_data: unknown;
  reason: string | null;
  occurred_at: string;
}

export interface ListAuditLogsParams {
  tenantId?: string;
  entityType?: string;
  actorUserId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export function listAuditLogs(params: ListAuditLogsParams) {
  return apiClient
    .get<Paginated<AuditLogEntry>>('/super-admin/audit-logs', { params })
    .then((r) => r.data);
}
