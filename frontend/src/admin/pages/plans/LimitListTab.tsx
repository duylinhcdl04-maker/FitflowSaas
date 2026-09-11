import { useState, useMemo } from 'react';
import { MagnifyingGlass, Plus, Gauge, Sparkle, Tag } from '@phosphor-icons/react';
import type { PlatformFeature, Plan } from '../../api/plans';
import { LIMIT_CATEGORIES, LIMIT_UNITS } from './types';

interface LimitListTabProps {
  features: PlatformFeature[];
  plans: Plan[];
  onCreateLimit: () => void;
  isLoading?: boolean;
}

export default function LimitListTab({
  features,
  plans,
  onCreateLimit,
  isLoading,
}: LimitListTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const quotaLimits = useMemo(() => {
    return features.filter((f) => f.feature_type === 'QUOTA');
  }, [features]);

  const filteredLimits = useMemo(() => {
    return quotaLimits.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (categoryFilter !== 'ALL' && f.module !== categoryFilter) return false;
      return true;
    });
  }, [quotaLimits, search, categoryFilter]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Danh mục Giới hạn Tài nguyên (Usage Limits & Quotas)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Quản lý các định mức trần kỹ thuật và giới hạn tiêu dùng tài nguyên của phòng gym theo gói thuê bao.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateLimit}
          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-500 active:scale-95"
        >
          <Plus className="h-4 w-4" weight="bold" />
          <span>Thêm Định mức mới</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative min-w-64 flex-1 sm:max-w-md">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên định mức hoặc mã (e.g. MAX_MEMBERS)..."
            className="h-8.5 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 pl-8.5 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-100"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={`rounded-md px-2.5 py-1 font-medium transition ${
              categoryFilter === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Tất cả ({quotaLimits.length})
          </button>
          {LIMIT_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 font-medium transition ${
                categoryFilter === cat.key
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Limit Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-850/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Định mức & Mã Key</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Mô tả giới hạn</th>
                <th className="px-4 py-3">Đơn vị đo lường</th>
                <th className="px-4 py-3 text-right">Mặc định đề xuất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                    Đang tải danh sách định mức tài nguyên...
                  </td>
                </tr>
              )}

              {!isLoading && filteredLimits.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                    Không tìm thấy định mức nào.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredLimits.map((limit) => {
                  const catMeta = LIMIT_CATEGORIES.find((c) => c.key === limit.module);
                  const unitMeta = LIMIT_UNITS[limit.code] || { unit: 'đơn vị', defaultVal: 100 };

                  return (
                    <tr
                      key={limit.code}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/40 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {limit.name}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                          {limit.code}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {catMeta?.label || limit.module || 'ACCOUNT'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400 max-w-xs">
                        {limit.description || 'Chưa có mô tả'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-xs bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                          {unitMeta.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        {unitMeta.defaultVal != null ? `${unitMeta.defaultVal.toLocaleString('vi-VN')} ${unitMeta.unit}` : 'Không giới hạn'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
