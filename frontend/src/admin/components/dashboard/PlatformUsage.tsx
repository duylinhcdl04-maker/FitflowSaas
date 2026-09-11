import {
  Users,
  SignIn,
  Scan,
  Database,
  HardDrive,
  Bell,
  TrendUp,
  TrendDown,
} from '@phosphor-icons/react';
import type { PlatformUsageItem } from '../../types/dashboard';

interface PlatformUsageProps {
  metrics: PlatformUsageItem[];
  isLoading?: boolean;
}

export default function PlatformUsage({ metrics, isLoading }: PlatformUsageProps) {
  const iconMap: Record<string, JSX.Element> = {
    'usg-1': <Users size={16} className="text-emerald-500" />,
    'usg-2': <SignIn size={16} className="text-blue-500" />,
    'usg-3': <Scan size={16} className="text-purple-500" />,
    'usg-4': <Database size={16} className="text-teal-500" />,
    'usg-5': <HardDrive size={16} className="text-amber-500" />,
    'usg-6': <Bell size={16} className="text-indigo-500" />,
  };

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Tần suất Sử dụng Nền tảng (Platform Usage)
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Hoạt động người dùng cuối, lượt quét khuôn mặt và tài nguyên hệ thống
          </p>
        </div>
        <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">Live Telemetry</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((item) => {
          const isUp = item.trend === 'up';
          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800/80 dark:bg-zinc-950/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  {item.label}
                </span>
                <span className="p-1">{iconMap[item.id] ?? <Users size={16} />}</span>
              </div>

              <div className="mt-2.5">
                <div className="font-mono text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {item.value}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px]">
                  <span
                    className={`inline-flex items-center font-mono font-semibold ${
                      isUp
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {isUp ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} />}
                    {item.changePercent > 0 ? `+${item.changePercent}%` : `${item.changePercent}%`}
                  </span>
                  <span className="text-zinc-400 dark:text-zinc-500 truncate">
                    {item.timeframe}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
