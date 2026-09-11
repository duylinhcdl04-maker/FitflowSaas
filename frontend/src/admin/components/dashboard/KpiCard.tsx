import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendUp, TrendDown, Minus, ArrowUpRight } from '@phosphor-icons/react';
import type { KpiMetric } from '../../types/dashboard';

interface KpiCardProps {
  metric: KpiMetric;
  icon: ReactNode;
}

export default function KpiCard({ metric, icon }: KpiCardProps) {
  const navigate = useNavigate();

  const toneClasses = {
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 dark:text-purple-400',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400',
    red: 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400',
  }[metric.tone];

  const trendIcon =
    metric.trend === 'up' ? (
      <TrendUp size={13} weight="bold" />
    ) : metric.trend === 'down' ? (
      <TrendDown size={13} weight="bold" />
    ) : (
      <Minus size={13} />
    );

  const trendBadgeClass =
    metric.trend === 'up'
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
      : metric.trend === 'down'
      ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';

  return (
    <button
      type="button"
      onClick={() => navigate(metric.targetPath)}
      className="group relative flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {metric.label}
        </span>
        <div className="flex items-center gap-1">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClasses}`}>
            {icon}
          </span>
          <ArrowUpRight
            size={14}
            className="text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-600"
          />
        </div>
      </div>

      <div className="mt-3">
        <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {metric.value}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
          {metric.changePercent !== undefined ? (
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ${trendBadgeClass}`}
            >
              {trendIcon}
              {metric.changePercent > 0 ? `+${metric.changePercent}%` : `${metric.changePercent}%`}
            </span>
          ) : metric.tone === 'red' ? (
            <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
              Cần xử lý
            </span>
          ) : null}

          <span className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate">
            {metric.changeLabel}
          </span>
        </div>

        {metric.hint && (
          <p className="mt-1.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
            {metric.hint}
          </p>
        )}
      </div>
    </button>
  );
}
