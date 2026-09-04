import { apiClient } from '../../owner/api/client';

export interface PtBooking {
  id: string;
  tenant_id: string;
  branch_id: string;
  pt_user_id: string;
  customer_id: string;
  customer_pt_package_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: 'PENDING' | 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  actual_start?: string;
  actual_end?: string;
  completed_at?: string;
  completed_by?: string;
  session_note?: string;
  cancel_reason?: string;
  customers: {
    id: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
  };
  customer_pt_packages?: {
    id: string;
    plan_name_snapshot: string;
    total_sessions: number;
    used_sessions: number;
    remaining_sessions: number;
  };
}

export interface PtOverview {
  todaySessionsCount: number;
  nextSession?: PtBooking | null;
  pendingBookingsCount: number;
  lowSessionClientsCount: number;
  lowSessionClients: any[];
  todaySessionsList: PtBooking[];
}

export interface PtClientItem {
  packageId: string;
  planName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  startDate: string;
  expiryDate?: string;
  packageStatus: string;
  customer: {
    id: string;
    full_name: string;
    phone?: string;
    email?: string;
    avatar_url?: string;
    status: string;
    isMembershipActive: boolean;
  };
}

export interface PtPackagePlan {
  id: string;
  name: string;
  description?: string;
  session_count: number;
  price: string | number;
  validity_days?: number;
  session_duration_minutes: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED';
  created_at: string;
}

export interface PtWorkingHour {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

export async function getPtOverview(): Promise<PtOverview> {
  const { data } = await apiClient.get('/pt/dashboard/overview');
  return data;
}

export async function getPtSchedule(startDate?: string, endDate?: string): Promise<PtBooking[]> {
  const { data } = await apiClient.get('/pt/schedule', {
    params: { startDate, endDate },
  });
  return data;
}

export async function confirmPtBooking(bookingId: string): Promise<PtBooking> {
  const { data } = await apiClient.post('/pt/bookings/confirm', { bookingId });
  return data;
}

export async function rejectPtBooking(bookingId: string, reason?: string): Promise<PtBooking> {
  const { data } = await apiClient.post('/pt/bookings/reject', { bookingId, reason });
  return data;
}

export async function completePtSession(bookingId: string, sessionNote?: string) {
  const { data } = await apiClient.post('/pt/sessions/complete', { bookingId, sessionNote });
  return data;
}

export async function markPtNoShow(bookingId: string, reason?: string): Promise<PtBooking> {
  const { data } = await apiClient.post('/pt/bookings/no-show', { bookingId, reason });
  return data;
}

export async function createBookingByPt(payload: {
  customerId: string;
  customerPtPackageId: string;
  scheduledStart: string;
  scheduledEnd: string;
  sessionNote?: string;
}): Promise<PtBooking> {
  const { data } = await apiClient.post('/pt/bookings', payload);
  return data;
}

export async function getPtClients(search?: string): Promise<PtClientItem[]> {
  const { data } = await apiClient.get('/pt/clients', {
    params: { search },
  });
  return data;
}

export async function getPtClientDetail(customerId: string) {
  const { data } = await apiClient.get(`/pt/clients/${customerId}`);
  return data;
}

export async function createPtWorkoutLog(payload: {
  customerPtPackageId: string;
  bookingId?: string;
  sessionNumber?: number;
  workoutContent: string;
  mainExercises?: string;
  progressAssessment?: string;
  notes?: string;
}) {
  const { data } = await apiClient.post('/pt/workout-logs', payload);
  return data;
}

export async function updatePtWorkoutLog(
  logId: string,
  payload: {
    workoutContent: string;
    mainExercises?: string;
    progressAssessment?: string;
    notes?: string;
  },
) {
  const { data } = await apiClient.patch(`/pt/workout-logs/${logId}`, payload);
  return data;
}

export async function deletePtWorkoutLog(logId: string) {
  const { data } = await apiClient.delete(`/pt/workout-logs/${logId}`);
  return data;
}

export async function createInBodyRecord(payload: {
  customerId: string;
  weightKg: number;
  bodyFatPercent?: number;
  muscleMassKg?: number;
  notes?: string;
  measuredAt?: string;
}) {
  const { data } = await apiClient.post('/pt/clients/inbody', payload);
  return data;
}

export async function getPtPackages(): Promise<PtPackagePlan[]> {
  const { data } = await apiClient.get('/pt/packages');
  return data;
}

export async function createPtPackagePlan(payload: {
  name: string;
  description?: string;
  sessionCount: number;
  price: number;
  validityDays?: number;
  sessionDurationMinutes?: number;
}): Promise<PtPackagePlan> {
  const { data } = await apiClient.post('/pt/packages', payload);
  return data;
}

export async function getPtWorkingHours(): Promise<PtWorkingHour[]> {
  const { data } = await apiClient.get('/pt/availability');
  return data;
}

export async function updatePtWorkingHours(hours: { weekday: number; startTime: string; endTime: string }[]) {
  const { data } = await apiClient.post('/pt/availability', { hours });
  return data;
}

export async function getPtProfile() {
  const { data } = await apiClient.get('/pt/profile');
  return data;
}

export async function cancelPtPackage(packageId: string, reason?: string) {
  const { data } = await apiClient.post(`/pt/packages/${packageId}/cancel`, { reason });
  return data;
}
