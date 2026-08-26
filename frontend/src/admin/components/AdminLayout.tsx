import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  SquaresFour,
  Buildings,
  Stack,
  Package,
  Receipt,
  Money,
  IdentificationBadge,
  GearSix,
  ClipboardText,
  SignOut,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  CaretDown,
} from '@phosphor-icons/react';
import { useAuthStore } from '../store/auth-store';
import { logout } from '../api/auth';
import ThemeToggle from './ThemeToggle';
import CommandPalette from './CommandPalette';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tổng quan', icon: SquaresFour, end: true },
  { to: '/admin/tenants', label: 'Tenants', icon: Buildings },
  { to: '/admin/plans', label: 'Gói & Tính năng', icon: Stack },
  { to: '/admin/addons', label: 'Add-on', icon: Package },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: Receipt },
  { to: '/admin/invoices', label: 'Hoá đơn SaaS', icon: Money },
  { to: '/admin/staff', label: 'Nhân sự nền tảng', icon: IdentificationBadge },
  { to: '/admin/audit-logs', label: 'Audit Log', icon: ClipboardText },
  { to: '/admin/settings', label: 'Cài đặt', icon: GearSix },
];

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Ctrl/Cmd+K opens the tenant search palette from anywhere in the admin area.
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === 'Escape') setPaletteOpen(false);
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      navigate('/admin/login', { replace: true });
    }
  }

  return (
    <div className="flex min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <aside
        className={`flex shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 dark:border-zinc-800 dark:bg-zinc-900 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center gap-2 px-5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white dark:bg-emerald-500 dark:text-zinc-950">
            F
          </span>
          {!collapsed && (
            <span className="font-display truncate text-base font-bold text-zinc-900 dark:text-zinc-50">
              FitFlow Admin
            </span>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-emerald-600 dark:bg-emerald-400" />
                  )}
                  <Icon size={20} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white/80 px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden w-72 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-white sm:flex dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
          >
            <MagnifyingGlass size={16} />
            <span className="flex-1 text-left">Tìm tenant...</span>
            <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Tìm tenant"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <MagnifyingGlass size={18} />
          </button>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-800" />
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-100 marker:content-none dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {initials(user?.fullName)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-36 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {user?.fullName}
                  </span>
                  <span className="block max-w-36 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {user?.email}
                  </span>
                </span>
                <CaretDown size={14} className="hidden text-zinc-400 sm:block" />
              </summary>
              <div className="absolute right-0 z-30 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 px-2.5 py-2 sm:hidden dark:border-zinc-800">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {user?.fullName}
                  </p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <SignOut size={16} />
                  Đăng xuất
                </button>
              </div>
            </details>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
