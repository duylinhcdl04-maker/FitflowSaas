import { apiClient } from './client';
import type { Paginated } from './types';

export const SUPPORT_SESSION_SCOPES = ['CONFIG', 'CUSTOMERS', 'BILLING', 'ATTENDANCE'] as const;
export type SupportSessionScope = (typeof SUPPORT_SESSION_SCOPES)[number];

export const SUPPORT_SESSION_DURATIONS = [30, 120, 480] as const;

export interface SupportSession {
  id: string;
  tenant_id: string;
  actor_user_id: string;
  target_user_id: string;
  access_level: 'READ_ONLY' | 'WRITE';
  scope: SupportSessionScope[];
  reason: string;
  status: 'ACTIVE' | 'ENDED' | 'EXPIRED';
  started_at: string;
  expires_at: string;
  ended_at: string | null;
  ended_by: string | null;
  end_reason: string | null;
  tenants: { id: string; name: string; code: string };
}

export interface ListSupportSessionsParams {
  tenantId?: string;
  page?: number;
  pageSize?: number;
}

export function listSupportSessions(params: ListSupportSessionsParams) {
  return apiClient
    .get<Paginated<SupportSession>>('/super-admin/support-sessions', { params })
    .then((r) => r.data);
}

export function endSupportSession(id: string, reason?: string) {
  return apiClient
    .post<SupportSession>(`/super-admin/support-sessions/${id}/end`, { reason })
    .then((r) => r.data);
}
