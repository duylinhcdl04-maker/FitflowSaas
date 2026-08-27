import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  UsersThree,
  Clock,
  CheckCircle,
  WarningCircle,
  ArrowRight,
  Phone,
  Barbell,
  Sparkle,
  Hourglass,
  CalendarPlus,
} from '@phosphor-icons/react';
import { getPtOverview, completePtSession } from '../api/pt';
import { useAuthStore } from '../../owner/store/auth-store';

export default function PtDashboardPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [completeModalBooking, setCompleteModalBooking] = useState<any | null>(null);
  const [sessionNote, setSessionNote] = useState('');

  const { data: overview, isLoading, isError } = useQuery({
    queryKey: ['pt-overview'],
    queryFn: getPtOverview,
  });

  const completeMutation = useMutation({
    mutationFn: () => completePtSession(completeModalBooking.id, sessionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      queryClient.invalidateQueries({ queryKey: ['pt-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-clients'] });
      setCompleteModalBooking(null);
      setSessionNote('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-400" />
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Đang tải không gian làm việc PT...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
        Không thể tải dữ liệu ca làm việc. Vui lòng kiểm tra kết nối mạng.
      </div>
    );
  }

  const nextSession = overview?.nextSession;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Chào buổi sáng, {user?.fullName || 'HLV PT'} <Sparkle className="h-6 w-6 text-amber-500 fill-amber-400 animate-bounce" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Dưới đây là danh sách ca dạy và trạng thái học viên cá nhân thuộc phụ trách của bạn hôm nay.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/pt/schedule"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95"
          >
            <CalendarPlus className="h-4 w-4" />
            <span>Xem lịch dạy chi tiết</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Today Sessions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Hôm Nay</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {overview?.todaySessionsCount || 0} <span className="text-xs font-normal text-slate-400">buổi</span>
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Ca dạy trong ngày</span>
        </div>

        {/* Pending Bookings */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Chờ Duyệt</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Hourglass className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {overview?.pendingBookingsCount || 0} <span className="text-xs font-normal text-slate-400">yêu cầu</span>
          </p>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Cần xác nhận lịch đặt</span>
        </div>

        {/* Low Session Clients */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Sắp Hết Gói</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <WarningCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {overview?.lowSessionClientsCount || 0} <span className="text-xs font-normal text-slate-400">học viên</span>
          </p>
          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">Còn ≤ 2 buổi tập</span>
        </div>

        {/* My Total Clients */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-xs font-bold uppercase tracking-wider">Học Viên</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <UsersThree className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {overview?.todaySessionsList?.length || 0} <span className="text-xs font-normal text-slate-400">hồ sơ</span>
          </p>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Đang hoạt động</span>
        </div>
      </div>

      {/* Main Grid: Next Session Hero + Today's Schedule */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Next Session Hero Feature Card */}
        <div className="lg:col-span-1 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/60 to-white p-5 dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-zinc-900 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-3 dark:border-emerald-900/40">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-spin" /> CA DẠY TIẾP THEO
              </span>
              <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200">
                {nextSession ? 'SẮP DIỄN RA' : 'KHÔNG CÓ CA'}
              </span>
            </div>

            {nextSession ? (
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-lg shadow-md shadow-emerald-600/30">
                    {nextSession.customers.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                      {nextSession.customers.full_name}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {nextSession.customers.phone || 'Chưa cập nhật SĐT'}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-3.5 border border-slate-200/80 dark:bg-zinc-900/80 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">Thời gian:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {new Date(nextSession.scheduled_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(nextSession.scheduled_end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">Gói tập:</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      {nextSession.customer_pt_packages?.plan_name_snapshot || 'Gói Huấn Luyện PT'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-zinc-400">Tiến độ gói:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {nextSession.customer_pt_packages?.used_sessions || 0} / {nextSession.customer_pt_packages?.total_sessions || 0} buổi
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
                <Barbell className="mx-auto h-12 w-12 text-slate-300 dark:text-zinc-700" />
                <p className="mt-2 text-xs font-medium">Hiện không có ca dạy sắp diễn ra</p>
              </div>
            )}
          </div>

          {nextSession && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setCompleteModalBooking(nextSession)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-95"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Hoàn Thành Buổi Tập (Trừ 1 Buổi)</span>
              </button>
            </div>
          )}
        </div>

        {/* Today's Schedule Timeline List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800">
              <h2 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Ca Dạy Trong Ngày
              </h2>
              <Link
                to="/pt/schedule"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Xem toàn bộ <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {overview?.todaySessionsList && overview.todaySessionsList.length > 0 ? (
                overview.todaySessionsList.map((item) => {
                  const startTime = new Date(item.scheduled_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  const endTime = new Date(item.scheduled_end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  const isCompleted = item.status === 'COMPLETED';

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                        isCompleted
                          ? 'border-slate-200 bg-slate-50 dark:border-zinc-800 dark:bg-zinc-800/40 opacity-75'
                          : 'border-slate-200/80 bg-white dark:border-zinc-700/80 dark:bg-zinc-800/80 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200/60 dark:border-emerald-900/60">
                          {startTime} - {endTime}
                        </div>

                        <div>
                          <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {item.customers.full_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {item.customer_pt_packages?.plan_name_snapshot || 'Gói PT'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[11px] font-black ${
                            item.status === 'COMPLETED'
                              ? 'bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-300'
                              : item.status === 'SCHEDULED' || item.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : item.status === 'NO_SHOW'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {item.status === 'COMPLETED'
                            ? 'Hoàn thành'
                            : item.status === 'SCHEDULED' || item.status === 'CONFIRMED'
                            ? 'Đã duyệt'
                            : item.status === 'PENDING'
                            ? 'Chờ xác nhận'
                            : item.status === 'NO_SHOW'
                            ? 'Vắng mặt'
                            : 'Đã hủy'}
                        </span>

                        {(item.status === 'SCHEDULED' || item.status === 'CONFIRMED') && (
                          <button
                            type="button"
                            onClick={() => setCompleteModalBooking(item)}
                            className="rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition"
                          >
                            Hoàn thành
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 dark:text-zinc-500">
                  <CalendarCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-zinc-700" />
                  <p className="mt-2 text-xs font-medium">Hôm nay không có ca dạy nào được xếp lịch</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Complete Session */}
      {completeModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-emerald-600" /> Xác Nhận Hoàn Thành Buổi Tập
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
              Xác nhận bạn đã kết thúc ca dạy với học viên <strong className="text-slate-900 dark:text-white">{completeModalBooking.customers.full_name}</strong>.
            </p>

            <div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/50">
              ⚠️ <strong>Quy tắc BR-PT-002:</strong> Thao tác này sẽ chính thức trừ 1 buổi tập khỏi gói PT của học viên và lưu nhật ký ca dạy.
            </div>

            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Ghi chú nội dung buổi dạy (không bắt buộc):
              </label>
              <textarea
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="Ví dụ: Tập mông đùi, squat 60kg, squat tốt..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompleteModalBooking(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={completeMutation.isPending}
                onClick={() => completeMutation.mutate()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {completeMutation.isPending ? 'Đang ghi nhận...' : 'Xác Nhận & Trừ Buổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
