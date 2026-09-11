import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Buildings,
  Receipt,
  UserCircle,
} from '@phosphor-icons/react';
import type { ActivityEvent } from '../../types/dashboard';

interface RecentActivityProps {
  activities: ActivityEvent[];
  isLoading?: boolean;
}

export default function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  const navigate = useNavigate();

  const iconByType: Record<string, JSX.Element> = {
    tenant: <Buildings size={14} className="text-blue-500" />,
    subscription: <Receipt size={14} className="text-purple-500" />,
    payment: <CreditCard size={14} className="text-emerald-500" />,
    security: <ShieldCheck size={14} className="text-amber-500" />,
    system: <Clock size={14} className="text-zinc-500" />,
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Nhật ký Hoạt động Gần đây
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Dòng sự kiện quản trị, thanh toán và thay đổi trạng thái nền tảng
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/audit-logs')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <span>Xem tất cả Audit Log</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-start justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                {iconByType[act.type] ?? <UserCircle size={14} />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {act.actor}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400">{act.action}</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {act.target}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-400">
                  <span>{act.timestamp}</span>
                  <span>•</span>
                  <span className="font-mono">{act.time}</span>
                </div>
              </div>
            </div>

            <span
              className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                act.status === 'success'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : act.status === 'warning'
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}
            >
              {act.type.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
