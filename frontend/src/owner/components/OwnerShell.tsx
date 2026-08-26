import { NavLink, useNavigate } from 'react-router-dom';
import { SignOut } from '@phosphor-icons/react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { logout } from '../api/auth';

const NAV_LINKS = [
  { to: '/owner', label: 'Dashboard', end: true },
  { to: '/owner/branches', label: 'Chi nhánh', end: false },
  { to: '/owner/customers', label: 'Khách hàng', end: false },
  { to: '/owner/memberships', label: 'Membership', end: false },
  { to: '/owner/pt', label: 'PT', end: false },
  { to: '/owner/checkin', label: 'Check-in', end: false },
  { to: '/owner/subscription', label: 'Gói sử dụng', end: false },
  { to: '/owner/settings', label: 'Cài đặt', end: false },
];

// Owner Portal chưa cần sidebar dày đặc như Admin — top bar cuộn ngang khi
// đủ mục là tạm đủ. Sẽ đổi sang sidebar khi sitemap đầy đủ hơn (Payments,
// Reports, Notifications...).
export default function OwnerShell() {
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      navigate('/owner/login', { replace: true });
    }
  }

  return (
    <div className="min-h-dvh bg-stone-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white dark:bg-emerald-400 dark:text-zinc-950">
              F
            </span>
            <span className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">FitFlow</span>
          </div>
          <nav className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `shrink-0 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'text-zinc-500 hover:bg-stone-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-zinc-500 sm:block dark:text-zinc-400">{user?.fullName}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-stone-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <SignOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
