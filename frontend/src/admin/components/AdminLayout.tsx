import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  SquaresFour,
  Buildings,
  ChartLine,
  Stack,
  Package,
  Receipt,
  Money,
  Heartbeat,
  HardDrives,
  Bell,
  IdentificationBadge,
  ClipboardText,
  GearSix,
  SignOut,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  CaretDown,
  List,
  X,
  SidebarSimple,
} from '@phosphor-icons/react';
import { useAuthStore } from '../store/auth-store';
import { logout } from '../api/auth';
import { getPlatformSettings } from '../api/settings';
import ThemeToggle from './ThemeToggle';
import CommandPalette from './CommandPalette';
import NotificationCenter from './NotificationCenter';
import NetworkStatusBadge from '../../components/NetworkStatusBadge';

interface NavGroup {
  title: string;
  items: {
    to: string;
    label: string;
    icon: typeof SquaresFour;
    end?: boolean;
    badge?: string;
    badgeTone?: 'emerald' | 'amber' | 'rose';
  }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'PLATFORM',
    items: [
      { to: '/admin', label: 'Tổng quan', icon: SquaresFour, end: true },
      { to: '/admin/tenants', label: 'Tenants', icon: Buildings },
      { to: '/admin/subscriptions', label: 'Analytics', icon: ChartLine },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      { to: '/admin/plans', label: 'Gói & Tính năng', icon: Stack },
      { to: '/admin/addons', label: 'Add-ons', icon: Package },
      { to: '/admin/subscriptions', label: 'Subscriptions', icon: Receipt, badge: '5', badgeTone: 'amber' },
      { to: '/admin/invoices', label: 'Hóa đơn SaaS', icon: Money, badge: '7', badgeTone: 'rose' },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { to: '/admin/settings', label: 'System Health', icon: Heartbeat, badge: '●', badgeTone: 'emerald' },
      { to: '/admin/settings', label: 'Usage & Limits', icon: HardDrives },
      { to: '/admin/audit-logs', label: 'Notifications', icon: Bell },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { to: '/admin/staff', label: 'Nhân sự nền tảng', icon: IdentificationBadge },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardText },
      { to: '/admin/settings', label: 'Cài đặt', icon: GearSix },
    ],
  },
];

function initials(name?: string) {
  if (!name) return 'SA';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Fetch Platform Settings for Dynamic Branding
  const { data: platformSettings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: getPlatformSettings,
    staleTime: 1000 * 60 * 5,
  });

  const branding = platformSettings?.BRANDING?.value;
  const platformName = branding?.name || 'FitFlow';
  const logoUrl = branding?.logoUrl;
  const faviconUrl = branding?.faviconUrl;

  // Dynamically update Document Title and Favicon
  useEffect(() => {
    if (platformName) {
      document.title = `${platformName} — SaaS Control Center`;
    }
    if (faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [platformName, faviconUrl]);

  // Ctrl/Cmd+K opens the global tenant search palette
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      const isAdmin = window.location.hostname.startsWith('admin.');
      navigate(isAdmin ? '/login' : '/admin/login', { replace: true });
    }
  }

  return (
    <div className="flex h-screen h-dvh overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop Collapsible Sidebar (Fixed / Stays in place when scrolling) */}
      <aside
        className={`hidden md:flex h-full shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-300 ease-in-out dark:border-zinc-800 dark:bg-zinc-900 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-16 items-center border-b border-zinc-100 px-4 dark:border-zinc-800/80 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {collapsed ? (
              faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt={platformName}
                  className="h-9 w-9 rounded-xl object-contain shadow-xs"
                />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt={platformName}
                  className="h-9 w-9 rounded-xl object-contain shadow-xs"
                />
              ) : (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-display text-sm font-bold text-white shadow-xs dark:bg-emerald-500 dark:text-zinc-950">
                  {platformName.charAt(0) || 'F'}
                </span>
              )
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                {logoUrl ? (
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <img
                      src={logoUrl}
                      alt={platformName}
                      className="h-8 max-h-8 w-auto max-w-[140px] rounded-md object-contain"
                    />
                  </div>
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 font-display text-sm font-bold text-white shadow-xs dark:bg-emerald-500 dark:text-zinc-950">
                    {platformName.charAt(0) || 'F'}
                  </span>
                )}
                {!logoUrl && (
                  <div className="flex flex-col min-w-0">
                    <span className="font-display truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      {platformName}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      SaaS Control Center
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 cursor-pointer"
              title="Thu gọn thanh bên"
            >
              <SidebarSimple size={16} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 py-4 scrollbar-none">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={group.title} className="flex flex-col gap-1">
              {!collapsed ? (
                <span className="px-3 pb-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                  {group.title}
                </span>
              ) : (
                gIdx > 0 && <div className="mx-2 my-1 border-t border-zinc-100 dark:border-zinc-800/80" />
              )}

              {group.items.map(({ to, label, icon: Icon, end, badge, badgeTone }) => (
                <NavLink
                  key={to + label}
                  to={to}
                  end={end}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    `group relative flex items-center rounded-xl text-xs font-medium transition-all ${
                      collapsed
                        ? 'h-10 w-10 justify-center mx-auto'
                        : 'justify-between px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-emerald-50 font-semibold text-emerald-700 shadow-2xs dark:bg-emerald-500/15 dark:text-emerald-400'
                        : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                        {isActive && !collapsed && (
                          <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-emerald-600 dark:bg-emerald-400" />
                        )}
                        <Icon
                          size={collapsed ? 20 : 18}
                          weight={isActive ? 'fill' : 'regular'}
                          className={`shrink-0 transition-transform group-hover:scale-105 ${
                            isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300'
                          }`}
                        />
                        {!collapsed && <span className="truncate">{label}</span>}
                      </div>

                      {!collapsed && badge && (
                        <span
                          className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            badgeTone === 'rose'
                              ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                              : badgeTone === 'amber'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          }`}
                        >
                          {badge}
                        </span>
                      )}

                      {collapsed && badge && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom Expand / Collapse Footer */}
        <div className="border-t border-zinc-200 p-2.5 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 text-xs"
            aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
            {!collapsed && <span>Thu gọn sidebar</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-white p-4 shadow-2xl dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={platformName}
                    className="h-8 max-h-8 w-auto max-w-[120px] rounded-md object-contain"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white">
                    {platformName.charAt(0) || 'F'}
                  </span>
                )}
                <span className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {platformName}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="mt-4 flex flex-1 flex-col gap-4 overflow-y-auto">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="flex flex-col gap-1">
                  <span className="px-2 text-[10px] font-bold text-zinc-400 uppercase">
                    {group.title}
                  </span>
                  {group.items.map(({ to, label, icon: Icon, end, badge }) => (
                    <NavLink
                      key={to + label}
                      to={to}
                      end={end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                          isActive
                            ? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                        }`
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon size={18} />
                        <span>{label}</span>
                      </div>
                      {badge && (
                        <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                          {badge}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area (Scrolls independently while sidebar & topbar stay pinned) */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="relative z-40 shrink-0 flex h-16 items-center justify-between gap-3 border-b border-zinc-200 bg-white/85 px-4 sm:px-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/85">
          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Mở menu"
          >
            <List size={20} />
          </button>

          {/* Global Search */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden w-80 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-300 hover:bg-white sm:flex dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:bg-zinc-800"
          >
            <MagnifyingGlass size={15} />
            <span className="flex-1 text-left">Tìm tenant, gói cước, hóa đơn, user...</span>
            <kbd className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900">
              ⌘K
            </kbd>
          </button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Tìm kiếm toàn hệ thống"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 sm:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <MagnifyingGlass size={18} />
          </button>

          {/* Right Action Icons & Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Network Offline / Syncing Status Indicator */}
            <NetworkStatusBadge />

            {/* Notification Center */}
            <NotificationCenter />

            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Theme Toggle */}
            <ThemeToggle />

            <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Super Admin Profile */}
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-zinc-100 marker:content-none dark:hover:bg-zinc-800 [&::-webkit-details-marker]:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white dark:bg-emerald-500 dark:text-zinc-950">
                  {initials(user?.fullName)}
                </span>
                <span className="hidden text-left sm:block">
                  <span className="block max-w-36 truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                    {user?.fullName || 'Super Admin'}
                  </span>
                  <span className="block max-w-36 truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                    {user?.email || 'admin@fitflow.vn'}
                  </span>
                </span>
                <CaretDown size={13} className="hidden text-zinc-400 sm:block" />
              </summary>

              <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-100 px-2.5 py-2 sm:hidden dark:border-zinc-800">
                  <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                    {user?.fullName || 'Super Admin'}
                  </p>
                  <p className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                    {user?.email || 'admin@fitflow.vn'}
                  </p>
                </div>
                <div className="px-2.5 py-1.5 text-[11px] text-zinc-400">
                  Quyền: <span className="font-semibold text-emerald-600">Platform Super Admin</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
                >
                  <SignOut size={15} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </details>
          </div>
        </header>

        {/* Dashboard Main Content with dynamic max-width */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
