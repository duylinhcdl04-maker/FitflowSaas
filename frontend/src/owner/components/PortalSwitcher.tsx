import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Crown,
  Buildings,
  Storefront,
  DeviceMobile,
  CaretDown,
  Check,
  Sparkle,
  Storefront as BranchIcon,
} from '@phosphor-icons/react';
import { useAuthStore } from '../store/auth-store';
import { getAvailableBranches, type AvailableBranch } from '../../manager/api/manager';
import { joinBranch } from '../../lib/socket';

export interface PortalOption {
  id: string;
  path: string;
  name: string;
  shortName: string;
  roleLabel: string;
  description: string;
  icon: typeof Crown;
  colorClass: string;
  bgLightClass: string;
  badgeClass: string;
}

const PORTALS: PortalOption[] = [
  {
    id: 'owner',
    path: '/owner',
    name: 'Quản lý chuỗi',
    shortName: 'Owner',
    roleLabel: 'Chủ phòng tập',
    description: 'Báo cáo doanh thu, cấu hình chuỗi, chi nhánh & gói SaaS',
    icon: Crown,
    colorClass: 'text-amber-500 dark:text-amber-400',
    bgLightClass: 'bg-amber-500/10',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    id: 'manager',
    path: '/manager',
    name: 'Quản lý Chi nhánh',
    shortName: 'Manager',
    roleLabel: 'Cơ sở / Chi nhánh',
    description: 'Vận hành cơ sở, nhân sự chi nhánh, hội viên & báo cáo ca',
    icon: Buildings,
    colorClass: 'text-blue-500 dark:text-blue-400',
    bgLightClass: 'bg-blue-500/10',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    id: 'staff',
    path: '/staff',
    name: 'Lễ tân & Bán hàng',
    shortName: 'Lễ tân (POS)',
    roleLabel: 'Quầy dịch vụ POS',
    description: 'Check-in Turnstile, bán gói POS, thu tiền vé lượt & Kiosk FaceID',
    icon: Storefront,
    colorClass: 'text-emerald-500 dark:text-emerald-400',
    bgLightClass: 'bg-emerald-500/10',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    id: 'customer',
    path: '/customer',
    name: 'Cổng Hội viên',
    shortName: 'Khách hàng',
    roleLabel: 'Giao diện Member',
    description: 'Xem trước trải nghiệm học viên, mã QR động & lịch tập',
    icon: DeviceMobile,
    colorClass: 'text-teal-500 dark:text-teal-400',
    bgLightClass: 'bg-teal-500/10',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  },
];

interface PortalSwitcherProps {
  className?: string;
  variant?: 'header' | 'compact';
}

export default function PortalSwitcher({ className = '', variant = 'header' }: PortalSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // Close on click outside
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

  // Check which portal is currently active based on path
  const activePortal =
    PORTALS.find((p) => location.pathname.startsWith(p.path)) || PORTALS[0];

  const isOwner = user?.roles?.includes('OWNER');
  const queryClient = useQueryClient();

  const { data: branches = [] } = useQuery<AvailableBranch[]>({
    queryKey: ['available-branches'],
    queryFn: getAvailableBranches,
    enabled: Boolean(isOwner),
    staleTime: 60_000,
  });
  const activeBranchId = localStorage.getItem('fitflow_active_branch_id');

  // If user is not OWNER and only has 1 role, don't show the switcher dropdown
  if (!isOwner && (!user?.roles || user.roles.length <= 1)) {
    return null;
  }

  const ActiveIcon = activePortal.icon;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Chuyển đổi phân hệ làm việc (KiotViet style)"
        className={`group flex items-center gap-2 rounded-xl border transition-all cursor-pointer ${
          variant === 'compact'
            ? 'h-9 px-2.5 bg-white dark:bg-zinc-900 border-stone-200/80 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:border-emerald-500/50 shadow-xs'
            : 'h-9 px-3 bg-stone-100/90 dark:bg-zinc-800/80 border-stone-200/80 dark:border-zinc-700/60 text-xs font-bold text-zinc-800 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-800 hover:border-emerald-500 shadow-xs'
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-md ${activePortal.bgLightClass} ${activePortal.colorClass}`}
        >
          <ActiveIcon size={14} weight="bold" />
        </span>

        <span className="truncate max-w-[120px] sm:max-w-[150px]">
          {activePortal.name}
        </span>

        <CaretDown
          size={12}
          weight="bold"
          className={`text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-80 sm:w-88 rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2 dark:border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100">
              <Sparkle size={15} weight="fill" className="text-amber-500" />
              <span>Chuyển đổi phân hệ FitFlow</span>
            </div>
            {isOwner && (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                Toàn quyền Chủ chuỗi
              </span>
            )}
          </div>

          {/* List of Portals */}
          <div className="flex flex-col gap-1 py-1.5">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              const isCurrent = portal.id === activePortal.id;

              return (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (!isCurrent) {
                      queryClient.invalidateQueries();
                      navigate(portal.path);
                    }
                  }}
                  className={`group flex items-start gap-3 rounded-xl p-2.5 text-left transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-50/80 ring-1 ring-emerald-500/20 dark:bg-emerald-500/10 dark:ring-emerald-500/30'
                      : 'hover:bg-stone-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${portal.bgLightClass} ${portal.colorClass}`}
                  >
                    <Icon size={20} weight={isCurrent ? 'fill' : 'regular'} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {portal.name}
                        </span>
                        <span className={`rounded px-1.5 py-0.2 text-[9px] font-semibold ${portal.badgeClass}`}>
                          {portal.shortName}
                        </span>
                      </div>

                      {isCurrent && (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500">
                          <Check size={10} weight="bold" />
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-[11px] leading-tight text-zinc-500 line-clamp-2 dark:text-zinc-400">
                      {portal.description}
                    </p>

                    {/* Quick branch selection for Manager and Staff */}
                    {isOwner && (portal.id === 'manager' || portal.id === 'staff') && branches.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-stone-200/60 dark:border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                          Cơ sở:
                        </span>
                        {branches.map((b) => {
                          const isBranchActive = isCurrent && b.id === (activeBranchId || branches[0]?.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                localStorage.setItem('fitflow_active_branch_id', b.id);
                                joinBranch(b.id);
                                queryClient.invalidateQueries();
                                setIsOpen(false);
                                navigate(portal.path);
                              }}
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                                isBranchActive
                                  ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-500'
                                  : 'bg-stone-100 hover:bg-emerald-500 hover:text-white dark:bg-zinc-800 dark:hover:bg-emerald-600 text-zinc-700 dark:text-zinc-300'
                              }`}
                              title={`Chuyển tới ${portal.name} - ${b.name}`}
                            >
                              {b.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="border-t border-stone-100 bg-stone-50/70 -mx-2 -mb-2 mt-1 rounded-b-2xl px-3 py-2 text-[10px] text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950/50">
            💡 Quyền Chủ phòng tập (Owner) cho phép bạn trực tiếp vận hành mọi quầy dịch vụ mà không cần đăng xuất.
          </div>
        </div>
      )}
    </div>
  );
}
