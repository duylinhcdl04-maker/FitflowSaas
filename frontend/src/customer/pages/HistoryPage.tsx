import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Clock,
  Fire,
  GridFour,
  ListBullets,
  MapPinLine,
  Printer,
  Pulse,
  Receipt,
  SignIn,
  SignOut,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import {
  getAttendanceCalendar,
  getAttendanceHistory,
  getAttendanceMonthSummary,
  getPaymentDetail,
  getPayments,
  type AttendanceCalendarDay,
  type AttendanceEntry,
} from '../api/customer';
import Card from '../../owner/components/Card';
import Button from '../../owner/components/Button';
import Modal from '../../owner/components/Modal';
import { Skeleton } from '../../owner/components/Skeleton';

type Tab = 'attendance' | 'billing';
type ViewMode = 'week' | 'month' | 'list';

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

// NOT `date.toISOString().slice(0, 10)` — that converts to UTC first, which silently
// shifts the date back a day in any timezone ahead of UTC (Asia/Ho_Chi_Minh, UTC+7,
// is exactly where this app's customers are). Build the string from local Y/M/D instead.
function toLocalDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayIso() {
  return toLocalDateStr(new Date());
}

function mondayIso(d: Date) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const weekday = date.getDay(); // 0 (Sun) .. 6 (Sat)
  date.setDate(date.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return toLocalDateStr(date);
}

function shiftIso(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
}

function formatDayMonth(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

/** "1g 55p" / "2 giờ" / "35 phút" — matches the compact duration format from the mockup. */
function formatDuration(checkInAt: string, checkOutAt: string | null) {
  if (!checkOutAt) return null;
  const minutes = Math.round((new Date(checkOutAt).getTime() - new Date(checkInAt).getTime()) / 60_000);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}g ${rest}p` : `${hours} giờ`;
}

const METHOD_LABEL: Record<string, string> = { QR: 'Mã QR', MANUAL: 'Thủ công', AUTO: 'Tự động' };
const PAYMENT_STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Đã thanh toán', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  PENDING: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  EXPIRED: { label: 'Hết hạn', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
};

function formatMoney(n: string | number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n));
}
function formatDateTime(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function HistoryPage() {
  const [tab, setTab] = useState<Tab>('attendance');
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [weekStart, setWeekStart] = useState(() => mondayIso(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => todayIso());
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const calendarQuery = useQuery({
    queryKey: ['customer-attendance-calendar', weekStart],
    queryFn: () => getAttendanceCalendar(weekStart),
    enabled: tab === 'attendance' && viewMode === 'week',
  });

  function goToWeek(offsetDays: number) {
    setWeekStart((w) => shiftIso(w, offsetDays));
  }

  function goToToday() {
    setWeekStart(mondayIso(new Date()));
    setSelectedDate(todayIso());
  }

  /** Month grid → jump to that day's week, in the week view — ties the 3 view modes together. */
  function jumpToDay(date: string) {
    setWeekStart(mondayIso(new Date(`${date}T00:00:00`)));
    setSelectedDate(date);
    setViewMode('week');
  }

  const days = calendarQuery.data?.days ?? [];
  const activeDay: AttendanceCalendarDay | undefined =
    days.find((d) => d.date === selectedDate) ?? days.find((d) => d.isToday) ?? days[0];

  const paymentsQuery = useQuery({
    queryKey: ['customer-payments', paymentsPage],
    queryFn: () => getPayments(paymentsPage, 10),
    enabled: tab === 'billing',
  });

  const paymentDetailQuery = useQuery({
    queryKey: ['customer-payment-detail', selectedPaymentId],
    queryFn: () => getPaymentDetail(selectedPaymentId!),
    enabled: Boolean(selectedPaymentId),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Lịch sử</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Nhật ký ra/vào phòng tập và lịch sử thanh toán của bạn.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex w-fit items-center gap-1 rounded-2xl border border-stone-200/60 bg-stone-100/80 p-1 dark:border-zinc-700/60 dark:bg-zinc-800/60">
          {(
            [
              { key: 'attendance', label: 'Điểm danh' },
              { key: 'billing', label: 'Thanh toán' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-1.5 text-xs font-bold transition ${
                tab === t.key
                  ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-400'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'attendance' && (
          <div className="inline-flex w-fit items-center gap-1 rounded-2xl border border-stone-200/60 bg-stone-100/80 p-1 dark:border-zinc-700/60 dark:bg-zinc-800/60">
            {(
              [
                { key: 'week', icon: CalendarBlank, title: 'Xem theo tuần' },
                { key: 'month', icon: GridFour, title: 'Xem theo tháng' },
                { key: 'list', icon: ListBullets, title: 'Lịch sử chi tiết' },
              ] as const
            ).map((v) => {
              const ModeIcon = v.icon;
              const active = viewMode === v.key;
              return (
                <button
                  key={v.key}
                  type="button"
                  title={v.title}
                  onClick={() => setViewMode(v.key)}
                  className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    active ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="history-view-toggle-pill"
                      transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                      className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-stone-200/80 dark:bg-zinc-900 dark:ring-zinc-700"
                    />
                  )}
                  <ModeIcon size={16} weight={active ? 'fill' : 'regular'} className="relative" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {tab === 'attendance' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {viewMode === 'week' &&
              (calendarQuery.isLoading ? (
                <Skeleton className="h-96 w-full" />
              ) : (
                <WeekView
                  stats={calendarQuery.data?.stats}
                  weekStart={calendarQuery.data?.weekStart}
                  weekEnd={calendarQuery.data?.weekEnd}
                  days={days}
                  activeDay={activeDay}
                  onSelectDay={setSelectedDate}
                  onPrevWeek={() => goToWeek(-7)}
                  onNextWeek={() => goToWeek(7)}
                  onToday={goToToday}
                />
              ))}
            {viewMode === 'month' && <MonthView onSelectDay={jumpToDay} />}
            {viewMode === 'list' && <ListView />}
          </motion.div>
        </AnimatePresence>
      ) : paymentsQuery.isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : paymentsQuery.data && paymentsQuery.data.items.length > 0 ? (
        <>
          <div className="flex flex-col gap-3">
            {paymentsQuery.data.items.map((p) => (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPaymentId(p.id)}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedPaymentId(p.id)}
                className="flex cursor-pointer items-center justify-between gap-4 rounded-3xl border border-stone-200/70 bg-white p-4 shadow-sm shadow-stone-950/[0.03] transition hover:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-emerald-800"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <Receipt size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{p.paymentCode}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(p.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatMoney(p.totalAmount)}</p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${PAYMENT_STATUS_STYLE[p.status]?.className ?? ''}`}>
                    {PAYMENT_STATUS_STYLE[p.status]?.label ?? p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={paymentsQuery.data.page} totalPages={paymentsQuery.data.totalPages} onChange={setPaymentsPage} />
        </>
      ) : (
        <p className="text-center text-sm text-zinc-400">Chưa có giao dịch nào.</p>
      )}

      <Modal open={Boolean(selectedPaymentId)} onClose={() => setSelectedPaymentId(null)} title="Chi tiết hoá đơn" size="lg">
        {paymentDetailQuery.isLoading || !paymentDetailQuery.data ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div id="customer-receipt" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {paymentDetailQuery.data.payment_code}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(paymentDetailQuery.data.created_at)}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${PAYMENT_STATUS_STYLE[paymentDetailQuery.data.status]?.className ?? ''}`}>
                {PAYMENT_STATUS_STYLE[paymentDetailQuery.data.status]?.label ?? paymentDetailQuery.data.status}
              </span>
            </div>

            <div className="flex flex-col gap-2 rounded-2xl bg-stone-50 p-4 dark:bg-zinc-800/60">
              {(paymentDetailQuery.data.payment_items ?? []).map((item: { id: string; description: string; quantity: number; amount: string | number }) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-300">
                    {item.description} {item.quantity > 1 ? `x${item.quantity}` : ''}
                  </span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">{formatMoney(item.amount)}</span>
                </div>
              ))}
              <div className="mt-2 flex justify-between border-t border-stone-200 pt-2 text-sm font-bold dark:border-zinc-700">
                <span>Tổng cộng</span>
                <span className="text-emerald-700 dark:text-emerald-400">{formatMoney(paymentDetailQuery.data.total_amount)}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              Chi nhánh: {paymentDetailQuery.data.branches?.name ?? '—'} · Phương thức: {paymentDetailQuery.data.method}
            </p>

            <Button variant="secondary" className="w-fit gap-1.5 self-end" onClick={() => window.print()}>
              <Printer size={16} /> In / Lưu PDF
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View 1/3 — Week strip (default)
// ---------------------------------------------------------------------------

function WeekView({
  stats,
  weekStart,
  weekEnd,
  days,
  activeDay,
  onSelectDay,
  onPrevWeek,
  onNextWeek,
  onToday,
}: {
  stats?: { thisWeekSessions: number; thisMonthSessions: number; totalHours: number };
  weekStart?: string;
  weekEnd?: string;
  days: AttendanceCalendarDay[];
  activeDay?: AttendanceCalendarDay;
  onSelectDay: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile icon={Fire} tone="amber" value={`${stats?.thisWeekSessions ?? 0} buổi`} label="Tuần này" />
        <StatTile icon={Pulse} tone="violet" value={`${stats?.thisMonthSessions ?? 0} buổi`} label="Tháng này" />
        <StatTile icon={Clock} tone="blue" value={`${stats?.totalHours ?? 0} giờ`} label="Tổng thời gian tập" />
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevWeek}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-stone-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <CaretLeft size={14} />
            </button>
            <span className="whitespace-nowrap font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {weekStart && weekEnd ? `${formatDayMonth(weekStart)} – ${formatDayMonth(weekEnd)}` : '—'}
            </span>
            <button
              type="button"
              onClick={onNextWeek}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-stone-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <CaretRight size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={onToday}
            className="shrink-0 text-xs font-bold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            Hôm nay
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 p-3 sm:gap-2 sm:p-4">
          {days.map((day, i) => {
            const isSelected = activeDay?.date === day.date;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => onSelectDay(day.date)}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-center transition-colors sm:py-3 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : day.isToday
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'text-zinc-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-emerald-100' : ''}`}>{WEEKDAY_LABELS[i]}</span>
                <span className="font-display text-sm font-extrabold sm:text-base">{new Date(`${day.date}T00:00:00`).getDate()}</span>
                {day.count > 0 ? (
                  <span className="flex gap-0.5">
                    {Array.from({ length: Math.min(day.count, 3) }).map((_, dotIdx) => (
                      <span key={dotIdx} className={`h-1 w-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                    ))}
                  </span>
                ) : (
                  <span className={`text-[9px] ${isSelected ? 'text-emerald-100' : 'text-zinc-300 dark:text-zinc-600'}`}>Nghỉ</span>
                )}
                {day.count > 0 && (
                  <span className={`text-[9px] font-semibold ${isSelected ? 'text-emerald-100' : 'text-zinc-400'}`}>{day.count} lượt</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <CalendarBlank size={16} className="shrink-0 text-zinc-400" />
          <p className="shrink-0 text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {activeDay?.isToday ? 'Hôm nay' : activeDay ? formatDayMonth(activeDay.date) : ''}
          </p>
          <span className="truncate text-xs text-zinc-400">
            {activeDay ? `— ${formatDayMonth(activeDay.date)} · ${activeDay.count} lượt tập` : ''}
          </span>
        </div>

        {activeDay && activeDay.entries.length > 0 ? (
          <div className="flex flex-col gap-3">
            {activeDay.entries.map((a) => (
              <Card key={a.id} padded={false} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <SignIn size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                      <MapPinLine size={13} className="shrink-0 text-zinc-400" />
                      <span className="truncate">{a.branchName}</span>
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      Vào: {formatDateTime(a.checkInAt)} ({METHOD_LABEL[a.method] ?? a.method})
                    </p>
                    {a.checkOutAt && (
                      <p className="flex items-center gap-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        <SignOut size={11} className="shrink-0" /> Ra: {formatDateTime(a.checkOutAt)}
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    a.status === 'CHECKED_IN'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : 'bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {a.status === 'CHECKED_IN' ? 'Đang tập' : 'Đã hoàn thành'}
                </span>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-stone-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
            Không có buổi tập nào trong ngày này.
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// View 2/3 — Month heatmap (GitHub-contributions style)
// ---------------------------------------------------------------------------

// Index = activity level (0 = none .. 3 = busiest). `swatch` is just the background,
// used standalone for the legend key; `cell` is the full class list for a grid day.
const MONTH_LEVELS = [
  { swatch: 'bg-stone-100 dark:bg-zinc-800/60', cell: 'bg-stone-100 text-zinc-400 dark:bg-zinc-800/60 dark:text-zinc-500' },
  { swatch: 'bg-emerald-200 dark:bg-emerald-500/25', cell: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' },
  { swatch: 'bg-emerald-400 dark:bg-emerald-600', cell: 'bg-emerald-400 text-white dark:bg-emerald-600' },
  { swatch: 'bg-emerald-600 dark:bg-emerald-500', cell: 'bg-emerald-600 text-white dark:bg-emerald-500' },
];

function levelOf(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  return 3;
}

function shiftMonth(monthStr: string, delta: number) {
  const [y, m] = monthStr.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthStr: string) {
  const [y, m] = monthStr.split('-').map(Number);
  return `Tháng ${m}, ${y}`;
}

function MonthView({ onSelectDay }: { onSelectDay: (date: string) => void }) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const query = useQuery({
    queryKey: ['customer-attendance-month', month],
    queryFn: () => getAttendanceMonthSummary(month),
  });

  if (query.isLoading) return <Skeleton className="h-96 w-full" />;
  const data = query.data;

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-stone-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <CaretLeft size={14} />
          </button>
          <div>
            <p className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatMonthLabel(month)}</p>
            <p className="text-[11px] text-zinc-400">{data ? `${data.daysWithActivity} ngày có hoạt động` : '—'}</p>
          </div>
          <button
            type="button"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-stone-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <CaretRight size={14} />
          </button>
        </div>

        {/* Intensity legend */}
        <div className="flex shrink-0 items-center gap-1">
          {MONTH_LEVELS.map((level, i) => (
            <span key={i} className={`h-3.5 w-3.5 rounded-md ${level.swatch}`} />
          ))}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="mb-1.5 grid grid-cols-7 gap-1.5 sm:gap-2">
          {WEEKDAY_LABELS.map((label) => (
            <p key={label} className="text-center text-[10px] font-bold uppercase text-zinc-400">
              {label}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {data &&
            Array.from({ length: data.firstWeekday }).map((_, i) => <span key={`pad-${i}`} />)}
          {data?.days.map((day) => (
            <motion.button
              key={day.date}
              type="button"
              onClick={() => onSelectDay(day.date)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className={`relative aspect-square rounded-xl text-xs font-bold transition-shadow ${MONTH_LEVELS[levelOf(day.count)].cell} ${
                day.isToday ? 'ring-2 ring-emerald-600 ring-offset-1 dark:ring-offset-zinc-900' : ''
              }`}
              title={day.count > 0 ? `${day.count} lượt tập` : 'Không có hoạt động'}
            >
              {Number(day.date.slice(-2))}
            </motion.button>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// View 3/3 — Detailed chronological list, grouped by day
// ---------------------------------------------------------------------------

function groupEntriesByDay(items: AttendanceEntry[]) {
  const groups: { date: string; items: AttendanceEntry[] }[] = [];
  for (const item of items) {
    const key = toLocalDateStr(new Date(item.checkInAt));
    const last = groups[groups.length - 1];
    if (last && last.date === key) last.items.push(item);
    else groups.push({ date: key, items: [item] });
  }
  return groups;
}

function formatDayHeader(dateStr: string) {
  if (dateStr === todayIso()) return 'Hôm nay';
  const d = new Date(`${dateStr}T00:00:00`);
  const weekdayIdx = (d.getDay() + 6) % 7; // 0=T2..6=CN, matches WEEKDAY_LABELS
  return `${WEEKDAY_LABELS[weekdayIdx]}, ${formatDayMonth(dateStr)}`;
}

function formatTimeOnly(iso: string) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function ListView() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['customer-attendance-list', page],
    queryFn: () => getAttendanceHistory(page, 20),
  });

  if (query.isLoading) return <Skeleton className="h-96 w-full" />;
  if (!query.data || query.data.items.length === 0) {
    return <p className="text-center text-sm text-zinc-400">Chưa có lịch sử điểm danh nào.</p>;
  }

  const groups = groupEntriesByDay(query.data.items);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <Card key={group.date} padded={false} className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-4 py-3 dark:border-zinc-800">
            <div className="flex min-w-0 items-center gap-2">
              <CalendarBlank size={15} className="shrink-0 text-zinc-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatDayHeader(group.date)}</p>
                <p className="truncate text-[11px] text-zinc-400">{formatDayMonth(group.date)}</p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-semibold text-zinc-400">{group.items.length} lượt</span>
          </div>

          <div className="flex flex-col divide-y divide-stone-100 dark:divide-zinc-800">
            {group.items.map((a) => {
              const isOngoing = a.status === 'CHECKED_IN';
              const duration = formatDuration(a.checkInAt, a.checkOutAt);
              return (
                <div
                  key={a.id}
                  className={`flex flex-wrap items-center justify-between gap-2 border-l-2 p-3.5 sm:gap-3 ${
                    isOngoing
                      ? 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/[0.06]'
                      : 'border-l-indigo-400 dark:border-l-indigo-500'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-xs font-bold text-zinc-800 dark:text-zinc-100">
                      <MapPinLine size={12} className="shrink-0 text-zinc-400" />
                      <span className="truncate">{a.branch?.name ?? 'Chi nhánh'}</span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <SignIn size={11} /> {formatTimeOnly(a.checkInAt)}
                      </span>
                      {a.checkOutAt && (
                        <span className="flex items-center gap-1">
                          <SignOut size={11} /> {formatTimeOnly(a.checkOutAt)}
                        </span>
                      )}
                      {duration && (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                          <Clock size={11} /> {duration}
                        </span>
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      isOngoing
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                        : 'bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {isOngoing ? 'Đang tập' : 'Hoàn thành'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <Pagination page={query.data.page} totalPages={query.data.totalPages} onChange={setPage} />
    </div>
  );
}

const STAT_TONE: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
};

function StatTile({
  icon: TileIcon,
  tone,
  value,
  label,
}: {
  icon: Icon;
  tone: 'amber' | 'violet' | 'blue';
  value: string;
  label: string;
}) {
  return (
    <Card className="flex items-center gap-3">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${STAT_TONE[tone]}`}>
        <TileIcon size={20} weight="fill" />
      </span>
      <div>
        <p className="font-display text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{value}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
    </Card>
  );
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
      >
        <CaretLeft size={14} />
      </button>
      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        Trang {page}/{totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-xl border border-stone-200 text-zinc-600 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300"
      >
        <CaretRight size={14} />
      </button>
    </div>
  );
}
