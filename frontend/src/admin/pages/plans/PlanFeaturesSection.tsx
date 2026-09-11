import { useState, useMemo } from 'react';
import {
  MagnifyingGlass,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  QrCode,
  Users,
  Barbell,
  ChartLineUp,
  ChatCircleDots,
  PlugsConnected,
  ShieldCheck,
  SquaresFour,
  X,
  Check,
} from '@phosphor-icons/react';
import type { PlatformFeature } from '../../api/plans';
import { FEATURE_CATEGORIES } from './types';
import Toggle from '../../components/Toggle';

interface PlanFeaturesSectionProps {
  allFeatures: PlatformFeature[];
  featureValues: Record<string, { isEnabled: boolean; quotaValue?: number | null }>;
  onToggleFeature: (featureCode: string, isEnabled: boolean) => void;
  disabled?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ALL: SquaresFour,
  CHECKIN: QrCode,
  MEMBERSHIP: Users,
  TRAINING: Barbell,
  ANALYTICS: ChartLineUp,
  COMMUNICATION: ChatCircleDots,
  INTEGRATION: PlugsConnected,
  SECURITY: ShieldCheck,
};

export default function PlanFeaturesSection({
  allFeatures,
  featureValues,
  onToggleFeature,
  disabled,
}: PlanFeaturesSectionProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');

  // Filter only boolean features or non-quota features for this tab
  const booleanFeatures = useMemo(() => {
    return allFeatures.filter((f) => f.feature_type !== 'QUOTA');
  }, [allFeatures]);

  // Map category code -> count stats
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; enabled: number }> = {};
    for (const cat of FEATURE_CATEGORIES) {
      stats[cat.key] = { total: 0, enabled: 0 };
    }

    for (const feat of booleanFeatures) {
      const mod = feat.module || 'OTHER';
      if (!stats[mod]) stats[mod] = { total: 0, enabled: 0 };
      stats[mod].total += 1;
      if (featureValues[feat.code]?.isEnabled) {
        stats[mod].enabled += 1;
      }
    }
    return stats;
  }, [booleanFeatures, featureValues]);

  const filteredFeatures = useMemo(() => {
    return booleanFeatures.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.code.toLowerCase().includes(search.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;
      if (selectedCategory !== 'ALL' && f.module !== selectedCategory) return false;

      const isEnabled = featureValues[f.code]?.isEnabled ?? false;
      if (statusFilter === 'ENABLED' && !isEnabled) return false;
      if (statusFilter === 'DISABLED' && isEnabled) return false;

      return true;
    });
  }, [booleanFeatures, search, selectedCategory, statusFilter, featureValues]);

  // Group by category
  const groupedFeatures = useMemo(() => {
    const map = new Map<string, PlatformFeature[]>();
    for (const feat of filteredFeatures) {
      const cat = feat.module || 'OTHER';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(feat);
    }
    return map;
  }, [filteredFeatures]);

  const totalCount = booleanFeatures.length;
  const enabledCount = Object.values(featureValues).filter((v) => v.isEnabled).length;

  const handleBulkToggle = (enable: boolean) => {
    if (disabled) return;
    booleanFeatures.forEach((f) => onToggleFeature(f.code, enable));
  };

  return (
    <div className="space-y-6">
      {/* Header with Search & Overall Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Phân quyền Tính năng (Feature Entitlements)
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Bật hoặc tắt quyền truy cập các module chức năng cao cấp của gói dịch vụ FitFlow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Đang kích hoạt: <span className="font-mono text-emerald-900 dark:text-emerald-200">{enabledCount}</span> / {totalCount} tính năng
          </div>

          {!disabled && (
            <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-2.5 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => handleBulkToggle(true)}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Bật tất cả
              </button>
              <button
                type="button"
                onClick={() => handleBulkToggle(false)}
                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                Tắt tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control Toolbar: Search & Status Filters */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-3 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/90">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên tính năng hoặc mã code (VD: ATTENDANCE, QR, ...)..."
              className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 pl-10 pr-9 text-xs text-zinc-900 placeholder-zinc-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100"
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

          {/* Quick Status Filter Tabs */}
          <div className="flex items-center gap-1 self-start rounded-lg bg-zinc-100 p-1 text-xs dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-md px-3 py-1.5 font-medium transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-zinc-900 shadow-2xs dark:bg-zinc-700 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Tất cả ({booleanFeatures.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ENABLED')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
                statusFilter === 'ENABLED'
                  ? 'bg-white text-emerald-700 shadow-2xs dark:bg-zinc-700 dark:text-emerald-400'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              Đã bật ({enabledCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DISABLED')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
                statusFilter === 'DISABLED'
                  ? 'bg-white text-rose-700 shadow-2xs dark:bg-zinc-700 dark:text-rose-400'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <XCircle className="h-3.5 w-3.5 text-rose-500" />
              Đang tắt ({totalCount - enabledCount})
            </button>
          </div>
        </div>

        {/* Dedicated Full-Width Category Pill Bar */}
        <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {/* All Category Pill */}
            {(() => {
              const Icon = CATEGORY_ICONS['ALL'] || SquaresFour;
              const isActive = selectedCategory === 'ALL';
              return (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className={`group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-zinc-950 font-semibold'
                      : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white dark:text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                  <span>Tất cả danh mục</span>
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-700 text-emerald-100 dark:bg-emerald-600 dark:text-zinc-950'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {enabledCount}/{totalCount}
                  </span>
                </button>
              );
            })()}

            {/* Category Items */}
            {FEATURE_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.key] || SlidersHorizontal;
              const isActive = selectedCategory === cat.key;
              const stats = categoryStats[cat.key] || { total: 0, enabled: 0 };

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`group inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs dark:bg-emerald-500 dark:text-zinc-950 font-semibold'
                      : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white dark:text-zinc-950' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                  <span>{cat.label}</span>
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-700 text-emerald-100 dark:bg-emerald-600 dark:text-zinc-950'
                        : stats.enabled > 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400'
                    }`}
                  >
                    {stats.enabled}/{stats.total}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {groupedFeatures.size === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white py-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <SlidersHorizontal className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Không tìm thấy tính năng nào phù hợp
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc phân loại.
          </p>
          {(search || selectedCategory !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCategory('ALL');
                setStatusFilter('ALL');
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              <X className="h-3.5 w-3.5" />
              Đặt lại toàn bộ bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Feature Categories Grouped List */}
      <div className="space-y-5">
        {Array.from(groupedFeatures.entries()).map(([catKey, features]) => {
          const meta = FEATURE_CATEGORIES.find((c) => c.key === catKey) || {
            key: catKey,
            label: catKey,
            description: 'Danh mục tính năng mở rộng hệ thống',
          };
          const Icon = CATEGORY_ICONS[catKey] || SlidersHorizontal;

          const catEnabledCount = features.filter((f) => featureValues[f.code]?.isEnabled).length;
          const allEnabledInCat = catEnabledCount === features.length;

          return (
            <div
              key={catKey}
              className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-2xs transition dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Category Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 bg-zinc-50/70 px-5 py-3.5 dark:border-zinc-800 dark:bg-zinc-850/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        {meta.label}
                      </h4>
                      <span className="rounded-full bg-zinc-200/80 px-2 py-0.2 text-[10px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                        {catEnabledCount} / {features.length} đang bật
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      {meta.description}
                    </p>
                  </div>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetState = !allEnabledInCat;
                      features.forEach((f) => onToggleFeature(f.code, targetState));
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      allEnabledInCat
                        ? 'border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                    }`}
                  >
                    {allEnabledInCat ? (
                      <>
                        <X className="h-3 w-3" />
                        Tắt tất cả trong nhóm
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        Bật tất cả trong nhóm
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Items in Category */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {features.map((feat) => {
                  const isEnabled = featureValues[feat.code]?.isEnabled ?? false;

                  return (
                    <div
                      key={feat.code}
                      className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-center sm:justify-between ${
                        isEnabled
                          ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                          : 'hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {feat.name}
                          </span>
                          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            {feat.code}
                          </span>
                          <span className="inline-flex rounded-xs bg-emerald-50 px-1.5 py-0.2 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Boolean
                          </span>
                        </div>
                        {feat.description && (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                            {feat.description}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isEnabled
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {isEnabled ? 'ĐANG BẬT' : 'TẮT'}
                        </span>
                        <Toggle
                          checked={isEnabled}
                          onChange={(checked) => !disabled && onToggleFeature(feat.code, checked)}
                          disabled={disabled}
                        />
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

