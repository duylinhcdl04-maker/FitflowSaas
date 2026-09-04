import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  SquaresFour,
  Users,
  Ticket,
  UserGear,
  QrCode,
  CreditCard,
  Gear,
  SignOut,
  MagnifyingGlass,
  List,
  X,
  Buildings,
  Crown,
  Lightning,
  SidebarSimple,
  CaretLeft,
  CaretRight,
  Storefront,
  Barbell,
} from '@phosphor-icons/react';
import { useAuthStore } from '../store/auth-store';
import { logout } from '../api/auth';
import { getDashboardOverview } from '../api/dashboard';
import Tooltip from './Tooltip';
import NotificationBell from './NotificationBell';
import PortalSwitcher from './PortalSwitcher';
import { showConfirm, showToast } from '../utils/swal';

const NAV_LINKS = [
  { to: '/owner', label: 'Tổng quan', icon: SquaresFour, end: true },
  { to: '/owner/customers', label: 'Khách hàng', icon: Users, end: false },
  { to: '/owner/memberships', label: 'Membership', icon: Ticket, end: false },
  { to: '/owner/pt', label: 'PT (Huấn luyện)', icon: UserGear, end: false },
  { to: '/owner/checkin', label: 'Check-in', icon: QrCode, end: false },
  { to: '/owner/branches', label: 'Chi nhánh', icon: Buildings, end: false },
  { to: '/owner/subscription', label: 'Gói sử dụng', icon: CreditCard, end: false },
  { to: '/owner/settings', label: 'Cài đặt', icon: Gear, end: false },
];

const OPERATIONAL_PORTALS = [
  { to: '/staff', label: 'Quầy Lễ tân (POS)', icon: Storefront, color: 'text-emerald-500 dark:text-emerald-400' },
  { to: '/manager', label: 'Quản lý Chi nhánh', icon: Buildings, color: 'text-blue-500 dark:text-blue-400' },
];

export default function OwnerShell() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Persist sidebar collapsed state in localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('fitflow_sidebar_collapsed') === 'true';
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('fitflow_sidebar_collapsed', String(next));
      return next;
    });
  };

  const { data: dashboardData } = useQuery({
    queryKey: ['owner-dashboard-shell'],
    queryFn: () => getDashboardOverview({}),
  });

  async function handleLogout() {
    const confirmed = await showConfirm({
      title: 'Đăng xuất khỏi hệ thống?',
      text: 'Bạn có chắc chắn muốn kết thúc phiên đăng nhập?',
      confirmButtonText: 'Đăng xuất ngay',
      cancelButtonText: 'Quay lại',
      icon: 'warning',
    });

    if (!confirmed) return;

    try {
      await logout();
    } finally {
      clearSession();
      showToast('Đã đăng xuất thành công', 'info');
      navigate('/owner/login', { replace: true });
    }
  }

  const plan = dashboardData?.subscription;

  return (
    <div className="min-h-screen bg-stone-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* FIXED COLLAPSIBLE SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col justify-between border-r border-stone-200/80 bg-white transition-all duration-300 ease-in-out lg:translate-x-0 dark:border-zinc-800/80 dark:bg-zinc-900 select-none overflow-x-hidden ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col">
          {/* Logo Branding & Toggle Header */}
          <div className={`flex h-16 items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
            <NavLink to="/owner" className="flex items-center gap-2.5 overflow-hidden shrink-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 font-display text-base font-bold text-white shadow-md shadow-emerald-500/20">
                F
              </span>
              {!collapsed && (
                <div className="min-w-0 transition-all duration-200">
                  <span className="font-display text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
                    FitFlow
                  </span>
                  <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    OWNER
                  </span>
                </div>
              )}
            </NavLink>

            {/* Desktop Collapse Button */}
            {!collapsed && (
              <button
                onClick={toggleCollapsed}
                title="Thu gọn Sidebar"
                className="hidden rounded-lg p-1.5 text-zinc-400 hover:bg-stone-100 hover:text-zinc-700 lg:flex dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <CaretLeft size={18} />
              </button>
            )}

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-stone-100 lg:hidden dark:hover:bg-zinc-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Collapsed Expand Toggle Button (when collapsed) */}
          {collapsed && (
            <div className="hidden lg:flex justify-center pt-1 pb-2">
              <button
                onClick={toggleCollapsed}
                title="Mở rộng Sidebar"
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-stone-100 text-zinc-500 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-emerald-400 transition-colors"
              >
                <CaretRight size={14} />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className={`flex flex-col gap-1.5 py-4 ${collapsed ? 'items-center px-2' : 'px-3'}`}>
            {!collapsed && (
              <span className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Menu Quản lý
              </span>
            )}
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Tooltip key={link.to} content={link.label} disabled={!collapsed} placement="right">
                  <NavLink
                    to={link.to}
                    end={link.end}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `group flex items-center transition-all ${
                        collapsed
                          ? 'h-10 w-10 justify-center rounded-xl'
                          : 'gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold'
                      } ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'text-zinc-600 hover:bg-stone-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                      }`
                    }
                  >
                    <Icon size={20} className="shrink-0 transition-transform group-hover:scale-110" />
                    {!collapsed && <span className="truncate">{link.label}</span>}
                  </NavLink>
                </Tooltip>
              );
            })}

            {/* Phân hệ vận hành (Direct role portals - KiotViet style) */}
            <div className="pt-2 flex flex-col gap-1">
              {!collapsed && (
                <span className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Phân hệ vận hành
                </span>
              )}
              {collapsed && <div className="my-1.5 h-px w-8 bg-stone-200 dark:bg-zinc-800 self-center" />}
              {OPERATIONAL_PORTALS.map((portal) => {
                const Icon = portal.icon;
                return (
                  <Tooltip key={portal.to} content={portal.label} disabled={!collapsed} placement="right">
                    <NavLink
                      to={portal.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `group flex items-center transition-all ${
                          collapsed
                            ? 'h-10 w-10 justify-center rounded-xl'
                            : 'gap-3 rounded-xl px-3 py-2 text-xs font-semibold'
                        } ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-500/10 dark:text-emerald-400'
                            : 'text-zinc-600 hover:bg-stone-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
                        }`
                      }
                    >
                      <Icon size={18} className={`shrink-0 transition-transform group-hover:scale-110 ${portal.color}`} />
                      {!collapsed && <span className="truncate">{portal.label}</span>}
                    </NavLink>
                  </Tooltip>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Bottom Sidebar Subscription Card */}
        <div className={collapsed ? 'flex justify-center p-3' : 'p-4'}>
          {collapsed ? (
            <Tooltip content={plan ? `Gói ${plan.planName}` : 'Quản lý gói SaaS'} placement="right">
              <button
                onClick={() => navigate('/owner/subscription')}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-950 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
              >
                <Crown size={20} />
              </button>
            </Tooltip>
          ) : (
            <div className="rounded-2xl border border-stone-200/80 bg-gradient-to-b from-stone-50 to-stone-100/60 p-4 dark:border-zinc-800 dark:from-zinc-950/80 dark:to-zinc-900">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <Crown size={14} />
                  {plan ? `Gói ${plan.planName}` : 'FitFlow Pro'}
                </span>
                {plan?.daysRemaining !== null && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Còn {plan?.daysRemaining} ngày
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Vận hành hệ thống không giới hạn tính năng.
              </p>

              <button
                onClick={() => navigate('/owner/subscription')}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
              >
                <Lightning size={14} />
                Quản lý gói SaaS
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div
        className={`flex min-h-screen min-w-0 flex-col transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200/80 bg-white/80 px-6 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-zinc-600 hover:bg-stone-100 lg:hidden dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <List size={20} />
            </button>

            {/* Quick Search Bar */}
            <div className="relative hidden w-72 sm:block">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                placeholder="Tìm kiếm nhanh... (⌘K)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/owner/customers?search=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                className="w-full rounded-xl border border-zinc-200 bg-stone-50 py-1.5 pl-9 pr-3 text-xs font-medium text-zinc-700 outline-none transition-colors focus:border-emerald-500 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* KiotViet Style Quick Action Button: Quầy Bán hàng / Lễ tân */}
            <button
              type="button"
              onClick={() => navigate('/staff')}
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-3 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-900/20 transition-all cursor-pointer shrink-0"
              title="Vào ngay giao diện quầy Lễ tân & Bán hàng POS (KiotViet style)"
            >
              <Storefront size={16} weight="fill" />
              <span>Quầy Lễ tân (POS)</span>
            </button>

            {/* Portal Switcher Dropdown (KiotViet style) */}
            <PortalSwitcher variant="header" />

            {/* Collapse Toggle Shortcut in Header */}
            <button
              onClick={toggleCollapsed}
              title={collapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'}
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-zinc-600 shadow-sm transition-colors hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <SidebarSimple size={18} />
            </button>

            {/* Notification Bell */}
            <NotificationBell basePath="/owner" />

            {/* User Profile Menu */}
            <div className="flex items-center gap-3 border-l border-stone-200 pl-4 dark:border-zinc-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 font-display text-xs font-bold text-white shadow-sm">
                {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {user?.fullName ?? 'Owner'}
                </span>
                <span className="text-[10px] text-zinc-400">Chủ phòng tập</span>
              </div>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-stone-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
              >
                <SignOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="flex-1 px-6 py-8 xl:px-8 xl:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
