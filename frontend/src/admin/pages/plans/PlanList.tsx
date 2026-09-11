import { useState, useMemo } from 'react';
import { MagnifyingGlass, Plus, Users, Sparkle, Star, Gauge, Plug } from '@phosphor-icons/react';
import type { Plan } from '../../api/plans';

function formatMoney(amount: string | number, currency: string) {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN').format(num) + ' ' + currency;
}

interface PlanListProps {
  plans: Plan[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  onCreateNewPlan: () => void;
  isLoading?: boolean;
}

export default function PlanList({
  plans,
  selectedPlanId,
  onSelectPlan,
  onCreateNewPlan,
  isLoading,
}: PlanListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'ARCHIVED'>('ALL');

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchSearch =
        plan.name.toLowerCase().includes(search.toLowerCase()) ||
        plan.code.toLowerCase().includes(search.toLowerCase()) ||
        (plan.slogan && plan.slogan.toLowerCase().includes(search.toLowerCase())) ||
        (plan.description && plan.description.toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (statusFilter === 'ACTIVE') return plan.status === 'ACTIVE';
      if (statusFilter === 'DRAFT') return plan.status === 'DRAFT';
      if (statusFilter === 'ARCHIVED') return plan.status === 'ARCHIVED';
      return true;
    });
  }, [plans, search, statusFilter]);

  return (
    <div className="flex w-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:w-84 lg:shrink-0 h-full overflow-hidden">
      {/* Header with Search & Filter */}
      <div className="border-b border-zinc-100 p-4 dark:border-zinc-800 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">Danh sách Gói</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {plans.length} gói SaaS nền tảng
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateNewPlan}
            className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-cyan-500 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" weight="bold" />
            <span>Gói mới</span>
          </button>
        </div>

        {/* Search box */}
        <div className="relative mt-3">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm gói theo tên, mã, slogan..."
            className="h-8.5 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 pl-8.5 pr-3 text-xs text-zinc-900 placeholder-zinc-400 transition focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-100 dark:focus:bg-zinc-900"
          />
        </div>

        {/* Status filter pills */}
        <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pb-0.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-md px-2 py-1 font-medium transition shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Tất cả ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`rounded-md px-2 py-1 font-medium transition shrink-0 ${
              statusFilter === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Đang bán
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DRAFT')}
            className={`rounded-md px-2 py-1 font-medium transition shrink-0 ${
              statusFilter === 'DRAFT'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Bản nháp
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ARCHIVED')}
            className={`rounded-md px-2 py-1 font-medium transition shrink-0 ${
              statusFilter === 'ARCHIVED'
                ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            Lưu trữ
          </button>
        </div>
      </div>

      {/* Plan items list */}
      <div className="flex-1 space-y-2 overflow-y-auto p-2.5">
        {isLoading && (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        )}

        {!isLoading && filteredPlans.length === 0 && (
          <div className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Không tìm thấy gói nào phù hợp.
          </div>
        )}

        {!isLoading &&
          filteredPlans.map((plan) => {
            const isSelected = plan.id === selectedPlanId;
            const subsCount = plan._count?.subscriptions ?? 0;
            const enabledFeaturesCount = plan.saas_plan_features?.filter((f) => f.is_enabled).length ?? 0;
            const enabledIntegrationsCount = plan.plan_integrations?.filter((i) => i.is_enabled).length ?? 0;

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => onSelectPlan(plan.id)}
                className={`group relative flex w-full flex-col rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-cyan-500/80 bg-cyan-50/40 shadow-sm dark:border-cyan-500/50 dark:bg-cyan-950/20'
                    : 'border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/50'
                }`}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-cyan-500" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {plan.name}
                      </span>
                      {plan.badge_text && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {plan.badge_text}
                        </span>
                      )}
                    </div>
                    {plan.slogan ? (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                        {plan.slogan}
                      </p>
                    ) : null}
                  </div>

                  {plan.is_popular && (
                    <span className="shrink-0 text-amber-400" title="Hero Plan / Phổ biến nhất">
                      <Star className="w-4 h-4 weight-fill" />
                    </span>
                  )}
                </div>

                {/* Price & Code row */}
                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(plan.price, plan.currency || 'VND')}
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">/tháng</span>
                  </div>

                  <span className="font-mono text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                    {plan.code}
                  </span>
                </div>

                {/* Footer specs badges */}
                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-purple-400" title="Tính năng kích hoạt">
                      <Sparkle className="h-3 w-3" />
                      <span>{enabledFeaturesCount}</span>
                    </span>
                    <span className="flex items-center gap-1 text-indigo-400" title="Tích hợp kích hoạt">
                      <Plug className="h-3 w-3" />
                      <span>{enabledIntegrationsCount}</span>
                    </span>
                  </div>

                  <span className="flex items-center gap-1 text-cyan-400 font-medium">
                    <Users className="h-3 w-3" />
                    <span>{subsCount} tenants</span>
                  </span>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
