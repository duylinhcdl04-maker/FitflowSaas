import { apiClient } from './client';

export interface TenantBrand {
  id: string;
  code: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  logo_url: string | null;
}

export interface UpdateTenantBrandInput {
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  logo_url?: string;
}

export interface PaymentAccount {
  id: string;
  tenant_id: string;
  branch_id: string | null;
  account_type: string;
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  qr_template: string;
  is_default: boolean;
  status: string;
  /** Masked (e.g. "••••ab12") — the raw key is never sent back by the API. */
  sepayApiKeyMasked: string | null;
  /** Paste this into SePay Dashboard → Webhook config → auth method "API Key". */
  webhookUrl: string;
}

export interface CreatePaymentAccountInput {
  branchId?: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrTemplate?: string;
  isDefault?: boolean;
  sepayApiKey?: string;
}

export interface UpdatePaymentAccountInput {
  branchId?: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  qrTemplate?: string;
  isDefault?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
  sepayApiKey?: string;
}

export function getTenantBrand() {
  return apiClient.get<TenantBrand>('/owner/settings/tenant').then((res) => res.data);
}

export function updateTenantBrand(input: UpdateTenantBrandInput) {
  return apiClient.put<TenantBrand>('/owner/settings/tenant', input).then((res) => res.data);
}

export function listPaymentAccounts() {
  return apiClient.get<PaymentAccount[]>('/owner/settings/payment-accounts').then((res) => res.data);
}

export function createPaymentAccount(input: CreatePaymentAccountInput) {
  return apiClient.post<PaymentAccount>('/owner/settings/payment-accounts', input).then((res) => res.data);
}

export function updatePaymentAccount(id: string, input: UpdatePaymentAccountInput) {
  return apiClient.put<PaymentAccount>(`/owner/settings/payment-accounts/${id}`, input).then((res) => res.data);
}

export function deletePaymentAccount(id: string) {
  return apiClient.delete<PaymentAccount>(`/owner/settings/payment-accounts/${id}`).then((res) => res.data);
}

export interface VietQrBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
}

export function listBanks() {
  return apiClient.get<VietQrBank[]>('/owner/settings/banks').then((res) => res.data);
}

export function lookupAccountName(bin: string, accountNumber: string) {
  return apiClient
    .post<{ accountName: string }>('/owner/settings/payment-accounts/lookup-account-name', { bin, accountNumber })
    .then((res) => res.data);
}
