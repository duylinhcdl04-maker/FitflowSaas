import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowClockwise,
  ArrowRight,
  Barbell,
  CheckCircle,
  ChartBar,
  Hourglass,
  PersonSimpleRun,
} from '@phosphor-icons/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getManagerDashboardOverview,
  getManagerDashboardPerformance,
  formatOperatingTime,
  type ManagerDashboardOverview,
  type ManagerContext,
} from '../api/manager';
import { useRealtimeInvalidate } from '../../lib/useRealtimeInvalidate';
import Card from '../../owner/components/Card';
import KpiCard from '../../owner/components/KpiCard';
import RevenueChart from '../../owner/components/RevenueChart';
import { Skeleton } from '../../owner/components/Skeleton';
import Modal from '../../owner/components/Modal';
import Button from '../../owner/components/Button';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  VIETQR: 'Chuyển khoản (VietQR)',
  CREDIT_CARD: 'Thẻ',
  MIXED: 'Kết hợp',
  OTHER: 'Khác',
};

const QUEUE_TARGET_URL: Record<ManagerDashboardOverview['actionCenter'][number]['id'], string> = {
  'pending-payments': '/manager/memberships',
  'pending-pt-plans': '/manager/memberships',
  'expiring-memberships': '/manager/customers',
  'at-risk-members': '/manager/customers',
};

const RANGE_OPTIONS = [
  { key: 'today', label: 'Hôm nay', days: 0 },
  { key: '7d', label: '7 ngày qua', days: 6 },
  { key: 'month', label: 'Tháng này', days: 29 },
] as const;

const PRIORITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  WARNING: 'bg-amber-500',
  INFORMATION: 'bg-blue-500',
};

function formatMoney(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
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
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatGroupLabel(dateStr: string, groupBy: 'day' | 'week' | 'month') {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  if (groupBy === 'day') return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  if (groupBy === 'week') return 'T.' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return date.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' });
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const } }),
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<{ context?: ManagerContext }>();
  const branch = outletCtx?.context?.branch;

  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]>(RANGE_OPTIONS[1]);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [activeTab, setActiveTab] = useState<'revenue' | 'members' | 'pt'>('revenue');
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState('vừa xong');
  const [selectedQueueItem, setSelectedQueueItem] = useState<ManagerDashboardOverview['actionCenter'][number] | null>(null);

  const from = new Date();
  from.setDate(from.getDate() - range.days);
  from.setHours(0, 0, 0, 0);

  // TẦNG 1 — real-time, KHÔNG chịu ảnh hưởng của bộ lọc ngày (đúng như nhãn hiển thị).
  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['manager-dashboard-overview', branch?.id],
    queryFn: () => getManagerDashboardOverview(branch?.id),
    refetchInterval: 30000,
  });

  // TẦNG 2 — dữ liệu thật theo khoảng ngày đã chọn (trước đây là số liệu cứng, không đổi theo bộ lọc).
  const { data: performance, isLoading: isPerformanceLoading } = useQuery({
    queryKey: ['manager-dashboard-performance', branch?.id, range.key, groupBy],
    queryFn: () =>
      getManagerDashboardPerformance({
        from: from.toISOString(),
        to: new Date().toISOString(),
        groupBy,
      }),
  });

  useEffect(() => {
    const timer = setInterval(() => setLastUpdatedLabel('vừa xong'), 10000);
    return () => clearInterval(timer);
  }, []);

  // Realtime push is the primary update path — the 30s refetchInterval above is just a
  // safety net if the socket connection drops.
  useRealtimeInvalidate('dashboard:refresh', [['manager-dashboard-overview']]);
  useRealtimeInvalidate('attendance:updated', [['manager-dashboard-overview']]);
  useRealtimeInvalidate('guestvisit:updated', [['manager-dashboard-overview']]);
  useRealtimeInvalidate('payment:confirmed', [['manager-dashboard-overview'], ['manager-dashboard-performance']]);

  const kpis = overview?.kpis;
  const actionCenter = overview?.actionCenter ?? [];
  const activeQueueItems = actionCenter.filter((item) => item.count > 0);
  const criticalCount = activeQueueItems
    .filter((item) => item.priority === 'CRITICAL' || item.priority === 'WARNING')
    .reduce((acc, item) => acc + item.count, 0);

  const hourlyCheckins = overview?.hourlyCheckins ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
              Tổng quan chi nhánh: <span className="text-emerald-600 dark:text-emerald-400 font-black">{branch?.name || 'Chi nhánh'}</span>
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap items-center gap-2">
            <span>Vận hành thời gian thực & hiệu suất cơ sở</span>
            {branch?.address && (
              <>
                <span>·</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">📍 {branch.address}</span>
              </>
            )}
            {branch?.phone && (
              <>
                <span>·</span>
                <span>📞 Hotline: <strong className="text-zinc-700 dark:text-zinc-300">{branch.phone}</strong></span>
              </>
            )}
            {formatOperatingTime(branch?.openingTime, branch?.closingTime) && (
              <>
                <span>·</span>
                <span>⏰ {formatOperatingTime(branch?.openingTime, branch?.closingTime)}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Cập nhật {lastUpdatedLabel}</span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-stone-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Làm mới dữ liệu"
          >
            <ArrowClockwise size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* TẦNG 1 — VẬN HÀNH THỜI GIAN THỰC */}
      <motion.div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" initial="hidden" animate="show">
        <motion.div custom={0} variants={fadeUp}>
          <KpiCard
            icon={PersonSimpleRun}
            tone="violet"
            label="Đang trong phòng tập"
            value={`${kpis?.currentlyInGym ?? 0}`}
            hint={`Member ${kpis?.currentlyInGymMembers ?? 0} · Guest ${kpis?.currentlyInGymGuests ?? 0}`}
          />
        </motion.div>
        <motion.div custom={1} variants={fadeUp}>
          {/* BR-STAT-001: "Khách đã đến" (Daily Unique Visitors) — một khách chỉ tính một lần
              dù check-in nhiều lượt trong ngày. Số LƯỢT check-in (todayCheckins) hiển thị ở
              hint, không được gộp chung làm một chỉ số. */}
          <KpiCard
            icon={CheckCircle}
            tone="blue"
            label="Khách đã đến hôm nay"
            value={`${kpis?.dailyUniqueVisitors ?? 0}`}
            hint={`${kpis?.todayCheckins ?? 0} lượt Check-in · Undo ${kpis?.undoCheckins ?? 0}`}
          />
        </motion.div>
        <motion.div custom={2} variants={fadeUp}>
          <KpiCard
            icon={Hourglass}
            tone="amber"
            label="Chờ thanh toán"
            value={`${actionCenter.find((a) => a.id === 'pending-payments')?.count ?? 0}`}
            hint={(actionCenter.find((a) => a.id === 'pending-payments')?.count ?? 0) > 0 ? 'Cần xác nhận thủ công' : 'Không có giao dịch chờ'}
          />
        </motion.div>
        <motion.div custom={3} variants={fadeUp}>
          <KpiCard
            icon={Barbell}
            tone="emerald"
            label="PT hôm nay"
            value={`${kpis?.todayPtSessions.total ?? 0}`}
            hint={`Xong ${kpis?.todayPtSessions.completed ?? 0} · Sắp tới ${kpis?.todayPtSessions.upcoming ?? 0} · Huỷ ${kpis?.todayPtSessions.cancelled ?? 0}`}
          />
        </motion.div>
      </motion.div>

      {/* Lưu lượng theo giờ */}
      <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp}>
        <Card>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <ChartBar size={16} />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Lưu lượng theo giờ</h2>
              <p className="text-xs text-zinc-400">Số lượt check-in trong ngày, theo từng khung giờ mở cửa</p>
            </div>
          </div>
          <div className="mt-4 h-48">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyCheckins} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                  <CartesianGrid vertical={false} stroke="#e1e0d9" className="dark:stroke-zinc-800" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#898781', fontSize: 11 }} dy={6} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#898781', fontSize: 11 }} width={32} allowDecimals={false} />
                  <RechartsTooltip
                    cursor={{ fill: '#05966912' }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <div className="rounded-xl border border-stone-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
                          <p className="text-[11px] font-medium text-zinc-400">{label}</p>
                          <p className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">{payload[0].value} lượt</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Hàng đợi xử lý */}
      <motion.div initial="hidden" animate="show" custom={5} variants={fadeUp}>
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-stone-200/80 px-6 py-4 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Hàng đợi xử lý</h2>
              {criticalCount > 0 && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  {criticalCount} việc cần gấp
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-zinc-400">Sắp giảm dần theo mức độ</span>
          </div>

          {activeQueueItems.length === 0 ? (
            <div className="flex h-36 flex-col items-center justify-center gap-1.5 text-center">
              <CheckCircle size={28} weight="bold" className="text-emerald-500" />
              <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">Không có việc cần xử lý</p>
              <p className="text-xs text-zinc-400">Mọi cảnh báo trong chi nhánh đã được giải quyết.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-zinc-800">
              {activeQueueItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSelectedQueueItem(item)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-3 text-left transition-colors hover:bg-stone-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[item.priority] ?? 'bg-blue-500'}`} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.title}</p>
                      <p className="truncate text-xs text-zinc-400">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                    Xem chi tiết
                    <ArrowRight size={12} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </motion.div>

      {/* TẦNG 2 — HIỆU SUẤT THEO KỲ */}
      <motion.div initial="hidden" animate="show" custom={6} variants={fadeUp}>
        <Card padded={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 bg-stone-50/60 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Tầng 2 · Hiệu suất theo kỳ</span>
            <select
              value={range.key}
              onChange={(e) => {
                const opt = RANGE_OPTIONS.find((r) => r.key === e.target.value);
                if (opt) setRange(opt);
              }}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs font-bold text-zinc-700 shadow-xs outline-none transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {RANGE_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto border-b border-stone-200/80 px-6 dark:border-zinc-800">
            {[
              { id: 'revenue', label: 'Doanh thu' },
              { id: 'members', label: 'Hội viên' },
              { id: 'pt', label: 'Huấn luyện viên (PT)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`whitespace-nowrap border-b-2 py-3 text-sm font-bold transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isPerformanceLoading || !performance ? (
            <div className="p-6">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12"
              >
                {activeTab === 'revenue' && (
                  <>
                    <div className="flex flex-col justify-between lg:col-span-7">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-3">
                          <span className="font-display text-2xl font-bold text-zinc-900 lg:text-3xl dark:text-zinc-50">
                            {formatMoney(performance.revenue.total)}
                          </span>
                          {performance.revenue.growthPct !== null && (
                            <span className={`text-xs font-bold ${performance.revenue.growthPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {performance.revenue.growthPct >= 0 ? '▲' : '▼'} {Math.abs(performance.revenue.growthPct)}% so với kỳ trước
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">Tổng doanh thu đã thu — {RANGE_OPTIONS.find((r) => r.key === range.key)?.label}</p>
                      </div>
                      <div className="mt-4 flex justify-end">
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
                      <div className="mt-3">
                        <RevenueChart data={performance.revenue.trend.map((d) => ({ date: formatGroupLabel(d.date, groupBy), revenue: d.revenue }))} />
                      </div>
                    </div>
                    <div className="flex flex-col border-t border-stone-200/80 pt-4 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-zinc-800">
                      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-400">Phân tích cấu trúc nguồn</span>
                      <div className="flex flex-col gap-3 text-xs">
                        <div className="flex items-center justify-between border-b border-stone-100 py-1.5 dark:border-zinc-800">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400">Gói tập (Membership)</span>
                          <span className="font-display font-bold text-zinc-900 dark:text-zinc-100">{formatMoney(performance.revenue.bySource.membership)}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-stone-100 py-1.5 dark:border-zinc-800">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400">Gói PT (PT Package)</span>
                          <span className="font-display font-bold text-zinc-900 dark:text-zinc-100">{formatMoney(performance.revenue.bySource.pt)}</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-stone-100 py-1.5 dark:border-zinc-800">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400">Khách lẻ (Guest)</span>
                          <span className="font-display font-bold text-zinc-900 dark:text-zinc-100">{formatMoney(performance.revenue.bySource.guest)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 font-bold text-zinc-900 dark:text-zinc-50">
                          <span>Tổng doanh thu</span>
                          <span className="font-display text-sm">{formatMoney(performance.revenue.total)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'members' && (
                  <>
                    <div className="flex flex-col justify-between lg:col-span-7">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-3">
                          <span className="font-display text-2xl font-bold text-zinc-900 lg:text-3xl dark:text-zinc-50">
                            {performance.members.newCount} hội viên mới
                          </span>
                          {performance.members.growthPct !== null && (
                            <span className={`text-xs font-bold ${performance.members.growthPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {performance.members.growthPct >= 0 ? '▲' : '▼'} {Math.abs(performance.members.growthPct)}% so với kỳ trước
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">Đăng ký mới trong kỳ — {RANGE_OPTIONS.find((r) => r.key === range.key)?.label}</p>
                      </div>
                      <div className="mt-6 h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { label: 'Mới', value: performance.members.newCount },
                              { label: 'Gia hạn', value: performance.members.renewedCount },
                              { label: 'Hết hạn', value: performance.members.expiredCount },
                            ]}
                            margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
                          >
                            <CartesianGrid vertical={false} stroke="#e1e0d9" className="dark:stroke-zinc-800" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#898781', fontSize: 12 }} dy={6} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#898781', fontSize: 11 }} width={32} allowDecimals={false} />
                            <RechartsTooltip
                              cursor={{ fill: '#2a78d612' }}
                              content={({ active, payload, label }) =>
                                active && payload?.length ? (
                                  <div className="rounded-xl border border-stone-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
                                    <p className="text-[11px] font-medium text-zinc-400">{label}</p>
                                    <p className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">{payload[0].value} hội viên</p>
                                  </div>
                                ) : null
                              }
                            />
                            <Bar dataKey="value" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="flex flex-col border-t border-stone-200/80 pt-4 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-zinc-800">
                      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-400">Chi tiết hội viên</span>
                      <div className="flex flex-col gap-3 text-xs">
                        <div className="flex items-center justify-between border-b border-stone-100 py-1.5 dark:border-zinc-800">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400">Hội viên mới trong kỳ</span>
                          <span className="font-display font-bold text-zinc-900 dark:text-zinc-100">{performance.members.newCount} người</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-stone-100 py-1.5 dark:border-zinc-800">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400">Gia hạn gói tập</span>
                          <span className="font-display font-bold text-zinc-900 dark:text-zinc-100">{performance.members.renewedCount} gói</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-stone-100 py-1.5 text-red-600 dark:border-zinc-800 dark:text-red-400">
                          <span className="font-semibold">Gói đã hết hạn trong kỳ</span>
                          <span className="font-display font-bold">{performance.members.expiredCount} gói</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 text-amber-600 dark:text-amber-400">
                          <span className="font-semibold">Nguy cơ rời bỏ (hiện tại, &gt;14 ngày chưa tập)</span>
                          <span className="font-display font-bold">{performance.members.atRiskCount} người</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'pt' && (
                  <>
                    <div className="flex flex-col justify-between lg:col-span-7">
                      <div>
                        <div className="flex flex-wrap items-baseline gap-3">
                          <span className="font-display text-2xl font-bold text-zinc-900 lg:text-3xl dark:text-zinc-50">
                            {performance.pt.totalSessions} buổi tập
                          </span>
                          {performance.pt.growthPct !== null && (
                            <span className={`text-xs font-bold ${performance.pt.growthPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                              {performance.pt.growthPct >= 0 ? '▲' : '▼'} {Math.abs(performance.pt.growthPct)}% so với kỳ trước
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-zinc-400">Lịch tập PT trong kỳ — {RANGE_OPTIONS.find((r) => r.key === range.key)?.label}</p>
                      </div>
                      <div className="mt-6 h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { label: 'Hoàn thành', value: performance.pt.completedSessions },
                              { label: 'Đã huỷ', value: performance.pt.cancelledSessions },
                            ]}
                            margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
                          >
                            <CartesianGrid vertical={false} stroke="#e1e0d9" className="dark:stroke-zinc-800" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#898781', fontSize: 12 }} dy={6} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#898781', fontSize: 11 }} width={32} allowDecimals={false} />
                            <RechartsTooltip
                              cursor={{ fill: '#7c6ce812' }}
                              content={({ active, payload, label }) =>
                                active && payload?.length ? (
                                  <div className="rounded-xl border border-stone-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
                                    <p className="text-[11px] font-medium text-zinc-400">{label}</p>
                                    <p className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">{payload[0].value} buổi</p>
                                  </div>
                                ) : null
                              }
                            />
                            <Bar dataKey="value" fill="#7c6ce8" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="flex flex-col border-t border-stone-200/80 pt-4 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 dark:border-zinc-800">
                      <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-zinc-400">Chi tiết huấn luyện viên</span>
                      <div className="flex flex-col gap-3 text-xs">
                        <div className="flex items-center justify-between border-b border-stone-100 py-1.5 dark:border-zinc-800">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400">PT có lịch trong kỳ</span>
                          <span className="font-display font-bold text-zinc-900 dark:text-zinc-100">{performance.pt.activeTrainersCount} HLV</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-stone-100 py-1.5 dark:border-zinc-800">
                          <span className="font-semibold text-zinc-500 dark:text-zinc-400">Tổng số buổi hoàn thành</span>
                          <span className="font-display font-bold text-zinc-900 dark:text-zinc-100">{performance.pt.completedSessions} buổi</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 text-red-600 dark:text-red-400">
                          <span className="font-semibold">Tỷ lệ huỷ lịch</span>
                          <span className="font-display font-bold">{performance.pt.cancelRate}%</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </Card>
      </motion.div>

      {/* QUEUE ITEM DETAIL MODAL — SaaS Rich Modal Design */}
      {selectedQueueItem && (
        <Modal open={!!selectedQueueItem} size="lg" title="Chi tiết danh sách cần xử lý" onClose={() => setSelectedQueueItem(null)}>
          <div className="flex flex-col gap-4">
            {/* Header Banner */}
            <div
              className={`rounded-2xl border p-4 shadow-sm ${
                selectedQueueItem.priority === 'CRITICAL'
                  ? 'border-rose-200 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/40'
                  : selectedQueueItem.priority === 'WARNING'
                  ? 'border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/40'
                  : 'border-blue-200 bg-blue-50/80 dark:border-blue-900/60 dark:bg-blue-950/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    selectedQueueItem.priority === 'CRITICAL'
                      ? 'bg-rose-600 text-white'
                      : selectedQueueItem.priority === 'WARNING'
                      ? 'bg-amber-600 text-white'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  {selectedQueueItem.priority === 'CRITICAL'
                    ? 'Cần xử lý ngay'
                    : selectedQueueItem.priority === 'WARNING'
                    ? 'Cảnh báo'
                    : 'Thông báo'}
                </span>
                <span className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-300">
                  {selectedQueueItem.items.length} hội viên
                </span>
              </div>
              <h3 className="mt-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
                {selectedQueueItem.title}
              </h3>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">{selectedQueueItem.description}</p>
            </div>

            {/* Rich Data Table */}
            {selectedQueueItem.items.length > 0 && (
              <div className="max-h-88 overflow-y-auto rounded-2xl border border-stone-200 shadow-sm dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50/90 font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-400">
                      <th className="px-4 py-3">{selectedQueueItem.id === 'pending-pt-plans' ? 'HLV đề xuất' : 'Hội viên'}</th>
                      <th className="px-4 py-3">Số điện thoại</th>
                      {selectedQueueItem.id === 'pending-payments' && (
                        <>
                          <th className="px-4 py-3">Phương thức</th>
                          <th className="px-4 py-3 text-right">Số tiền</th>
                        </>
                      )}
                      {selectedQueueItem.id === 'pending-pt-plans' && (
                        <>
                          <th className="px-4 py-3">Gói PT đề xuất</th>
                          <th className="px-4 py-3 text-center">Số buổi</th>
                          <th className="px-4 py-3 text-right">Giá đề xuất</th>
                        </>
                      )}
                      {selectedQueueItem.id === 'expiring-memberships' && (
                        <>
                          <th className="px-4 py-3">Gói tập</th>
                          <th className="px-4 py-3 text-right">Ngày hết hạn</th>
                        </>
                      )}
                      {selectedQueueItem.id === 'at-risk-members' && (
                        <>
                          <th className="px-4 py-3">Gói tập</th>
                          <th className="px-4 py-3 text-center">Mốc tính hoạt động</th>
                          <th className="px-4 py-3 text-right">Số ngày vắng mặt</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-zinc-800/60">
                    {selectedQueueItem.items.map((item) => {
                      const displayName = item.customerName || item.ptName || '—';
                      const displayPhone = item.customerPhone || item.ptPhone || '—';
                      const avatarGradient = getAvatarGradient(displayName);
                      return (
                        <tr key={item.id} className="group hover:bg-stone-50/80 dark:hover:bg-zinc-900/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-display text-xs font-bold shadow-xs ${avatarGradient}`}
                              >
                                {getInitials(displayName)}
                              </div>
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                {displayName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                              {displayPhone}
                            </span>
                          </td>
                          {selectedQueueItem.id === 'pending-payments' && (
                            <>
                              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                                <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium dark:bg-zinc-800">
                                  {PAYMENT_METHOD_LABELS[item.method ?? ''] ?? item.method ?? '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                                {item.amount != null ? formatMoney(item.amount) : '—'}
                              </td>
                            </>
                          )}
                          {selectedQueueItem.id === 'pending-pt-plans' && (
                            <>
                              <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                                {item.name || '—'}
                              </td>
                              <td className="px-4 py-3 text-center font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                {item.sessionCount ?? '—'} buổi
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {item.price != null ? formatMoney(item.price) : '—'}
                              </td>
                            </>
                          )}
                          {selectedQueueItem.id === 'expiring-memberships' && (
                            <>
                              <td className="px-4 py-3 font-medium text-emerald-700 dark:text-emerald-400">
                                {item.packageName || 'Gói tập'}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                {item.endDate ? new Date(item.endDate).toLocaleDateString('vi-VN') : '—'}
                              </td>
                            </>
                          )}
                          {selectedQueueItem.id === 'at-risk-members' && (
                            <>
                              <td className="px-4 py-3 font-medium text-emerald-700 dark:text-emerald-400">
                                {item.packageName || 'Gói tập'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.isNeverAttended ? (
                                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                                    Chưa từng tập (tính từ ngày thẻ: {item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '—'})
                                  </span>
                                ) : item.lastVisitAt ? (
                                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-zinc-300">
                                    Lần tập gần nhất: {new Date(item.lastVisitAt).toLocaleDateString('vi-VN')}
                                  </span>
                                ) : (
                                  <span className="font-mono text-xs text-slate-500">
                                    {item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '—'}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono">
                                {(item.inactiveDays ?? 0) >= 30 ? (
                                  <span className="inline-flex rounded-lg bg-rose-100 px-2.5 py-1 text-xs font-extrabold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                    🔴 {item.inactiveDays} ngày (Nguy cơ cao)
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                    🟠 {item.inactiveDays} ngày
                                  </span>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="mt-2 flex justify-end gap-2 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <Button variant="ghost" size="sm" onClick={() => setSelectedQueueItem(null)}>
                Đóng
              </Button>
              <Button
                size="sm"
                className="font-bold shadow-sm"
                onClick={() => {
                  const url = QUEUE_TARGET_URL[selectedQueueItem.id];
                  setSelectedQueueItem(null);
                  navigate(url);
                }}
              >
                Tới trang xử lý <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
}
