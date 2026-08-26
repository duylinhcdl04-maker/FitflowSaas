import { apiClient } from './client';
import type { Paginated } from './customers';

export interface PtSummary {
  userId: string;
  fullName: string;
  status: string;
  specialties: string[];
  experienceYears: number | null;
  activeCustomers: number;
  todaySessions: number;
}

export interface PtPackagePlan {
  id: string;
  name: string;
  description: string | null;
  ptName: string;
  sessionCount: number;
  price: string;
  validityDays: number | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'REJECTED';
  rejectReason: string | null;
  createdAt: string;
}

export interface PtBookingRow {
  id: string;
  customerName: string;
  branchName: string;
  ptName: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
}

export function listPts() {
  return apiClient.get<PtSummary[]>('/owner/pt').then((res) => res.data);
}

export function listPtPackagePlans(status?: string) {
  return apiClient.get<PtPackagePlan[]>('/owner/pt/packages', { params: { status } }).then((res) => res.data);
}

export function approvePtPackagePlan(id: string) {
  return apiClient.patch(`/owner/pt/packages/${id}/approve`).then((res) => res.data);
}

export function rejectPtPackagePlan(id: string, reason: string) {
  return apiClient.patch(`/owner/pt/packages/${id}/reject`, { reason }).then((res) => res.data);
}

export function listPtBookings(query: { date?: string; branchId?: string; ptUserId?: string; page?: number }) {
  return apiClient.get<Paginated<PtBookingRow>>('/owner/pt/bookings', { params: query }).then((res) => res.data);
}
