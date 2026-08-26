import { Link } from 'react-router-dom';
import {
  MagnifyingGlass,
  Bell,
  CalendarBlank,
  QrCode,
  Storefront,
} from '@phosphor-icons/react';

interface ManagerHeaderProps {
  branchName?: string;
  branchAddress?: string;
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  unreadAlertsCount?: number;
  onOpenQuickSearch?: () => void;
}

export default function ManagerHeader({
  branchName = 'Cơ sở 2 Hà Nội',
  branchAddress = '18 Tam Trinh, Hai Bà Trưng',
  dateRange,
  onDateRangeChange,
  unreadAlertsCount = 0,
  onOpenQuickSearch,
}: ManagerHeaderProps) {
  const todayString = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-stone-200/80 bg-white/80 px-6 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/80 shadow-xs">
      {/* Left section: Branch status badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 shadow-xs">
            <Storefront size={20} weight="duotone" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {branchName}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                ĐANG MỞ CỬA
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
              {branchAddress}
            </p>
          </div>
        </div>
      </div>

      {/* Middle section: Global search launcher (Command Palette trigger) */}
      <div className="hidden lg:flex items-center w-80">
        <button
          type="button"
          onClick={onOpenQuickSearch}
          className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-stone-50/80 px-3.5 py-1.5 text-xs text-zinc-400 hover:border-emerald-500/50 hover:bg-white dark:border-zinc-700/80 dark:bg-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <MagnifyingGlass
              size={16}
              className="text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
            />
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Tìm kiếm nhanh hoặc lệnh...</span>
          </div>
          <kbd className="rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 shadow-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right section: Controls & Actions */}
      <div className="flex items-center gap-3">
        {/* Date string */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 capitalize bg-stone-100/80 dark:bg-zinc-800/80 px-3 py-1.5 rounded-xl border border-stone-200/60 dark:border-zinc-700/60">
          <CalendarBlank size={14} className="text-zinc-400" />
          <span>{todayString}</span>
        </div>

        {/* Date Filter Segmented Control */}
        <div className="flex items-center rounded-xl bg-stone-100 p-0.5 dark:bg-zinc-800/80 border border-stone-200/60 dark:border-zinc-700/60 text-xs font-semibold">
          {[
            { id: 'today', label: 'Hôm nay' },
            { id: 'week', label: 'Tuần này' },
            { id: 'month', label: 'Tháng này' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onDateRangeChange(item.id)}
              className={`rounded-lg px-2.5 py-1 transition-all ${
                dateRange === item.id
                  ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-700 dark:text-zinc-50 font-bold'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={onOpenQuickSearch}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-zinc-600 hover:bg-stone-50 hover:text-zinc-900 dark:border-zinc-700/80 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-all"
          title="Thông báo cảnh báo"
        >
          <Bell size={18} />
          {unreadAlertsCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-zinc-900">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Primary Action Button */}
        <Link
          to="/manager/checkin"
          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-lg dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-all"
        >
          <QrCode size={16} />
          <span>Check-in quầy</span>
        </Link>
      </div>
    </header>
  );
}
