import { apiClient } from './client';
import type { AccessMode } from './dashboard';

export interface CurrentSubscription {
  planCode: string;
  planName: string;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  trialEndsAt: string | null;
  daysRemaining: number | null;
  daysUntilRenewal: number | null;
  usage: { code: string; used: number; limit: number | null }[];
  accessMode: AccessMode;
}

export interface PublicPlan {
  code: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  billingCycle: string;
  billingCycleMonths: number | null;
  isCurrent: boolean;
  features: { code: string; name: string; quota: number | null }[];
}

export interface SubscriptionInvoice {
  id: string;
  invoice_no: string;
  period_start: string;
  period_end: string;
  total_amount: string;
  currency: string;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID';
  due_date: string;
  paid_at: string | null;
  saas_payments: { id: string; status: string; method: string; amount: string; created_at: string }[];
}

export function getCurrentSubscription() {
  return apiClient.get<CurrentSubscription>('/owner/subscription').then((res) => res.data);
}

export function listPublicPlans() {
  return apiClient.get<PublicPlan[]>('/owner/subscription/plans').then((res) => res.data);
}

export function listSubscriptionInvoices() {
  return apiClient.get<SubscriptionInvoice[]>('/owner/subscription/invoices').then((res) => res.data);
}

export function requestPlanInvoice(planCode: string) {
  return apiClient.post<SubscriptionInvoice>('/owner/subscription/invoices', { planCode }).then((res) => res.data);
}

export function markInvoiceTransferred(invoiceId: string) {
  return apiClient
    .post(`/owner/subscription/invoices/${invoiceId}/mark-transferred`, { method: 'BANK_TRANSFER' })
    .then((res) => res.data);
}
