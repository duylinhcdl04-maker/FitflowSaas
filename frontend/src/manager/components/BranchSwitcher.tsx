import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Storefront,
  CaretDown,
  CheckCircle,
  LockKey,
  MapPin,
  Building,
} from '@phosphor-icons/react';
import { useSearchParams } from 'react-router-dom';
import { getAvailableBranches, type AvailableBranch } from '../api/manager';
import { useAuthStore } from '../../owner/store/auth-store';
import { joinBranch } from '../../lib/socket';

interface BranchSwitcherProps {
  currentBranch?: {
    id: string;
    name: string;
    code?: string;
  };
  variant?: 'badge' | 'pill';
  className?: string;
}

export default function BranchSwitcher({
  currentBranch,
  variant = 'badge',
  className = '',
}: BranchSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();
  const branchParam = searchParams.get('branch');

  const isOwner = user?.roles?.includes('OWNER');

  const { data: branches = [] } = useQuery<AvailableBranch[]>({
    queryKey: ['available-branches'],
    queryFn: getAvailableBranches,
    staleTime: 60_000,
  });

  const canSwitch = Boolean(isOwner || branches.length > 1);

  // Active branch id from localStorage or currentBranch prop
  const activeBranchId = currentBranch?.id || localStorage.getItem('fitflow_active_branch_id');
  const activeBranchObj =
    branches.find((b) => b.id === activeBranchId) ||
    (currentBranch ? { id: currentBranch.id, name: currentBranch.name, code: currentBranch.code || '' } : undefined);
  const activeBranchName = activeBranchObj?.name || 'Đang tải chi nhánh...';

  // Sync URL query param `?branch=<code>` with active branch and vice versa
  useEffect(() => {
    if (!branches.length) return;

    if (branchParam) {
      const matched = branches.find(
        (b) =>
          b.code?.toLowerCase() === branchParam.toLowerCase() ||
          b.id.toLowerCase() === branchParam.toLowerCase(),
      );
      if (matched && matched.id !== activeBranchId) {
        localStorage.setItem('fitflow_active_branch_id', matched.id);
        joinBranch(matched.id);
        queryClient.invalidateQueries();
        window.dispatchEvent(new CustomEvent('fitflow:branch-changed', { detail: { branchId: matched.id } }));
        return;
      }
    }

    // If no branch in URL but activeBranchObj is resolved, reflect branch code in URL query cleanly
    if (activeBranchObj?.code) {
      const cleanCode = activeBranchObj.code.toLowerCase();
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.get('branch') !== cleanCode) {
        currentUrl.searchParams.set('branch', cleanCode);
        window.history.replaceState(null, '', currentUrl.toString());
      }
    }
  }, [branches, branchParam, activeBranchId, activeBranchObj?.code]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  function handleSelectBranch(branch: AvailableBranch) {
    if (branch.id === activeBranchId) {
      setIsOpen(false);
      return;
    }

    // Save to localStorage so apiClient interceptor picks it up immediately
    localStorage.setItem('fitflow_active_branch_id', branch.id);

    // Update URL query string with branch code
    const cleanCode = (branch.code || branch.id).toLowerCase();
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('branch', cleanCode);
    window.history.replaceState(null, '', currentUrl.toString());

    // Join new socket branch room for real-time check-in updates
    joinBranch(branch.id);

    // Invalidate all queries so all manager/staff/pt data refreshes with the new branch context
    queryClient.invalidateQueries();
    window.dispatchEvent(new CustomEvent('fitflow:branch-changed', { detail: { branchId: branch.id } }));

    setIsOpen(false);
  }

  // Non-owner with single branch: Render read-only locked badge
  if (!canSwitch) {
    if (variant === 'pill') {
      return (
        <div className={`flex items-center gap-1.5 text-slate-600 dark:text-zinc-400 overflow-hidden text-[11px] sm:text-xs ${className}`}>
          <Storefront size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-bold text-slate-900 dark:text-zinc-100 truncate">
            {activeBranchName}
          </span>
          <span title="Chi nhánh cố định theo phân công" className="text-slate-400 shrink-0">
            <LockKey size={12} />
          </span>
        </div>
      );
    }

    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-slate-100/80 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 shadow-2xs ${className}`}
        title="Chi nhánh cố định theo phân công làm việc"
      >
        <Storefront size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="truncate max-w-[140px] sm:max-w-[200px]">{activeBranchName}</span>
        <LockKey size={12} className="text-slate-400 shrink-0" />
      </div>
    );
  }

  // Switchable Branch (Owner or Multi-Branch staff/manager)
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {variant === 'pill' ? (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 hover:border-emerald-500/50 bg-slate-50 hover:bg-white dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 transition-all shadow-2xs text-[11px] sm:text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          title="Bấm để đổi chi nhánh làm việc"
        >
          <Storefront size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-slate-900 dark:text-zinc-100 truncate max-w-[110px] sm:max-w-[180px]">
            {activeBranchName}
          </span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
            Đổi
          </span>
          <CaretDown
            size={12}
            className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex items-center gap-2 rounded-xl border border-slate-200/90 hover:border-emerald-500/60 bg-white/90 hover:bg-slate-50/90 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-all shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          title="Bấm để chuyển sang cơ sở khác"
        >
          <Storefront size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="truncate max-w-[160px] sm:max-w-[240px]">{activeBranchName}</span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
            Đổi cơ sở
          </span>
          <CaretDown
            size={12}
            className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 mb-1.5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <Building size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
                  Cơ sở làm việc
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5">
                Chọn cơ sở bạn muốn xem và thao tác
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
              {branches.length} cơ sở
            </span>
          </div>

          {/* Branch List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {branches.map((branch) => {
              const isSelected = branch.id === activeBranchId;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelectBranch(branch)}
                  className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100 font-bold ring-1 ring-emerald-500/30'
                      : 'hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      <Storefront size={16} weight={isSelected ? 'fill' : 'regular'} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-black truncate">{branch.name}</p>
                      </div>
                      {branch.address ? (
                        <p className="text-[11px] text-slate-400 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{branch.address}</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                          Mã: {branch.code}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {isOwner && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-zinc-800 px-2 py-1">
              <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                👑 Bạn có quyền Chủ phòng tập (toàn quyền chuyển đổi giữa tất cả chi nhánh).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
