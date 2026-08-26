import { apiClient } from './client';

export const PRICING_MODELS = ['FIXED', 'PER_BRANCH', 'PER_USER', 'PER_USAGE'] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export const ADDON_EFFECT_TYPES = ['QUOTA_DELTA', 'ENABLE_FEATURE'] as const;
export type AddonEffectType = (typeof ADDON_EFFECT_TYPES)[number];

export const ADDON_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type AddonStatus = (typeof ADDON_STATUSES)[number];

export interface Addon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  pricing_model: PricingModel;
  price: string;
  currency: string;
  effect_feature_code: string | null;
  effect_type: AddonEffectType | null;
  effect_amount: number | null;
  compatible_plan_codes: string[];
  status: AddonStatus;
  activeSubscriptions: number;
}

export function listAddons() {
  return apiClient.get<Addon[]>('/super-admin/addons').then((r) => r.data);
}

export interface CreateAddonPayload {
  code: string;
  name: string;
  description?: string;
  pricingModel: PricingModel;
  price: number;
  currency?: string;
  effectFeatureCode?: string;
  effectType?: AddonEffectType;
  effectAmount?: number;
  compatiblePlanCodes?: string[];
}

export function createAddon(payload: CreateAddonPayload) {
  return apiClient.post<Addon>('/super-admin/addons', payload).then((r) => r.data);
}

export type UpdateAddonPayload = Partial<CreateAddonPayload> & { status?: AddonStatus };

export function updateAddon(id: string, payload: UpdateAddonPayload) {
  return apiClient.patch<Addon>(`/super-admin/addons/${id}`, payload).then((r) => r.data);
}

export interface SubscriptionAddon {
  subscription_id: string;
  addon_id: string;
  quantity: number;
  price_snapshot: string;
  pricing_model_snapshot: PricingModel;
  status: 'ACTIVE' | 'CANCELLED';
  added_at: string;
  cancelled_at: string | null;
  cancel_reason: string | null;
  addons: Addon;
}

export function listTenantAddons(tenantId: string) {
  return apiClient.get<SubscriptionAddon[]>(`/super-admin/tenants/${tenantId}/addons`).then((r) => r.data);
}

export function attachAddon(tenantId: string, addonCode: string, quantity?: number) {
  return apiClient
    .post<SubscriptionAddon>(`/super-admin/tenants/${tenantId}/addons`, { addonCode, quantity })
    .then((r) => r.data);
}

export function cancelAddon(tenantId: string, addonId: string, reason: string) {
  return apiClient
    .patch<SubscriptionAddon>(`/super-admin/tenants/${tenantId}/addons/${addonId}/cancel`, { reason })
    .then((r) => r.data);
}
