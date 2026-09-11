import { useNavigate } from 'react-router-dom';
import { Buildings, ArrowRight } from '@phosphor-icons/react';

interface TenantOverviewProps {
  statusCounts: {
    active: number;
    trial: number;
    pastDue: number;
    suspended: number;
    cancelled: number;
    total: number;
  };
  isLoading?: boolean;
}

interface StatusItemConfig {
  key: string;
  label: string;
  count: number;
  statusParam: string;
  color: string;
  bgLight: string;
  textTone: string;
}

export default function TenantOverview({ statusCounts, isLoading }: TenantOverviewProps) {
  const navigate = useNavigate();

  const total = statusCounts.total || 1;

  const STATUS_CONFIGS: StatusItemConfig[] = [
    {
      key: 'active',
      label: 'Đang hoạt động (Active)',
      count: statusCounts.active,
      statusParam: 'ACTIVE',
      color: 'bg-emerald-500',
      bgLight: 'bg-emerald-50 dark:bg-emerald-500/10',
      textTone: 'text-emerald-700 dark:text-emerald-400',
    },
    {
      key: 'trial',
      label: 'Dùng thử (Trial)',
      count: statusCounts.trial,
      statusParam: 'TRIAL',
      color: 'bg-blue-500',
      bgLight: 'bg-blue-50 dark:bg-blue-500/10',
      textTone: 'text-blue-700 dark:text-blue-400',
    },
    {
      key: 'pastDue',
      label: 'Chờ thanh toán (Past Due)',
      count: statusCounts.pastDue,
      statusParam: 'PAST_DUE',
      color: 'bg-amber-500',
      bgLight: 'bg-amber-50 dark:bg-amber-500/10',
      textTone: 'text-amber-700 dark:text-amber-400',
    },
    {
      key: 'suspended',
      label: 'Tạm ngưng (Suspended)',
      count: statusCounts.suspended,
      statusParam: 'SUSPENDED',
      color: 'bg-rose-500',
      bgLight: 'bg-rose-50 dark:bg-rose-500/10',
      textTone: 'text-rose-700 dark:text-rose-400',
    },
    {
      key: 'cancelled',
      label: 'Ngừng dịch vụ (Cancelled)',
      count: statusCounts.cancelled,
      statusParam: 'INACTIVE',
      color: 'bg-zinc-400',
      bgLight: 'bg-zinc-100 dark:bg-zinc-800',
      textTone: 'text-zinc-600 dark:text-zinc-400',
    },
  ];

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Phân bố Trạng thái Tenant
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Tổng cộng {statusCounts.total} phòng gym trên nền tảng
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/tenants')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <span>Danh sách Tenant</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Multi-segment progress bar */}
      <div className="mt-4">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          {STATUS_CONFIGS.map((st) => {
            const percent = (st.count / total) * 100;
            if (percent === 0) return null;
            return (
              <div
                key={st.key}
                style={{ width: `${percent}%` }}
                className={`${st.color} transition-all duration-500`}
                title={`${st.label}: ${st.count} (${percent.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Status rows */}
      <div className="mt-4 flex flex-col gap-2">
        {STATUS_CONFIGS.map((st) => {
          const percent = ((st.count / total) * 100).toFixed(1);
          return (
            <button
              key={st.key}
              type="button"
              onClick={() => navigate(`/admin/tenants?status=${st.statusParam}`)}
              className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${st.color}`} />
                <span className="font-medium text-zinc-700 group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100">
                  {st.label}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-zinc-400">{percent}%</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                  {st.count}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
