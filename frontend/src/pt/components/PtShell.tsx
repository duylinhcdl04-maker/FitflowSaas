import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
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
} from '@phosphor-icons/react';
import { useAuthStore } from '../../owner/store/auth-store';
import FirstLoginPasswordModal from '../../manager/components/FirstLoginPasswordModal';

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

  const navItems = [
    { label: 'Tổng Quan', path: '/pt', icon: House },
    { label: 'Lịch Dạy Của Tôi', path: '/pt/schedule', icon: CalendarCheck },
    { label: 'Học Viên Của Tôi', path: '/pt/clients', icon: UsersThree },
    { label: 'Gói PT & Giá', path: '/pt/packages', icon: Barbell },
    { label: 'Hồ Sơ & Lịch Làm', path: '/pt/profile', icon: UserGear },
  ];

  const mustChangePassword = Boolean(user?.mustChangePassword);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand & Workspace Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20 font-black text-xl tracking-tighter">
              FF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-base">FitFlow</span>
                <span className="rounded-md bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  PT WORKSPACE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium hidden sm:block">
                Cổng làm việc & Quản lý huấn luyện cá nhân
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-zinc-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
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
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-zinc-700'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-zinc-700/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} weight={isActive ? 'fill' : 'regular'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Time & User Controls */}
          <div className="flex items-center gap-3">
            {/* Live Clock Widget */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 text-xs font-medium text-slate-700 dark:text-zinc-300">
              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span className="font-mono font-bold">{formatTime(time)}</span>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500">({formatDate(time)})</span>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition"
              title="Chuyển đổi giao diện"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* User Dropdown / Info */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-zinc-800">
              <div className="flex flex-col text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user?.fullName || 'Huấn Luyện Viên'}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  {user?.email || 'PT Staff'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setChangePasswordOpen(true)}
                  className="p-2 text-slate-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                  title="Đổi mật khẩu"
                >
                  <Key className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearSession();
                    navigate('/owner/login');
                  }}
                  className="p-2 text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                  title="Đăng xuất"
                >
                  <SignOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/90 dark:bg-zinc-900/90 px-2 py-2">
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
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
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

      {/* First Login Change Password Enforcement Modal */}
      {(mustChangePassword || changePasswordOpen) && (
        <FirstLoginPasswordModal
          manualOpen={changePasswordOpen}
          onCloseManual={() => setChangePasswordOpen(false)}
        />
      )}
    </div>
  );
}
