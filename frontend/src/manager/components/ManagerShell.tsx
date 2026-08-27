import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Storefront,
  Plus,
  UserPlus,
  QrCode,
  CurrencyCircleDollar,
  CalendarCheck,
  WarningCircle,
  SignOut,
} from '@phosphor-icons/react';
import { getManagerContext } from '../api/manager';
import { joinBranch } from '../../lib/socket';
import { apiErrorMessage } from '../../owner/api/client';
import { logout } from '../../owner/api/auth';
import { useAuthStore } from '../../owner/store/auth-store';
import ManagerTopNav from './ManagerTopNav';
import FirstLoginPasswordModal from './FirstLoginPasswordModal';
import QuickSearchModal from './QuickSearchModal';
import QuickActionsModals from './QuickActionsModals';
import type { QuickActionType } from './QuickActionsModals';

export default function ManagerShell() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<QuickActionType>(null);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const { data: context, error: contextError } = useQuery({
    queryKey: ['manager-context'],
    queryFn: () => getManagerContext(),
    retry: false,
  });

  useEffect(() => {
    if (context?.branch?.id) joinBranch(context.branch.id);
  }, [context?.branch?.id]);

  // Global Keyboard Shortcuts (⌘K for Search)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      clearSession();
      window.location.href = '/owner/login';
    }
  }

  // Màn hình thông báo khi Tài khoản Manager CHƯA ĐƯỢC OWNER GÁN CHI NHÁNH
  if (contextError) {
    const errorMsg = apiErrorMessage(
      contextError,
      'Tài khoản Quản lý của bạn chưa được phân công phụ trách chi nhánh nào. Vui lòng liên hệ Owner để được gán chi nhánh.',
    );
    return (
      <div className="min-h-dvh bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-8 shadow-2xl flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <WarningCircle size={36} />
          </div>
          <h2 className="text-xl font-bold text-white">Chưa được phân công chi nhánh</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {errorMsg}
          </p>
          <div className="mt-4 pt-4 border-t border-zinc-800/80 w-full flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <SignOut size={16} />
              Đăng xuất tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  const todayString = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  function triggerAction(type: QuickActionType) {
    setIsQuickActionsOpen(false);
    setActiveQuickAction(type);
  }

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-slate-900 dark:bg-[#090D16] dark:text-zinc-50 flex flex-col font-sans overflow-x-hidden selection:bg-emerald-500/20">
      {/* Top Navigation Bar (56px) */}
      <ManagerTopNav
        onOpenQuickSearch={() => setIsSearchOpen(true)}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        userName={context?.user.full_name}
        branchName={context?.branch.name}
        brandName={context?.tenant?.name || context?.tenant?.legalName}
      />

      {/* Branch Context Bar (Sticky, 100% Mobile Clean Overflow Layout) */}
      <div className="min-h-[44px] shrink-0 border-b border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-900/90 sticky top-[56px] z-20 py-1.5 px-3 sm:px-4">
        <div className="max-w-[1680px] w-full mx-auto h-full flex items-center justify-between gap-2 text-xs">
          {/* Branch Info Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 dark:text-zinc-400 overflow-hidden text-[11px] sm:text-xs">
            <Storefront size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-900 dark:text-zinc-100 truncate max-w-[110px] sm:max-w-none">
              {context?.branch.name || 'Cơ sở 2 Hà Nội'}
            </span>
            <span className="shrink-0">·</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold dark:text-emerald-400 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Đang mở
            </span>
            <span className="hidden md:inline">·</span>
            <span className="hidden md:inline capitalize">{todayString}</span>
          </div>

          {/* Quick Actions Dropdown */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 font-bold text-slate-800 hover:bg-white dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-all shadow-xs text-[11px] sm:text-xs"
            >
              <Plus size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Thao tác nhanh</span>
              <span className="text-[10px] text-slate-400">▾</span>
            </button>

            {isQuickActionsOpen && (
              <>
                {/* Backdrop click outside to close */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsQuickActionsOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-48 sm:w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-fade-in">
                  <button
                    type="button"
                    onClick={() => triggerAction('REGISTER_CUSTOMER')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <UserPlus size={16} className="text-emerald-600 shrink-0" />
                    <span>Đăng ký hội viên</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerAction('CHECKIN')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <QrCode size={16} className="text-emerald-600 shrink-0" />
                    <span>Check-in quầy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerAction('CREATE_PAYMENT')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <CurrencyCircleDollar size={16} className="text-emerald-600 shrink-0" />
                    <span>Tạo thanh toán</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerAction('BOOK_PT')}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors text-left"
                  >
                    <CalendarCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>Đặt lịch PT</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-[1680px] w-full mx-auto px-3 sm:px-4 py-4 sm:py-6 xl:px-8 xl:py-8 overflow-x-hidden">
        <Outlet />
      </main>

      <FirstLoginPasswordModal
        manualOpen={isChangePasswordOpen}
        onCloseManual={() => setIsChangePasswordOpen(false)}
      />
      <QuickSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <QuickActionsModals
        activeAction={activeQuickAction}
        onClose={() => setActiveQuickAction(null)}
      />
    </div>
  );
}
