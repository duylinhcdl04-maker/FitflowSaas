import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  SignOut,
  Clock,
  IdentificationCard,
  CreditCard,
  Ticket,
  UserList,
  LockKey,
  Moon,
  Sun,
  Layout,
  MagnifyingGlass,
  ScanSmiley,
  Crown,
  CaretDown,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../owner/store/auth-store';
import { logout } from '../../owner/api/auth';
import { getManagerContext } from '../../manager/api/manager';
import FirstLoginPasswordModal from '../../manager/components/FirstLoginPasswordModal';
import QuickSearchModal from '../../manager/components/QuickSearchModal';
import { useThemeStore } from '../../store/theme-store';
import { joinBranch } from '../../lib/socket';
import NotificationBell from '../../owner/components/NotificationBell';
import PortalSwitcher from '../../owner/components/PortalSwitcher';
import BranchSwitcher from '../../manager/components/BranchSwitcher';

function getBrandInitials(name: string) {
  if (!name) return 'FF';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function StaffShell() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Fetch branch context scoped to active branch
  const [activeBranchId, setActiveBranchId] = useState<string | null>(() =>
    localStorage.getItem('fitflow_active_branch_id'),
  );

  useEffect(() => {
    function handleBranchChanged(e: Event) {
      const customEvent = e as CustomEvent<{ branchId: string }>;
      setActiveBranchId(customEvent.detail?.branchId || localStorage.getItem('fitflow_active_branch_id'));
    }
    window.addEventListener('fitflow:branch-changed', handleBranchChanged);
    window.addEventListener('storage', handleBranchChanged);
    return () => {
      window.removeEventListener('fitflow:branch-changed', handleBranchChanged);
      window.removeEventListener('storage', handleBranchChanged);
    };
  }, []);

  const { data: context } = useQuery({
    queryKey: ['staff-context', activeBranchId],
    queryFn: () => getManagerContext(activeBranchId || undefined),
  });

  // Join this branch's realtime room as soon as we know it
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
    { to: '/staff/checkin-kiosk', label: 'Kiosk Khuôn Mặt', icon: ScanSmiley },
    { to: '/staff/pos', label: 'Bán Gói / POS', icon: CreditCard },
    { to: '/staff/guest-visits', label: 'Vé Lượt Vãng Lai', icon: Ticket },
    { to: '/staff/members', label: 'Hội Viên & Face ID', icon: UserList },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans">
      {/* Top Staff Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/90 shadow-sm shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 gap-3">
          {/* Left Brand & Active Branch Scope */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white font-black text-base tracking-wider shadow-md shadow-emerald-500/20 shrink-0">
              {getBrandInitials(context?.tenant?.name || 'FitFlow')}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div className="hidden sm:block shrink-0">
              <div className="flex items-center gap-1.5 font-display text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
                <span className="truncate max-w-[130px]">{context?.tenant?.name || 'FitFlow'}</span>
                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                  STAFF
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium leading-none mt-1">
                Lễ Tân & Bán Hàng
              </p>
            </div>

            {/* Branch Switcher (sleek pill button) */}
            <div className="border-l border-slate-200/80 dark:border-zinc-800/80 pl-2.5 shrink-0">
              <BranchSwitcher currentBranch={context?.branch} variant="pill" />
            </div>
          </div>

          {/* Center Search Button (Fixed width, never wrap vertically) */}
          <div className="hidden md:flex flex-1 max-w-[240px] justify-center shrink-0">
            <button
              type="button"
              onClick={() => setQuickSearchOpen(true)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200/90 bg-slate-100/70 hover:bg-slate-200/60 dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:bg-zinc-800 px-3 py-1.5 text-xs text-slate-500 dark:text-zinc-400 transition font-medium shadow-2xs whitespace-nowrap cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <MagnifyingGlass size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">Tìm hội viên...</span>
              </div>
              <kbd className="ml-1 rounded-md border border-slate-300/80 bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-500 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 shrink-0">
                Ctrl+K
              </kbd>
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Quick link back to Owner Portal if user is OWNER */}
            {user?.roles?.includes('OWNER') && (
              <button
                type="button"
                onClick={() => navigate('/owner')}
                className="hidden lg:inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer shrink-0"
                title="Quay lại Cổng Chủ phòng tập (Owner)"
              >
                <Crown size={14} weight="fill" />
                <span>Cổng Owner</span>
              </button>
            )}

            {/* Portal Switcher Dropdown */}
            <PortalSwitcher variant="compact" />

            {/* Real-time Clock on ultra-wide screens */}
            <div className="hidden 2xl:flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 dark:text-zinc-300 bg-slate-100/80 dark:bg-zinc-900/80 px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs shrink-0">
              <Clock size={13} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>{currentTime.toLocaleTimeString('vi-VN')}</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell basePath="/staff" />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition shadow-2xs cursor-pointer shrink-0"
              title="Đổi giao diện Sáng / Tối"
            >
              {theme === 'dark' ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            {/* Unified User Profile Dropdown (Never overlap or sprawl) */}
            <div className="relative pl-1 shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-xl p-1 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-zinc-800"
                title="Tài khoản cá nhân"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-emerald-600 font-bold text-xs shadow-xs shrink-0">
                  {user?.fullName?.charAt(0).toUpperCase() || 'S'}
                </div>
                <div className="hidden xl:block text-left max-w-[110px]">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate leading-none">
                    {user?.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium leading-none mt-1 truncate">
                    {user?.roles?.includes('OWNER') ? 'Chủ phòng tập' : 'Nhân viên'}
                  </p>
                </div>
                <CaretDown
                  size={12}
                  className={`text-slate-400 transition-transform duration-150 shrink-0 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">{user?.email}</p>
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {user?.roles?.includes('OWNER') ? 'Chủ phòng tập (Owner)' : 'Nhân viên Lễ Tân'}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setChangePasswordOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-zinc-300 dark:hover:bg-zinc-800 transition cursor-pointer text-left"
                    >
                      <LockKey size={15} className="text-slate-400" />
                      <span>Đổi mật khẩu</span>
                    </button>

                    {user?.roles?.includes('OWNER') && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/owner');
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 transition cursor-pointer text-left"
                      >
                        <Crown size={15} />
                        <span>Về Quản lý chuỗi</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition cursor-pointer text-left"
                    >
                      <SignOut size={15} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
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
        <Outlet context={{ context }} />
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
