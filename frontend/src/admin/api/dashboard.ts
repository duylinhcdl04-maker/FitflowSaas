import { apiClient } from './client';
import type {
  TopTenantItem,
  ActionItem,
  ActivityEvent,
  ServiceHealthItem,
  TenantGrowthPoint,
} from '../types/dashboard';

export interface DashboardOverview {
  tenants: { total: number; byStatus: Record<string, number> };
  subscriptions: {
    byStatus: Record<string, number>;
    customBillingCount: number;
    expiringCount?: number;
  };
  revenue: { currency: string; mrr: number; arr: number };
  churn: { ratio: number; churnedLast30Days: number };
  platformUsage: {
    totalUsers?: number;
    activeUsersToday?: number;
    checkinsToday?: number;
    faceEmbeddingsRegistered: number;
    failedInvoicesCount?: number;
    notificationsSentCount?: number;
    storageUsageBytes: number | null;
    faceApiCallsThisMonth?: number | null;
  };
  tenantGrowth?: TenantGrowthPoint[];
  topTenants?: TopTenantItem[];
  actionItems?: ActionItem[];
  recentActivities?: ActivityEvent[];
  serviceHealth?: ServiceHealthItem[];
}

export function fetchDashboardOverview() {
  return apiClient.get<DashboardOverview>('/super-admin/dashboard').then((res) => res.data);
}
