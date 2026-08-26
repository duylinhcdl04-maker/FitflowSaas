import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import { getPtSchedule, confirmPtBooking, rejectPtBooking, completePtSession } from '../api/pt';

export default function PtSchedulePage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [confirmModal, setConfirmModal] = useState<any | null>(null);
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [completeModal, setCompleteModal] = useState<any | null>(null);
  const [sessionNote, setSessionNote] = useState('');

  const { data: scheduleList, isLoading, isError } = useQuery({
    queryKey: ['pt-schedule'],
    queryFn: () => getPtSchedule(),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmPtBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      setConfirmModal(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectPtBooking(rejectModal.id, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      setRejectModal(null);
      setRejectReason('');
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => completePtSession(completeModal.id, sessionNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-overview'] });
      queryClient.invalidateQueries({ queryKey: ['pt-clients'] });
      setCompleteModal(null);
      setSessionNote('');
    },
  });

  const filteredList = (scheduleList || []).filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> Quản Lý Lịch Dạy PT
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Tiếp nhận yêu cầu đặt lịch, xác nhận ca dạy và đánh dấu hoàn thành buổi tập.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold">
            {['ALL', 'PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === st
                    ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st === 'ALL'
                  ? 'Tất cả'
                  : st === 'PENDING'
                  ? 'Chờ duyệt'
                  : st === 'SCHEDULED'
                  ? 'Đã duyệt'
                  : st === 'COMPLETED'
                  ? 'Hoàn thành'
                  : 'Đã hủy'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule Items Timeline List */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-400" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          Không thể tải danh sách lịch dạy.
        </div>
      ) : filteredList.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-zinc-800 dark:bg-zinc-900">
          <CalendarCheck className="mx-auto h-12 w-12 text-slate-300 dark:text-zinc-700" />
          <p className="mt-2 text-sm font-semibold">Không tìm thấy ca dạy nào phù hợp với bộ lọc</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((item) => {
            const startTime = new Date(item.scheduled_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(item.scheduled_end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const startDateFormatted = new Date(item.scheduled_start).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });

            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 hover:border-emerald-300 transition"
              >
                <div className="flex items-start gap-4">
                  {/* Time Badge */}
                  <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200/60 dark:border-emerald-900/60 px-3 py-2 text-center min-w-[100px]">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">{startDateFormatted}</span>
                    <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {startTime} - {endTime}
                    </span>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {item.customers.full_name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          item.status === 'COMPLETED'
                            ? 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                            : item.status === 'SCHEDULED' || item.status === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : item.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {item.status === 'COMPLETED'
                          ? 'HOÀN THÀNH'
                          : item.status === 'SCHEDULED'
                          ? 'ĐÃ DUYỆT'
                          : item.status === 'PENDING'
                          ? 'CHỜ XÁC NHẬN'
                          : 'ĐÃ HỦY'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>Gói: <strong>{item.customer_pt_packages?.plan_name_snapshot || 'PT Course'}</strong></span>
                      <span>•</span>
                      <span>SĐT: <strong>{item.customers.phone || 'Chưa có'}</strong></span>
                    </p>

                    {item.session_note && (
                      <p className="text-xs italic text-slate-600 dark:text-zinc-400 bg-slate-50 dark:bg-zinc-800/60 p-2 rounded-lg mt-1 border border-slate-100 dark:border-zinc-800">
                        "{item.session_note}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions Button Group */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {item.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectModal(item)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 transition"
                      >
                        <XCircle className="h-4 w-4" /> Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmModal(item)}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                      >
                        <CheckCircle className="h-4 w-4" /> Xác nhận
                      </button>
                    </>
                  )}

                  {item.status === 'SCHEDULED' && (
                    <button
                      type="button"
                      onClick={() => setCompleteModal(item)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                    >
                      <CheckCircle className="h-4 w-4" /> Hoàn Thành Ca (Trừ Buổi)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Booking Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-emerald-600" /> Xác Nhận Đặt Lịch Hẹn
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
              Bạn có chắc chắn muốn chấp nhận lịch hẹn huấn luyện với học viên <strong className="text-slate-900 dark:text-white">{confirmModal.customers.full_name}</strong> vào lúc{' '}
              <strong className="font-mono text-emerald-600">{new Date(confirmModal.scheduled_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>?
            </p>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate(confirmModal.id)}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {confirmMutation.isPending ? 'Đang duyệt...' : 'Xác Nhận Đặt Lịch'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Booking Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="h-6 w-6 text-rose-600" /> Từ Chối Đặt Lịch Hẹn
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
              Nhập lý do từ chối yêu cầu đặt lịch hẹn của học viên <strong className="text-slate-900 dark:text-white">{rejectModal.customers.full_name}</strong>:
            </p>

            <div className="mt-4">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: PT trùng ca dạy hoặc bận việc cá nhân..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {rejectMutation.isPending ? 'Đang lưu...' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Session Modal */}
      {completeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-emerald-600" /> Xác Nhận Hoàn Thành Buổi Dạy
            </h3>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
              Hệ thống sẽ chuyển trạng thái ca dạy sang <strong className="text-emerald-600">COMPLETED</strong> và tự động trừ 1 buổi trong gói tập của học viên <strong className="text-slate-900 dark:text-white">{completeModal.customers.full_name}</strong> theo quy tắc BR-PT-002.
            </p>

            <div className="mt-4 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Ghi chú nhật ký buổi dạy:
              </label>
              <textarea
                value={sessionNote}
                onChange={(e) => setSessionNote(e.target.value)}
                placeholder="Ghi chú bài tập đã thực hiện..."
                rows={3}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompleteModal(null)}
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
                {completeMutation.isPending ? 'Đang xử lý...' : 'Xác Nhận & Trừ Buổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
