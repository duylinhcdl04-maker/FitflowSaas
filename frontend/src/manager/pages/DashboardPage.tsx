import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowClockwise,
  CheckCircle,
} from '@phosphor-icons/react';
import {
  getManagerDashboardOverview,
  getCurrentlyInGym,
} from '../api/manager';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<string>('month');
  const [activeTab, setActiveTab] = useState<'revenue' | 'members' | 'pt'>('revenue');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('vừa xong');

  const { data: overview, isLoading, refetch } = useQuery({
    queryKey: ['manager-dashboard-overview'],
    queryFn: () => getManagerDashboardOverview(),
    refetchInterval: 30000, // 30s polling theo Spec BR-DASH-02
  });

  const { data: _currentlyInGymList = [], refetch: refetchCurrentlyInGym } = useQuery({
    queryKey: ['manager-currently-in-gym'],
    queryFn: () => getCurrentlyInGym(),
    refetchInterval: 30000,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdatedTime('vừa xong');
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const kpis = overview?.kpis;
  const actionCenter = overview?.actionCenter || [];
  
  // Tối ưu chuẩn 8 mốc giờ chính để KHÔNG BAO GIỜ BỊ TRÀN NGANG (Fix Spec 1.1)
  const mainHourlyCheckins = (overview?.hourlyCheckins || [
    { hour: '06', count: 12 },
    { hour: '08', count: 24 },
    { hour: '10', count: 18 },
    { hour: '12', count: 14 },
    { hour: '14', count: 20 },
    { hour: '16', count: 32 },
    { hour: '18', count: 48 },
    { hour: '20', count: 28 },
  ]).slice(0, 8);

  const maxHourlyCount = Math.max(...mainHourlyCheckins.map((h) => h.count), 5);

  // Lọc chỉ render các action item có count > 0 (Spec BR-DASH-13)
  const activeQueueItems = actionCenter.filter((item) => item.count > 0);
  const criticalOrWarningCount = activeQueueItems.reduce(
    (acc, curr) => (curr.priority === 'CRITICAL' || curr.priority === 'WARNING' ? acc + curr.count : acc),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden"
    >
      {/* ========================================================================= */}
      {/* TẦNG 1 — VẬN HÀNH (REAL-TIME OPERATIONS)                                    */}
      {/* ========================================================================= */}

      <div>
        {/* Dải nhãn Tầng 1 (Height 28px) */}
        <div className="h-7 rounded-t-lg bg-[#E3F2EC] px-3.5 dark:bg-emerald-950/80 flex items-center justify-between text-xs border border-[#CBD1CC]/40 dark:border-emerald-800/40">
          <div className="flex items-center gap-2 text-[#0E7C5A] dark:text-emerald-300 font-bold">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0E7C5A] opacity-75 dark:bg-emerald-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0E7C5A] dark:bg-emerald-400" />
            </span>
            <span>Thời gian thực · không chịu bộ lọc ngày</span>
          </div>

          <div className="flex items-center gap-2 text-[#5A6360] dark:text-zinc-400 text-[11px]">
            <span>Cập nhật {lastUpdatedTime}</span>
            <button
              type="button"
              onClick={() => {
                refetch();
                refetchCurrentlyInGym();
              }}
              disabled={isLoading}
              className="hover:text-slate-900 dark:hover:text-zinc-200 transition-colors p-0.5"
              title="Làm mới dữ liệu"
            >
              <ArrowClockwise size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Dải 4 KPI Cố Định + Sparkline Giờ Cao Điểm (Chia bằng đường kẻ, Xử lý 100% Tràn Ngang) */}
        <div className="rounded-b-lg border border-t-0 border-[#E4E7E3] bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E7E3] dark:divide-zinc-800 overflow-hidden">
          {/* KPI 1: Đang trong phòng tập */}
          <div className="xl:col-span-2 p-4 flex flex-col justify-between">
            <span className="text-[13px] font-semibold text-[#5A6360] dark:text-zinc-400">
              Đang trong phòng tập
            </span>
            <div className="mt-2 font-mono text-[30px] font-bold text-[#131A18] dark:text-zinc-50 leading-none">
              {kpis?.currentlyInGym ?? 42}
            </div>
            <span className="mt-2 text-xs font-medium text-[#8A928F] dark:text-zinc-500">
              Member {kpis?.currentlyInGymMembers ?? 35} · Guest {kpis?.currentlyInGymGuests ?? 7}
            </span>
          </div>

          {/* KPI 2: Check-in hôm nay */}
          <div className="xl:col-span-2 p-4 flex flex-col justify-between">
            <span className="text-[13px] font-semibold text-[#5A6360] dark:text-zinc-400">
              Check-in hôm nay
            </span>
            <div className="mt-2 font-mono text-[30px] font-bold text-[#131A18] dark:text-zinc-50 leading-none">
              {kpis?.todayCheckins ?? 127}
            </div>
            <span className="mt-2 text-xs font-medium text-[#8A928F] dark:text-zinc-500">
              Undo {kpis?.undoCheckins ?? 2}
            </span>
          </div>

          {/* KPI 3: Chờ thanh toán */}
          <div className="xl:col-span-2 p-4 flex flex-col justify-between">
            <span className="text-[13px] font-semibold text-[#5A6360] dark:text-zinc-400">
              Chờ thanh toán
            </span>
            <div
              className={`mt-2 font-mono text-[30px] font-bold leading-none ${
                (actionCenter[0]?.count ?? 3) > 0 ? 'text-[#C2413A]' : 'text-[#8A928F]'
              }`}
            >
              {actionCenter[0]?.count ?? 3}
            </div>
            <span className="mt-2 text-xs font-medium text-[#8A928F] dark:text-zinc-500">
              {(actionCenter[0]?.count ?? 3) > 0 ? 'Quá 30 phút' : 'Không có giao dịch chờ'}
            </span>
          </div>

          {/* KPI 4: PT hôm nay */}
          <div className="xl:col-span-2 p-4 flex flex-col justify-between">
            <span className="text-[13px] font-semibold text-[#5A6360] dark:text-zinc-400">
              PT hôm nay
            </span>
            <div className="mt-2 font-mono text-[30px] font-bold text-[#131A18] dark:text-zinc-50 leading-none">
              {kpis?.todayPtSessions.total ?? 18}
            </div>
            <span className="mt-2 text-xs font-medium text-[#8A928F] dark:text-zinc-500">
              Xong {kpis?.todayPtSessions.completed ?? 10} · Sắp tới {kpis?.todayPtSessions.upcoming ?? 6} · Huỷ {kpis?.todayPtSessions.cancelled ?? 2}
            </span>
          </div>

          {/* Ô 5: Sparkline lưu lượng theo giờ (Cố định 8 cột chuẩn, KHÔNG TRÀN KHUNG) */}
          <div className="xl:col-span-4 p-4 flex flex-col justify-between min-w-0 overflow-hidden">
            <span className="text-[13px] font-semibold text-[#5A6360] dark:text-zinc-400">
              Lưu lượng theo giờ
            </span>

            <div className="mt-3 flex h-12 items-end justify-between gap-1.5 w-full min-w-0">
              {mainHourlyCheckins.map((item) => {
                const heightPercent = Math.round((item.count / maxHourlyCount) * 100);
                const isPeak = item.count >= maxHourlyCount * 0.8;
                return (
                  <div
                    key={item.hour}
                    className="group relative flex flex-1 flex-col items-center gap-1 h-full justify-end min-w-0"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-slate-900 text-white text-[10px] font-mono py-0.5 px-1.5 rounded shadow-md pointer-events-none whitespace-nowrap z-20">
                      {item.hour}:00 · {item.count} lượt
                    </div>

                    <div
                      style={{ height: `${Math.max(heightPercent, 12)}%` }}
                      className={`w-full rounded-t-xs transition-all ${
                        isPeak ? 'bg-[#0E7C5A]' : 'bg-[#CBD1CC] dark:bg-zinc-700'
                      }`}
                    />
                    <span className="text-[10px] font-mono text-[#8A928F] truncate w-full text-center">
                      {item.hour}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hàng Đợi Xử Lý (Single List sắp giảm dần theo Severity, KHÔNG DÙNG 3 CỘT) */}
      <div className="rounded-xl border border-[#E4E7E3] bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs overflow-hidden">
        {/* Header hàng đợi */}
        <div className="px-4 py-3.5 border-b border-[#E4E7E3] dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-[#131A18] dark:text-zinc-50">
              Hàng đợi xử lý
            </h2>
            {criticalOrWarningCount > 0 && (
              <span className="rounded-full bg-[#FBEDEC] px-2.5 py-0.5 text-xs font-bold text-[#C2413A]">
                {criticalOrWarningCount} việc cần gấp
              </span>
            )}
          </div>

          <span className="text-xs text-[#8A928F] dark:text-zinc-500 font-medium">
            Sắp giảm dần theo mức độ
          </span>
        </div>

        {/* Danh sách hàng đợi */}
        {activeQueueItems.length === 0 ? (
          /* State 7.3: Hàng đợi rỗng */
          <div className="h-[140px] flex flex-col items-center justify-center text-center p-4">
            <CheckCircle size={32} className="text-[#0E7C5A] mb-2" weight="bold" />
            <p className="text-sm font-bold text-[#5A6360] dark:text-zinc-300">
              Không có việc cần xử lý
            </p>
            <p className="text-xs text-[#8A928F] dark:text-zinc-500 mt-1">
              Mọi cảnh báo trong chi nhánh đã được giải quyết.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E4E7E3] dark:divide-zinc-800">
            {activeQueueItems.map((item) => {
              const isCritical = item.priority === 'CRITICAL';
              const isWarning = item.priority === 'WARNING';

              const dotColor = isCritical
                ? 'bg-[#C2413A]'
                : isWarning
                ? 'bg-[#B0741A]'
                : 'bg-[#2C6CA8]';

              return (
                <div
                  key={item.id}
                  className="min-h-[56px] px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-[#F1F2EF] dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {/* Chấm 6px tín hiệu Severity duy nhất (Spec 5.4) */}
                    <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />

                    <div className="truncate">
                      <p className="text-xs sm:text-sm font-bold text-[#131A18] dark:text-zinc-100 truncate">
                        {item.count} {item.title}
                      </p>
                      <p className="text-xs text-[#8A928F] dark:text-zinc-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Nhãn nút phân biệt loại hành động */}
                  <div className="shrink-0">
                    {isCritical ? (
                      <button
                        type="button"
                        onClick={() => navigate('/manager/memberships')}
                        className="h-8 px-3.5 rounded-lg border border-[#C2413A] bg-white text-xs font-bold text-[#C2413A] hover:bg-[#FBEDEC] transition-colors shadow-xs"
                      >
                        Xác nhận
                      </button>
                    ) : isWarning ? (
                      <button
                        type="button"
                        onClick={() => navigate('/manager/customers')}
                        className="h-8 px-3.5 rounded-lg border border-[#E4E7E3] bg-[#F6F7F5] text-xs font-bold text-[#131A18] hover:bg-[#E4E7E3] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 transition-colors shadow-xs"
                      >
                        Xem {item.count}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-[#8A928F] dark:text-zinc-500">
                        Đang theo dõi
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TẦNG 2 — HIỆU SUẤT THEO KỲ (PERFORMANCE BY PERIOD)                          */}
      {/* ========================================================================= */}

      <div className="mt-2 rounded-xl border border-[#E4E7E3] bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs overflow-hidden">
        {/* Dải nhãn Tầng 2 (Height 44px, Tích hợp Bộ lọc ngày ở bên phải) */}
        <div className="min-h-[44px] px-4 py-2 bg-[#F1F2EF] dark:bg-zinc-800/80 border-b border-[#CBD1CC] dark:border-zinc-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#5A6360] dark:text-zinc-300 uppercase tracking-wider text-[11px]">
            TẦNG 2 · HIỆU SUẤT THEO KỲ
          </span>

          {/* BỘ LỌC NGÀY ĐẶT TẠI ĐÂY THEO SPEC 5.2 */}
          <div className="flex items-center gap-2">
            <span className="text-[#8A928F] dark:text-zinc-400 font-medium">Xem theo:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-7 rounded-lg border border-[#CBD1CC] bg-white px-2.5 text-xs font-bold text-[#131A18] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#0E7C5A] shadow-xs"
            >
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
              <option value="last_month">Tháng trước</option>
            </select>
          </div>
        </div>

        {/* Header Tabs: Doanh thu | Hội viên | PT */}
        <div className="px-4 border-b border-[#E4E7E3] dark:border-zinc-800 flex items-center gap-6 overflow-x-auto">
          {[
            { id: 'revenue', label: 'Doanh thu' },
            { id: 'members', label: 'Hội viên' },
            { id: 'pt', label: 'Huấn luyện viên (PT)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#0E7C5A] text-[#0E7C5A] dark:border-emerald-400 dark:text-emerald-400'
                  : 'border-transparent text-[#5A6360] hover:text-[#131A18] dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Nội dung Tab: Biểu đồ (1.5fr) | Breakdown (1fr) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Cột trái 1.5fr: Biểu đồ chính + Trend con số */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                {/* Value lớn & Nhãn so sánh đầy đủ chữ theo Spec 5.5 */}
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-mono text-2xl lg:text-3xl font-bold text-[#131A18] dark:text-zinc-50">
                    {activeTab === 'revenue'
                      ? '142.800.000 ₫'
                      : activeTab === 'members'
                      ? '342 hội viên active'
                      : '186 buổi tập'}
                  </span>
                  <span className="text-xs font-bold text-[#0E7C5A] dark:text-emerald-400">
                    ▲ 8% so với tháng trước
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-[#8A928F] dark:text-zinc-500">
                  Tổng hợp kinh doanh tính đến hôm nay
                </p>
              </div>

              {/* Simulated Chart Bars */}
              <div className="mt-6 flex h-40 items-end justify-between gap-3 border-b border-[#E4E7E3] pb-2 dark:border-zinc-800">
                {['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'].map((w, idx) => (
                  <div key={w} className="flex flex-1 flex-col items-center gap-1.5 h-full justify-end">
                    <div
                      style={{ height: `${[45, 68, 88, 60][idx]}%` }}
                      className="w-full bg-[#0E7C5A] rounded-t-xs hover:bg-[#0B6549] transition-colors"
                    />
                    <span className="text-xs font-medium text-[#5A6360] dark:text-zinc-400">{w}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải 1fr: Breakdown chi tiết nguồn (Tối ưu không bao giờ cắt chữ) */}
            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-[#E4E7E3] pt-4 lg:pt-0 lg:pl-6 dark:border-zinc-800 flex flex-col justify-between h-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A928F] dark:text-zinc-400 block mb-3">
                Phân tích cấu trúc nguồn
              </span>

              {activeTab === 'revenue' ? (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E4E7E3] dark:border-zinc-800">
                    <span className="text-[#5A6360] dark:text-zinc-400 font-semibold">Gói tập (Membership)</span>
                    <span className="font-mono font-bold text-[#131A18] dark:text-zinc-100">98.200.000 ₫</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E4E7E3] dark:border-zinc-800">
                    <span className="text-[#5A6360] dark:text-zinc-400 font-semibold">Gói PT (PT Package)</span>
                    <span className="font-mono font-bold text-[#131A18] dark:text-zinc-100">36.400.000 ₫</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E4E7E3] dark:border-zinc-800">
                    <span className="text-[#5A6360] dark:text-zinc-400 font-semibold">Khách lẻ (Guest)</span>
                    <span className="font-mono font-bold text-[#131A18] dark:text-zinc-100">12.600.000 ₫</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-[#C2413A]">
                    <span className="font-semibold">Hoàn tiền (Refund)</span>
                    <span className="font-mono font-bold">−4.400.000 ₫</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#CBD1CC] font-bold text-[#131A18] dark:border-zinc-700 dark:text-zinc-50">
                    <span>Doanh thu thuần (Net)</span>
                    <span className="font-mono text-sm">142.800.000 ₫</span>
                  </div>
                </div>
              ) : activeTab === 'members' ? (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E4E7E3] dark:border-zinc-800">
                    <span className="text-[#5A6360] dark:text-zinc-400 font-semibold">Hội viên mới trong kỳ</span>
                    <span className="font-mono font-bold text-[#131A18] dark:text-zinc-100">24 người</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E4E7E3] dark:border-zinc-800">
                    <span className="text-[#5A6360] dark:text-zinc-400 font-semibold">Gia hạn gói tập</span>
                    <span className="font-mono font-bold text-[#131A18] dark:text-zinc-100">18 gói</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-[#C2413A]">
                    <span className="font-semibold">Gói đã hết hạn</span>
                    <span className="font-mono font-bold">12 gói</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-[#B0741A]">
                    <span className="font-semibold">Nguy cơ rời bỏ (At risk)</span>
                    <span className="font-mono font-bold">42 người</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E4E7E3] dark:border-zinc-800">
                    <span className="text-[#5A6360] dark:text-zinc-400 font-semibold">PT đang hoạt động</span>
                    <span className="font-mono font-bold text-[#131A18] dark:text-zinc-100">8 HLV</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#E4E7E3] dark:border-zinc-800">
                    <span className="text-[#5A6360] dark:text-zinc-400 font-semibold">Tổng số buổi hoàn thành</span>
                    <span className="font-mono font-bold text-[#131A18] dark:text-zinc-100">186 buổi</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 text-[#C2413A]">
                    <span className="font-semibold">Tỷ lệ huỷ lịch</span>
                    <span className="font-mono font-bold">4.2%</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
