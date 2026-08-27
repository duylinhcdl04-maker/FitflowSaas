import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CaretRight,
  ChartLineUp,
  Clock,
  CurrencyCircleDollar,
  PersonSimpleRun,
  Users,
  DownloadSimple,
  Ticket,
  BellRinging,
  ChartPie,
  CalendarCheck,
  Lightning,
} from '@phosphor-icons/react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';
import {
  getDashboardOverview,
  getDashboardRevenue,
  type DashboardAlert,
  type DashboardActivityItem,
  type DashboardCheckinItem,
} from '../api/dashboard';
import { listBranches } from '../api/branches';
import { useAuthStore } from '../store/auth-store';
import Card from '../components/Card';
import Button from '../components/Button';
import Callout from '../components/Callout';
import KpiCard from '../components/KpiCard';
import RevenueChart from '../components/RevenueChart';
import { Skeleton } from '../components/Skeleton';
import Modal from '../components/Modal';

const RANGE_OPTIONS = [
  { key: 'today', label: 'Hôm nay', days: 0 },
  { key: '7d', label: '7 ngày qua', days: 6 },
  { key: 'month', label: 'Tháng này', days: 29 },
] as const;

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-orange-500',
  MEDIUM: 'bg-amber-500',
  LOW: 'bg-blue-500',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Khẩn cấp',
  HIGH: 'Ưu tiên cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thông tin',
};

const METHOD_LABELS: Record<string, string> = { FACE: 'Nhận diện', QR: 'QR', MANUAL: 'Thủ công', AUTO: 'Tự động' };
const QUOTA_LABELS: Record<string, string> = { MAX_BRANCHES: 'Chi nhánh', MAX_STAFF: 'Nhân sự' };

function formatMoney(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function formatGroupLabel(dateStr: string, groupBy: 'day' | 'week' | 'month') {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  if (groupBy === 'day') return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  if (groupBy === 'week') return 'T.' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  if (groupBy === 'month') return date.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' });
  return dateStr;
}

function formatSpecificDateTime(dateStr?: string | Date | null) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Hôm nay, ${timeStr}`;
  if (isYesterday) return `Hôm qua, ${timeStr}`;

  const dayStr = String(date.getDate()).padStart(2, '0');
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  const yearStr = date.getFullYear();
  return `${dayStr}/${monthStr}/${yearStr} ${timeStr}`;
}

function formatRelativeTime(dateStr?: string | Date | null) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);

  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const } }),
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(RANGE_OPTIONS[1]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  const [selectedAlert, setSelectedAlert] = useState<DashboardAlert | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<DashboardActivityItem | null>(null);
  const [selectedCheckin, setSelectedCheckin] = useState<DashboardCheckinItem | null>(null);

  const from = new Date();
  from.setDate(from.getDate() - range.days);
  from.setHours(0, 0, 0, 0);

  const { data: branches } = useQuery({
    queryKey: ['owner-branches-list'],
    queryFn: listBranches,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['owner-dashboard', range.key, selectedBranchId],
    queryFn: () =>
      getDashboardOverview({
        from: from.toISOString(),
        to: new Date().toISOString(),
        branchId: selectedBranchId || undefined,
      }),
  });

  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: ['owner-dashboard-revenue', range.key, selectedBranchId, groupBy],
    queryFn: () =>
      getDashboardRevenue({
        from: from.toISOString(),
        to: new Date().toISOString(),
        branchId: selectedBranchId || undefined,
        groupBy,
      }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-24 w-full" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <Card className="xl:col-span-8">
            <Skeleton className="h-64 w-full" />
          </Card>
          <Card className="xl:col-span-4">
            <Skeleton className="h-64 w-full" />
          </Card>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const revenueTrend = revenueData?.data?.map((d) => d.revenue);

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Range Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
            {greeting()}, {user?.fullName?.split(' ').pop()} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Tổng quan hiệu suất hoạt động & tình hình kinh doanh của chuỗi FitFlow
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm outline-none transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="">Tất cả chi nhánh</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={range.key}
            onChange={(e) => {
              const opt = RANGE_OPTIONS.find((r) => r.key === e.target.value);
              if (opt) setRange(opt);
            }}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm outline-none transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {RANGE_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
          >
            <DownloadSimple size={14} />
            <span>Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Subscription Warnings / Callouts */}
      {data.subscription?.status === 'TRIAL' && data.subscription.daysRemaining !== null && (
        <Callout
          tone={data.subscription.daysRemaining <= 3 ? 'warning' : 'info'}
          action={
            <Button to="/owner/subscription" size="sm" variant="secondary">
              Nâng cấp gói
            </Button>
          }
        >
          Bạn đang dùng thử FitFlow — còn <strong>{data.subscription.daysRemaining} ngày</strong> để trải nghiệm đầy đủ hệ thống.
        </Callout>
      )}

      {/* ROW 1: 4 KPI STAT CARDS */}
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        initial="hidden"
        animate="show"
      >
        <motion.div custom={0} variants={fadeUp}>
          <KpiCard
            icon={CurrencyCircleDollar}
            tone="emerald"
            label="Doanh thu"
            value={formatMoney(data.kpis!.revenue.total)}
            growthPct={data.kpis!.revenue.growthPct}
            trend={revenueTrend}
          />
        </motion.div>
        <motion.div custom={1} variants={fadeUp}>
          <KpiCard
            icon={Users}
            tone="blue"
            label="Tổng Khách hàng & Hội viên"
            value={`${data.kpis!.activeMembers} hội viên`}
            hint="Đang hoạt động"
          />
        </motion.div>
        <motion.div custom={2} variants={fadeUp}>
          {/* BR-STAT-001: số NGƯỜI đã đến (Daily Unique Visitors) là chỉ số chính — khác với
              tổng LƯỢT check-in (Total Check-in Events, hiển thị ở hint) vì một khách có thể
              check-in nhiều lần trong kỳ. Không được gộp 2 chỉ số này làm một. */}
          <KpiCard
            icon={ChartLineUp}
            tone="amber"
            label="Khách đã đến"
            value={`${data.kpis!.checkins.dailyUniqueVisitors} khách`}
            hint={`${data.kpis!.checkins.total} lượt Check-in trong kỳ`}
          />
        </motion.div>
        <motion.div custom={3} variants={fadeUp}>
          <KpiCard
            icon={PersonSimpleRun}
            tone="violet"
            label="Khách đang tập"
            value={`${data.kpis!.currentlyInGym} khách`}
            hint="Thời điểm hiện tại"
          />
        </motion.div>
      </motion.div>

      {/* SECTION: VIỆC CẦN CHÚ Ý (IMPORTANT ALERTS WITH DETAIL MODALS) */}
      {data.alerts && data.alerts.length > 0 && (
        <motion.div initial="hidden" animate="show" custom={3.5} variants={fadeUp}>
          <Card className="border-amber-200/80 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 dark:border-amber-900/40 dark:from-amber-950/20 dark:via-zinc-900 dark:to-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <BellRinging size={18} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                    Việc cần chú ý
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Nhấp vào từng thông báo để xem thông tin chi tiết danh sách hội viên
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {data.alerts.length} việc cần xử lý
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {data.alerts.map((alert) => (
                <div
                  key={alert.id || alert.message}
                  onClick={() => {
                    if (alert.items && alert.items.length > 0) {
                      setSelectedAlert(alert);
                    } else if (alert.targetUrl) {
                      navigate(alert.targetUrl);
                    }
                  }}
                  className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-sm transition-all hover:border-amber-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-amber-600"
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${PRIORITY_DOT[alert.priority] ?? 'bg-amber-500'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-zinc-900 transition-colors group-hover:text-amber-700 dark:text-zinc-100 dark:group-hover:text-amber-400">
                        {alert.message}
                      </span>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        {alert.items?.length ? `${alert.items.length} mục` : ''}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2 dark:text-zinc-400">
                      {alert.message}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Xem chi tiết & xử lý
                      </span>
                      <CaretRight size={12} className="text-amber-500 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ROW 2: REVENUE TREND, PACKAGE BREAKDOWN, RECENT FEED */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* Col 1: Biểu đồ xu hướng Doanh thu (5 cols) */}
        <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp} className="xl:col-span-5">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Doanh thu xu hướng</h2>
                <p className="text-xs text-zinc-400">{RANGE_OPTIONS.find((r) => r.key === range.key)?.label}</p>
              </div>
              <div className="flex rounded-lg bg-stone-100 p-0.5 dark:bg-zinc-800">
                {(['day', 'week', 'month'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGroupBy(mode)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                      groupBy === mode
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50'
                    }`}
                  >
                    {mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              {isRevenueLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <RevenueChart
                  data={(revenueData?.data ?? []).map((d) => ({ date: formatGroupLabel(d.date, groupBy), revenue: d.revenue }))}
                />
              )}
            </div>
          </Card>
        </motion.div>

        {/* Col 2: Phân bổ Doanh thu theo gói tập (4 cols) */}
        <motion.div initial="hidden" animate="show" custom={5} variants={fadeUp} className="xl:col-span-4">
          <Card className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-zinc-800">
                <div>
                  <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Doanh thu theo gói</h2>
                  <p className="text-[11px] text-zinc-400">Tỷ trọng doanh thu từng nhóm gói</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {formatMoney(data.kpis!.revenue.total)}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-4">
                {data.revenueByPackageBreakdown && data.revenueByPackageBreakdown.length > 0 ? (
                  data.revenueByPackageBreakdown.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-zinc-500 dark:text-zinc-400">{formatMoney(item.amount)}</span>
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                            {item.pct}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${Math.max(5, item.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex h-36 flex-col items-center justify-center text-center text-xs text-zinc-400">
                    <Ticket size={24} className="mb-1 text-zinc-300" />
                    <span>Chưa có dữ liệu phân bổ gói tập trong kỳ</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 border-t border-stone-100 pt-3 text-[11px] text-zinc-400 dark:border-zinc-800">
              Tính trên toàn bộ hóa đơn đã thanh toán trong kỳ.
            </div>
          </Card>
        </motion.div>

        {/* Col 3: Hoạt động gần đây (3 cols) */}
        <motion.div initial="hidden" animate="show" custom={6} variants={fadeUp} className="xl:col-span-3">
          <Card>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-zinc-800">
              <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Hoạt động gần đây</h2>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Real-time
              </span>
            </div>

            {data.recentActivities && data.recentActivities.length > 0 ? (
              <div className="mt-3 max-h-[295px] overflow-y-auto pr-1 flex flex-col gap-2.5">
                {data.recentActivities.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedActivity(a)}
                    className="group flex cursor-pointer flex-col gap-1 rounded-xl border border-stone-100 p-2.5 transition-all hover:border-emerald-200 hover:bg-emerald-50/30 dark:border-zinc-800 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-xs text-zinc-800 transition-colors group-hover:text-emerald-700 dark:text-zinc-200 dark:group-hover:text-emerald-400">
                        {a.message}
                      </p>
                      <span className="shrink-0 font-mono text-[10px] text-zinc-400">
                        {formatRelativeTime(a.occurredAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                      <Clock size={12} className="text-zinc-400" />
                      <span>{formatSpecificDateTime(a.occurredAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-zinc-400">Chưa có hoạt động nào.</p>
            )}
          </Card>
        </motion.div>
      </div>

      {/* SECTION: 3 BIỂU ĐỒ PHÂN TÍCH CHUYÊN SÂU (3 NEW ANALYTICS CHARTS) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* CHART 1: BIỂU ĐỒ PHÁT TRIỂN ĐĂNG KÝ GÓI TẬP (6 cols) */}
        <motion.div initial="hidden" animate="show" custom={6.5} variants={fadeUp} className="xl:col-span-6">
          <Card>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-zinc-800">
              <div>
                <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Phát triển đăng ký gói tập
                </h2>
                <p className="text-xs text-zinc-400">Xu hướng hội viên đăng ký gói theo thời gian</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                <Ticket size={18} />
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              {data.membershipGrowthChart && data.membershipGrowthChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.membershipGrowthChart}>
                    <defs>
                      <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return isNaN(d.getTime()) ? val : `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      formatter={(val: number) => [`${val} lượt đăng ký`, 'Số lượng']}
                      labelFormatter={(label) => `Ngày ${label}`}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#growthGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                  Chưa có dữ liệu đăng ký gói trong kỳ
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* CHART 2: BIỂU ĐỒ KHUNG GIỜ CHECK-IN CAO ĐIỂM (6 cols) */}
        <motion.div initial="hidden" animate="show" custom={6.8} variants={fadeUp} className="xl:col-span-6">
          <Card>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-zinc-800">
              <div>
                <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Khung giờ Check-in cao điểm
                </h2>
                <p className="text-xs text-zinc-400">Phân bố lượt tập theo khung giờ trong ngày (06:00 - 21:00)</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <Lightning size={18} />
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              {data.peakCheckinHours && data.peakCheckinHours.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.peakCheckinHours}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      formatter={(val: number) => [`${val} lượt check-in`, 'Số lượng']}
                      labelFormatter={(label) => `Khung giờ ${label}`}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                  Chưa có dữ liệu lượt check-in theo giờ
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* CHART 3: BIỂU ĐỒ NGÀY TRONG TUẦN ĐI TẬP NHIỀU NHẤT & BẢNG VẬN HÀNH */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 items-start">
        {/* CHART 3: NGÀY TRONG TUẦN ĐI TẬP NHIỀU NHẤT (6 cols) */}
        <motion.div initial="hidden" animate="show" custom={7} variants={fadeUp} className="xl:col-span-6">
          <Card>
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 dark:border-zinc-800">
              <div>
                <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                  Ngày đi tập nhiều nhất trong tuần
                </h2>
                <p className="text-xs text-zinc-400">Thống kê lưu lượng hội viên các ngày Thứ 2 — Chủ Nhật</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                <CalendarCheck size={18} />
              </div>
            </div>

            <div className="mt-4 h-64 w-full">
              {data.peakCheckinDaysOfWeek && data.peakCheckinDaysOfWeek.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.peakCheckinDaysOfWeek}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      formatter={(val: number) => [`${val} lượt check-in`, 'Lượt tập']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                  Chưa có dữ liệu lượt check-in theo ngày trong tuần
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* TÌNH TRẠNG ĐĂNG KÝ & TÀI NGUYÊN (6 cols) */}
        <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Tình trạng Đăng ký Membership */}
          <motion.div initial="hidden" animate="show" custom={8} variants={fadeUp}>
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Tình trạng Đăng ký</h2>
                <Button to="/owner/memberships" variant="ghost" size="sm" className="px-2! py-1! text-xs">
                  Chi tiết <ArrowRight size={12} />
                </Button>
              </div>
              <div className="mt-4 flex flex-col gap-4">
                {data.membershipStatusBreakdown ? (
                  data.membershipStatusBreakdown.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{item.count} hội viên</strong>
                          <span className="font-bold text-zinc-400">{item.pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
                        <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(4, item.pct)}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400">Chưa có dữ liệu tình trạng gói.</p>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Sử dụng Tài nguyên / Quota SaaS */}
          <motion.div initial="hidden" animate="show" custom={9} variants={fadeUp}>
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Sử dụng tài nguyên</h2>
                <Button to="/owner/subscription" variant="ghost" size="sm" className="px-2! py-1! text-xs">
                  Quản lý <ArrowRight size={12} />
                </Button>
              </div>
              {data.subscription ? (
                <div className="mt-4 flex flex-col gap-3.5 text-xs">
                  {data.subscription.usage.map((u) => {
                    const pct = u.limit ? Math.min(100, Math.round((u.used / u.limit) * 100)) : 0;
                    return (
                      <div key={u.code}>
                        <div className="flex justify-between font-medium text-zinc-600 dark:text-zinc-400">
                          <span>{QUOTA_LABELS[u.code] || u.code}</span>
                          <strong className="text-zinc-900 dark:text-zinc-100">
                            {u.used} / {u.limit ?? '∞'}
                          </strong>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-zinc-800">
                          <div
                            className={`h-full rounded-full ${pct >= 90 ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-400'}`}
                            style={{ width: u.limit ? `${pct}%` : '100%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-xs text-zinc-400">Chưa có thông tin hạn mức.</p>
              )}
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ALERT DETAIL MODAL (MODAL XEM CHI TIẾT VIỆC CẦN CHÚ Ý) */}
      {selectedAlert && (
        <Modal
          open={!!selectedAlert}
          title="Chi tiết việc cần chú ý"
          onClose={() => setSelectedAlert(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                  {PRIORITY_LABELS[selectedAlert.priority] || selectedAlert.priority}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {selectedAlert.items?.length ?? 0} hội viên cần chú ý
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                {selectedAlert.message}
              </p>
            </div>

            {/* Expiring Members List Table */}
            {selectedAlert.items && selectedAlert.items.length > 0 && (
              <div className="max-h-80 overflow-y-auto rounded-xl border border-stone-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50 font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                      <th className="px-3 py-2">Hội viên</th>
                      <th className="px-3 py-2">Số điện thoại</th>
                      <th className="px-3 py-2">Gói tập</th>
                      <th className="px-3 py-2 text-right">Ngày hết hạn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60">
                    {selectedAlert.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-stone-50 dark:hover:bg-zinc-850">
                        <td className="px-3 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">
                          {item.customerName}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-zinc-600 dark:text-zinc-300">
                          {item.customerPhone || '—'}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-emerald-700 dark:text-emerald-400">
                          {item.packageName || 'Gói tập'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold text-amber-600 dark:text-amber-400">
                          {item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-2 flex justify-end gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(null)}>
                Đóng
              </Button>
              {selectedAlert.targetUrl && (
                <Button
                  size="sm"
                  onClick={() => {
                    const url = selectedAlert.targetUrl!;
                    setSelectedAlert(null);
                    navigate(url);
                  }}
                >
                  Tới trang quản lý gia hạn <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ACTIVITY DETAIL MODAL (MODAL CHI TIẾT HOẠT ĐỘNG Real-time) */}
      {selectedActivity && (
        <Modal
          open={!!selectedActivity}
          title="Chi tiết hoạt động"
          onClose={() => setSelectedActivity(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {selectedActivity.type || 'Hoạt động hệ thống'}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {formatSpecificDateTime(selectedActivity.occurredAt)}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {selectedActivity.message}
              </p>
            </div>

            {/* Details Payload if present */}
            {selectedActivity.details && (
              <div className="flex flex-col gap-2 rounded-xl border border-stone-100 p-3 text-xs dark:border-zinc-800">
                {selectedActivity.details.amount && (
                  <div className="flex justify-between py-1 border-b border-stone-50 dark:border-zinc-800">
                    <span className="text-zinc-400">Số tiền thanh toán</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatMoney(selectedActivity.details.amount)}</strong>
                  </div>
                )}
                {selectedActivity.details.customerName && (
                  <div className="flex justify-between py-1 border-b border-stone-50 dark:border-zinc-800">
                    <span className="text-zinc-400">Hội viên thực hiện</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">{selectedActivity.details.customerName} ({selectedActivity.details.customerPhone || ''})</strong>
                  </div>
                )}
                {selectedActivity.details.packageName && (
                  <div className="flex justify-between py-1 border-b border-stone-50 dark:border-zinc-800">
                    <span className="text-zinc-400">Gói tập liên quan</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">{selectedActivity.details.packageName}</strong>
                  </div>
                )}
                {selectedActivity.details.branchName && (
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-400">Chi nhánh</span>
                    <strong className="text-zinc-800 dark:text-zinc-200">{selectedActivity.details.branchName}</strong>
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 flex justify-end gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedActivity(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* CHECK-IN DETAIL MODAL (MODAL CHI TIẾT LƯỢT CHECK-IN) */}
      {selectedCheckin && (
        <Modal
          open={!!selectedCheckin}
          title="Chi tiết lượt Check-in"
          onClose={() => setSelectedCheckin(null)}
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {selectedCheckin.status === 'CHECKED_IN' ? '● Đang trong phòng tập' : 'Đã check-in'}
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {formatSpecificDateTime(selectedCheckin.occurredAt)}
                </span>
              </div>
              <h3 className="mt-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {selectedCheckin.customerName}
              </h3>
            </div>

            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Số điện thoại / Mã</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">{selectedCheckin.customerPhone || selectedCheckin.customerCode || '—'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Chi nhánh</span>
                <strong className="text-zinc-800 dark:text-zinc-200">{selectedCheckin.branchName}</strong>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-stone-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400">Hình thức check-in</span>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {METHOD_LABELS[selectedCheckin.method] || selectedCheckin.method}
                </span>
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedCheckin(null)}>
                Đóng
              </Button>
              {selectedCheckin.customerId && (
                <Button
                  size="sm"
                  onClick={() => {
                    const custId = selectedCheckin.customerId!;
                    setSelectedCheckin(null);
                    navigate(`/owner/customers/${custId}`);
                  }}
                >
                  Hồ sơ hội viên <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
