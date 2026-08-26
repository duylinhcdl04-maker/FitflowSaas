const STYLES: Record<string, string> = {
  TRIAL: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400',
  INACTIVE: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  PAST_DUE: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-400',
  EXPIRED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  CANCELLED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  PAID: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400',
  ISSUED: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400',
  OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-400',
  VOID: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  ENDED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
};

const DOTS: Record<string, string> = {
  TRIAL: 'bg-amber-500',
  ACTIVE: 'bg-emerald-500',
  SUSPENDED: 'bg-red-500',
  INACTIVE: 'bg-zinc-400',
  PAST_DUE: 'bg-orange-500',
  EXPIRED: 'bg-zinc-400',
  CANCELLED: 'bg-zinc-400',
  PAID: 'bg-emerald-500',
  PENDING: 'bg-amber-500',
  ISSUED: 'bg-blue-500',
  OVERDUE: 'bg-red-500',
  VOID: 'bg-zinc-400',
  ENDED: 'bg-zinc-400',
};

const LABELS: Record<string, string> = {
  TRIAL: 'Dùng thử',
  ACTIVE: 'Đang hoạt động',
  SUSPENDED: 'Tạm ngưng',
  INACTIVE: 'Ngừng hoạt động',
  PAST_DUE: 'Quá hạn',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã huỷ',
  PAID: 'Đã thanh toán',
  PENDING: 'Chờ xử lý',
  ISSUED: 'Đã phát hành',
  OVERDUE: 'Quá hạn thanh toán',
  VOID: 'Đã huỷ',
  ENDED: 'Đã kết thúc',
};

export default function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400';
  const dot = DOTS[status] ?? 'bg-zinc-400';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      {LABELS[status] ?? status}
    </span>
  );
}
