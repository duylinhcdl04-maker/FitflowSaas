import { apiClient } from './client';
import type { Paginated } from './types';

export type InvoiceStatus = 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID';

export interface InvoiceTenant {
  id: string;
  name: string;
  code: string;
}

export interface InvoiceListRow {
  id: string;
  invoice_no: string;
  period_start: string;
  period_end: string;
  total_amount: string;
  currency: string;
  status: InvoiceStatus;
  due_date: string;
  paid_at: string | null;
  tenants: InvoiceTenant;
  subscriptions: { saas_plans: { code: string; name: string } };
}

export interface InvoicePayment {
  id: string;
  amount: string;
  currency: string;
  method: string;
  provider_ref: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export interface InvoiceDetail extends InvoiceListRow {
  subtotal: string;
  tax_amount: string;
  issued_at: string | null;
  saas_payments: InvoicePayment[];
}

export interface ListInvoicesParams {
  status?: InvoiceStatus;
  tenantId?: string;
  dueFrom?: string;
  dueTo?: string;
  page?: number;
  pageSize?: number;
}

export function listInvoices(params: ListInvoicesParams) {
  return apiClient.get<Paginated<InvoiceListRow>>('/super-admin/invoices', { params }).then((r) => r.data);
}

export function getInvoice(id: string) {
  return apiClient.get<InvoiceDetail>(`/super-admin/invoices/${id}`).then((r) => r.data);
}

export interface CreateInvoicePayload {
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  subtotal: number;
  taxAmount?: number;
}

export function createInvoice(payload: CreateInvoicePayload) {
  return apiClient.post<InvoiceDetail>('/super-admin/invoices', payload).then((r) => r.data);
}

export const PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH', 'CARD', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface RecordInvoicePaymentPayload {
  amount: number;
  method: PaymentMethod;
  providerRef?: string;
  paidAt?: string;
  note?: string;
}

export function recordInvoicePayment(id: string, payload: RecordInvoicePaymentPayload) {
  return apiClient
    .post<{ payment: InvoicePayment; invoice: InvoiceDetail }>(
      `/super-admin/invoices/${id}/payments`,
      payload,
    )
    .then((r) => r.data);
}

export function voidInvoice(id: string, reason: string) {
  return apiClient.patch<InvoiceDetail>(`/super-admin/invoices/${id}/void`, { reason }).then((r) => r.data);
}
