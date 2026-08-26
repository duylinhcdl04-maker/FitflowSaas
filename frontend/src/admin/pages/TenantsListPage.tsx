import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Buildings, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { listTenants, type TenantStatus } from '../api/tenants';
import StatusBadge from '../components/StatusBadge';
import { inputClass } from '../components/FormField';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import Button from '../components/Button';

const STATUS_OPTIONS: (TenantStatus | 'ALL')[] = ['ALL', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'INACTIVE'];
const COLUMN_COUNT = 5;

function formatCurrency(amount: string, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
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
            {data?.items.map((tenant) => (
              <tr
                key={tenant.id}
                onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60"
              >
                <td className="px-4 py-3.5">
                  <Link
                    to={`/admin/tenants/${tenant.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-medium text-zinc-900 hover:text-emerald-700 dark:text-zinc-50 dark:hover:text-emerald-400"
                  >
                    {tenant.name}
                  </Link>
                  <p className="font-mono text-xs text-zinc-400">{tenant.code}</p>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={tenant.status} />
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                  {tenant.subscriptions?.saas_plans.name ?? '-'}
                </td>
                <td className="px-4 py-3.5 font-mono text-zinc-900 dark:text-zinc-100">
                  {tenant.subscriptions
                    ? formatCurrency(tenant.subscriptions.price, tenant.subscriptions.currency)
                    : '-'}
                </td>
                <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
                  {tenant._count?.branches ?? 0} chi nhánh, {tenant._count?.users ?? 0} nhân sự
                </td>
              </tr>
            ))}
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
