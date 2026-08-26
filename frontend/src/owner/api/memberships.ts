import { apiClient } from './client';
import type { Paginated } from './customers';

export interface MembershipRow {
  id: string;
  membershipNo: string;
  customerId: string;
  customerName: string;
  branchName: string;
  packageName: string;
  startDate: string;
  endDate: string;
  status: string;
  price: string;
}

export interface QueryMemberships {
  search?: string;
  status?: 'SCHEDULED' | 'ACTIVE' | 'FROZEN' | 'EXPIRED' | 'CANCELLED';
  branchId?: string;
  page?: number;
}

export function listMemberships(query: QueryMemberships) {
  return apiClient.get<Paginated<MembershipRow>>('/owner/memberships', { params: query }).then((res) => res.data);
}
