import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { Barbell, XCircle, Phone, CalendarBlank } from '@phosphor-icons/react';
import { getManagerPtBookings, cancelPtBooking } from '../../api/manager';
import { apiErrorMessage } from '../../../owner/api/client';
import Card from '../../../owner/components/Card';
import Button from '../../../owner/components/Button';
import FormField, { inputClass } from '../../../owner/components/FormField';
import Modal from '../../../owner/components/Modal';
import { Skeleton } from '../../../owner/components/Skeleton';

export default function ManagerPtPage() {
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['manager-pt-bookings'],
    queryFn: () => getManagerPtBookings(),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelPtBooking(selectedBookingId!, cancelReason),
    onSuccess: () => {
      setCancelModalOpen(false);
      setSelectedBookingId(null);
      setCancelReason('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-pt-bookings'] });
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể hủy lịch tập PT')),
  });

  function handleOpenCancel(id: string) {
    setSelectedBookingId(id);
    setCancelReason('');
    setCancelModalOpen(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-6 w-full max-w-full overflow-x-hidden"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-zinc-50 tracking-tight">
            Quản lý PT & Lịch tập
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Theo dõi lịch tập PT tại chi nhánh, hỗ trợ hủy lịch kèm lý do kiểm toán
          </p>
        </div>
      </div>

      <Card className="border border-slate-200/80 dark:border-zinc-800/80 shadow-xs rounded-xl overflow-hidden p-4 sm:p-5">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
          <Barbell size={20} className="text-emerald-600 dark:text-emerald-400" />
          Danh sách Lịch tập PT
        </h2>

        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <>
            {/* 1. Mobile Card List View (< md) */}
            <div className="block md:hidden flex flex-col gap-3">
              {bookings && bookings.length > 0 ? (
                bookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm truncate">
                        {b.customers?.full_name}
                      </span>
                      <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {b.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>{b.customers?.phone || 'N/A'}</span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-800/60 flex flex-col gap-1 text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <CalendarBlank size={13} /> Bắt đầu: {new Date(b.scheduled_start).toLocaleString('vi-VN')}
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarBlank size={13} /> Kết thúc: {new Date(b.scheduled_end).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    {b.status === 'SCHEDULED' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenCancel(b.id)}
                          className="text-xs text-rose-600 hover:underline dark:text-rose-400 font-bold flex items-center gap-1"
                        >
                          <XCircle size={14} /> Hủy lịch
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-slate-400">
                  Chưa có lịch đặt PT nào tại chi nhánh.
                </div>
              )}
            </div>

            {/* 2. Desktop Table View (>= md min-w-[650px]) */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200/80 dark:border-zinc-800">
              <table className="w-full text-left text-sm min-w-[650px] text-slate-600 dark:text-zinc-300">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 dark:bg-zinc-800/60 dark:text-zinc-400 border-b border-slate-200/80 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3">Hội viên</th>
                    <th className="px-4 py-3">SĐT</th>
                    <th className="px-4 py-3">Thời gian bắt đầu</th>
                    <th className="px-4 py-3">Thời gian kết thúc</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                  {bookings && bookings.length > 0 ? (
                    bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-zinc-100">
                          {b.customers?.full_name}
                        </td>
                        <td className="px-4 py-3 text-xs">{b.customers?.phone || 'N/A'}</td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {new Date(b.scheduled_start).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono">
                          {new Date(b.scheduled_end).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300">
                            {b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {b.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancel(b.id)}
                              className="text-xs text-rose-600 hover:underline dark:text-rose-400 font-bold flex items-center gap-1 ml-auto"
                            >
                              <XCircle size={14} /> Hủy lịch
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                        Chưa có lịch đặt PT nào tại chi nhánh.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* CANCEL MODAL */}
      <Modal open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Hủy lịch tập PT">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            cancelMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-sm text-slate-600 dark:text-zinc-300">
            Vui lòng nhập lý do hủy lịch tập PT để lưu thông tin Audit Log.
          </p>

          <FormField label="Lý do hủy lịch *" htmlFor="cancel-pt-reason">
            <textarea
              id="cancel-pt-reason"
              required
              rows={3}
              className={inputClass}
              placeholder="Ví dụ: PT nghỉ đột xuất, Khách bận việc gia đình..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </FormField>

          {error && <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>}

          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setCancelModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={cancelMutation.isPending}>
              Xác nhận hủy lịch
            </Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
