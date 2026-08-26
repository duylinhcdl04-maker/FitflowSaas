import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Buildings, ChartLineUp, CurrencyCircleDollar, PersonSimpleRun, Users, Warning } from '@phosphor-icons/react';
import { getDashboardOverview, getDashboardRevenue } from '../api/dashboard';
import { listBranches } from '../api/branches';
import { getOnboardingProgress } from '../api/onboarding';
import { useAuthStore } from '../store/auth-store';
import Card from '../components/Card';
import Button from '../components/Button';
import Callout from '../components/Callout';
import EmptyState from '../components/EmptyState';
import KpiCard from '../components/KpiCard';
import SimpleBarChart from '../components/SimpleBarChart';
import { Skeleton } from '../components/Skeleton';

const RANGE_OPTIONS = [
  { key: 'today', label: 'Hôm nay', days: 0 },
  { key: '7d', label: '7 ngày qua', days: 6 },
  { key: 'month', label: 'Tháng này', days: 29 },
] as const;

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-blue-500',
};

function formatMoney(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

const METHOD_LABELS: Record<string, string> = { FACE: 'Nhận diện', QR: 'QR', MANUAL: 'Thủ công', AUTO: 'Tự động' };

function formatGroupLabel(dateStr: string, groupBy: 'day' | 'week' | 'month') {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  if (groupBy === 'day') {
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }
  if (groupBy === 'week') {
    return 'T.' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }
  if (groupBy === 'month') {
    return date.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' });
  }
  return dateStr;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(RANGE_OPTIONS[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const from = new Date();
  from.setDate(from.getDate() - range.days);
  from.setHours(0, 0, 0, 0);

  const { data: branches } = useQuery({
    queryKey: ['owner-branches-list'],
    queryFn: listBranches,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['owner-dashboard', range.key, selectedBranchId],
    queryFn: () =>
      getDashboardOverview({
        from: from.toISOString(),
        to: new Date().toISOString(),
        branchId: selectedBranchId || undefined,
      }),
  });

  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: ['owner-dashboard-revenue', range.key, selectedBranchId, groupBy],
    queryFn: () =>
      getDashboardRevenue({
        from: from.toISOString(),
        to: new Date().toISOString(),
        branchId: selectedBranchId || undefined,
        groupBy,
      }),
  });

  const { data: onboarding } = useQuery({ queryKey: ['owner-onboarding-progress'], queryFn: getOnboardingProgress });
  const onboardingDone = onboarding && Object.values(onboarding).every(Boolean);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            {greeting()}, {user?.fullName?.split(' ').pop()} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Theo dõi tình hình hoạt động doanh nghiệp của bạn</p>
        </div>

        {/* Section 4 Filters: [Tất cả chi nhánh ▼] [Hôm nay ▼] */}
        <div className="flex flex-wrap gap-2">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm outline-none transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700"
          >
            <option value="">Tất cả chi nhánh</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={range.key}
            onChange={(e) => {
              const opt = RANGE_OPTIONS.find((r) => r.key === e.target.value);
              if (opt) setRange(opt);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm outline-none transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {data.subscription?.status === 'TRIAL' && data.subscription.daysRemaining !== null && (
        <Callout
          tone={data.subscription.daysRemaining <= 3 ? 'warning' : 'info'}
          action={
            <Button to="/owner/subscription" size="sm" variant="secondary">
              Chọn gói
            </Button>
          }
        >
          ⏳ Bạn đang dùng thử FitFlow — còn <strong>{data.subscription.daysRemaining} ngày</strong> để trải nghiệm đầy đủ hệ thống.
        </Callout>
      )}

      {data.accessMode === 'READ_ONLY' && (
        <Callout
          tone="danger"
          action={
            <Button to="/owner/subscription/expired" size="sm">
              Chọn gói
            </Button>
          }
        >
          Thời gian dùng thử đã kết thúc. Dữ liệu của bạn vẫn được lưu an toàn, nhưng bạn cần chọn gói để tiếp tục tạo dữ liệu mới.
        </Callout>
      )}

      {data.hasBranches && onboarding && !onboardingDone && (
        <Callout tone="info" action={<Button to="/owner/onboarding" size="sm" variant="secondary">Tiếp tục thiết lập</Button>}>
          Bạn chưa hoàn thành thiết lập ban đầu — mời nhân sự, tạo gói tập hoặc cấu hình check-in.
        </Callout>
      )}

      {!data.hasBranches ? (
        <Card>
          <EmptyState
            icon={Buildings}
            title="Bạn chưa có chi nhánh nào"
            description="Hãy tạo chi nhánh đầu tiên để bắt đầu vận hành."
            action={
              <Button to="/owner/onboarding" size="sm">
                Thiết lập ngay
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              icon={CurrencyCircleDollar}
              tone="emerald"
              label="Doanh thu"
              value={formatMoney(data.kpis!.revenue.total)}
              growthPct={data.kpis!.revenue.growthPct}
            />
            <KpiCard
              icon={ChartLineUp}
              tone="blue"
              label="Check-in"
              value={`${data.kpis!.checkins.total} lượt`}
            />
            <KpiCard
              icon={PersonSimpleRun}
              tone="amber"
              label="Khách đang tập"
              value={`${data.kpis!.currentlyInGym} khách`}
              hint="Tính theo thời điểm hiện tại"
            />
            <KpiCard
              icon={Users}
              tone="zinc"
              label="Hội viên đang hoạt động"
              value={`${data.kpis!.activeMembers}`}
            />
          </div>

          {/* Row 2: Biểu đồ doanh thu & Hoạt động Check-in */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Doanh thu</h2>
                {/* Section 7 [Ngày] [Tuần] [Tháng] buttons filter */}
                <div className="flex bg-stone-100 rounded-lg p-0.5 dark:bg-zinc-800">
                  {(['day', 'week', 'month'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setGroupBy(mode)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        groupBy === mode
                          ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                      }`}
                    >
                      {mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                {isRevenueLoading ? (
                  <Skeleton className="h-32 w-full" />
                ) : revenueData?.data && revenueData.data.length > 0 ? (
                  <SimpleBarChart data={revenueData.data.map((d) => ({ label: formatGroupLabel(d.date, groupBy), value: d.revenue }))} />
                ) : (
                  <p className="py-8 text-center text-sm text-zinc-400">Chưa có doanh thu trong khoảng thời gian này.</p>
                )}
              </div>
            </Card>

            <Card>
              <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Hoạt động Check-in</h2>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                {data.recentCheckins && data.recentCheckins.length > 0 ? (
                  data.recentCheckins.map((c) => (
                    <li key={c.id} className="flex justify-between gap-3 border-b border-stone-100 pb-2.5 last:border-0 last:pb-0 dark:border-zinc-800">
                      <span className="text-zinc-700 dark:text-zinc-300">
                        <strong>{c.customerName}</strong> check-in tại {c.branchName} <span className="text-xs text-zinc-400">({METHOD_LABELS[c.method] || c.method})</span>
                      </span>
                      <span className="shrink-0 text-xs text-zinc-400">
                        {new Date(c.occurredAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-zinc-400">Chưa có lượt check-in nào hôm nay.</p>
                )}
              </ul>
            </Card>
          </div>

          {/* Row 3: Hiệu suất chi nhánh & Việc cần chú ý */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Hiệu suất chi nhánh</h2>
              {data.branchPerformance && data.branchPerformance.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {data.branchPerformance.map((b) => (
                    <li key={b.branchId} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">{b.name}</span>
                      <span className="font-mono text-zinc-500 dark:text-zinc-400">
                        {formatMoney(b.revenue)} · {b.checkins} check-in
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">Chỉ hiển thị khi có từ 2 chi nhánh trở lên.</p>
              )}
            </Card>

            <Card>
              <h2 className="font-display flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                <Warning size={16} className="text-amber-500" />
                Việc cần chú ý
              </h2>
              {data.alerts && data.alerts.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3">
                  {data.alerts.map((a, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[a.priority]}`} />
                      {a.message}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">Không có vấn đề nào cần chú ý.</p>
              )}
            </Card>
          </div>

          {/* Row 4: Hoạt động gần đây & Gói sử dụng */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Hoạt động gần đây</h2>
              {data.recentActivities && data.recentActivities.length > 0 ? (
                <ul className="mt-4 flex flex-col gap-3 text-sm">
                  {data.recentActivities.map((a, i) => (
                    <li key={i} className="flex justify-between gap-3 border-b border-stone-100 pb-2.5 last:border-0 last:pb-0 dark:border-zinc-800">
                      <span className="text-zinc-700 dark:text-zinc-300">{a.message}</span>
                      <span className="shrink-0 text-xs text-zinc-400">
                        {new Date(a.occurredAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-zinc-400">Chưa có hoạt động nào.</p>
              )}
            </Card>

            {data.subscription && (
              <Card>
                <h2 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">Gói sử dụng</h2>
                <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  FITFLOW {data.subscription.planName.toUpperCase()}
                </p>
                {data.subscription.daysRemaining !== null && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Trial còn {data.subscription.daysRemaining} ngày</p>
                )}
                {data.subscription.daysUntilRenewal !== null && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Gia hạn sau {data.subscription.daysUntilRenewal} ngày</p>
                )}
                <div className="mt-4 flex flex-col gap-3">
                  {data.subscription.usage.map((u) => {
                    const pct = u.limit ? Math.min(100, Math.round((u.used / u.limit) * 100)) : 0;
                    return (
                      <div key={u.code}>
                        <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                          <span>{u.code === 'MAX_BRANCHES' ? 'Chi nhánh' : 'Nhân sự'}</span>
                          <span className="font-mono">
                            {u.used} / {u.limit ?? '∞'}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
                          <div
                            className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400"
                            style={{ width: u.limit ? `${pct}%` : '100%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
