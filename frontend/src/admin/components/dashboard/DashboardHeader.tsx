import type { DateRange } from '../../types/dashboard';
import { Plus, Lightning, CalendarBlank } from '@phosphor-icons/react';

interface DashboardHeaderProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  onOpenQuickActions: () => void;
  onCreateTenant: () => void;
}

const RANGES: { key: DateRange; label: string }[] = [
  { key: 'today', label: 'Hôm nay' },
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: '3m', label: '3 tháng' },
  { key: '12m', label: '12 tháng' },
];

export default function DashboardHeader({
  dateRange,
  onDateRangeChange,
  onOpenQuickActions,
  onCreateTenant,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            Tổng quan nền tảng
          </h1>
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
            Super Admin
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Trung tâm điều hành và phân tích sức khỏe toàn diện hệ thống SaaS FitFlow.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Date range filter */}
        <div className="flex items-center rounded-lg border border-zinc-200 bg-white p-0.5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
          <div className="hidden px-2 text-zinc-400 md:block">
            <CalendarBlank size={15} />
          </div>
          {RANGES.map((r) => {
            const active = dateRange === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => onDateRangeChange(r.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? 'bg-emerald-600 font-semibold text-white shadow-xs dark:bg-emerald-500 dark:text-zinc-950'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Quick Actions Button */}
        <button
          type="button"
          onClick={onOpenQuickActions}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Lightning size={14} className="text-amber-500" weight="fill" />
          <span>Thao tác nhanh</span>
        </button>

        {/* Create Tenant CTA */}
        <button
          type="button"
          onClick={onCreateTenant}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 active:scale-98 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400"
        >
          <Plus size={14} weight="bold" />
          <span>Tạo Tenant Mới</span>
        </button>
      </div>
    </div>
  );
}
