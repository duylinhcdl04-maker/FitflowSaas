import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CreditCard,
  Buildings,
  GearSix,
  ShieldCheck,
  ArrowRight,
  X,
} from '@phosphor-icons/react';
import { MOCK_NOTIFICATIONS } from '../api/mockDashboardData';
import type { AdminNotification } from '../types/dashboard';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>(MOCK_NOTIFICATIONS);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const categories = ['ALL', 'Billing', 'Tenant', 'System', 'Security'];

  const filtered =
    selectedCategory === 'ALL'
      ? notifications
      : notifications.filter((n) => n.category === selectedCategory);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  const categoryIcons: Record<string, JSX.Element> = {
    Billing: <CreditCard size={14} className="text-rose-500" />,
    Tenant: <Buildings size={14} className="text-blue-500" />,
    System: <GearSix size={14} className="text-amber-500" />,
    Security: <ShieldCheck size={14} className="text-emerald-500" />,
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        aria-label="Thông báo hệ thống"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-2xl ring-1 ring-black/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Thông báo Nền tảng
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  <Check size={12} weight="bold" />
                  <span>Đọc tất cả</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Đóng"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                {cat === 'ALL' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="mt-1 flex max-h-80 flex-col gap-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                Không có thông báo nào trong mục này.
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    markAsRead(item.id);
                    setIsOpen(false);
                    if (item.actionUrl) navigate(item.actionUrl);
                  }}
                  className={`group flex cursor-pointer items-start gap-2.5 rounded-xl p-2.5 text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${
                    !item.read ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                  }`}
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                    {categoryIcons[item.category] ?? <Bell size={13} />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-zinc-400">{item.time}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-zinc-500 line-clamp-2 dark:text-zinc-400">
                      {item.description}
                    </p>
                  </div>

                  {!item.read && (
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
