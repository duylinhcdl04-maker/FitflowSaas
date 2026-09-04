import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  House,
  IdentificationCard,
  Barbell,
  ClockCounterClockwise,
  UserCircle,
  SignOut,
  Moon,
  Sun,
  Key,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../owner/store/auth-store';
import { logout } from '../../owner/api/auth';
import { getCustomerProfile } from '../api/customer';
import NotificationBell from '../../owner/components/NotificationBell';
import ForceChangePasswordModal from './ForceChangePasswordModal';

const NAV_ITEMS = [
  { label: 'Trang chủ', path: '/customer', icon: House },
  { label: 'Gói tập', path: '/customer/membership', icon: IdentificationCard },
  { label: 'PT', path: '/customer/pt', icon: Barbell },
  { label: 'Lịch sử', path: '/customer/history', icon: ClockCounterClockwise },
  { label: 'Hồ sơ', path: '/customer/profile', icon: UserCircle },
];

function getBrandInitials(name: string) {
  if (!name) return 'FF';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function CustomerShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Fetch customer profile to get avatarUrl & tenant store name
  const { data: profile } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: getCustomerProfile,
    enabled: !!user,
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  function isActive(path: string) {
    return path === '/customer' ? location.pathname === '/customer' : location.pathname.startsWith(path);
  }

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      navigate('/owner/login', { replace: true });
    }
  }

  const initials = (user?.fullName || 'HV')
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const brandName = profile?.tenantName || 'FitFlow Gym';
  const brandInitials = getBrandInitials(brandName);

  return (
    <div className="flex min-h-dvh flex-col bg-stone-50 font-sans text-zinc-900 selection:bg-emerald-500 selection:text-white dark:bg-zinc-950 dark:text-zinc-100">
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/90">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          {/* Brand Logo & Store Name */}
          <Link to="/customer" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-lg font-black tracking-wider text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              {brandInitials}
            </div>
            <div>
              <p className="font-display text-sm font-extrabold leading-tight text-zinc-900 dark:text-zinc-50 truncate max-w-[160px]">
                {brandName}
              </p>
              <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Cổng hội viên</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 rounded-2xl border border-stone-200/60 bg-stone-100/80 p-1 md:flex dark:border-zinc-700/60 dark:bg-zinc-800/60">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-150 ${
                    active
                      ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-400'
                      : 'text-zinc-500 hover:bg-white/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-white'
                  }`}
                >
                  <Icon size={16} weight={active ? 'fill' : 'regular'} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-zinc-600 transition hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              title="Chuyển giao diện"
            >
              {darkMode ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            <NotificationBell basePath="/customer" />

            {/* Customer Header Avatar Button: Displays uploaded avatarUrl image or fallback initials */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-xs font-bold text-white shadow-sm ring-2 ring-emerald-500/20"
                title={user?.fullName}
              >
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={user?.fullName || 'Avatar'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-2xl border border-stone-200 bg-white py-1.5 shadow-lg shadow-stone-950/10 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="border-b border-stone-100 px-3.5 py-2.5 dark:border-zinc-800 flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-xs font-bold text-white">
                        {profile?.avatarUrl ? (
                          <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{user?.fullName}</p>
                        <p className="truncate text-xs text-zinc-400">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setChangePasswordOpen(true);
                      }}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-zinc-600 hover:bg-stone-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      <Key size={14} /> Đổi mật khẩu
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <SignOut size={14} /> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      {/* Mobile nav */}
      <nav className="sticky bottom-0 z-40 border-t border-stone-200/80 bg-white/90 p-2 backdrop-blur-md md:hidden dark:border-zinc-800/80 dark:bg-zinc-900/90">
        <div className="mx-auto flex max-w-3xl justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-bold transition-colors ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                }`}
              >
                <Icon size={20} weight={active ? 'fill' : 'regular'} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {user?.mustChangePassword && <ForceChangePasswordModal />}

      {changePasswordOpen && (
        <ForceChangePasswordModal
          manualOpen={true}
          onCloseManual={() => setChangePasswordOpen(false)}
        />
      )}
    </div>
  );
}
