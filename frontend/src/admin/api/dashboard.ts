import { apiClient } from './client';

export interface DashboardOverview {
  tenants: { total: number; byStatus: Record<string, number> };
  subscriptions: { byStatus: Record<string, number>; customBillingCount: number };
  revenue: { currency: string; mrr: number; arr: number };
  churn: { ratio: number; churnedLast30Days: number };
  platformUsage: {
    faceEmbeddingsRegistered: number;
    storageUsageBytes: number | null;
    faceApiCallsThisMonth: number | null;
  };
}

export function fetchDashboardOverview() {
  return apiClient.get<DashboardOverview>('/super-admin/dashboard').then((res) => res.data);
}
