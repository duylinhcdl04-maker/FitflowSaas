import { apiClient } from './client';

export type AccessMode = 'FULL_ACCESS' | 'READ_ONLY' | 'BLOCKED';

export interface DashboardOverview {
  context: { tenantId: string; branchId: string | null; from: string; to: string };
  hasBranches: boolean;
  kpis?: {
    revenue: { total: number; growthPct: number | null };
    checkins: { total: number };
    currentlyInGym: number;
    activeMembers: number;
  };
  revenueChart?: { date: string; revenue: number }[];
  branchPerformance?: { branchId: string; name: string; code: string; revenue: number; checkins: number }[];
  alerts?: { priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'; message: string }[];
  recentActivities?: { occurredAt: string; message: string }[];
  recentCheckins?: {
    id: string;
    occurredAt: string;
    customerName: string;
    branchName: string;
    method: string;
  }[];
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
