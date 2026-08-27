import { apiClient } from './client';

export type AccessMode = 'FULL_ACCESS' | 'READ_ONLY' | 'BLOCKED';

export interface DashboardAlertItem {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerCode?: string;
  packageName: string;
  branchName: string;
  endDate: string;
  daysRemaining: number;
}

export interface DashboardAlert {
  id?: string;
  type?: 'MEMBERSHIP_EXPIRING_TODAY' | 'MEMBERSHIP_EXPIRING_SOON' | 'QUOTA_BRANCH' | 'QUOTA_STAFF';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  targetUrl?: string;
  items?: DashboardAlertItem[];
  details?: { used: number; limit: number };
}

export interface DashboardActivityItem {
  id?: string;
  type?: 'PAYMENT' | 'CHECKIN' | 'MEMBERSHIP';
  occurredAt: string;
  message: string;
  details?: {
    id?: string;
    amount?: number;
    paymentType?: string;
    paymentMethod?: string;
    invoiceCode?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerCode?: string;
    branchName?: string;
    checkInMethod?: string;
    packageName?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
  };
}

export interface DashboardCheckinItem {
  id: string;
  occurredAt: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerCode?: string;
  branchName: string;
  method: string;
  status?: string;
}

export interface DashboardOverview {
  context: { tenantId: string; branchId: string | null; from: string; to: string };
  hasBranches: boolean;
  kpis?: {
    revenue: { total: number; growthPct: number | null };
    checkins: { total: number; dailyUniqueVisitors: number };
    currentlyInGym: number;
    activeMembers: number;
  };
  revenueChart?: { date: string; revenue: number }[];
  branchPerformance?: { branchId: string; name: string; code: string; revenue: number; checkins: number }[];
  membershipStatusBreakdown?: { label: string; count: number; pct: number; color: string }[];
  revenueByPackageBreakdown?: { name: string; amount: number; pct: number }[];
  membershipGrowthChart?: { date: string; count: number }[];
  peakCheckinHours?: { hour: string; count: number }[];
  peakCheckinDaysOfWeek?: { day: string; count: number }[];
  alerts?: DashboardAlert[];
  recentActivities?: DashboardActivityItem[];
  recentCheckins?: DashboardCheckinItem[];
  subscription: {
    planName: string;
    status: string;
    daysRemaining: number | null;
    daysUntilRenewal: number | null;
    usage: { code: string; used: number; limit: number | null }[];
  } | null;
  accessMode: AccessMode;
}

export interface DashboardQuery {
  branchId?: string;
  from?: string;
  to?: string;
}

export interface DashboardRevenueQuery {
  branchId?: string;
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface DashboardRevenueResponse {
  total: number;
  data: { date: string; revenue: number }[];
}

export function getDashboardOverview(query: DashboardQuery) {
  return apiClient.get<DashboardOverview>('/owner/dashboard/overview', { params: query }).then((res) => res.data);
}

export function getDashboardRevenue(query: DashboardRevenueQuery) {
  return apiClient.get<DashboardRevenueResponse>('/owner/dashboard/revenue', { params: query }).then((res) => res.data);
}
