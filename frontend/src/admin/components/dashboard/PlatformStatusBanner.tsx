import { useState } from 'react';
import { CheckCircle, WarningCircle, ArrowRight, X } from '@phosphor-icons/react';
import type { ServiceHealthItem } from '../../types/dashboard';

interface PlatformStatusBannerProps {
  services: ServiceHealthItem[];
  onViewHealth: () => void;
}

export default function PlatformStatusBanner({ services, onViewHealth }: PlatformStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const degradedCount = services.filter((s) => s.status !== 'operational').length;
  const isHealthy = degradedCount === 0;

  if (dismissed) return null;

  return (
    <div
      className={`relative flex flex-col gap-2.5 rounded-xl border px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between transition-all ${
        isHealthy
          ? 'border-emerald-200/80 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'
          : 'border-amber-200/90 bg-amber-50/80 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/25 dark:text-amber-300'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
              isHealthy ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span
            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
              isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
        </span>

        {isHealthy ? (
          <div className="flex flex-wrap items-center gap-1.5 font-medium">
            <span className="font-semibold text-emerald-950 dark:text-emerald-100">
              Tất cả hệ thống đang hoạt động bình thường
            </span>
            <span className="text-emerald-700/80 dark:text-emerald-400/80">
              — API, Database, Redis, Object Storage và Face AI hoạt động ổn định (99.98% uptime).
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-1.5 font-medium">
            <span className="font-semibold text-amber-950 dark:text-amber-100">
              {degradedCount} dịch vụ cần chú ý
            </span>
            <span className="text-amber-800/80 dark:text-amber-300/80">
              — Độ trễ xử lý tăng nhẹ hoặc có dịch vụ đang suy giảm hiệu năng.
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 self-end sm:self-auto">
        <span className="hidden text-[11px] text-zinc-500 md:inline dark:text-zinc-400">
          Cập nhật: 10 giây trước
        </span>
        <button
          type="button"
          onClick={onViewHealth}
          className="inline-flex items-center gap-1 font-semibold underline-offset-2 hover:underline"
        >
          <span>Xem chi tiết hạ tầng</span>
          <ArrowRight size={13} />
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          aria-label="Đóng banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
