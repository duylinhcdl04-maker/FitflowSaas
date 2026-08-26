import React from 'react';
import { ArrowRight, WarningCircle, Warning, Info } from '@phosphor-icons/react';

interface SaaSActionCardProps {
  priority: 'CRITICAL' | 'WARNING' | 'INFORMATION';
  title: string;
  description: string;
  count: number;
  onAction?: () => void;
}

export default function SaaSActionCard({
  priority,
  title,
  description,
  count,
  onAction,
}: SaaSActionCardProps) {
  const config = {
    CRITICAL: {
      border: 'border-l-4 border-l-rose-500 border-stone-200/80 dark:border-zinc-800',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
      icon: WarningCircle,
      iconColor: 'text-rose-600 dark:text-rose-400',
      countBg: 'bg-rose-500 text-white',
      btnHover: 'hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-300',
      label: 'CRITICAL',
    },
    WARNING: {
      border: 'border-l-4 border-l-amber-500 border-stone-200/80 dark:border-zinc-800',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
      icon: Warning,
      iconColor: 'text-amber-600 dark:text-amber-400',
      countBg: 'bg-amber-500 text-white',
      btnHover: 'hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/50 dark:hover:text-amber-300',
      label: 'WARNING',
    },
    INFORMATION: {
      border: 'border-l-4 border-l-sky-500 border-stone-200/80 dark:border-zinc-800',
      badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300',
      icon: Info,
      iconColor: 'text-sky-600 dark:text-sky-400',
      countBg: 'bg-sky-500 text-white',
      btnHover: 'hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950/50 dark:hover:text-sky-300',
      label: 'INFO',
    },
  }[priority];

  const SeverityIcon = config.icon;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-900/90 ${config.border}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider ${config.badge}`}
          >
            <SeverityIcon size={12} weight="bold" />
            {config.label}
          </span>

          <span
            className={`flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold shadow-sm ${config.countBg}`}
          >
            {count}
          </span>
        </div>

        <h4 className="mt-3 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
          {title}
        </h4>

        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-5 pt-3 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
          {count > 0 ? `${count} trường hợp` : 'Đã xử lý xong'}
        </span>

        <button
          type="button"
          onClick={onAction}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-200 transition-all ${config.btnHover}`}
        >
          <span>Xử lý ngay</span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
