import { apiClient } from './client';

export interface CustomerSummary {
  id: string;
  customerCode: string;
  fullName: string;
  phone: string | null;
  status: string;
  homeBranchName: string | null;
  currentMembership: { packageName: string; status: string; endDate: string } | null;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface QueryCustomers {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  branchId?: string;
  page?: number;
}

export interface CustomerDetail {
  id: string;
  customerCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  status: string;
  homeBranchName: string | null;
  createdAt: string;
  memberships: { id: string; packageName: string; startDate: string; endDate: string; status: string; price: string }[];
  ptPackages: { id: string; planName: string; ptName: string; totalSessions: number; usedSessions: number; status: string }[];
  recentCheckins: { id: string; branchName: string; checkInAt: string; checkOutAt: string | null; method: string; status: string }[];
  recentPayments: { id: string; paymentCode: string; totalAmount: string; status: string; paidAt: string | null }[];
}

export function listCustomers(query: QueryCustomers) {
  return apiClient.get<Paginated<CustomerSummary>>('/owner/customers', { params: query }).then((res) => res.data);
}

export function getCustomer(id: string) {
  return apiClient.get<CustomerDetail>(`/owner/customers/${id}`).then((res) => res.data);
}
