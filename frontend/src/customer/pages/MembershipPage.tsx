import { useQuery } from '@tanstack/react-query';
import { CheckCircle, MapPinLine, Clock, XCircle } from '@phosphor-icons/react';
import { getCurrentMembership, getMembershipHistory } from '../api/customer';
import Card from '../../owner/components/Card';
import { Skeleton } from '../../owner/components/Skeleton';

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Đang hoạt động', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
  SCHEDULED: { label: 'Sắp kích hoạt', className: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  FROZEN: { label: 'Đang tạm ngưng', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
  EXPIRED: { label: 'Đã hết hạn', className: 'bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400' },
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}
function formatMoney(n: string | number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n));
}

export default function MembershipPage() {
  const currentQuery = useQuery({ queryKey: ['customer-membership'], queryFn: getCurrentMembership });
  const historyQuery = useQuery({ queryKey: ['customer-membership-history'], queryFn: getMembershipHistory });

  const current = currentQuery.data;
  const history = (historyQuery.data ?? []).filter((m) => m.id !== current?.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Gói tập của tôi</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Thông tin gói tập hiện tại, quyền truy cập chi nhánh và lịch sử các gói đã sử dụng.</p>
      </div>

      {currentQuery.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : current ? (
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-transparent dark:from-emerald-500/[0.06]" />
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Gói đang sử dụng</p>
                <h2 className="mt-0.5 font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">{current.packageName}</h2>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[current.status]?.className ?? STATUS_STYLE.EXPIRED.className}`}>
                {STATUS_STYLE[current.status]?.label ?? current.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Ngày bắt đầu</p>
                <p className="mt-0.5 font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatDate(current.startDate)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Ngày hết hạn</p>
                <p className="mt-0.5 font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatDate(current.endDate)}</p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Thời hạn</p>
                <p className="mt-0.5 font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {current.durationValue} {current.durationUnit}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Giá trị</p>
                <p className="mt-0.5 font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">{formatMoney(current.price)}</p>
              </div>
            </div>

            {/* Thống kê Số buổi tập Gym & Số buổi tập PT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 dark:border-zinc-800">
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Số buổi/ngày đã tập Gym</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">Thẻ Member</span>
                </div>
                <p className="mt-1 font-display text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {current.gymAttendanceDays ?? 0} <span className="text-sm font-semibold">ngày tập</span>
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  Tính theo ngày check-in tại phòng tập (1 ngày check-in 1 hoặc nhiều lần = 1 ngày)
                </p>
              </div>

              <div className="rounded-2xl border border-violet-200/80 bg-violet-50/60 p-3.5 dark:border-violet-900/50 dark:bg-violet-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-800 dark:text-violet-300">Số buổi đã tập với PT</span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-extrabold text-violet-700 dark:bg-violet-900 dark:text-violet-300">Hợp đồng PT</span>
                </div>
                {current.ptSummary ? (
                  <>
                    <p className="mt-1 font-display text-2xl font-black text-violet-700 dark:text-violet-400">
                      {current.ptSummary.completedSessions} / {current.ptSummary.totalSessions} <span className="text-sm font-semibold">buổi</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-violet-700/80 dark:text-violet-400/80">
                      HLV: <strong>{current.ptSummary.ptName}</strong> · Còn lại: <strong>{current.ptSummary.remainingSessions} buổi</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 font-display text-base font-bold text-zinc-400">Chưa có gói PT</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">Đăng ký dịch vụ Huấn luyện viên cá nhân để được hỗ trợ 1:1</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 border-t border-stone-100 pt-3 dark:border-zinc-800">
              <div className="flex items-center gap-2 rounded-2xl bg-stone-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
                <MapPinLine size={16} className="text-emerald-600 dark:text-emerald-400" />
                {current.branchAccessScope === 'ALL_BRANCHES'
                  ? 'Tập tại mọi chi nhánh'
                  : `Chỉ tập tại: ${current.branch?.name ?? 'chi nhánh đăng ký'}`}
              </div>
              {current.maxCheckinsPerDay ? (
                <div className="flex items-center gap-2 rounded-2xl bg-stone-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
                  <Clock size={16} className="text-blue-600 dark:text-blue-400" />
                  Tối đa {current.maxCheckinsPerDay} lượt check-in/ngày
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl bg-stone-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
                  <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                  Check-in không giới hạn trong ngày
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="text-center text-sm text-zinc-400">Bạn chưa có gói tập nào đang hoạt động.</Card>
      )}

      <div>
        <h2 className="mb-3 font-display text-base font-bold text-zinc-900 dark:text-zinc-50">Lịch sử gói tập</h2>
        {historyQuery.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : history.length > 0 ? (
          <div className="flex flex-col gap-3">
            {history.map((m) => (
              <Card key={m.id} padded={false} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {m.status === 'CANCELLED' ? <XCircle size={18} /> : <Clock size={18} />}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{m.packageName}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(m.startDate)} — {formatDate(m.endDate)}
                    </p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLE[m.status]?.className ?? STATUS_STYLE.EXPIRED.className}`}>
                  {STATUS_STYLE[m.status]?.label ?? m.status}
                </span>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-400">Chưa có lịch sử gói tập nào khác.</p>
        )}
      </div>
    </div>
  );
}
