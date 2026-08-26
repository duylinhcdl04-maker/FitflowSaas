import React from 'react';
import { TrendUp, TrendDown } from '@phosphor-icons/react';

interface SaaSStatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  subText?: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  isLive?: boolean;
  accentColor?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'indigo';
  onClick?: () => void;
}

export default function SaaSStatCard({
  title,
  value,
  unit,
  icon: Icon,
  iconColor = 'text-emerald-600 dark:text-emerald-400',
  iconBg = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-800/60',
  subText,
  trend,
  isLive = false,
  onClick,
}: SaaSStatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/5 dark:border-zinc-800/80 dark:bg-zinc-900/90 dark:hover:border-zinc-700 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Top ambient glow gradient line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {title}
            </span>
            {isLive && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                LIVE
              </span>
            )}
          </div>

          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${iconBg} shadow-sm transition-transform duration-300 group-hover:scale-110`}
        >
          <Icon size={24} className={iconColor} weight="duotone" />
        </div>
      </div>

      {/* Subtext or Trend indicator */}
      {(subText || trend) && (
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-zinc-800/80">
          {subText && (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {subText}
            </span>
          )}

          {trend && (
            <span
              className={`flex items-center gap-0.5 text-xs font-bold ${
                trend.isUp
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.isUp ? <TrendUp size={14} /> : <TrendDown size={14} />}
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
