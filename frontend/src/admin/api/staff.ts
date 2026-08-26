import { apiClient } from './client';
import type { Paginated } from './types';

export type StaffStatus = 'ACTIVE' | 'INACTIVE';

export interface StaffMember {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string;
  status: StaffStatus;
  lastLoginAt: string | null;
  createdAt: string;
  roles: string[];
}

export interface ListStaffParams {
  status?: StaffStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function listStaff(params: ListStaffParams) {
  return apiClient.get<Paginated<StaffMember>>('/super-admin/staff', { params }).then((r) => r.data);
}

export interface CreateStaffPayload {
  fullName: string;
  email: string;
  phone?: string;
}

export function createStaff(payload: CreateStaffPayload) {
  return apiClient
    .post<{ user: StaffMember; temporaryPassword: string }>('/super-admin/staff', payload)
    .then((r) => r.data);
}

export function changeStaffStatus(id: string, status: StaffStatus, reason: string) {
  return apiClient
    .patch<StaffMember>(`/super-admin/staff/${id}/status`, { status, reason })
    .then((r) => r.data);
}

export function resetStaffPassword(id: string, reason: string) {
  return apiClient
    .post<{ email: string; fullName: string; temporaryPassword: string }>(
      `/super-admin/staff/${id}/reset-password`,
      { reason },
    )
    .then((r) => r.data);
}
