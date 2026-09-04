import { apiClient } from '../../owner/api/client';

// ---------------------------------------------------------------------------
// Types — mirror backend/src/customer/customer.service.ts response shapes.
// ---------------------------------------------------------------------------

export interface CustomerProfile {
  id: string;
  customerCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  avatarUrl: string | null;
  tenantName?: string | null;
  homeBranch: { id: string; name: string } | null;
  faceConsentAt: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  createdAt: string;
}

export interface MembershipView {
  id: string;
  packageName: string;
  price: string | number;
  currency: string;
  durationValue: number;
  durationUnit: string;
  branchAccessScope: string;
  maxCheckinsPerDay: number | null;
  startDate: string;
  endDate: string;
  status: string;
  frozenDaysUsed: number;
  branch: { id: string; name: string } | null;
}

export interface PtPackageView {
  id: string;
  planName: string;
  ptName: string;
  ptUserId: string;
  sessionDurationMinutes: number;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  startDate: string;
  expiryDate: string | null;
  status: string;
}

export interface PtSlot {
  start: string;
  end: string;
}

export interface PtAvailability {
  weekdayLabel: string;
  sessionDurationMinutes: number;
  packageSummary?: {
    packageName: string;
    totalSessions: number;
    completedSessions: number;
    reservedSessions: number;
    availableToBook: number;
  };
  slots: PtSlot[];
}

export interface PtBookingView {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  session_note: string | null;
  cancel_reason: string | null;
}

export interface AttendanceEntry {
  id: string;
  branch: { id: string; name: string } | null;
  checkInAt: string;
  checkInMethod: string;
  checkOutAt: string | null;
  checkOutMethod: string | null;
  status: string;
}

export interface AttendanceCalendarEntry {
  id: string;
  branchName: string;
  checkInAt: string;
  checkOutAt: string | null;
  status: string;
  method: string;
}

export interface AttendanceCalendarDay {
  date: string;
  isToday: boolean;
  count: number;
  entries: AttendanceCalendarEntry[];
}

export interface AttendanceMonthDay {
  date: string;
  isToday: boolean;
  count: number;
}

export interface AttendanceMonthSummary {
  month: string;
  firstWeekday: number; // 0 (Mon) .. 6 (Sun)
  daysWithActivity: number;
  days: AttendanceMonthDay[];
}

export interface AttendanceCalendar {
  stats: { thisWeekSessions: number; thisMonthSessions: number; totalHours: number };
  weekStart: string;
  weekEnd: string;
  days: AttendanceCalendarDay[];
}

export interface PaymentEntry {
  id: string;
  paymentCode: string;
  paymentType: string;
  totalAmount: string | number;
  currency: string;
  method: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// 2.1 Identity & profile
// ---------------------------------------------------------------------------

export function changeCustomerPassword(currentPassword: string, newPassword: string) {
  return apiClient
    .post('/customer/change-password', { currentPassword, newPassword })
    .then((res) => res.data);
}

export function getCustomerProfile() {
  return apiClient.get<CustomerProfile>('/customer/me/profile').then((res) => res.data);
}

export function updateCustomerProfile(payload: {
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}) {
  return apiClient.patch<CustomerProfile>('/customer/me/profile', payload).then((res) => res.data);
}

export function submitFaceConsent(imageDataUrl: string) {
  return apiClient.post('/customer/me/face-consent', { imageDataUrl }).then((res) => res.data);
}

// ---------------------------------------------------------------------------
// Dynamic QR (BR-CUST-004)
// ---------------------------------------------------------------------------

export function getQrToken() {
  return apiClient
    .get<{ token: string; expiresInSeconds: number }>('/customer/me/qr-token')
    .then((res) => res.data);
}

// ---------------------------------------------------------------------------
// 2.2 Membership
// ---------------------------------------------------------------------------

export function getCurrentMembership() {
  return apiClient.get<MembershipView | null>('/customer/me/membership').then((res) => res.data);
}

export function getMembershipHistory() {
  return apiClient.get<MembershipView[]>('/customer/me/membership/history').then((res) => res.data);
}

// ---------------------------------------------------------------------------
// 2.3 PT booking
// ---------------------------------------------------------------------------

export function getMyPtPackage() {
  return apiClient.get<PtPackageView | null>('/customer/me/pt-package').then((res) => res.data);
}

export function getPtAvailability(date?: string) {
  return apiClient
    .get<PtAvailability>('/customer/me/pt/availability', { params: { date } })
    .then((res) => res.data);
}

export function getMyPtBookings() {
  return apiClient
    .get<{ upcoming: PtBookingView[]; past: PtBookingView[] }>('/customer/me/pt/bookings')
    .then((res) => res.data);
}

export function createPtBooking(payload: { scheduledStart: string; scheduledEnd?: string; note?: string }) {
  return apiClient.post('/customer/me/pt/bookings', payload).then((res) => res.data);
}

export function cancelPtBooking(id: string, reason?: string) {
  return apiClient.post(`/customer/me/pt/bookings/${id}/cancel`, { reason }).then((res) => res.data);
}

// ---------------------------------------------------------------------------
// 2.4 Attendance history
// ---------------------------------------------------------------------------

export function getAttendanceHistory(page = 1, pageSize = 10) {
  return apiClient
    .get<Paginated<AttendanceEntry>>('/customer/me/attendance', { params: { page, pageSize } })
    .then((res) => res.data);
}

/** `weekStart` = any date in ISO YYYY-MM-DD; backend snaps it to that week's Monday. */
export function getAttendanceCalendar(weekStart?: string) {
  return apiClient
    .get<AttendanceCalendar>('/customer/me/attendance/calendar', { params: { weekStart } })
    .then((res) => res.data);
}

/** `month` = YYYY-MM, defaults to the current month. */
export function getAttendanceMonthSummary(month?: string) {
  return apiClient
    .get<AttendanceMonthSummary>('/customer/me/attendance/calendar/month', { params: { month } })
    .then((res) => res.data);
}

// ---------------------------------------------------------------------------
// 2.5 Billing
// ---------------------------------------------------------------------------

export function getPayments(page = 1, pageSize = 10, status?: string) {
  return apiClient
    .get<Paginated<PaymentEntry>>('/customer/me/payments', { params: { page, pageSize, status } })
    .then((res) => res.data);
}

export function getPaymentDetail(id: string) {
  return apiClient.get(`/customer/me/payments/${id}`).then((res) => res.data);
}
