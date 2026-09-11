import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  ArrowUpRight,
  CaretUp,
  CaretDown,
  ShieldCheck,
  ShieldWarning,
  WarningOctagon,
} from '@phosphor-icons/react';
import type { TopTenantItem } from '../../types/dashboard';
import { formatVndCurrency, formatNumber } from '../../api/dashboardService';

interface TopTenantsProps {
  tenants: TopTenantItem[];
  isLoading?: boolean;
}

type SortField = 'mrr' | 'userCount' | 'healthScore' | 'storageUsagePercent';

export default function TopTenants({ tenants, isLoading }: TopTenantsProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('mrr');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = tenants
    .filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.domain.toLowerCase().includes(search.toLowerCase()) ||
      t.plan.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? valA - valB : valB - valA;
    });

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  function renderHealthBadge(score: number) {
    if (score >= 80) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <ShieldCheck size={13} weight="fill" />
          <span>{score} Tốt</span>
        </span>
      );
    }
    if (score >= 60) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
          <ShieldWarning size={13} weight="fill" />
          <span>{score} Cần chú ý</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
        <WarningOctagon size={13} weight="fill" />
        <span>{score} Rủi ro</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header with Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Top Tenants Tiêu biểu
            </h2>
            <span className="text-xs text-zinc-400">({filtered.length} phòng gym)</span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Theo dõi doanh thu MRR, số lượng thành viên (nhân sự) và điểm sức khỏe của từng phòng gym
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <MagnifyingGlass
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, domain, gói..."
              className="w-48 sm:w-64 rounded-lg border border-zinc-200 bg-zinc-50/50 py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-emerald-400"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/tenants')}
            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <span>Tất cả Tenant</span>
            <ArrowUpRight size={12} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800">
              <th className="py-3 pr-4">Tenant</th>
              <th className="py-3 px-3">Gói cước</th>
              <th
                className="cursor-pointer py-3 px-3 hover:text-zinc-700 dark:hover:text-zinc-200"
                onClick={() => handleSort('mrr')}
              >
                <div className="flex items-center gap-1">
                  <span>MRR</span>
                  {sortField === 'mrr' && (sortAsc ? <CaretUp size={12} /> : <CaretDown size={12} />)}
                </div>
              </th>
              <th
                className="cursor-pointer py-3 px-3 hover:text-zinc-700 dark:hover:text-zinc-200"
                onClick={() => handleSort('userCount')}
              >
                <div className="flex items-center gap-1">
                  <span>Thành viên</span>
                  {sortField === 'userCount' && (sortAsc ? <CaretUp size={12} /> : <CaretDown size={12} />)}
                </div>
              </th>
              <th
                className="cursor-pointer py-3 px-3 hover:text-zinc-700 dark:hover:text-zinc-200"
                onClick={() => handleSort('storageUsagePercent')}
              >
                <div className="flex items-center gap-1">
                  <span>Dung lượng</span>
                  {sortField === 'storageUsagePercent' && (sortAsc ? <CaretUp size={12} /> : <CaretDown size={12} />)}
                </div>
              </th>
              <th
                className="cursor-pointer py-3 px-3 hover:text-zinc-700 dark:hover:text-zinc-200"
                onClick={() => handleSort('healthScore')}
              >
                <div className="flex items-center gap-1">
                  <span>Health Score</span>
                  {sortField === 'healthScore' && (sortAsc ? <CaretUp size={12} /> : <CaretDown size={12} />)}
                </div>
              </th>
              <th className="py-3 px-3">Trạng thái</th>
              <th className="py-3 pl-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-400">
                  Không tìm thấy Tenant nào khớp với từ khóa.
                </td>
              </tr>
            ) : (
              filtered.map((tenant) => {
                return (
                  <tr
                    key={tenant.id}
                    className="group transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/70 font-display font-bold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          {tenant.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                            {tenant.name}
                          </div>
                          <div className="font-mono text-[11px] text-zinc-400">
                            {tenant.domain}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-flex rounded bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {tenant.plan}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatVndCurrency(tenant.mrr)}
                    </td>

                    <td className="py-3 px-3 font-mono text-zinc-600 dark:text-zinc-400">
                      {formatNumber(tenant.userCount)}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            style={{ width: `${tenant.storageUsagePercent}%` }}
                            className={`h-full ${
                              tenant.storageUsagePercent > 90
                                ? 'bg-rose-500'
                                : tenant.storageUsagePercent > 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-zinc-400">
                          {tenant.storageUsagePercent}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">{renderHealthBadge(tenant.healthScore)}</td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          tenant.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : tenant.status === 'PAST_DUE'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                      >
                        {tenant.status === 'ACTIVE'
                          ? 'Hoạt động'
                          : tenant.status === 'PAST_DUE'
                          ? 'Quá hạn'
                          : 'Tạm ngưng'}
                      </span>
                    </td>

                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                        title="Xem chi tiết tenant"
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
