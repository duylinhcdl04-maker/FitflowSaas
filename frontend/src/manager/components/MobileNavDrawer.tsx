import { createPortal } from 'react-dom';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  SignOut,
  Moon,
  Sun,
  Storefront,
} from '@phosphor-icons/react';
import { useAuthStore } from '../../owner/store/auth-store';
import { useThemeStore } from '../../store/theme-store';
import { logout } from '../../owner/api/auth';
import BrandBadge from '../../owner/components/BrandBadge';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branchName?: string;
  userName?: string;
  brandName?: string;
}

export default function MobileNavDrawer({
  isOpen,
  onClose,
  branchName = 'Cơ sở 2 Hà Nội',
  userName = 'Branch Manager',
  brandName = 'FitFlow',
}: MobileNavDrawerProps) {
  const clearSession = useAuthStore((s) => s.clearSession);
  const { theme, toggle } = useThemeStore();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      window.location.href = '/owner/login';
    }
  }

  const navItems = [
    { to: '/manager', label: 'Tổng quan điều hành', end: true },
    { to: '/manager/checkin', label: 'Check-in quầy' },
    { to: '/manager/customers', label: 'Hội viên & Khách' },
    { to: '/manager/memberships', label: 'Gói tập & Thanh toán' },
    { to: '/manager/pt', label: 'PT & Lịch tập' },
    { to: '/manager/staff', label: 'Nhân sự chi nhánh' },
    { to: '/manager/reports', label: 'Báo cáo & Audit Log' },
  ];

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Full-screen Dark Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative z-[10000] flex h-full w-4/5 max-w-xs sm:max-w-sm flex-col justify-between border-r border-slate-200 bg-white p-4 sm:p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <BrandBadge brandName={brandName} />
                  <div>
                    <span className="font-display font-bold text-base text-zinc-900 dark:text-zinc-50 block truncate max-w-[160px]">
                      {brandName || 'FitFlow'}
                    </span>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Portal Quản Lý</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-2 text-zinc-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Branch Pill */}
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <Storefront size={16} /> {branchName}
                </div>
              </div>

              {/* Nav Items */}
              <nav className="mt-5 flex flex-col gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'text-zinc-600 hover:bg-slate-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* User Controls */}
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">{userName}</span>
                <button
                  type="button"
                  onClick={toggle}
                  className="p-2 text-zinc-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded-lg"
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors w-full"
              >
                <SignOut size={16} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
