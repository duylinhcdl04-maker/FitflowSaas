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

export interface PlatformQuota {
  id: string;
  code: string;
  name: string;
  description: string | null;
  unit: string;
  module: string;
}

export interface PlatformIntegration {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  icon: string | null;
}

export interface PlanPrice {
  id?: string;
  plan_id?: string;
  billing_cycle: string;
  billing_cycle_months: number;
  price: number | string;
  currency: string;
  discount_percentage: number | string;
  is_active: boolean;
}

export interface PlanQuotaSetting {
  plan_id: string;
  quota_id: string;
  mode: 'LIMITED' | 'UNLIMITED' | 'DISABLED';
  quota_value: number | null;
  platform_quotas: PlatformQuota;
}

export interface PlanIntegrationSetting {
  plan_id: string;
  integration_id: string;
  is_enabled: boolean;
  config_options?: any;
  platform_integrations: PlatformIntegration;
}

export interface PlanFeatureSetting {
  plan_id: string;
  feature_id: string;
  is_enabled: boolean;
  quota_value: number | null;
  platform_features: PlatformFeature;
}

export interface Addon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  pricing_model: string;
  price: string | number;
  currency: string;
  addon_type: 'RESOURCE' | 'FEATURE' | 'INTEGRATION';
  compatible_plan_codes: string[];
  addon_quotas?: { quota_id: string; added_value: number; platform_quotas: PlatformQuota }[];
  addon_features?: { feature_id: string; platform_features: PlatformFeature }[];
}

export interface PlatformCatalog {
  features: PlatformFeature[];
  quotas: PlatformQuota[];
  integrations: PlatformIntegration[];
  addons: Addon[];
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  slogan: string | null;
  target_audience: string | null;
  support_tier: 'COMMUNITY' | 'STANDARD' | 'PRIORITY' | 'DEDICATED';
  is_popular: boolean;
  badge_text: string | null;
  cta_text: string | null;
  billing_cycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  billing_cycle_months: number | null;
  price: string;
  currency: string;
  trial_days: number;
  display_order: number;
  is_public: boolean;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'INACTIVE';
  saas_plan_features: PlanFeatureSetting[];
  plan_prices: PlanPrice[];
  plan_quotas: PlanQuotaSetting[];
  plan_integrations: PlanIntegrationSetting[];
  _count: { subscriptions: number };
}

export interface PlanSubscriber {
  id: string;
  tenant_id: string;
  status: string;
  tenants: Tenant;
}

export function getPlatformCatalog() {
  return apiClient.get<PlatformCatalog>('/super-admin/platform-catalog').then((r) => r.data);
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

export function savePlanConfiguration(id: string, payload: any) {
  return apiClient.put<Plan>(`/super-admin/plans/${id}/config`, payload).then((r) => r.data);
}

export function validatePlanForPublish(id: string) {
  return apiClient.post<{ isValid: boolean; errors: string[] }>(`/super-admin/plans/${id}/validate`).then((r) => r.data);
}

export function publishPlan(id: string) {
  return apiClient.post<Plan>(`/super-admin/plans/${id}/publish`).then((r) => r.data);
}

export function archivePlan(id: string) {
  return apiClient.post<Plan>(`/super-admin/plans/${id}/archive`).then((r) => r.data);
}

export function deletePlan(id: string) {
  return apiClient.delete<{ success: boolean; message: string }>(`/super-admin/plans/${id}`).then((r) => r.data);
}

export function duplicatePlan(id: string) {
  return apiClient.post<Plan>(`/super-admin/plans/${id}/duplicate`).then((r) => r.data);
}

export function updatePlan(id: string, payload: Partial<CreatePlanPayload> & { status?: any }) {
  return apiClient.patch<Plan>(`/super-admin/plans/${id}`, payload).then((r) => r.data);
}

export function upsertPlanFeatures(
  id: string,
  features: { featureCode: string; isEnabled: boolean; quotaValue?: number }[],
) {
  return apiClient.put<Plan>(`/super-admin/plans/${id}/features`, { features }).then((r) => r.data);
}

export function listPlanSubscribers(planId: string) {
  return apiClient.get<PlanSubscriber[]>(`/super-admin/plans/${planId}/subscribers`).then((r) => r.data);
}

export function applyPlanToSubscriptions(planId: string, subscriptionIds: string[]) {
  return apiClient.post<{ updatedCount: number }>(`/super-admin/plans/${planId}/apply`, { subscriptionIds }).then((r) => r.data);
}
