import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, CheckCircle, Warning, XCircle } from '@phosphor-icons/react';
import type { ServiceHealthItem } from '../../types/dashboard';

interface PlatformHealthProps {
  services: ServiceHealthItem[];
  isLoading?: boolean;
}

export default function PlatformHealth({ services, isLoading }: PlatformHealthProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-36 bg-zinc-100 rounded dark:bg-zinc-800 animate-pulse" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Sức khỏe Hạ tầng Nền tảng
            </h2>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Giám sát thời gian thực các vi dịch vụ cốt lõi
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/settings')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <span>Kiểm tra hạ tầng</span>
          <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="mt-3.5 divide-y divide-zinc-100 dark:divide-zinc-800/70">
        {services.map((srv) => {
          const isOp = srv.status === 'operational';
          const isDeg = srv.status === 'degraded';

          return (
            <div
              key={srv.id}
              className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-2.5">
                {isOp ? (
                  <CheckCircle size={15} weight="fill" className="text-emerald-500" />
                ) : isDeg ? (
                  <Warning size={15} weight="fill" className="text-amber-500" />
                ) : (
                  <XCircle size={15} weight="fill" className="text-rose-500" />
                )}
                <div>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {srv.name}
                  </span>
                  <div className="text-[11px] text-zinc-400">
                    Uptime: <span className="font-mono text-zinc-600 dark:text-zinc-300">{srv.uptimePercent}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                  {srv.latencyMs}ms
                </span>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                    isOp
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                      : isDeg
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                  }`}
                >
                  {isOp ? 'Ổn định' : isDeg ? 'Suy giảm' : 'Gián đoạn'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
