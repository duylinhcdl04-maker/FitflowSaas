import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Buildings,
  CheckCircle,
  Clock,
  MagnifyingGlass,
  Plus,
  Users,
  WarningCircle,
} from '@phosphor-icons/react';
import { listTenants, type Tenant, type TenantStatus } from '../api/tenants';
import StatusBadge from '../components/StatusBadge';
import { inputClass } from '../components/FormField';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { Skeleton, SkeletonRow } from '../components/Skeleton';
import Button from '../components/Button';
import KpiCard from '../components/KpiCard';

const STATUS_OPTIONS: (TenantStatus | 'ALL')[] = ['ALL', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE'];
const COLUMN_COUNT = 5;
const TRIAL_ENDING_SOON_DAYS = 3;

const AVATAR_PALETTE = [
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
];

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}

function daysUntil(iso: string) {
  const diffMs = new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Deterministic avatar colour + initial so the same tenant always renders the same way. */
function TenantAvatar({ name }: { name: string }) {
  const hash = Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const palette = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${palette}`}
    >
      {initial}
    </span>
  );
}

function needsAttention(tenant: Tenant) {
  if (tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE') return true;
  const endsAt = tenant.subscriptions?.trial_ends_at;
  return (
    tenant.status === 'TRIAL' && !!endsAt && daysUntil(endsAt) <= TRIAL_ENDING_SOON_DAYS
  );
}

export default function TenantsListPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<TenantStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', status, search, page],
    queryFn: () =>
      listTenants({
        status: status === 'ALL' ? undefined : status,
        search: search || undefined,
        page,
      }),
  });

  // Lightweight counts-only fetch (pageSize: 1, we only read `.total`) so the
  // KPI strip always reflects the whole platform, independent of the current
  // filter/search/page above.
  const { data: statCounts } = useQuery({
    queryKey: ['tenants-stat-counts'],
    queryFn: async () => {
      const [trial, active, suspended, inactive] = await Promise.all(
        (['TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE'] as const).map((s) =>
          listTenants({ status: s, page: 1, pageSize: 1 }),
        ),
      );
      return {
        trial: trial.total,
        active: active.total,
        attention: suspended.total + inactive.total,
        total: trial.total + active.total + suspended.total + inactive.total,
      };
    },
    staleTime: 30_000,
  });

  const attentionCount = useMemo(
    () => data?.items.filter(needsAttention).length ?? 0,
    [data],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Tenants</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Quản lý toàn bộ doanh nghiệp đang thuê nền tảng FitFlow.
          </p>
        </div>
        <Button to="/admin/tenants/new">
          <Plus size={18} weight="bold" />
          Tạo Tenant
        </Button>
      </div>

      {!statCounts ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-7 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={Buildings} tone="blue" label="Tổng Tenant" value={String(statCounts.total)} />
          <KpiCard icon={CheckCircle} tone="emerald" label="Đang hoạt động" value={String(statCounts.active)} />
          <KpiCard icon={Clock} tone="amber" label="Dùng thử" value={String(statCounts.trial)} />
          <KpiCard
            icon={WarningCircle}
            tone="red"
            label="Cần chú ý"
            value={String(statCounts.attention)}
            hint="Tạm ngưng / ngừng hoạt động"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
          <input
            className={`${inputClass} w-64 pl-9`}
            placeholder="Tìm theo tên, mã, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setStatus(option);
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                status === option
                  ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {option === 'ALL' ? 'Tất cả' : option}
            </button>
          ))}
        </div>
        {attentionCount > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
            <WarningCircle size={14} weight="fill" />
            {attentionCount} tenant trên trang này cần chú ý
          </span>
        )}
      </div>

      <Card padded={false} className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3.5 font-medium">Tenant</th>
              <th className="px-4 py-3.5 font-medium">Trạng thái</th>
              <th className="px-4 py-3.5 font-medium">Gói</th>
              <th className="px-4 py-3.5 font-medium">MRR</th>
              <th className="px-4 py-3.5 font-medium">Chi nhánh / Nhân sự</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={COLUMN_COUNT} />)}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState
                    icon={Buildings}
                    title="Không tìm thấy Tenant phù hợp"
                    description="Thử đổi bộ lọc trạng thái hoặc từ khoá tìm kiếm."
                  />
                </td>
              </tr>
            )}
            {data?.items.map((tenant) => {
              const attention = needsAttention(tenant);
              const trialDaysLeft =
                tenant.status === 'TRIAL' && tenant.subscriptions?.trial_ends_at
                  ? daysUntil(tenant.subscriptions.trial_ends_at)
                  : null;

              return (
                <tr
                  key={tenant.id}
                  onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                  className={`cursor-pointer border-l-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
                    attention ? 'border-l-red-500' : 'border-l-transparent'
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <TenantAvatar name={tenant.name} />
                      <div>
                        <Link
                          to={`/admin/tenants/${tenant.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-zinc-900 hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-400"
                        >
                          {tenant.name}
                        </Link>
                        <p className="font-mono text-xs text-zinc-400">{tenant.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={tenant.status} />
                    {trialDaysLeft !== null && (
                      <p
                        className={`mt-1 text-xs ${
                          trialDaysLeft <= TRIAL_ENDING_SOON_DAYS
                            ? 'text-orange-600 dark:text-orange-400'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {trialDaysLeft < 0
                          ? 'Hết hạn dùng thử'
                          : trialDaysLeft === 0
                            ? 'Hết hạn hôm nay'
                            : `Còn ${trialDaysLeft} ngày dùng thử`}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                    {tenant.subscriptions?.saas_plans.name ?? '-'}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-zinc-900 dark:text-zinc-100">
                    {tenant.subscriptions
                      ? formatCurrency(tenant.subscriptions.price, tenant.subscriptions.currency)
                      : '-'}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1">
                        <Buildings size={13} />
                        {tenant._count?.branches ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} />
                        {tenant._count?.users ?? 0}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>
            Trang {data.page}/{data.totalPages} • {data.total} Tenant
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
