import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarCheck,
  UsersThree,
  Barbell,
  UserGear,
  House,
  SignOut,
  Moon,
  Sun,
  Key,
  Clock,
  MapPin,
  CaretDown,
  Sparkle,
  Crown,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../owner/store/auth-store';
import { getManagerContext } from '../../manager/api/manager';
import FirstLoginPasswordModal from '../../manager/components/FirstLoginPasswordModal';
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

export default function PtShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });
  const [time, setTime] = useState(new Date());
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Auto-hide header on scroll down / show on scroll up
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Fetch tenant brand & branch context for PT
  const { data: context } = useQuery({
    queryKey: ['pt-context'],
    queryFn: () => getManagerContext(),
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Smart scroll header logic
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 50 && currentScrollY > lastScrollY) {
        setIsHeaderVisible(false); // Hide header when scrolling down
      } else {
        setIsHeaderVisible(true); // Show header when scrolling up or at top
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { label: 'Tổng Quan', path: '/pt', icon: House },
    { label: 'Lịch Dạy', path: '/pt/schedule', icon: CalendarCheck },
    { label: 'Học Viên', path: '/pt/clients', icon: UsersThree },
    { label: 'Gói PT & Giá', path: '/pt/packages', icon: Barbell },
    { label: 'Hồ Sơ & Lịch Làm', path: '/pt/profile', icon: UserGear },
  ];

  const mustChangePassword = Boolean(user?.mustChangePassword);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const brandName = context?.tenant?.name || 'FitFlow Gym';
  const brandInitials = getBrandInitials(brandName);
  const branchName = context?.branch?.name || 'Chi Nhánh Trung Tâm';

  // Extract user initials
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'PT';

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top Bar Header with Auto-Hide Transition */}
      <header
        className={`sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/90 shadow-sm shadow-slate-900/5 transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          {/* Brand Logo & Branch Scope */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/pt" className="flex items-center gap-2.5 group focus:outline-none">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-white shadow-md shadow-emerald-500/20 font-black text-xl tracking-wider group-hover:scale-105 transition-transform">
                {brandInitials}
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg">
                    {brandName}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                    <Sparkle size={10} className="fill-current" /> PT
                  </span>
                </div>
              </div>
            </Link>

            {/* Branch Switcher (Owner can switch, single-branch PT locked) */}
            <div className="hidden sm:block">
              <BranchSwitcher currentBranch={context?.branch} />
            </div>
          </div>

          {/* Center Navigation Bar (Single line, whitespace-nowrap, no wrapping clutter) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-900/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/pt'
                  ? location.pathname === '/pt'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-zinc-700 font-extrabold'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400 scale-110' : 'text-slate-400 dark:text-zinc-500'
                    }`}
                    weight={isActive ? 'fill' : 'regular'}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Time & User Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick link back to Owner Portal if user is OWNER */}
            {user?.roles?.includes('OWNER') && (
              <button
                type="button"
                onClick={() => navigate('/owner')}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer shrink-0"
                title="Quay lại Cổng Chủ phòng tập (Owner)"
              >
                <Crown size={15} weight="fill" />
                <span>Về Quản lý chuỗi</span>
              </button>
            )}

            {/* Portal Switcher Dropdown */}
            <PortalSwitcher variant="compact" />

            {/* Clean Live Clock Capsule */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 text-xs font-mono font-bold text-slate-800 dark:text-zinc-200">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse shrink-0" />
              <span>{formatTime(time)}</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition shadow-2xs"
              title="Chuyển đổi giao diện Sáng / Tối"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-slate-600" />}
            </button>

            {/* User Profile Pill & Dropdown Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs shadow-xs shrink-0">
                  {initials}
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white hidden sm:inline max-w-[120px] truncate">
                  {user?.fullName || 'HLV PT'}
                </span>
                <CaretDown size={12} className="text-slate-400 hidden sm:inline shrink-0" />
              </button>

              {/* User Dropdown Menu */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-fade-in text-xs space-y-1">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">{user?.email || 'PT Staff'}</p>
                      <span className="inline-block mt-1 rounded bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                        Huấn Luyện Viên Cá Nhân
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        setChangePasswordOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-bold text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition"
                    >
                      <Key size={16} className="text-emerald-600 shrink-0" />
                      <span>Đổi mật khẩu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        clearSession();
                        navigate('/owner/login');
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition border-t border-slate-100 dark:border-zinc-800 pt-2"
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

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden items-center justify-around border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/90 dark:bg-zinc-900/90 px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/pt'
                ? location.pathname === '/pt'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold transition ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 font-black'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" weight={isActive ? 'fill' : 'regular'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {mustChangePassword && <FirstLoginPasswordModal />}

      {changePasswordOpen && (
        <FirstLoginPasswordModal
          manualOpen={true}
          onCloseManual={() => setChangePasswordOpen(false)}
        />
      )}
    </div>
  );
}
