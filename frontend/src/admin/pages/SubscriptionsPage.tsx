import { Fragment, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  MagnifyingGlass,
  Receipt,
  WarningCircle,
} from '@phosphor-icons/react';
import { listSubscriptions, type SubscriptionRow } from '../api/subscriptions';
import StatusBadge from '../components/StatusBadge';
import { inputClass } from '../components/FormField';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { Skeleton, SkeletonRow } from '../components/Skeleton';
import KpiCard from '../components/KpiCard';
import Callout from '../components/Callout';

const COLUMN_COUNT = 5;
const EXPIRING_SOON_DAYS = 7;

type StatusFilter = SubscriptionRow['status'] | 'ALL';
type GroupKey = 'urgent' | 'soon' | 'healthy' | 'ended';

const STATUS_OPTIONS: StatusFilter[] = [
  'ALL',
  'PAST_DUE',
  'TRIAL',
  'ACTIVE',
  'SUSPENDED',
  'EXPIRED',
  'CANCELLED',
];

const BILLING_CYCLE_LABELS: Record<string, string> = {
  MONTHLY: '/ tháng',
  QUARTERLY: '/ quý',
  YEARLY: '/ năm',
};

const GROUP_META: Record<GroupKey, { label: string; dot: string; text: string }> = {
  urgent: { label: 'Cần xử lý ngay', dot: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
  soon: { label: 'Sắp hết hạn', dot: 'bg-orange-500', text: 'text-orange-700 dark:text-orange-400' },
  healthy: { label: 'Đang hoạt động ổn định', dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
  ended: { label: 'Đã kết thúc', dot: 'bg-zinc-400', text: 'text-zinc-500 dark:text-zinc-400' },
};
const GROUP_ORDER: GroupKey[] = ['urgent', 'soon', 'healthy', 'ended'];

function formatMoney(amount: number | string, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

function daysUntil(iso: string) {
  const diffMs = new Date(iso).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** % of the current billing cycle already elapsed — drives the mini runway bar. */
function elapsedPercent(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
}

function groupOf(sub: SubscriptionRow): GroupKey {
  if (sub.status === 'PAST_DUE' || sub.status === 'SUSPENDED') return 'urgent';
  if (sub.status === 'EXPIRED' || sub.status === 'CANCELLED') return 'ended';
  return daysUntil(sub.end_date) <= EXPIRING_SOON_DAYS ? 'soon' : 'healthy';
}

/** Expiry date + coloured "còn X ngày / quá hạn X ngày" hint + a mini runway bar. */
function ExpiryCell({ sub }: { sub: SubscriptionRow }) {
  const isTerminal = sub.status === 'EXPIRED' || sub.status === 'CANCELLED';
  if (isTerminal) {
    return <p className="font-mono text-zinc-500 dark:text-zinc-500">{formatDate(sub.end_date)}</p>;
  }

  const days = daysUntil(sub.end_date);
  const overdue = days < 0 || sub.status === 'PAST_DUE';
  const soon = !overdue && days <= EXPIRING_SOON_DAYS;
  const tone = overdue ? 'red' : soon ? 'orange' : 'emerald';

  const hint = overdue
    ? `Quá hạn ${Math.abs(days)} ngày`
    : days === 0
      ? 'Hết hạn hôm nay'
      : `Còn ${days} ngày`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-zinc-900 dark:text-zinc-100">{formatDate(sub.end_date)}</span>
        <span
          className={`text-xs font-medium ${
            tone === 'red'
              ? 'text-red-600 dark:text-red-400'
              : tone === 'orange'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-zinc-400 dark:text-zinc-500'
          }`}
        >
          {hint}
        </span>
      </div>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className={`h-full rounded-full ${
            tone === 'red' ? 'bg-red-500' : tone === 'orange' ? 'bg-orange-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${elapsedPercent(sub.start_date, sub.end_date)}%` }}
        />
      </div>
    </div>
  );
}

function SubscriptionRowItem({ sub }: { sub: SubscriptionRow }) {
  const group = groupOf(sub);
  const accent =
    group === 'urgent' ? 'border-l-red-500' : group === 'soon' ? 'border-l-orange-400' : 'border-l-transparent';

  return (
    <tr className={`border-l-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${accent}`}>
      <td className="px-4 py-3.5">
        <Link
          to={`/admin/tenants/${sub.tenant_id}`}
          className="font-medium text-zinc-900 hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-400"
        >
          {sub.tenants.name}
        </Link>
      </td>
      <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">{sub.saas_plans.name}</td>
      <td className="px-4 py-3.5">
        <StatusBadge status={sub.status} />
      </td>
      <td className="px-4 py-3.5">
        <span className="font-mono text-zinc-900 dark:text-zinc-100">{formatMoney(sub.price, sub.currency)}</span>
        <span className="ml-1 text-xs text-zinc-400">{BILLING_CYCLE_LABELS[sub.billing_cycle] ?? ''}</span>
      </td>
      <td className="px-4 py-3.5">
        <ExpiryCell sub={sub} />
      </td>
    </tr>
  );
}

export default function SubscriptionsPage() {
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['subscriptions'], queryFn: listSubscriptions });

  const filtered = useMemo(() => {
    if (!data) return undefined;
    const term = search.trim().toLowerCase();
    return data
      .filter((sub) => status === 'ALL' || sub.status === status)
      .filter((sub) => !term || sub.tenants.name.toLowerCase().includes(term));
  }, [data, status, search]);

  // Grouped-by-urgency view only makes sense when no single status is pinned —
  // once a status filter is chosen, the sections would collapse into one anyway.
  const groups = useMemo(() => {
    if (!filtered) return undefined;
    const buckets: Record<GroupKey, SubscriptionRow[]> = { urgent: [], soon: [], healthy: [], ended: [] };
    for (const sub of filtered) buckets[groupOf(sub)].push(sub);
    for (const key of GROUP_ORDER) {
      buckets[key].sort((a, b) =>
        key === 'ended'
          ? new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
          : new Date(a.end_date).getTime() - new Date(b.end_date).getTime(),
      );
    }
    return buckets;
  }, [filtered]);

  const stats = useMemo(() => {
    if (!data) return undefined;
    const active = data.filter((s) => s.status === 'ACTIVE');
    const trial = data.filter((s) => s.status === 'TRIAL');
    const attention = data.filter(
      (s) => s.status === 'PAST_DUE' || s.status === 'SUSPENDED' || groupOf(s) === 'soon',
    );
    const mrr = active.reduce((sum, s) => sum + Number(s.price), 0);
    return {
      mrr,
      currency: active[0]?.currency ?? 'VND',
      activeCount: active.length,
      trialCount: trial.length,
      attention,
    };
  }, [data]);

  const isGrouped = status === 'ALL';
  const totalRows = filtered?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Subscriptions</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Theo dõi hạn dùng &amp; tình trạng thanh toán của toàn bộ thuê bao SaaS.
        </p>
      </div>

      {isLoading || !stats ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-7 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={CurrencyCircleDollar}
            tone="blue"
            label="MRR (Active)"
            value={formatMoney(stats.mrr, stats.currency)}
          />
          <KpiCard icon={CheckCircle} tone="emerald" label="Đang hoạt động" value={String(stats.activeCount)} />
          <KpiCard icon={Clock} tone="amber" label="Dùng thử" value={String(stats.trialCount)} />
          <KpiCard
            icon={WarningCircle}
            tone="red"
            label="Cần chú ý"
            value={String(stats.attention.length)}
            hint="Quá hạn / tạm ngưng / sắp hết hạn"
          />
        </div>
      )}

      {stats && stats.attention.length > 0 && (
        <Callout tone="warning" title={`${stats.attention.length} thuê bao cần xử lý sớm`}>
          <div className="mt-1 flex flex-wrap gap-x-1 gap-y-1.5">
            {stats.attention.slice(0, 6).map((sub, i) => (
              <span key={sub.id}>
                <Link to={`/admin/tenants/${sub.tenant_id}`} className="font-medium underline decoration-dotted underline-offset-2">
                  {sub.tenants.name}
                </Link>
                {i < Math.min(stats.attention.length, 6) - 1 && <span className="text-zinc-400">,</span>}
              </span>
            ))}
            {stats.attention.length > 6 && (
              <span className="text-zinc-500">+{stats.attention.length - 6} khác</span>
            )}
          </div>
        </Callout>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <MagnifyingGlass size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400" />
          <input
            className={`${inputClass} w-64 pl-9`}
            placeholder="Tìm theo tên tenant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
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
      </div>

      <Card padded={false} className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3.5 font-medium">Tenant</th>
              <th className="px-4 py-3.5 font-medium">Gói</th>
              <th className="px-4 py-3.5 font-medium">Trạng thái</th>
              <th className="px-4 py-3.5 font-medium">Giá</th>
              <th className="px-4 py-3.5 font-medium">Hết hạn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} columns={COLUMN_COUNT} />)}
            {!isLoading && totalRows === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState
                    icon={Receipt}
                    title="Không tìm thấy subscription phù hợp"
                    description="Thử đổi bộ lọc trạng thái hoặc từ khoá tìm kiếm."
                  />
                </td>
              </tr>
            )}
            {!isLoading && groups && isGrouped
              ? GROUP_ORDER.filter((key) => groups[key].length > 0).map((key) => (
                  <Fragment key={key}>
                    <tr className="bg-zinc-50/70 dark:bg-zinc-900/40">
                      <td colSpan={COLUMN_COUNT} className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${GROUP_META[key].dot}`} />
                          <span className={`text-xs font-semibold ${GROUP_META[key].text}`}>
                            {GROUP_META[key].label}
                          </span>
                          <span className="text-xs text-zinc-400">({groups[key].length})</span>
                        </div>
                      </td>
                    </tr>
                    {groups[key].map((sub) => (
                      <SubscriptionRowItem key={sub.id} sub={sub} />
                    ))}
                  </Fragment>
                ))
              : !isLoading &&
                filtered
                  ?.slice()
                  .sort((a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime())
                  .map((sub) => <SubscriptionRowItem key={sub.id} sub={sub} />)}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
