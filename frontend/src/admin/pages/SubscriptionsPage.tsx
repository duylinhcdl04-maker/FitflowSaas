import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Receipt } from '@phosphor-icons/react';
import { listSubscriptions } from '../api/subscriptions';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';

const COLUMN_COUNT = 5;

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function SubscriptionsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['subscriptions'], queryFn: listSubscriptions });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Subscriptions
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Toàn bộ thuê bao SaaS đang tồn tại trên nền tảng.
        </p>
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
            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState icon={Receipt} title="Chưa có subscription nào trên nền tảng" />
                </td>
              </tr>
            )}
            {data?.map((sub) => (
              <tr key={sub.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60">
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
                <td className="px-4 py-3.5 font-mono">{formatMoney(sub.price, sub.currency)}</td>
                <td className="px-4 py-3.5 font-mono">{formatDate(sub.end_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
