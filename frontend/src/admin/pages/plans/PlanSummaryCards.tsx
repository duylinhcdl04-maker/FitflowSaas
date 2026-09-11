import { CurrencyDollar, Users, Sparkle, Gauge } from '@phosphor-icons/react';
import type { Plan } from '../../api/plans';
import { monthsLabel } from '../../lib/billing';

function formatMoney(amount: string | number, currency: string) {
  const num = Number(amount);
  if (isNaN(num) || num === 0) return 'Miễn phí';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(num);
}

interface PlanSummaryCardsProps {
  plan: Plan;
  onViewSubscribers?: () => void;
  onViewFeatures?: () => void;
  onViewLimits?: () => void;
}

export default function PlanSummaryCards({
  plan,
  onViewSubscribers,
  onViewFeatures,
  onViewLimits,
}: PlanSummaryCardsProps) {
  const isFreeTrial = Number(plan.price) === 0 || plan.code === 'TRIAL';
  const subsCount = plan._count?.subscriptions ?? 0;
  const enabledFeaturesCount = plan.saas_plan_features?.filter((f) => f.is_enabled && f.platform_features?.feature_type !== 'QUOTA').length ?? 0;
  const configuredLimitsCount = plan.saas_plan_features?.filter((f) => f.platform_features?.feature_type === 'QUOTA' && f.is_enabled).length ?? 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* 1. Price Card */}
      <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {isFreeTrial ? 'Gói trải nghiệm' : 'Giá thuê bao'}
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CurrencyDollar className="h-3.5 w-3.5" weight="bold" />
          </span>
        </div>
        <div className="mt-2">
          <div className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            {isFreeTrial ? 'Miễn phí (0 ₫)' : formatMoney(plan.price, plan.currency)}
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {isFreeTrial
              ? `Thời hạn ${plan.trial_days || 14} ngày trải nghiệm`
              : `/ ${monthsLabel(plan.billing_cycle_months)}`}
          </p>
        </div>
      </div>

      {/* 2. Tenants Card */}
      <div
        onClick={onViewSubscribers}
        className={`group rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs transition dark:border-zinc-800 dark:bg-zinc-900/60 ${
          onViewSubscribers ? 'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Thuê bao</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Users className="h-3.5 w-3.5" weight="bold" />
          </span>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">{subsCount}</span>
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">tenants</span>
          </div>
          <p className="text-[11px] text-zinc-500 group-hover:text-blue-600 dark:text-zinc-400 dark:group-hover:text-blue-400">
            đang sử dụng gói →
          </p>
        </div>
      </div>

      {/* 3. Features Card */}
      <div
        onClick={onViewFeatures}
        className={`group rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs transition dark:border-zinc-800 dark:bg-zinc-900/60 ${
          onViewFeatures ? 'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tính năng bật</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <Sparkle className="h-3.5 w-3.5" weight="bold" />
          </span>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">{enabledFeaturesCount}</span>
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">modules</span>
          </div>
          <p className="text-[11px] text-zinc-500 group-hover:text-amber-600 dark:text-zinc-400 dark:group-hover:text-amber-400">
            features enabled →
          </p>
        </div>
      </div>

      {/* 4. Limits Card */}
      <div
        onClick={onViewLimits}
        className={`group rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-2xs transition dark:border-zinc-800 dark:bg-zinc-900/60 ${
          onViewLimits ? 'cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Giới hạn định mức</span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
            <Gauge className="h-3.5 w-3.5" weight="bold" />
          </span>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">{configuredLimitsCount}</span>
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">quotas</span>
          </div>
          <p className="text-[11px] text-zinc-500 group-hover:text-purple-600 dark:text-zinc-400 dark:group-hover:text-purple-400">
            limits configured →
          </p>
        </div>
      </div>
    </div>
  );
}
