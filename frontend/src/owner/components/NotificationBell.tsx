import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  ArrowRight,
  Barbell,
  Bell,
  Check,
  CheckCircle,
  CurrencyCircleDollar,
  Hourglass,
  SignOut,
  Storefront,
  Ticket,
  Trash,
  UserPlus,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllReadNotifications,
  type AppNotification,
} from '../../lib/notifications-api';
import { useRealtimeEvent } from '../../lib/useRealtimeInvalidate';
import Modal from './Modal';
import Button from './Button';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  VIETQR: 'Chuyển khoản (VietQR)',
  CREDIT_CARD: 'Thẻ',
  MIXED: 'Kết hợp',
  OTHER: 'Khác',
};

function formatMoney(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

// Branches are created freely by each Owner — there's no fixed list to assign hues
// from up front, so a stable hash picks a slot from this fixed 8-hue palette
// instead. Same branchId -> same color everywhere, every reload.
const BRANCH_PALETTE = [
  { badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', bar: 'bg-emerald-500' },
  { badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', bar: 'bg-blue-500' },
  { badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', bar: 'bg-amber-500' },
  { badge: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400', bar: 'bg-violet-500' },
  { badge: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400', bar: 'bg-rose-500' },
  { badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400', bar: 'bg-cyan-500' },
  { badge: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400', bar: 'bg-indigo-500' },
  { badge: 'bg-teal-50 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400', bar: 'bg-teal-500' },
] as const;

function branchColor(branchId: string) {
  let hash = 0;
  for (let i = 0; i < branchId.length; i++) hash = (hash * 31 + branchId.charCodeAt(i)) >>> 0;
  return BRANCH_PALETTE[hash % BRANCH_PALETTE.length];
}

// Icon + tint per event type — lets "đăng ký gói tập", "khách vãng lai" and "vừa
// thanh toán" read apart from the recurring cần-chú-ý alerts at a glance.
const EVENT_STYLES: Record<string, { icon: Icon; iconClass: string }> = {
  PENDING_PAYMENTS: { icon: Hourglass, iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  MEMBERSHIP_EXPIRING_SOON: { icon: WarningCircle, iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  MEMBERS_AT_RISK: { icon: WarningCircle, iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  MEMBERSHIP_SOLD: { icon: Ticket, iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  GUEST_VISIT_CREATED: { icon: UserPlus, iconClass: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
  PAYMENT_CONFIRMED: { icon: CurrencyCircleDollar, iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  AUTO_CHECKOUT: { icon: SignOut, iconClass: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
  PT_BOOKING_CONFIRMED: { icon: Barbell, iconClass: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  PT_BOOKING_REJECTED: { icon: XCircle, iconClass: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' },
};
const DEFAULT_EVENT_STYLE = { icon: Bell, iconClass: 'bg-stone-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' };

// Owner/Manager/Staff route sets don't mirror each other 1:1 — remap a stored
// targetPath to each role's closest equivalent page instead of a 404.
const PATH_OVERRIDES: Record<'/owner' | '/manager' | '/staff' | '/customer', Record<string, string>> = {
  '/owner': { '/guest-visits': '/customers', '/memberships': '/customers' },
  '/manager': { '/guest-visits': '/customers', '/memberships': '/customers' },
  '/staff': { '/memberships': '/pos', '/customers': '/members' },
  '/customer': { '/attendance': '/attendance' },
};

function resolveTargetPath(basePath: '/owner' | '/manager' | '/staff' | '/customer', targetPath: string): string {
  return PATH_OVERRIDES[basePath][targetPath] ?? targetPath;
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

/**
 * Shared notification bell — mounted in Owner/Manager/Staff headers alike (see
 * `basePath`, which turns a stored `payload.targetPath` like "/customers" into
 * a role-correct route). Realtime via the same socket used across the app:
 * NotificationsScannerService pushes `notification:new` to `user:{id}` and this
 * just invalidates the list — no polling.
 */
export default function NotificationBell({ basePath }: { basePath: '/owner' | '/manager' | '/staff' | '/customer' }) {
  const [open, setOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 60000, // safety net if the socket drops
  });

  useRealtimeEvent('notification:new', () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const deleteAllReadMutation = useMutation({
    mutationFn: deleteAllReadNotifications,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const hasReadItems = items.some((n) => n.readAt);

  function handleOpenItem(n: AppNotification) {
    if (!n.readAt) readMutation.mutate(n.id);
    setOpen(false);
    // Has member/payment detail behind it -> show that first, same as the dashboard
    // queue's "xem chi tiết". No detail recorded (older row, or a type that never
    // carries one) -> just go straight to the closest matching list page.
    if (n.payload?.items?.length) {
      setSelectedNotification(n);
    } else if (n.payload?.targetPath) {
      navigate(`${basePath}${resolveTargetPath(basePath, n.payload.targetPath)}`);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-zinc-600 shadow-xs transition-colors hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        title="Thông báo"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white dark:ring-zinc-900">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-104 max-w-[92vw] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-950/10 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  {unreadCount} chưa đọc
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => readAllMutation.mutate()}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                <Check size={12} /> Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-10 text-center">
                <CheckCircle size={26} className="text-zinc-300 dark:text-zinc-700" />
                <p className="text-xs font-medium text-zinc-400">Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 dark:divide-zinc-800">
                {items.map((n) => {
                  const eventStyle = EVENT_STYLES[n.eventCode] ?? DEFAULT_EVENT_STYLE;
                  const EventIcon = eventStyle.icon;
                  const branchId = n.payload?.branchId as string | undefined;
                  const branchName = n.payload?.branchName as string | undefined;
                  const color = branchId ? branchColor(branchId) : null;

                  return (
                    <div
                      key={n.id}
                      className={`group relative flex items-start gap-2.5 py-3 pl-3.5 pr-4 transition-colors hover:bg-stone-50 dark:hover:bg-zinc-800/50 ${
                        !n.readAt ? 'bg-emerald-50/40 dark:bg-emerald-500/4' : ''
                      }`}
                    >
                      {/* Colored left accent — same hue as the branch badge, so a whole
                          row reads as "this branch" before you even read the text. */}
                      {color && <span className={`absolute inset-y-0 left-0 w-1 ${color.bar}`} />}

                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${eventStyle.iconClass}`}>
                        <EventIcon size={16} weight="fill" />
                      </span>

                      <button type="button" onClick={() => handleOpenItem(n)} className="min-w-0 flex-1 text-left">
                        {color && branchName && (
                          <span className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${color.badge}`}>
                            <Storefront size={10} weight="bold" />
                            {branchName}
                          </span>
                        )}
                        <div className="flex items-start gap-2">
                          {!n.readAt && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />}
                          <div className="min-w-0">
                            <p className={`text-xs leading-snug ${!n.readAt ? 'font-bold text-zinc-900 dark:text-zinc-100' : 'font-medium text-zinc-600 dark:text-zinc-400'}`}>
                              {n.title}
                            </p>
                            {n.body && <p className="mt-0.5 truncate text-[11px] text-zinc-400">{n.body}</p>}
                            <p className="mt-1 text-[10px] font-medium text-zinc-400">{formatRelativeTime(n.createdAt)}</p>
                          </div>
                        </div>
                      </button>
                      {n.readAt && (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(n.id)}
                          title="Xoá thông báo đã đọc"
                          className="shrink-0 rounded-lg p-1.5 text-zinc-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                        >
                          <Trash size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {hasReadItems && (
            <div className="border-t border-stone-100 px-4 py-2.5 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => deleteAllReadMutation.mutate()}
                className="w-full text-center text-[11px] font-semibold text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
              >
                Xoá tất cả thông báo đã đọc
              </button>
            </div>
          )}
        </div>
      )}

      {/* DETAIL MODAL — "xem chi tiết hội viên" behind a notification, whether it's
          1 record (a sale/payment that just happened) or several (a recurring alert). */}
      {selectedNotification?.payload?.items && (
        <Modal open size="lg" title="Chi tiết thông báo" onClose={() => setSelectedNotification(null)}>
          <NotificationDetail
            notification={selectedNotification}
            onNavigate={() => {
              const targetPath = selectedNotification.payload?.targetPath;
              setSelectedNotification(null);
              if (targetPath) navigate(`${basePath}${resolveTargetPath(basePath, targetPath)}`);
            }}
            onClose={() => setSelectedNotification(null)}
          />
        </Modal>
      )}
    </div>
  );
}

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-700 text-white',
  'from-blue-500 to-indigo-700 text-white',
  'from-violet-500 to-purple-700 text-white',
  'from-amber-500 to-orange-700 text-white',
  'from-rose-500 to-pink-700 text-white',
];

function getAvatarGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function getInitials(name: string) {
  if (!name) return 'HV';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function NotificationDetail({
  notification,
  onNavigate,
  onClose,
}: {
  notification: AppNotification;
  onNavigate: () => void;
  onClose: () => void;
}) {
  const items = notification.payload?.items ?? [];
  const hasAmount = items.some((i) => i.amount != null);
  const hasPackage = items.some((i) => i.packageName);
  const hasStartDate = items.some((i) => i.startDate);
  const hasEndDate = items.some((i) => i.endDate);
  const hasLastVisit = items.some((i) => i.lastVisitAt !== undefined);

  return (
    <div className="flex flex-col gap-4">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Thông báo chi tiết
          </span>
          <div className="flex items-center gap-2">
            {notification.payload?.branchName && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-bold text-zinc-700 shadow-xs dark:bg-zinc-900 dark:text-zinc-300">
                <Storefront size={11} weight="bold" />
                {notification.payload.branchName}
              </span>
            )}
            <span className="font-mono text-xs font-bold text-zinc-500">{items.length} mục</span>
          </div>
        </div>
        <h3 className="mt-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-100">{notification.title}</h3>
        {notification.body && <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{notification.body}</p>}
      </div>

      {/* Rich Table */}
      {items.length > 0 && (
        <div className="max-h-88 overflow-y-auto rounded-2xl border border-stone-200 shadow-sm dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50/90 font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
                <th className="px-4 py-3">Hội viên</th>
                <th className="px-4 py-3">Số điện thoại</th>
                {hasPackage && <th className="px-4 py-3">Gói tập</th>}
                {hasStartDate && <th className="px-4 py-3 text-right">Ngày đăng ký</th>}
                {hasAmount && <th className="px-4 py-3 text-right">Số tiền</th>}
                {hasEndDate && <th className="px-4 py-3 text-right">Ngày hết hạn</th>}
                {hasLastVisit && <th className="px-4 py-3 text-right">Lần tập gần nhất</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60">
              {items.map((item, idx) => {
                const avatarGradient = getAvatarGradient(item.customerName);

                return (
                  <tr key={item.id ?? idx} className="group hover:bg-stone-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-xs font-bold shadow-xs ${avatarGradient}`}
                        >
                          {getInitials(item.customerName)}
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {item.customerName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        {item.customerPhone || '—'}
                      </span>
                    </td>
                    {hasPackage && (
                      <td className="px-4 py-3 font-medium text-emerald-700 dark:text-emerald-400">
                        {item.packageName || '—'}
                      </td>
                    )}
                    {hasStartDate && (
                      <td className="px-4 py-3 text-right font-mono text-zinc-600 dark:text-zinc-300">
                        {item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    )}
                    {hasAmount && (
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {item.amount != null ? formatMoney(item.amount) : '—'}
                        {item.method && (
                          <span className="ml-1 rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {PAYMENT_METHOD_LABELS[item.method] ?? item.method}
                          </span>
                        )}
                      </td>
                    )}
                    {hasEndDate && (
                      <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                        {item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '—'}
                      </td>
                    )}
                    {hasLastVisit && (
                      <td className="px-4 py-3 text-right">
                        {item.lastVisitAt ? (
                          <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            {new Date(item.lastVisitAt).toLocaleDateString('vi-VN')}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Chưa từng tập
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-2 flex justify-end gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Đóng
        </Button>
        {notification.payload?.targetPath && (
          <Button size="sm" className="font-bold shadow-sm" onClick={onNavigate}>
            Tới trang xử lý <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  );
}
