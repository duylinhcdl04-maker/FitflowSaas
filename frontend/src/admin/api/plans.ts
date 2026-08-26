import { apiClient } from './client';
import type { Tenant } from './tenants';

export interface PlatformFeature {
  id: string;
  code: string;
  name: string;
  description: string | null;
  feature_type: 'BOOLEAN' | 'QUOTA';
  module: string | null;
}

export interface PlanFeatureSetting {
  plan_id: string;
  feature_id: string;
  is_enabled: boolean;
  quota_value: number | null;
  platform_features: PlatformFeature;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  billing_cycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  // Real source of truth since SA-06's 1-12 month picker shipped. billing_cycle
  // above is kept only for rows created before that migration.
  billing_cycle_months: number | null;
  price: string;
  currency: string;
  trial_days: number;
  display_order: number;
  is_public: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  saas_plan_features: PlanFeatureSetting[];
  _count: { subscriptions: number };
}

export interface PlanSubscriber {
  id: string;
  tenant_id: string;
  status: string;
  tenants: Tenant;
}

export function listFeatures() {
  return apiClient.get<PlatformFeature[]>('/super-admin/platform-features').then((r) => r.data);
}

export function createFeature(payload: {
  code: string;
  name: string;
  description?: string;
  featureType: 'BOOLEAN' | 'QUOTA';
  module?: string;
}) {
  return apiClient.post('/super-admin/platform-features', payload).then((r) => r.data);
}

export function listPlans() {
  return apiClient.get<Plan[]>('/super-admin/plans').then((r) => r.data);
}

export function getPlan(id: string) {
  return apiClient.get<Plan>(`/super-admin/plans/${id}`).then((r) => r.data);
}

export interface CreatePlanPayload {
  code: string;
  name: string;
  description?: string;
  // 1-12: Super Admin configures any billing period in months (SA-06).
  billingCycleMonths: number;
  price: number;
  currency?: string;
  trialDays?: number;
  displayOrder?: number;
  isPublic?: boolean;
}

export function createPlan(payload: CreatePlanPayload) {
  return apiClient.post<Plan>('/super-admin/plans', payload).then((r) => r.data);
}

export function updatePlan(id: string, payload: Partial<CreatePlanPayload> & { status?: 'ACTIVE' | 'INACTIVE' }) {
  return apiClient.patch<Plan>(`/super-admin/plans/${id}`, payload).then((r) => r.data);
}

export function upsertPlanFeatures(
  id: string,
  features: { featureCode: string; isEnabled: boolean; quotaValue?: number }[],
) {
  return apiClient.put<Plan>(`/super-admin/plans/${id}/features`, { features }).then((r) => r.data);
}

/** SA-06 banner "N doanh nghiệp đang dùng — Xem danh sách". */
export function listPlanSubscribers(planId: string) {
  return apiClient.get<PlanSubscriber[]>(`/super-admin/plans/${planId}/subscribers`).then((r) => r.data);
}

/** SA-06 "Áp dụng cho doanh nghiệp hiện tại" — explicit opt-in list, never "all". */
export function applyPlanToSubscriptions(planId: string, subscriptionIds: string[]) {
  return apiClient
    .post<{ updatedCount: number }>(`/super-admin/plans/${planId}/apply`, { subscriptionIds })
    .then((r) => r.data);
}
