import { apiClient } from './client';

export const INVITABLE_ROLES = [
  { code: 'BRANCH_MANAGER', label: 'Quản lý chi nhánh' },
  { code: 'STAFF', label: 'Nhân viên' },
  { code: 'PT', label: 'Huấn luyện viên (PT)' },
] as const;

export interface StaffSummary {
  id: string;
  fullName: string;
  email: string;
  status: string;
  roles: string[];
  branches: string[];
  lastLoginAt: string | null;
}

export interface PendingInvitation {
  id: string;
  roleCode: string;
  expiresAt: string;
  createdAt: string;
}

export interface InviteStaffInput {
  fullName: string;
  email: string;
  roleCode: (typeof INVITABLE_ROLES)[number]['code'];
  branchId?: string;
}

export function listStaff() {
  return apiClient
    .get<{ staff: StaffSummary[]; pendingInvitations: PendingInvitation[] }>('/owner/staff')
    .then((res) => res.data);
}

export function inviteStaff(input: InviteStaffInput) {
  return apiClient.post<{ invitationId: string; email: string }>('/owner/staff/invite', input).then((res) => res.data);
}
