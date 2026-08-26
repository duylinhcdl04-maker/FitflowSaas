import { apiClient } from './client';
import type { Paginated } from './types';

export type TenantStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface SaasPlanSummary {
  id: string;
  code: string;
  name: string;
  price: string;
  currency: string;
  billing_cycle: string;
  billing_cycle_months: number | null;
}

export interface SubscriptionSummary {
  id: string;
  status: string;
  start_date: string;
  end_date: string;
  trial_ends_at: string | null;
  price: string;
  currency: string;
  billing_cycle: string;
  billing_cycle_months: number | null;
  saas_plans: SaasPlanSummary;
}

export interface Tenant {
  id: string;
  code: string;
  name: string;
  legal_name: string | null;
  tax_code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  logo_url: string | null;
  status: TenantStatus;
  suspended_at: string | null;
  suspended_reason: string | null;
  data_retention_days: number | null;
  created_at: string;
  updated_at: string;
  subscriptions?: SubscriptionSummary;
  _count?: { branches: number; users: number; customers: number };
}

// SA-03 Tab "Gói & Thuê bao" three-layer feature table row.
export interface FeatureMatrixRow {
  code: string;
  name: string;
  plan: { isEnabled: boolean; quota: number | null } | null;
  snapshot: { isEnabled: boolean; quota: number | null } | null;
  override: { isEnabled: boolean; quota: number | null } | null;
  effective: { isEnabled: boolean; quota: number | null } | null;
  outOfSyncWithPlan: boolean;
}

// SA-03 Tab "Hạn mức" row.
export interface QuotaRow {
  code: string;
  used: number;
  limit: number | null; // null = unlimited
}

// SA-03 Tab "Gói & Thuê bao" lifecycle timeline entry.
export interface TimelineEntry {
  at: string;
  label: string;
  actorRole: string | null;
  reason: string | null;
}

export interface TenantDetail extends Tenant {
  featureMatrix: FeatureMatrixRow[];
  quotas: QuotaRow[];
  timeline: TimelineEntry[];
}

export interface TenantUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  lastLoginAt: string | null;
  roles: string[];
}

export interface TenantBranch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  status: string;
  activeCustomers: number;
}

export interface ListTenantsParams {
  status?: TenantStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function listTenants(params: ListTenantsParams) {
  return apiClient
    .get<Paginated<Tenant>>('/super-admin/tenants', { params })
    .then((res) => res.data);
}

export function getTenant(id: string) {
  return apiClient.get<TenantDetail>(`/super-admin/tenants/${id}`).then((res) => res.data);
}

export function listTenantUsers(id: string) {
  return apiClient.get<TenantUser[]>(`/super-admin/tenants/${id}/users`).then((res) => res.data);
}

export function listTenantBranches(id: string) {
  return apiClient.get<TenantBranch[]>(`/super-admin/tenants/${id}/branches`).then((res) => res.data);
}

export interface CreateTenantPayload {
  name: string;
  code: string;
  legalName?: string;
  taxCode?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  planCode: string;
  owner: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
  };
}

export function createTenant(payload: CreateTenantPayload) {
  return apiClient.post('/super-admin/tenants', payload).then((res) => res.data);
}

export interface UpdateTenantPayload {
  name?: string;
  legalName?: string;
  taxCode?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoUrl?: string;
  dataRetentionDays?: number;
}

export function updateTenant(id: string, payload: UpdateTenantPayload) {
  return apiClient.patch<Tenant>(`/super-admin/tenants/${id}`, payload).then((res) => res.data);
}

export function changeTenantStatus(id: string, status: TenantStatus, reason?: string) {
  return apiClient
    .patch<Tenant>(`/super-admin/tenants/${id}/status`, { status, reason })
    .then((res) => res.data);
}

export function startImpersonation(
  tenantId: string,
  reason: string,
  options?: {
    targetUserId?: string;
    readOnly?: boolean;
    scope?: string[];
    durationMinutes?: number;
  },
) {
  return apiClient
    .post<{
      sessionId: string;
      accessToken: string;
      expiresInMinutes: number;
      readOnly: boolean;
      scope: string[];
      target: { id: string; fullName: string; email: string; roles: string[] };
    }>(`/super-admin/tenants/${tenantId}/impersonation`, {
      reason,
      targetUserId: options?.targetUserId,
      readOnly: options?.readOnly,
      scope: options?.scope,
      durationMinutes: options?.durationMinutes,
    })
    .then((res) => res.data);
}

/** SA-03 Tab "Người dùng" exception: Owner mất quyền truy cập. Xem doc comment ở backend. */
export function resetOwnerPassword(tenantId: string, reason: string) {
  return apiClient
    .post<{ ownerEmail: string; ownerFullName: string; temporaryPassword: string }>(
      `/super-admin/tenants/${tenantId}/reset-owner-password`,
      { reason },
    )
    .then((res) => res.data);
}
