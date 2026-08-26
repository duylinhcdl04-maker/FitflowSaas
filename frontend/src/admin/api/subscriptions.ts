import { apiClient } from './client';
import type { SaasPlanSummary, Tenant } from './tenants';

export interface SubscriptionRow {
  id: string;
  tenant_id: string;
  status: string;
  start_date: string;
  end_date: string;
  price: string;
  currency: string;
  billing_cycle: string;
  billing_cycle_months: number | null;
  auto_renew: boolean;
  tenants: Tenant;
  saas_plans: SaasPlanSummary;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  period_start: string;
  period_end: string;
  total_amount: string;
  currency: string;
  status: string;
  due_date: string;
  paid_at: string | null;
}

export interface PlanChangeCheck {
  currentPlan: { code?: string; name?: string };
  targetPlan: { code: string; name: string };
  quotaConflicts: { code: string; label: string; used: number; limit: number }[];
  featuresLost: { code: string; name: string }[];
  canProceed: boolean;
}

export function listSubscriptions() {
  return apiClient.get<SubscriptionRow[]>('/super-admin/subscriptions').then((r) => r.data);
}

export function getSubscription(tenantId: string) {
  return apiClient.get<SubscriptionRow>(`/super-admin/subscriptions/${tenantId}`).then((r) => r.data);
}

export function listInvoices(tenantId: string) {
  return apiClient.get<Invoice[]>(`/super-admin/subscriptions/${tenantId}/invoices`).then((r) => r.data);
}

/** SA-08 wizard step 2 preview — safe to call before committing to a plan change. */
export function checkPlanChangeConflicts(tenantId: string, planCode: string) {
  return apiClient
    .get<PlanChangeCheck>(`/super-admin/subscriptions/${tenantId}/plan-change-check`, { params: { planCode } })
    .then((r) => r.data);
}

export interface UpdateSubscriptionPayload {
  planCode?: string;
  status?: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';
  cancelReason?: string;
  renewDays?: number;
}

export function updateSubscription(tenantId: string, payload: UpdateSubscriptionPayload) {
  return apiClient
    .patch<SubscriptionRow>(`/super-admin/subscriptions/${tenantId}`, payload)
    .then((r) => r.data);
}
