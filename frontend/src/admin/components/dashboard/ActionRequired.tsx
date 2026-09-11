import { useNavigate } from 'react-router-dom';
import {
  WarningOctagon,
  Warning,
  Info,
  ArrowRight,
  CheckCircle,
} from '@phosphor-icons/react';
import type { ActionItem } from '../../types/dashboard';

interface ActionRequiredProps {
  items: ActionItem[];
  isLoading?: boolean;
}

export default function ActionRequired({ items, isLoading }: ActionRequiredProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-36 bg-zinc-100 rounded dark:bg-zinc-800 animate-pulse" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Hành động cần xử lý ngay
          </h2>
          {items.length > 0 && (
            <span className="flex h-5 items-center rounded-full bg-rose-50 px-2 text-xs font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
              {items.length}
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">Ưu tiên vận hành</span>
      </div>

      <div className="mt-3.5 flex flex-col gap-2.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle size={24} weight="fill" />
            </div>
            <p className="mt-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Mọi thứ đều hoàn hảo
            </p>
            <p className="mt-0.5 text-xs text-zinc-400">
              Không có sự cố thanh toán hay tenant nào cần can thiệp lúc này.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isCritical = item.severity === 'critical';
            const isWarning = item.severity === 'warning';

            return (
              <div
                key={item.id}
                className={`group flex items-start justify-between gap-3 rounded-lg border p-3 transition-all hover:shadow-xs ${
                  isCritical
                    ? 'border-rose-200/80 bg-rose-50/40 hover:bg-rose-50/70 dark:border-rose-900/40 dark:bg-rose-950/20 dark:hover:bg-rose-950/30'
                    : isWarning
                    ? 'border-amber-200/80 bg-amber-50/30 hover:bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20 dark:hover:bg-amber-950/30'
                    : 'border-zinc-200 bg-zinc-50/60 hover:bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                      isCritical
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                        : isWarning
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                    }`}
                  >
                    {isCritical ? (
                      <WarningOctagon size={15} weight="fill" />
                    ) : isWarning ? (
                      <Warning size={15} weight="fill" />
                    ) : (
                      <Info size={15} weight="fill" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(item.ctaPath)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isCritical
                      ? 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:text-white dark:hover:bg-rose-600'
                      : isWarning
                      ? 'bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-zinc-950 dark:hover:bg-amber-400'
                      : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  <span>{item.ctaText}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
