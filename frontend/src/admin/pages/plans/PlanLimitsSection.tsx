import { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  Infinity as InfinityIcon,
  Buildings,
  Users,
  Barbell,
  QrCode,
  HardDrives,
  ChatCircleDots,
  SquaresFour,
  X,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import type { PlatformFeature } from '../../api/plans';
import { LIMIT_CATEGORIES, LIMIT_UNITS } from './types';
import { inputClass } from '../../components/FormField';

interface PlanLimitsSectionProps {
  allFeatures: PlatformFeature[];
  featureValues: Record<string, { isEnabled: boolean; quotaValue?: number | null }>;
  onChangeQuota: (featureCode: string, quotaValue: number | null) => void;
  disabled?: boolean;
}

const LIMIT_CATEGORY_ICONS: Record<string, React.ElementType> = {
  ALL: SquaresFour,
  ACCOUNT: Buildings,
  MEMBERS: Users,
  TRAINING: Barbell,
  OPERATIONS: QrCode,
  STORAGE: HardDrives,
  COMMUNICATION: ChatCircleDots,
};

export default function PlanLimitsSection({
  allFeatures,
  featureValues,
  onChangeQuota,
  disabled,
}: PlanLimitsSectionProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter only quota limits
  const quotaFeatures = useMemo(() => {
    return allFeatures.filter((f) => f.feature_type === 'QUOTA');
  }, [allFeatures]);

  const filteredLimits = useMemo(() => {
    return quotaFeatures.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (selectedCategory !== 'ALL' && f.module !== selectedCategory) return false;
      return true;
    });
  }, [quotaFeatures, search, selectedCategory]);

  // Group by category
  const groupedLimits = useMemo(() => {
    const map = new Map<string, PlatformFeature[]>();
    for (const feat of filteredLimits) {
      const cat = feat.module || 'ACCOUNT';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(feat);
    }
    return map;
  }, [filteredLimits]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Giới hạn Định mức Tài nguyên (Usage Limits & Quotas)
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Thiết lập trần tài nguyên tối đa (nhân viên, hội viên, chi nhánh, lưu trữ, SMS) mà tenant được phép sử dụng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-lg border border-purple-200/80 bg-purple-50/80 px-3 py-1.5 text-xs font-semibold text-purple-800 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
            Đang quản lý <span className="font-mono text-purple-900 dark:text-purple-200">{quotaFeatures.length}</span> định mức tài nguyên
          </span>
        </div>
      </div>

      {/* Control Toolbar: Search & Category Navigation */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="relative">
          <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên giới hạn hoặc mã định mức (VD: MAX_MEMBERS, STORAGE, ...)..."
            className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 pl-10 pr-9 text-xs text-zinc-900 placeholder-zinc-400 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dedicated Full-Width Category Pill Bar */}
        <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {/* All Category Pill */}
            {(() => {
              const Icon = LIMIT_CATEGORY_ICONS['ALL'] || SquaresFour;
              const isActive = selectedCategory === 'ALL';
              return (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-xs dark:bg-purple-500 dark:text-zinc-950 font-semibold'
                      : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white dark:text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                  <span>Tất cả định mức</span>
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? 'bg-purple-700 text-purple-100 dark:bg-purple-600 dark:text-zinc-950'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {quotaFeatures.length}
                  </span>
                </button>
              );
            })()}

            {/* Limit Categories */}
            {LIMIT_CATEGORIES.map((cat) => {
              const Icon = LIMIT_CATEGORY_ICONS[cat.key] || SlidersHorizontal;
              const isActive = selectedCategory === cat.key;
              const count = quotaFeatures.filter((f) => f.module === cat.key).length;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-xs dark:bg-purple-500 dark:text-zinc-950 font-semibold'
                      : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white dark:text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                  <span>{cat.label}</span>
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? 'bg-purple-700 text-purple-100 dark:bg-purple-600 dark:text-zinc-950'
                        : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {groupedLimits.size === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <SlidersHorizontal className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Không tìm thấy giới hạn tài nguyên nào phù hợp
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn lại danh mục.
          </p>
        </div>
      )}

      {/* Grouped Limit Cards */}
      <div className="space-y-5">
        {Array.from(groupedLimits.entries()).map(([catKey, limits]) => {
          const meta = LIMIT_CATEGORIES.find((c) => c.key === catKey) || {
            key: catKey,
            label: catKey,
            description: 'Giới hạn vận hành hệ thống',
          };
          const Icon = LIMIT_CATEGORY_ICONS[catKey] || SlidersHorizontal;

          return (
            <div
              key={catKey}
              className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-2xs transition dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-850/60">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    {meta.label}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">{meta.description}</p>
                </div>
              </div>

              {/* Limit items */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {limits.map((limit) => {
                  const unitMeta = LIMIT_UNITS[limit.code] || { unit: 'đơn vị', defaultVal: 100 };
                  const currentVal = featureValues[limit.code]?.quotaValue;
                  const isUnlimited = currentVal === null || currentVal === undefined;

                  return (
                    <div
                      key={limit.code}
                      className="flex flex-col gap-3 p-4 transition-colors hover:bg-zinc-50/60 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-zinc-800/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {limit.name}
                          </span>
                          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {limit.code}
                          </span>
                          <span className="rounded-xs bg-purple-50 px-1.5 py-0.2 text-[10px] font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                            {unitMeta.unit}
                          </span>
                        </div>
                        {limit.description && (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {limit.description}
                          </p>
                        )}
                      </div>

                      {/* Controls: numeric input + unlimited checkbox */}
                      <div className="flex shrink-0 items-center gap-4">
                        {/* Numeric input */}
                        <div className="relative w-38">
                          {isUnlimited ? (
                            <div className="flex h-9 w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                              <InfinityIcon className="mr-1.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              Không giới hạn
                            </div>
                          <div className="flex h-9 items-center rounded-lg border border-zinc-200 bg-white shadow-xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-900">
                            <input
                              type="number"
                              min={0}
                              disabled={disabled}
                              value={currentVal ?? 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                onChangeQuota(limit.code, isNaN(val) ? 0 : Math.max(0, val));
                              }}
                              className="h-full w-full bg-transparent px-3 text-right font-mono text-xs font-bold text-zinc-900 focus:outline-none dark:text-zinc-100"
                            />
                            <span className="shrink-0 rounded-r-lg border-l border-zinc-100 bg-zinc-50 px-2.5 py-2 text-[11px] font-medium text-zinc-500 select-none dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                              {unitMeta.unit}
                            </span>
                          </div>
                        )}
                        </div>

                        {/* Unlimited toggle */}
                        <label className="flex cursor-pointer select-none items-center gap-2 rounded-lg border border-zinc-200/80 bg-zinc-50/60 px-2.5 py-2 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-750">
                          <input
                            type="checkbox"
                            disabled={disabled}
                            checked={isUnlimited}
                            onChange={(e) => {
                              if (e.target.checked) {
                                onChangeQuota(limit.code, null);
                              } else {
                                onChangeQuota(limit.code, unitMeta.defaultVal ?? 100);
                              }
                            }}
                            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800"
                          />
                          <span className="font-semibold text-[11px]">Không giới hạn (∞)</span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

