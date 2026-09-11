export type DateRange = 'today' | '7d' | '30d' | '3m' | '12m';

export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  numericValue: number;
  changePercent?: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  tone: 'emerald' | 'blue' | 'purple' | 'amber' | 'red';
  targetPath: string;
  hint?: string;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  mrr: number;
  arr: number;
  newSubs: number;
  renewals: number;
}

export interface TenantGrowthPoint {
  month: string;
  newTenants: number;
  churnedTenants: number;
  netGrowth: number;
}

export interface ActionItem {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  count?: number;
  ctaText: string;
  ctaPath: string;
}

export interface ServiceHealthItem {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptimePercent: number;
  latencyMs: number;
  lastIncident?: string;
}

export interface TopTenantItem {
  id: string;
  name: string;
  slug: string;
  domain: string;
  plan: string;
  mrr: number;
  userCount: number;
  storageUsagePercent: number;
  healthScore: number;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'SUSPENDED';
}

export interface PlatformUsageItem {
  id: string;
  label: string;
  value: string;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  timeframe: string;
}

export interface ActivityEvent {
  id: string;
  time: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  type: 'tenant' | 'subscription' | 'payment' | 'security' | 'system';
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface AdminNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  category: 'Billing' | 'Tenant' | 'System' | 'Security';
  read: boolean;
  actionUrl?: string;
}
