import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  SignOut,
  Clock,
  Storefront,
  IdentificationCard,
  CreditCard,
  Ticket,
  UserList,
  LockKey,
  Moon,
  Sun,
  Layout,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../owner/store/auth-store';
import { logout } from '../../owner/api/auth';
import { getManagerContext } from '../../manager/api/manager';
import FirstLoginPasswordModal from '../../manager/components/FirstLoginPasswordModal';
import QuickSearchModal from '../../manager/components/QuickSearchModal';
import { useThemeStore } from '../../store/theme-store';
import { joinBranch } from '../../lib/socket';
import NotificationBell from '../../owner/components/NotificationBell';

export default function StaffShell() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for quick search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen(true);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch branch context
  const { data: context } = useQuery({
    queryKey: ['staff-context'],
    queryFn: () => getManagerContext(),
  });

  // Join this branch's realtime room as soon as we know it, so payment/attendance/guest-visit
  // updates from anywhere (this screen, another tab, the SePay webhook) push in live.
  useEffect(() => {
    if (context?.branch?.id) joinBranch(context.branch.id);
  }, [context?.branch?.id]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      navigate('/owner/login');
    }
  }

  const navItems = [
    { to: '/staff', label: 'Ca Trực', icon: Layout, end: true },
    { to: '/staff/checkin', label: 'Lễ Tân Check-in', icon: IdentificationCard },
    { to: '/staff/pos', label: 'Bán Gói / POS', icon: CreditCard },
    { to: '/staff/guest-visits', label: 'Vé Lượt Vãng Lai', icon: Ticket },
    { to: '/staff/members', label: 'Hội Viên & Face ID', icon: UserList },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      {/* Top Staff Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Left Brand & Fixed Branch Scope */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20">
                F
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-display text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  FitFlow <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">STAFF</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">Quầy Lễ Tân & Thu Ngân</p>
              </div>
            </div>

            {/* Branch Scope Badge (Fixed - Staff constraint) */}
            <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100/70 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-zinc-800 dark:bg-zinc-800/70 dark:text-zinc-300">
              <Storefront size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>{context?.branch?.name || 'Đang tải chi nhánh...'}</span>
              <span title="Chi nhánh cố định theo phân công"><LockKey size={12} className="text-slate-400" /></span>
            </div>
          </div>

          {/* Center Quick Search Button */}
          <button
            onClick={() => setQuickSearchOpen(true)}
            className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-400 dark:hover:bg-zinc-800 transition"
          >
            <MagnifyingGlass size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Tìm nhanh hội viên...</span>
            <kbd className="ml-2 rounded border border-slate-300 bg-white px-1.5 text-[10px] font-mono text-slate-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              Ctrl+K
            </kbd>
          </button>

          {/* Right Live Clock & User Menu */}
          <div className="flex items-center gap-3">
            {/* Real-time Clock */}
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800">
              <Clock size={14} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>{currentTime.toLocaleTimeString('vi-VN')}</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell basePath="/staff" />

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              title="Đổi giao diện"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Dropdown / Staff Profile Info */}
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-zinc-800 pl-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs shadow">
                {user?.fullName?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-none">{user?.fullName}</p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-tight">Nhân viên quầy</p>
              </div>

              {/* Staff Actions */}
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
                title="Đổi mật khẩu"
              >
                <LockKey size={16} />
              </button>

              <button
                onClick={handleLogout}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                title="Đăng xuất"
              >
                <SignOut size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-header Navigation Tabs */}
        <nav className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 scrollbar-none border-t border-slate-100 dark:border-zinc-800/50">
          <div className="flex gap-1 py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
                    }`
                  }
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6">
        <Outlet />
      </main>

      {/* Mandatory First Login Password Modal */}
      <FirstLoginPasswordModal
        manualOpen={changePasswordOpen}
        onCloseManual={() => setChangePasswordOpen(false)}
      />

      {/* Global Quick Search Modal (Ctrl + K) */}
      <QuickSearchModal
        isOpen={quickSearchOpen}
        onClose={() => setQuickSearchOpen(false)}
      />
    </div>
  );
}
