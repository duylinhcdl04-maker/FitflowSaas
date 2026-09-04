import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Barbell,
  CalendarBlank,
  CalendarCheck,
  CheckCircle,
  Clock,
  Fire,
  IdentificationCard,
  Lightning,
  MapPin,
  Receipt,
  Scan,
  ShieldCheck,
  Sparkle,
  UserCircle,
} from '@phosphor-icons/react';
import {
  getAttendanceCalendar,
  getCurrentMembership,
  getCustomerProfile,
  getMyPtBookings,
  getMyPtPackage,
  getQrToken,
} from '../api/customer';
import { useAuthStore } from '../../owner/store/auth-store';
import Card from '../../owner/components/Card';
import { Skeleton } from '../../owner/components/Skeleton';

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  SCHEDULED: 'Sắp kích hoạt',
  FROZEN: 'Đang tạm ngưng',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
};

const WEEKDAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const DAY_COL_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

function formatTime(d?: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function CustomerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(45);
  const expiresAtRef = useRef<number>(0);

  // Queries
  const tokenQuery = useQuery({
    queryKey: ['customer-qr-token'],
    queryFn: getQrToken,
    refetchInterval: 45_000,
  });

  const profileQuery = useQuery({
    queryKey: ['customer-profile'],
    queryFn: getCustomerProfile,
  });

  const membershipQuery = useQuery({
    queryKey: ['customer-membership'],
    queryFn: getCurrentMembership,
  });

  const ptPackageQuery = useQuery({
    queryKey: ['customer-pt-package'],
    queryFn: getMyPtPackage,
  });

  const calendarQuery = useQuery({
    queryKey: ['customer-attendance-calendar'],
    queryFn: () => getAttendanceCalendar(),
  });

  const ptBookingsQuery = useQuery({
    queryKey: ['customer-pt-bookings'],
    queryFn: getMyPtBookings,
  });

  // Dynamic QR Code generation
  useEffect(() => {
    if (!tokenQuery.data) return;
    expiresAtRef.current = Date.now() + tokenQuery.data.expiresInSeconds * 1000;
    QRCode.toDataURL(tokenQuery.data.token, {
      width: 260,
      margin: 1,
      color: { dark: '#064e3b', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [tokenQuery.data]);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAtRef.current - Date.now()) / 1000));
      setCountdown(remaining);
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const profile = profileQuery.data;
  const membership = membershipQuery.data;
  const ptPackage = ptPackageQuery.data;
  const calendar = calendarQuery.data;
  const upcomingBooking = ptBookingsQuery.data?.upcoming?.[0];

  // Today Date details
  const today = new Date();
  const todayFormatted = `${WEEKDAY_NAMES[today.getDay()]}, ${String(today.getDate()).padStart(2, '0')}/${String(
    today.getMonth() + 1,
  ).padStart(2, '0')}/${today.getFullYear()}`;

  // Membership progress
  let membershipDaysLeft = 0;
  let membershipTotalDays = 0;
  let membershipProgress = 0;
  if (membership?.startDate && membership?.endDate) {
    const start = new Date(membership.startDate).getTime();
    const end = new Date(membership.endDate).getTime();
    const nowTime = Date.now();
    membershipTotalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    membershipDaysLeft = Math.max(0, Math.round((end - nowTime) / (1000 * 60 * 60 * 24)));
    const elapsed = Math.max(0, nowTime - start);
    membershipProgress = Math.min(100, Math.max(0, Math.round((elapsed / (end - start)) * 100)));
  }

  // PT sessions progress
  const ptUsed = ptPackage?.usedSessions ?? 0;
  const ptTotal = ptPackage?.totalSessions ?? 0;
  const ptRemaining = ptPackage?.remainingSessions ?? 0;
  const ptProgress = ptTotal > 0 ? Math.min(100, Math.round((ptUsed / ptTotal) * 100)) : 0;

  // Streak calculation & encouraging message
  const weekSessions = calendar?.stats?.thisWeekSessions ?? 0;
  const monthSessions = calendar?.stats?.thisMonthSessions ?? 0;
  const totalHours = calendar?.stats?.totalHours ?? 0;

  const streakMessage =
    weekSessions >= 4
      ? '🔥 Phong độ xuất sắc! Bạn đang duy trì thói quen tập luyện rất tuyệt vời.'
      : weekSessions >= 2
      ? '💪 Giữ vững phong độ nhé! Còn vài ngày để hoàn thành mục tiêu tuần này.'
      : '🎯 Khởi động tuần mới bằng một buổi tập tràn đầy năng lượng hôm nay!';

  return (
    <div className="flex flex-col gap-6">
      {/* 1. WELCOME HEADER WITH DATE & QUICK STATUS */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
              Chào, {user?.fullName?.split(' ').slice(-1)[0] || 'bạn'} 👋
            </h1>
            {membership?.status === 'ACTIVE' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Hội viên
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {todayFormatted} · Chúc bạn một buổi tập hiệu quả!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {profile?.customerCode && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white px-3 py-1.5 text-xs font-mono font-medium text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <UserCircle size={15} className="text-zinc-400" />
              <span>{profile.customerCode}</span>
            </div>
          )}
          {(profile?.homeBranch?.name || membership?.branch?.name) && (
            <div className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <MapPin size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>{profile?.homeBranch?.name || membership?.branch?.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. MAIN 2-COLUMN RESPONSIVE GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ================= LEFT COLUMN (Col 7) ================= */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* A. HERO — DYNAMIC QR CHECK-IN CARD */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 p-6 text-white shadow-xl shadow-emerald-950/20 sm:p-7">
            {/* Ambient background glows */}
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-teal-300/15 blur-3xl" />

            <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  <ShieldCheck size={16} weight="fill" className="text-emerald-300" />
                  <span>Mã Check-in Bảo Mật Động</span>
                </div>

                <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white">
                  {user?.fullName || 'Khách hàng FitFlow'}
                </h2>

                <p className="mt-1 text-xs text-emerald-100/85">
                  Đưa mã vào mắt quét tại cổng xoay Turnstile hoặc lễ tân để check-in mở cửa.
                </p>

                {/* Countdown meter */}
                <div className="mt-4 inline-flex items-center gap-2.5 rounded-2xl bg-black/20 px-3.5 py-2 backdrop-blur-md">
                  <div className="relative flex h-3 w-3 items-center justify-center">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-xs font-medium text-emerald-100">
                    Tự động đổi mới sau <span className="font-mono font-bold text-white">{countdown}s</span>
                  </span>
                </div>
              </div>

              {/* QR Canvas Box */}
              <div className="flex flex-col items-center gap-2">
                <div className="group relative flex h-[190px] w-[190px] shrink-0 items-center justify-center rounded-2xl bg-white p-3 shadow-2xl shadow-black/20 ring-4 ring-white/20 transition duration-300 hover:scale-[1.02] sm:h-[200px] sm:w-[200px]">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="Mã QR Check-in" className="h-full w-full object-contain" />
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-xl bg-stone-200" />
                  )}
                </div>
                <span className="text-[11px] font-medium tracking-wide text-emerald-200/80">
                  Chống chụp màn hình gian lận
                </span>
              </div>
            </div>

            {/* Bottom mini status bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4 text-xs text-emerald-100/80">
              <span className="flex items-center gap-1.5">
                <Lightning size={14} weight="fill" className="text-amber-300" /> Tốc độ nhận diện tức thì &lt; 0.3s
              </span>
              <Link
                to="/customer/profile"
                className="flex items-center gap-1 text-white underline-offset-4 hover:underline"
              >
                <Scan size={14} /> Cài đặt Face ID nhận diện
              </Link>
            </div>
          </div>

          {/* B. ATTENDANCE & HABIT TRACKER (7 DAYS) */}
          <Card className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                  <Fire size={22} weight="fill" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Nhịp độ tập luyện tuần này
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Theo dõi tần suất check-in đều đặn</p>
                </div>
              </div>
              <Link
                to="/customer/history"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Chi tiết <ArrowRight size={13} />
              </Link>
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-3 text-center dark:border-zinc-800/80 dark:bg-zinc-800/40">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Tuần này</p>
                <p className="mt-1 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {calendarQuery.isLoading ? '...' : `${weekSessions} buổi`}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-3 text-center dark:border-zinc-800/80 dark:bg-zinc-800/40">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Tháng này</p>
                <p className="mt-1 font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {calendarQuery.isLoading ? '...' : `${monthSessions} buổi`}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-100 bg-stone-50/60 p-3 text-center dark:border-zinc-800/80 dark:bg-zinc-800/40">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Tổng giờ tập</p>
                <p className="mt-1 font-display text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {calendarQuery.isLoading ? '...' : `${totalHours}h`}
                </p>
              </div>
            </div>

            {/* 7-Day Habit Strip (Mon-Sun) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarQuery.isLoading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))
                : (calendar?.days || []).map((day, idx) => {
                    const attended = day.count > 0;
                    const isToday = day.isToday;
                    const dayNum = day.date ? new Date(`${day.date}T00:00:00`).getDate() : '';

                    return (
                      <div
                        key={day.date || idx}
                        className={`flex flex-col items-center justify-between rounded-2xl p-2 text-center transition-all ${
                          attended
                            ? 'bg-emerald-500/10 text-emerald-900 ring-1 ring-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300'
                            : isToday
                            ? 'border-2 border-dashed border-emerald-500 bg-emerald-50/30 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300'
                            : 'bg-stone-50 text-zinc-400 dark:bg-zinc-800/50 dark:text-zinc-500'
                        }`}
                      >
                        <span className="text-[11px] font-bold">
                          {DAY_COL_LABELS[idx] ?? `T${idx + 2}`}
                        </span>
                        <span className="text-xs font-semibold">{dayNum}</span>
                        <div className="mt-1 flex h-5 w-5 items-center justify-center">
                          {attended ? (
                            <CheckCircle size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                          ) : isToday ? (
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-stone-300 dark:bg-zinc-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
            </div>

            {/* Streak insight prompt */}
            <div className="flex items-center gap-2 rounded-2xl bg-amber-500/10 px-4 py-2.5 text-xs text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
              <Sparkle size={16} weight="fill" className="shrink-0 text-amber-500" />
              <span>{streakMessage}</span>
            </div>
          </Card>

          {/* C. UPCOMING PT SESSION / BOOKING PROMPT */}
          {upcomingBooking ? (
            <Card className="flex flex-col gap-4 border-l-4 border-l-emerald-500">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CalendarCheck size={22} weight="fill" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Buổi tập PT sắp tới
                    </span>
                    <h4 className="mt-1 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                      {formatDate(upcomingBooking.scheduled_start)} ({formatTime(upcomingBooking.scheduled_start)} -{' '}
                      {formatTime(upcomingBooking.scheduled_end)})
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Huấn luyện viên: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{ptPackage?.ptName || 'HLV cá nhân'}</span>
                    </p>
                  </div>
                </div>

                <Link
                  to="/customer/pt"
                  className="rounded-xl bg-stone-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  Xem lịch
                </Link>
              </div>
            </Card>
          ) : ptPackage && ptRemaining > 0 ? (
            <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-dashed border-emerald-300 bg-emerald-50/50 p-5 sm:flex-row sm:items-center dark:border-emerald-800/60 dark:bg-emerald-500/5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <CalendarBlank size={20} weight="fill" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    Bạn còn {ptRemaining} buổi tập cùng HLV {ptPackage.ptName}
                  </h4>
                  <p className="mt-0.5 text-xs text-emerald-800/80 dark:text-emerald-400/80">
                    Đặt lịch trước để HLV chuẩn bị giáo án tập luyện phù hợp cho bạn.
                  </p>
                </div>
              </div>
              <Link
                to="/customer/pt"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-900/20 transition hover:bg-emerald-700 active:scale-95"
              >
                Đặt lịch ngay <ArrowRight size={14} />
              </Link>
            </div>
          ) : null}
        </div>

        {/* ================= RIGHT COLUMN (Col 5) ================= */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* D. GÓI TẬP HIỆN TẠI (MEMBERSHIP PROGRESS) */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <IdentificationCard size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Gói hội viên
                  </h3>
                  <h4 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {membershipQuery.isLoading ? (
                      <Skeleton className="h-5 w-32" />
                    ) : (
                      membership?.packageName || 'Chưa đăng ký gói'
                    )}
                  </h4>
                </div>
              </div>

              {membership && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  {STATUS_LABEL[membership.status] ?? membership.status}
                </span>
              )}
            </div>

            {membership ? (
              <div className="flex flex-col gap-3 rounded-2xl bg-stone-50/70 p-4 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Thời hạn sử dụng</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Còn {membershipDaysLeft} ngày ({100 - membershipProgress}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${membershipProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                  <span>Bắt đầu: {formatDate(membership.startDate)}</span>
                  <span>Hết hạn: {formatDate(membership.endDate)}</span>
                </div>

                <div className="mt-1 border-t border-stone-200/60 pt-2 text-[11px] text-zinc-500 dark:border-zinc-700/60 dark:text-zinc-400">
                  Phạm vi:{' '}
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {membership.branchAccessScope === 'ALL_BRANCHES'
                      ? 'Toàn bộ hệ thống chi nhánh'
                      : membership.branch?.name || 'Chi nhánh đăng ký'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-stone-50 p-4 text-center text-xs text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400">
                Chưa có gói hội viên nào đang kích hoạt. Vui lòng liên hệ lễ tân để đăng ký.
              </div>
            )}

            <Link
              to="/customer/membership"
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-zinc-600 transition hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400"
            >
              Xem chi tiết gói tập & đặc quyền <ArrowRight size={13} />
            </Link>
          </Card>

          {/* E. GÓI TẬP PT (PT SESSIONS PROGRESS) */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <Barbell size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Huấn luyện viên cá nhân
                  </h3>
                  <h4 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                    {ptPackageQuery.isLoading ? (
                      <Skeleton className="h-5 w-28" />
                    ) : (
                      ptPackage?.planName || 'Gói tập PT'
                    )}
                  </h4>
                </div>
              </div>

              {ptPackage && (
                <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
                  {ptRemaining} buổi còn lại
                </span>
              )}
            </div>

            {ptPackage ? (
              <div className="flex flex-col gap-3 rounded-2xl bg-stone-50/70 p-4 dark:bg-zinc-800/40">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>HLV phụ trách: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{ptPackage.ptName}</span></span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {ptUsed}/{ptTotal} buổi ({ptProgress}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-700">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${ptProgress}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
                  <span>Thời lượng: {ptPackage.sessionDurationMinutes || 60} phút/buổi</span>
                  {ptPackage.expiryDate && <span>Hết hạn: {formatDate(ptPackage.expiryDate)}</span>}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-stone-50 p-4 text-center text-xs text-zinc-500 dark:bg-zinc-800/40 dark:text-zinc-400">
                Bạn chưa đăng ký gói huấn luyện viên riêng. Tập luyện cùng PT giúp đạt kết quả nhanh hơn 3x.
              </div>
            )}

            <Link
              to="/customer/pt"
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-zinc-600 transition hover:text-violet-600 dark:text-zinc-400 dark:hover:text-violet-400"
            >
              {ptPackage ? 'Quản lý lịch tập PT' : 'Tìm hiểu gói tập PT'} <ArrowRight size={13} />
            </Link>
          </Card>

          {/* F. QUICK ACTIONS GRID (4 SHORTCUTS) */}
          <Card className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Lối tắt tiện ích
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/customer/pt"
                className="group flex flex-col items-start gap-2 rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5 transition hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/20"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm transition group-hover:bg-emerald-600 group-hover:text-white dark:bg-zinc-800 dark:text-emerald-400">
                  <CalendarCheck size={18} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Đặt lịch PT</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">Chọn giờ tập HLV</p>
                </div>
              </Link>

              <Link
                to="/customer/history"
                className="group flex flex-col items-start gap-2 rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5 transition hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/20"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-teal-600 shadow-sm transition group-hover:bg-teal-600 group-hover:text-white dark:bg-zinc-800 dark:text-teal-400">
                  <Clock size={18} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Lịch sử tập</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">Chi tiết giờ ra/vào</p>
                </div>
              </Link>

              <Link
                to="/customer/history?tab=billing"
                className="group flex flex-col items-start gap-2 rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5 transition hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/20"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-zinc-800 dark:text-indigo-400">
                  <Receipt size={18} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Hóa đơn & TT</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">Biên lai nộp phí</p>
                </div>
              </Link>

              <Link
                to="/customer/profile"
                className="group flex flex-col items-start gap-2 rounded-2xl border border-stone-200/70 bg-stone-50/50 p-3.5 transition hover:border-emerald-500 hover:bg-emerald-50/40 active:scale-[0.98] dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:border-emerald-500/50 dark:hover:bg-emerald-950/20"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm transition group-hover:bg-sky-600 group-hover:text-white dark:bg-zinc-800 dark:text-sky-400">
                  <Scan size={18} weight="fill" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Cài đặt Face ID</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">Nhận diện vào cửa</p>
                </div>
              </Link>
            </div>
          </Card>

          {/* G. HOME BRANCH & OPERATING STATUS */}
          <div className="flex items-center justify-between rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <MapPin size={22} weight="fill" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {profile?.homeBranch?.name || membership?.branch?.name || 'FitFlow Center'}
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Mở cửa
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Giờ mở cửa: 06:00 - 22:00 hàng ngày
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
