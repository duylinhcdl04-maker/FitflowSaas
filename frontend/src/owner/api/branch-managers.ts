import { apiClient } from './client';

export interface BranchManager {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  status: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  lastLoginAt: string | null;
  createdAt: string;
  branch: { id: string; name: string } | null;
}

export interface CreateBranchManagerInput {
  fullName: string;
  email: string;
  phone?: string;
}

export interface UpdateBranchManagerInput {
  fullName?: string;
  phone?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export function listBranchManagers() {
  return apiClient.get<BranchManager[]>('/owner/branch-managers').then((res) => res.data);
}

export function listUnassignedBranchManagers() {
  return apiClient.get<BranchManager[]>('/owner/branch-managers/unassigned').then((res) => res.data);
}

export function createBranchManager(input: CreateBranchManagerInput) {
  return apiClient.post<BranchManager>('/owner/branch-managers', input).then((res) => res.data);
}

export function updateBranchManager(id: string, input: UpdateBranchManagerInput) {
  return apiClient.patch<BranchManager>(`/owner/branch-managers/${id}`, input).then((res) => res.data);
}

export function resetBranchManagerPassword(id: string) {
  return apiClient.post<{ email: string; fullName: string }>(`/owner/branch-managers/${id}/reset-password`).then((res) => res.data);
}

export function assignBranchManagerToBranch(id: string, branchId: string) {
  return apiClient.post<BranchManager>(`/owner/branch-managers/${id}/assign-branch`, { branchId }).then((res) => res.data);
}

export function unassignBranchManager(id: string) {
  return apiClient.post<BranchManager>(`/owner/branch-managers/${id}/unassign-branch`).then((res) => res.data);
}
