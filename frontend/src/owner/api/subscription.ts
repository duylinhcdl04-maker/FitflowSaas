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
  slogan?: string | null;
  badge_text?: string | null;
  is_popular?: boolean;
  price: string;
  currency: string;
  billingCycle: string;
  billingCycleMonths: number | null;
  isCurrent: boolean;
  features: { code: string; name: string; quota: number | null }[];
}

export interface PaymentInfo {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferContent: string;
  amount: number;
  qrUrl: string;
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
  paymentInfo?: PaymentInfo | null;
}

export interface QuotaUsageItem {
  code: string;
  name: string;
  unit: string;
  module: string;
  mode: 'LIMITED' | 'UNLIMITED' | 'DISABLED';
  currentValue: number;
  effectiveLimit: number | null;
  percentage: number;
  status: 'NORMAL' | 'WARNING_80' | 'CRITICAL_90' | 'LIMIT_REACHED' | 'DISABLED' | 'UNLIMITED';
  message?: string;
}

export interface TenantUsageResponse {
  subscription: {
    id: string;
    status: string;
    planId: string;
    planCode: string;
    planName: string;
    startDate: string;
    endDate: string;
    isTrial: boolean;
    trialEndsAt: string | null;
    billingCycle: string;
    supportTier: string;
  };
  usages: QuotaUsageItem[];
}

export function getCurrentSubscription() {
  return apiClient.get<CurrentSubscription>('/owner/subscription').then((res) => res.data);
}

export function getTenantUsageOverview() {
  return apiClient.get<TenantUsageResponse>('/owner/subscription/usage').then((res) => res.data);
}

export function getEffectiveEntitlements() {
  return apiClient.get('/owner/subscription/entitlements').then((res) => res.data);
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

export function getPendingInvoice() {
  return apiClient.get<SubscriptionInvoice | null>('/owner/subscription/invoices/pending').then((res) => res.data);
}

export function simulatePaymentSuccess(invoiceId: string) {
  return apiClient
    .post<{ success: boolean; invoice: SubscriptionInvoice }>(`/owner/subscription/invoices/${invoiceId}/simulate-payment`)
    .then((res) => res.data);
}

