import { apiClient } from '../../owner/api/client';

export interface ManagerContext {
  user: { id: string; email: string; full_name: string; phone: string };
  tenant?: { id: string; name: string; legalName?: string; logoUrl?: string } | null;
  branch: {
    id: string;
    code: string;
    name: string;
    address: string;
    openingTime: string;
    closingTime: string;
  };
}

export interface ManagerDashboardOverview {
  kpis: {
    currentlyInGym: number;
    currentlyInGymMembers: number;
    currentlyInGymGuests: number;
    todayCheckins: number;
    undoCheckins: number;
    todayRevenue: number;
    newMembershipsCount: number;
    renewedMembershipsCount: number;
    todayGuestsCount: number;
    todayPtSessions: { total: number; completed: number; upcoming: number; cancelled: number };
  };
  actionCenter: Array<{
    id: string;
    priority: 'CRITICAL' | 'WARNING' | 'INFORMATION';
    title: string;
    description: string;
    count: number;
  }>;
  hourlyCheckins: Array<{ hour: string; count: number }>;
  revenueBySource: { membership: number; pt: number; guest: number };
  expiringMemberships: Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    packageName: string;
    endDate: string;
  }>;
}

export interface CurrentlyInGymItem {
  id: string;
  customer: { id: string; full_name: string; phone: string; customer_code: string; avatar_url: string };
  attendanceType: string;
  checkInAt: string;
  checkInMethod: string;
  autoCheckoutAt: string;
}

export function getManagerContext(branchId?: string) {
  return apiClient
    .get<ManagerContext>('/manager/context', { params: { branchId } })
    .then((res) => res.data);
}

export function getManagerDashboardOverview(branchId?: string) {
  return apiClient
    .get<ManagerDashboardOverview>('/manager/dashboard/overview', { params: { branchId } })
    .then((res) => res.data);
}

export function getCurrentlyInGym(branchId?: string) {
  return apiClient
    .get<CurrentlyInGymItem[]>('/manager/checkin/currently-in-gym', { params: { branchId } })
    .then((res) => res.data);
}

export function manualCheckin(customerId: string, membershipId?: string, note?: string) {
  return apiClient
    .post('/manager/checkin/manual', { customerId, membershipId, note })
    .then((res) => res.data);
}

export function manualCheckout(attendanceId: string) {
  return apiClient
    .post(`/manager/checkin/checkout/${attendanceId}`)
    .then((res) => res.data);
}

export function undoCheckin(attendanceId: string, reason: string) {
  return apiClient
    .post('/manager/checkin/undo', { attendanceId, reason })
    .then((res) => res.data);
}

export function getManagerCustomers(
  search?: string,
  packageId?: string,
  status?: string,
  page: number = 1,
  limit: number = 10,
) {
  return apiClient
    .get<{
      items: any[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/manager/customers', { params: { search, packageId, status, page, limit } })
    .then((res) => res.data);
}

export function freezeMembership(membershipId: string, startDate: string, endDate: string, reason?: string) {
  return apiClient
    .post('/manager/memberships/freeze', { membershipId, startDate, endDate, reason })
    .then((res) => res.data);
}

export function addFreeDays(membershipId: string, days: number, reason: string) {
  return apiClient
    .post('/manager/memberships/add-days', { membershipId, days, reason })
    .then((res) => res.data);
}

export function getManagerPtBookings() {
  return apiClient.get<any[]>('/manager/pt/bookings').then((res) => res.data);
}

export function createPtBooking(payload: {
  ptUserId: string;
  customerId: string;
  customerPtPackageId: string;
  scheduledStart: string;
  scheduledEnd: string;
  sessionNote?: string;
}) {
  return apiClient.post('/manager/pt/bookings', payload).then((res) => res.data);
}

export function cancelPtBooking(bookingId: string, reason: string) {
  return apiClient.post('/manager/pt/cancel-booking', { bookingId, reason }).then((res) => res.data);
}

export function getManagerStaff() {
  return apiClient.get<any[]>('/manager/staff').then((res) => res.data);
}

export function getManagerAuditLogs() {
  return apiClient.get<any[]>('/manager/audit-logs').then((res) => res.data);
}

export function changeManagerPassword(currentPassword: string, newPassword: string) {
  return apiClient
    .post<{ success: boolean; message: string }>('/manager/change-password', { currentPassword, newPassword })
    .then((res) => res.data);
}

export function quickRegisterCustomer(
  fullNameOrPayload: string | { fullName: string; phone: string; email?: string; gender?: string },
  phone?: string,
  email?: string,
  gender?: string,
) {
  const payload =
    typeof fullNameOrPayload === 'string'
      ? { fullName: fullNameOrPayload, phone: phone!, email, gender }
      : fullNameOrPayload;
  return apiClient.post('/manager/customers/quick-register', payload).then((res) => res.data);
}

export function quickCreatePayment(payload: { customerId: string; title: string; amount: number; paymentMethod?: string }) {
  return apiClient.post('/manager/payments/quick-create', payload).then((res) => res.data);
}

export function createManagerStaff(payload: {
  fullName: string;
  phone: string;
  email?: string;
  gender?: string;
  role: 'RECEPTIONIST' | 'STAFF' | 'PT';
  password?: string;
}) {
  return apiClient
    .post<{ success: boolean; message: string; defaultPassword: string; staff: any }>('/manager/staff', payload)
    .then((res) => res.data);
}

export interface BranchPackageItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  durationValue: number;
  durationUnit: string;
  basePrice: number;
  branchAccessScope: string;
  appliesToAllBranches: boolean;
  branches: Array<{ id: string; name: string }>;
}

export function getBranchPackages() {
  return apiClient.get<BranchPackageItem[]>('/manager/packages').then((res) => res.data);
}

export function registerCustomerWithAccount(payload: {
  fullName: string;
  email: string;
  phone?: string;
  gender?: string;
  defaultPassword?: string;
}) {
  return apiClient.post('/manager/customers/register-with-account', payload).then((res) => res.data);
}

export interface RequiresPaymentResponse {
  requiresPayment: true;
  paymentId: string;
  qrUrl: string;
  amount: number;
  expiresAt: string;
}

export function assignMembershipPackage(
  customerIdOrPayload: string | { customerId: string; packageId: string; startDate?: string; paymentMethod?: string },
  packageId?: string,
  startDate?: string,
  paymentMethod?: string,
) {
  const payload =
    typeof customerIdOrPayload === 'string'
      ? { customerId: customerIdOrPayload, packageId: packageId!, startDate, paymentMethod }
      : customerIdOrPayload;
  return apiClient.post('/manager/customers/assign-package', payload).then((res) => res.data);
}

export function getPaymentStatus(paymentId: string) {
  return apiClient
    .get<{ id: string; status: string; paid_at: string | null }>(`/manager/payments/${paymentId}/status`)
    .then((res) => res.data);
}

export function cancelPendingPayment(paymentId: string) {
  return apiClient.post(`/manager/payments/${paymentId}/cancel`).then((res) => res.data);
}

export function toggleCustomerStatus(customerId: string, status: 'ACTIVE' | 'INACTIVE') {
  return apiClient.patch(`/manager/customers/${customerId}/status`, { status }).then((res) => res.data);
}

export function getGuestVisits(status?: string) {
  return apiClient.get<any[]>('/manager/guest-visits', { params: { status } }).then((res) => res.data);
}

export function createGuestVisit(fullName: string, phone: string, packageId: string, paymentMethod?: string) {
  return apiClient.post('/manager/guest-visits', { fullName, phone, packageId, paymentMethod }).then((res) => res.data);
}

export function toggleGuestHold(guestVisitId: string, reason?: string) {
  return apiClient
    .post<{ success: boolean; message: string; visit: any }>('/manager/guest-visits/toggle-hold', { guestVisitId, reason })
    .then((res) => res.data);
}

export interface PtPackagePlanItem {
  id: string;
  name: string;
  description: string | null;
  sessionCount: number;
  price: number;
  validityDays: number;
  sessionDurationMinutes: number;
  status: 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'DRAFT';
  approvedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  ptUser: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  } | null;
}

export function getPtPackagePlans(status?: string) {
  return apiClient.get<PtPackagePlanItem[]>('/manager/pt-package-plans', { params: { status } }).then((res) => res.data);
}

export function approvePtPackagePlan(planId: string) {
  return apiClient.post<{ success: boolean; message: string }>(`/manager/pt-package-plans/${planId}/approve`).then((res) => res.data);
}

export function rejectPtPackagePlan(planId: string, reason?: string) {
  return apiClient.post<{ success: boolean; message: string }>(`/manager/pt-package-plans/${planId}/reject`, { reason }).then((res) => res.data);
}

export function assignPtPackage(customerId: string, planId: string, startDate?: string, paymentMethod?: string) {
  return apiClient
    .post<{ success: boolean; message: string; package: any; payment: any }>('/manager/customers/assign-pt-package', {
      customerId,
      planId,
      startDate,
      paymentMethod,
    })
    .then((res) => res.data);
}
