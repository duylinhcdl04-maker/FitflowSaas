import { useState } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import {
  MagnifyingGlass,
  SignOut,
  Moon,
  Sun,
  List,
  Key,
  Crown,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../owner/store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { logout } from '../../owner/api/auth';
import BrandBadge from '../../owner/components/BrandBadge';
import NotificationBell from '../../owner/components/NotificationBell';
import PortalSwitcher from '../../owner/components/PortalSwitcher';
import MobileNavDrawer from './MobileNavDrawer';
import BranchSwitcher from './BranchSwitcher';

interface ManagerTopNavProps {
  onOpenQuickSearch: () => void;
  onOpenChangePassword: () => void;
  userName?: string;
  branchName?: string;
  brandName?: string;
  branch?: {
    id: string;
    name: string;
    code?: string;
    address?: string | null;
    phone?: string | null;
  };
}

export default function ManagerTopNav({
  onOpenQuickSearch,
  onOpenChangePassword,
  userName = 'Branch Manager',
  branchName,
  brandName = 'FitFlow',
  branch,
}: ManagerTopNavProps) {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clearSession);
  const user = useAuthStore((s) => s.user);
  const { theme, toggle } = useThemeStore();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [searchParams] = useSearchParams();
  const branchCode = (branch?.code || searchParams.get('branch') || '').toLowerCase();
  const branchQuery = branchCode ? `?branch=${branchCode}` : '';

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      navigate('/owner/login', { replace: true });
    }
  }

  const navItems = [
    { to: '/manager', label: 'Tổng quan', end: true },
    { to: '/manager/checkin', label: 'Check-in' },
    { to: '/manager/customers', label: 'Hội viên & Khách' },
    { to: '/manager/memberships', label: 'Gói tập' },
    { to: '/manager/pt', label: 'PT & Lịch tập' },
    { to: '/manager/staff', label: 'Nhân sự' },
    { to: '/manager/reports', label: 'Báo cáo' },
  ];

  return (
    <header className="h-[56px] shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/95 sticky top-0 z-30 shadow-xs">
      {/* Container KHÔNG CÓ overflow-hidden ở cấp cha để dropdown xổ xuống mượt mà 100% */}
      <div className="max-w-[1680px] w-full mx-auto h-full px-4 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Section: Mobile Drawer Toggle + Dynamic Registered Brand Name */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="xl:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
            title="Mở menu"
          >
            <List size={22} />
          </button>

          {/* Dynamic Brand Logo & Registered Brand Name */}
          <div className="flex items-center gap-2.5 shrink-0">
            <BrandBadge brandName={brandName} />
            <span className="font-display font-bold text-base text-slate-900 dark:text-zinc-50 hidden sm:inline tracking-tight truncate max-w-[120px]">
              {brandName || 'FitFlow'}
            </span>
          </div>

          {/* Branch Identity & Switcher in Top Nav */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-zinc-800 shrink-0">
            <BranchSwitcher currentBranch={branch} variant="badge" />
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1 ml-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={`${item.to}${branchQuery}`}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border-b-2 border-emerald-600'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right Section: Owner Link, Portal Switcher, ⌘K Search, Notification, Theme Toggle, User Avatar Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick link back to Owner Portal if user is OWNER */}
          {user?.roles?.includes('OWNER') && (
            <button
              type="button"
              onClick={() => navigate('/owner')}
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-95 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer shrink-0"
              title="Quay lại Cổng Chủ phòng tập (Owner)"
            >
              <Crown size={14} weight="fill" />
              <span>Về Quản lý chuỗi</span>
            </button>
          )}

          {/* Portal Switcher Dropdown */}
          <PortalSwitcher variant="compact" />

          {/* Quick Search Button */}
          <button
            type="button"
            onClick={onOpenQuickSearch}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 text-xs text-slate-500 hover:border-slate-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 transition-all shadow-xs"
          >
            <MagnifyingGlass size={14} className="text-slate-400" />
            <span className="hidden md:inline font-medium">Tìm kiếm...</span>
            <kbd className="hidden sm:inline rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 shadow-xs dark:border-zinc-700 dark:bg-zinc-900">
              ⌘K
            </kbd>
          </button>

          {/* Notification Bell */}
          <NotificationBell basePath="/manager" />

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggle}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
            title="Đổi giao diện"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User Profile Avatar Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-slate-200/80 dark:border-zinc-700/60 bg-slate-50/50 dark:bg-zinc-800/40"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 hidden lg:inline max-w-[130px] truncate">
                {userName}
              </span>
              <span className="text-[10px] text-slate-400 hidden lg:inline">▾</span>
            </button>

            {isUserMenuOpen && (
              <>
                {/* Backdrop Click Outside to Close */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />

                {/* Dropdown Menu (Z-50) */}
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 mb-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">{userName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user?.email || 'Manager Chi nhánh'}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenChangePassword();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <Key size={16} className="text-emerald-600 shrink-0" />
                    <span>Đổi mật khẩu</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left mt-0.5 border-t border-slate-100 dark:border-zinc-800 pt-2"
                  >
                    <SignOut size={16} className="shrink-0" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        branchName={branchName}
        userName={userName}
        brandName={brandName}
      />
    </header>
  );
}
