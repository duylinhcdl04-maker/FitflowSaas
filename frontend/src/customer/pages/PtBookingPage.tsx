import { useQuery } from '@tanstack/react-query';
import { Barbell, Calendar, Check, Clock, Note, UserCheck } from '@phosphor-icons/react';
import { getMyPtBookings, getMyPtPackage } from '../api/customer';
import Card from '../../owner/components/Card';
import { Skeleton } from '../../owner/components/Skeleton';

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chờ HLV xác nhận', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  SCHEDULED: { label: 'Đã sắp lịch', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  CONFIRMED: { label: 'Đã sắp lịch', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  COMPLETED: { label: 'Đã hoàn thành', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  NO_SHOW: { label: 'Vắng mặt', className: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
};

export default function PtBookingPage() {
  const pkgQuery = useQuery({ queryKey: ['customer-pt-package'], queryFn: getMyPtPackage });
  const bookingsQuery = useQuery({ queryKey: ['customer-pt-bookings'], queryFn: getMyPtBookings });

  const pkg = pkgQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Lịch Tập PT Của Tôi</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Xem thời gian biểu và các ca tập do Huấn luyện viên cá nhân (PT) trực tiếp sắp xếp cho bạn.</p>
      </div>

      {pkgQuery.isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : !pkg ? (
        <Card className="text-center text-sm text-zinc-400">Bạn chưa đăng ký gói PT nào đang hoạt động.</Card>
      ) : (
        <>
          {/* Thông tin gói PT & Hạn ngạch */}
          <Card className="space-y-3">
            <div className="flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <Barbell size={22} weight="fill" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{pkg.planName}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  HLV phụ trách: <strong>{pkg.ptName}</strong> · Quy chuẩn: <strong>{pkg.sessionDurationMinutes} phút/buổi</strong>
                </p>
              </div>
            </div>

            {/* Quota Breakdown */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-2 border-t border-stone-100 dark:border-zinc-800 text-xs">
              <div className="rounded-xl bg-stone-50 p-2.5 text-center dark:bg-zinc-900/60">
                <span className="text-zinc-500 dark:text-zinc-400">Tổng gói</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-50">{pkg.totalSessions} buổi</p>
              </div>
              <div className="rounded-xl bg-emerald-50/60 p-2.5 text-center dark:bg-emerald-950/30">
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Đã hoàn thành</span>
                <p className="font-bold text-emerald-800 dark:text-emerald-300">{pkg.completedSessions} buổi</p>
              </div>
              <div className="rounded-xl bg-amber-50/60 p-2.5 text-center dark:bg-amber-950/30">
                <span className="text-amber-700 dark:text-amber-400 font-medium">Lịch đã xếp</span>
                <p className="font-bold text-amber-800 dark:text-amber-300">{(pkg.totalSessions - pkg.completedSessions - pkg.remainingSessions)} buổi</p>
              </div>
              <div className="rounded-xl bg-violet-50/60 p-2.5 text-center dark:bg-violet-950/30">
                <span className="text-violet-700 dark:text-violet-400 font-medium">Còn lại</span>
                <p className="font-bold text-violet-800 dark:text-violet-300">{pkg.remainingSessions} buổi</p>
              </div>
            </div>
          </Card>

          {/* Lịch tập PT được HLV sắp xếp */}
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">
              <Calendar size={20} className="text-emerald-600 dark:text-emerald-400" /> Ca tập PT sắp tới
            </h2>

            {bookingsQuery.isLoading ? (
              <Skeleton className="h-28 w-full" />
            ) : bookingsQuery.data && bookingsQuery.data.upcoming.length > 0 ? (
              <div className="flex flex-col gap-3">
                {bookingsQuery.data.upcoming.map((b) => {
                  const sStart = new Date(b.scheduled_start);
                  const sEnd = new Date(b.scheduled_end);
                  const dateStr = sStart.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                  const startTime = sStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                  const endTime = sEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <Card key={b.id} className="space-y-2 border-emerald-100 dark:border-emerald-950/50">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                            <Clock size={16} weight="bold" />
                          </span>
                          <div>
                            <p className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50 capitalize">
                              {dateStr}
                            </p>
                            <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {startTime} - {endTime}
                            </p>
                          </div>
                        </div>

                        <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${STATUS_STYLE[b.status]?.className ?? ''}`}>
                          {STATUS_STYLE[b.status]?.label ?? b.status}
                        </span>
                      </div>

                      {b.session_note && (
                        <div className="mt-2 rounded-xl bg-stone-50 p-2.5 text-xs text-zinc-600 dark:bg-zinc-900/60 dark:text-zinc-300 flex items-start gap-2">
                          <Note size={15} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>Ghi chú từ HLV: <strong>{b.session_note}</strong></span>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="text-center text-xs text-zinc-400 py-6">
                Chưa có ca tập nào được HLV sắp xếp cho thời gian tới.
              </Card>
            )}
          </div>
        </>
      )}

      {/* Lịch sử ca tập đã qua */}
      {bookingsQuery.data && bookingsQuery.data.past.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Lịch sử ca tập PT</h2>
          <div className="flex flex-col gap-2">
            {bookingsQuery.data.past.slice(0, 10).map((b) => {
              const sStart = new Date(b.scheduled_start);
              const sEnd = new Date(b.scheduled_end);
              const dateStr = sStart.toLocaleDateString('vi-VN', { dateStyle: 'medium' });
              const startTime = sStart.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
              const endTime = sEnd.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={b.id} className="rounded-xl bg-stone-50 px-4 py-3 text-xs dark:bg-zinc-900/60">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {dateStr} ({startTime} - {endTime})
                    </span>
                    <span className="flex shrink-0 items-center gap-1 font-bold text-zinc-600 dark:text-zinc-400">
                      {b.status === 'COMPLETED' && <Check size={14} className="text-emerald-600 dark:text-emerald-400" />}
                      {STATUS_STYLE[b.status]?.label ?? b.status}
                    </span>
                  </div>
                  {b.session_note && (
                    <p className="mt-1.5 flex items-start gap-1.5 border-t border-stone-200/70 pt-1.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      <Note size={13} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{b.session_note}</span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
