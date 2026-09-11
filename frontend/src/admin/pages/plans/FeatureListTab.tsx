import { useState, useMemo } from 'react';
import { MagnifyingGlass, Plus, Sparkle, SlidersHorizontal, Check, Tag } from '@phosphor-icons/react';
import type { PlatformFeature, Plan } from '../../api/plans';
import { FEATURE_CATEGORIES } from './types';

interface FeatureListTabProps {
  features: PlatformFeature[];
  plans: Plan[];
  onCreateFeature: () => void;
  isLoading?: boolean;
}

export default function FeatureListTab({
  features,
  plans,
  onCreateFeature,
  isLoading,
}: FeatureListTabProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const booleanFeatures = useMemo(() => {
    return features.filter((f) => f.feature_type !== 'QUOTA');
  }, [features]);

  const filteredFeatures = useMemo(() => {
    return booleanFeatures.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (categoryFilter !== 'ALL' && f.module !== categoryFilter) return false;
      return true;
    });
  }, [booleanFeatures, search, categoryFilter]);

  // Count which plans have this feature enabled
  const planCountByFeature = useMemo(() => {
    const map = new Map<string, number>();
    for (const plan of plans) {
      for (const featSetting of plan.saas_plan_features || []) {
        if (featSetting.is_enabled) {
          const code = featSetting.platform_features?.code;
          if (code) map.set(code, (map.get(code) || 0) + 1);
        }
      }
    }
    return map;
  }, [plans]);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Danh mục Tính năng Nền tảng (Platform Features)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Quản lý toàn bộ danh sách module tính năng có thể gán vào các gói SaaS hoặc bán kèm dưới dạng Add-on.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreateFeature}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 active:scale-95"
        >
          <Plus className="h-4 w-4" weight="bold" />
          <span>Thêm Feature mới</span>
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
            placeholder="Tìm theo tên tính năng hoặc mã key (e.g. FACE_RECOGNITION)..."
            className="h-8.5 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 pl-8.5 pr-3 text-xs text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-100"
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
            Tất cả ({booleanFeatures.length})
          </button>
          {FEATURE_CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategoryFilter(cat.key)}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 font-medium transition ${
                categoryFilter === cat.key
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feature Table */}
      <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-850/60 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3">Tính năng & Mã Key</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Mô tả chức năng</th>
                <th className="px-4 py-3">Loại dữ liệu</th>
                <th className="px-4 py-3 text-right">Gói áp dụng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                    Đang tải danh sách tính năng...
                  </td>
                </tr>
              )}

              {!isLoading && filteredFeatures.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                    Không tìm thấy tính năng nào.
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredFeatures.map((feat) => {
                  const catMeta = FEATURE_CATEGORIES.find((c) => c.key === feat.module);
                  const activePlansCount = planCountByFeature.get(feat.code) || 0;

                  return (
                    <tr
                      key={feat.code}
                      className="hover:bg-zinc-50/70 dark:hover:bg-zinc-850/40 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {feat.name}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                          {feat.code}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {catMeta?.label || feat.module || 'OTHER'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400 max-w-xs">
                        {feat.description || 'Chưa có mô tả'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex rounded-xs bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                          {feat.feature_type || 'BOOLEAN'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-zinc-900 dark:text-zinc-100">
                        {activePlansCount > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            <Check className="h-3 w-3" weight="bold" />
                            {activePlansCount} / {plans.length} gói
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-xs">Chưa gán</span>
                        )}
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
