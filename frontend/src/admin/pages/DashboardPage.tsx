import { useQuery } from '@tanstack/react-query';
import { Buildings, CurrencyDollar, TrendUp, TrendDown } from '@phosphor-icons/react';
import { fetchDashboardOverview } from '../api/dashboard';
import Card from '../components/Card';
import KpiCard from '../components/KpiCard';
import { Skeleton } from '../components/Skeleton';

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Dùng thử',
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm ngưng',
  INACTIVE: 'Ngừng hoạt động',
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: fetchDashboardOverview,
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Tổng quan nền tảng
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Số liệu tổng hợp toàn bộ Tenant trên FitFlow.
        </p>
      </div>

      {isError && (
        <Card className="border-red-200 bg-red-50 text-sm text-red-700 dark:border-red-900 dark:bg-red-500/10 dark:text-red-400">
          Không tải được dữ liệu dashboard.
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !data ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-4 h-7 w-28" />
              <Skeleton className="mt-2 h-3 w-32" />
            </Card>
          ))
        ) : (
          <>
            <KpiCard icon={Buildings} tone="blue" label="Tổng số Tenant" value={String(data.tenants.total)} />
            <KpiCard
              icon={CurrencyDollar}
              tone="emerald"
              label="MRR"
              value={formatCurrency(data.revenue.mrr, data.revenue.currency)}
              hint={
                data.subscriptions.customBillingCount > 0
                  ? `Chưa gồm ${data.subscriptions.customBillingCount} subscription chu kỳ CUSTOM`
                  : undefined
              }
            />
            <KpiCard
              icon={TrendUp}
              tone="emerald"
              label="ARR"
              value={formatCurrency(data.revenue.arr, data.revenue.currency)}
            />
            <KpiCard
              icon={TrendDown}
              tone="red"
              label="Churn (30 ngày)"
              value={`${(data.churn.ratio * 100).toFixed(1)}%`}
              hint={`${data.churn.churnedLast30Days} subscription rời bỏ`}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Tenant theo trạng thái
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                {isLoading || !data ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                    {data.tenants.byStatus[status] ?? 0}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Hạ tầng nền tảng
          </h2>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Face ID đã đăng ký</span>
              {isLoading || !data ? (
                <Skeleton className="h-4 w-8" />
              ) : (
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                  {data.platformUsage.faceEmbeddingsRegistered}
                </span>
              )}
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">Dung lượng lưu trữ</span>
              <span className="text-zinc-400 dark:text-zinc-500">Chưa theo dõi</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">API Face Recognition / tháng</span>
              <span className="text-zinc-400 dark:text-zinc-500">Chưa theo dõi</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
