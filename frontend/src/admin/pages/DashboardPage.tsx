import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { DateRange } from '../types/dashboard';
import { fetchFullDashboardData } from '../api/dashboardService';

import DashboardHeader from '../components/dashboard/DashboardHeader';
import PlatformStatusBanner from '../components/dashboard/PlatformStatusBanner';
import KpiGrid from '../components/dashboard/KpiGrid';
import RevenueOverview from '../components/dashboard/RevenueOverview';
import TenantGrowth from '../components/dashboard/TenantGrowth';
import ActionRequired from '../components/dashboard/ActionRequired';
import PlatformHealth from '../components/dashboard/PlatformHealth';
import TenantOverview from '../components/dashboard/TenantOverview';
import PlatformUsage from '../components/dashboard/PlatformUsage';
import TopTenants from '../components/dashboard/TopTenants';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActionsModal from '../components/dashboard/QuickActionsModal';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const healthRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['super-admin-full-dashboard', dateRange],
    queryFn: () => fetchFullDashboardData(dateRange),
    staleTime: 30000,
  });

  function handleViewHealth() {
    healthRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleOpenSearch() {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. Header */}
      <DashboardHeader
        dateRange={dateRange}
        onDateRangeChange={(range) => setDateRange(range)}
        onOpenQuickActions={() => setQuickActionsOpen(true)}
        onCreateTenant={() => navigate('/admin/tenants/new')}
      />

      {/* 2. Platform Status Banner */}
      <PlatformStatusBanner
        services={data?.serviceHealth ?? []}
        onViewHealth={handleViewHealth}
      />

      {/* Error Callout if any */}
      {isError && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-400">
          <span>Không thể kết nối đến máy chủ để làm mới một số chỉ số. Đang hiển thị bộ đệm an toàn.</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded bg-rose-600 px-3 py-1 font-semibold text-white hover:bg-rose-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 3. KPI Section (6 Cards) */}
      <section aria-label="Chỉ số quan trọng KPI">
        <KpiGrid kpis={data?.kpis ?? []} isLoading={isLoading} />
      </section>

      {/* 4. Revenue Analytics (65%) & Tenant Growth (35%) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12" aria-label="Phân tích Doanh thu và Tăng trưởng">
        <div className="lg:col-span-8">
          <RevenueOverview
            data={data?.revenueData ?? []}
            isLoading={isLoading}
          />
        </div>
        <div className="lg:col-span-4">
          <TenantGrowth
            data={data?.tenantGrowth ?? []}
            isLoading={isLoading}
          />
        </div>
      </section>

      {/* 5. Action Required & Platform Health */}
      <section
        ref={healthRef}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
        aria-label="Vấn đề cần xử lý và Sức khỏe hạ tầng"
      >
        <ActionRequired
          items={data?.actionItems ?? []}
          isLoading={isLoading}
        />
        <PlatformHealth
          services={data?.serviceHealth ?? []}
          isLoading={isLoading}
        />
      </section>

      {/* 6. Tenant Status Overview & Platform Usage Telemetry */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2" aria-label="Phân bố Tenant và Mức độ sử dụng">
        <TenantOverview
          statusCounts={
            data?.tenantStatusCounts ?? {
              active: 0,
              trial: 0,
              pastDue: 0,
              suspended: 0,
              cancelled: 0,
              total: 0,
            }
          }
          isLoading={isLoading}
        />
        <PlatformUsage
          metrics={data?.platformUsage ?? []}
          isLoading={isLoading}
        />
      </section>

      {/* 7. Top Tenants Table */}
      <section aria-label="Danh sách Top Tenants">
        <TopTenants
          tenants={data?.topTenants ?? []}
          isLoading={isLoading}
        />
      </section>

      {/* 8. Recent Activity Timeline */}
      <section aria-label="Nhật ký hoạt động">
        <RecentActivity
          activities={data?.recentActivities ?? []}
          isLoading={isLoading}
        />
      </section>

      {/* Quick Actions Modal */}
      <QuickActionsModal
        open={quickActionsOpen}
        onClose={() => setQuickActionsOpen(false)}
        onOpenSearch={handleOpenSearch}
      />
    </div>
  );
}
