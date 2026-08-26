import { apiClient } from './client';

export interface BranchSummary {
  id: string;
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  openingDays: string;
  status: 'ACTIVE' | 'INACTIVE';
  memberCount: number;
  staffCount: number;
  checkinToday: number;
}

export interface BranchDetail extends BranchSummary {
  openingTime: string;
  closingTime: string;
  staff: { id: string; fullName: string; roles: string[] }[];
}

export interface CreateBranchInput {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingDays?: string;
  openingTime?: string;
  closingTime?: string;
  managerIds?: string[];
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export function listBranches() {
  return apiClient.get<BranchSummary[]>('/owner/branches').then((res) => res.data);
}

export function getBranch(id: string) {
  return apiClient.get<BranchDetail>(`/owner/branches/${id}`).then((res) => res.data);
}

export function createBranch(input: CreateBranchInput) {
  return apiClient.post<BranchSummary>('/owner/branches', input).then((res) => res.data);
}

export function updateBranch(id: string, input: UpdateBranchInput) {
  return apiClient.patch<BranchSummary>(`/owner/branches/${id}`, input).then((res) => res.data);
}
