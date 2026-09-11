import { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  Check,
  Minus,
  Infinity as InfinityIcon,
  Sparkle,
  Gauge,
  ArrowsLeftRight,
} from '@phosphor-icons/react';
import type { Plan, PlatformFeature } from '../../api/plans';
import { FEATURE_CATEGORIES, LIMIT_CATEGORIES, LIMIT_UNITS } from './types';
import { monthsLabel } from '../../lib/billing';

function formatMoney(amount: string | number, currency: string) {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(num);
}

interface FeatureMatrixTabProps {
  plans: Plan[];
  features: PlatformFeature[];
  onSelectPlan?: (planId: string) => void;
  isLoading?: boolean;
}

export default function FeatureMatrixTab({
  plans,
  features,
  onSelectPlan,
  isLoading,
}: FeatureMatrixTabProps) {
  const [search, setSearch] = useState('');
  const [viewFilter, setViewFilter] = useState<'ALL' | 'FEATURES' | 'LIMITS'>('ALL');

  // Filter items
  const filteredFeatures = useMemo(() => {
    return features.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (viewFilter === 'FEATURES') return item.feature_type !== 'QUOTA';
      if (viewFilter === 'LIMITS') return item.feature_type === 'QUOTA';
      return true;
    });
  }, [features, search, viewFilter]);

  // Group items by module category
  const groupedSections = useMemo(() => {
    const map = new Map<string, PlatformFeature[]>();
    for (const item of filteredFeatures) {
      const cat = item.module || 'OTHER';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return map;
  }, [filteredFeatures]);

  // Helper to get setting for a plan and feature code
  const getSetting = (plan: Plan, featureCode: string) => {
    return plan.saas_plan_features?.find((f) => f.platform_features?.code === featureCode);
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
            Ma trận So sánh Quyền lợi Gói (Feature & Limits Matrix)
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Bảng đối soát trực quan toàn bộ tính năng và giới hạn sử dụng giữa các gói SaaS trên hệ thống FitFlow.
          </p>
        </div>

        {/* View mode filter pills */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-1 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setViewFilter('ALL')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              viewFilter === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Tất cả ({features.length})
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('FEATURES')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              viewFilter === 'FEATURES'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Chỉ Tính năng
          </button>
          <button
            type="button"
            onClick={() => setViewFilter('LIMITS')}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              viewFilter === 'LIMITS'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            Chỉ Giới hạn
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Lọc tính năng trong bảng so sánh..."
          className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-8.5 pr-3 text-xs text-zinc-900 placeholder-zinc-400 shadow-2xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      {/* Comparison Matrix Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Sticky Header with Plans */}
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/90 backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-850/90">
                <th className="sticky left-0 z-10 w-72 min-w-72 bg-zinc-50/95 p-4 text-xs font-bold uppercase tracking-wider text-zinc-700 shadow-xs dark:bg-zinc-850/95 dark:text-zinc-300">
                  Tính năng / Giới hạn
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className="min-w-44 p-4 text-center font-normal transition"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {plan.name}
                      </span>
                      <span className="font-mono text-[10px] text-zinc-400">
                        {plan.code}
                      </span>
                      <div className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        {plan.trial_days > 0
                          ? `${plan.trial_days} ngày`
                          : formatMoney(plan.price, plan.currency)}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {plan.trial_days > 0 ? 'Dùng thử' : `/ ${monthsLabel(plan.billing_cycle_months)}`}
                      </span>
                      {onSelectPlan && (
                        <button
                          type="button"
                          onClick={() => onSelectPlan(plan.id)}
                          className="mt-1.5 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          Cấu hình gói →
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading && (
                <tr>
                  <td colSpan={plans.length + 1} className="py-12 text-center text-xs text-zinc-400">
                    Đang tải ma trận so sánh gói...
                  </td>
                </tr>
              )}

              {!isLoading && groupedSections.size === 0 && (
                <tr>
                  <td colSpan={plans.length + 1} className="py-12 text-center text-xs text-zinc-400">
                    Không tìm thấy dữ liệu nào.
                  </td>
                </tr>
              )}

              {!isLoading &&
                Array.from(groupedSections.entries()).map(([catKey, items]) => {
                  const catLabel =
                    FEATURE_CATEGORIES.find((c) => c.key === catKey)?.label ||
                    LIMIT_CATEGORIES.find((c) => c.key === catKey)?.label ||
                    catKey;

                  return (
                    <tr key={catKey} className="contents">
                      {/* Category Header Row */}
                      <tr className="bg-zinc-100/60 dark:bg-zinc-800/50">
                        <td
                          colSpan={plans.length + 1}
                          className="sticky left-0 z-5 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200"
                        >
                          {catLabel}
                        </td>
                      </tr>

                      {/* Items in Category */}
                      {items.map((item) => {
                        const isQuota = item.feature_type === 'QUOTA';
                        const unitMeta = LIMIT_UNITS[item.code];

                        return (
                          <tr
                            key={item.code}
                            className="hover:bg-zinc-50/60 dark:hover:bg-zinc-850/40 transition-colors"
                          >
                            {/* Sticky Left Column: Item Name & Key */}
                            <td className="sticky left-0 z-5 bg-white px-4 py-3 shadow-xs dark:bg-zinc-900">
                              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {item.name}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                                  {item.code}
                                </span>
                                {isQuota && (
                                  <span className="rounded-xs bg-purple-50 px-1 py-0.2 text-[9px] font-medium text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                    {unitMeta?.unit || 'quota'}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Plan Columns */}
                            {plans.map((plan) => {
                              const setting = getSetting(plan, item.code);

                              if (!isQuota) {
                                // Boolean feature
                                const isEnabled = setting ? setting.is_enabled : false;
                                return (
                                  <td key={plan.id} className="px-4 py-3 text-center">
                                    {isEnabled ? (
                                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                                        <Check className="h-3.5 w-3.5" weight="bold" />
                                      </span>
                                    ) : (
                                      <span className="inline-flex h-5 w-5 items-center justify-center text-zinc-300 dark:text-zinc-600">
                                        <Minus className="h-3.5 w-3.5" />
                                      </span>
                                    )}
                                  </td>
                                );
                              } else {
                                // Quota limit
                                const quota = setting?.quota_value;
                                const isUnlimited = setting ? quota === null || quota === undefined : false;

                                return (
                                  <td key={plan.id} className="px-4 py-3 text-center">
                                    {isUnlimited ? (
                                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                                        <InfinityIcon className="h-3.5 w-3.5" />
                                        <span>Không giới hạn</span>
                                      </span>
                                    ) : quota !== undefined && quota !== null ? (
                                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {quota.toLocaleString('vi-VN')}{' '}
                                        <span className="text-[10px] font-normal text-zinc-400">
                                          {unitMeta?.unit || ''}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="text-zinc-300 dark:text-zinc-600">—</span>
                                    )}
                                  </td>
                                );
                              }
                            })}
                          </tr>
                        );
                      })}
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
