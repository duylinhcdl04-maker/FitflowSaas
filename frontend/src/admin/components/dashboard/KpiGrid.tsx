import {
  CurrencyDollar,
  Buildings,
  Users,
  TrendUp,
  TrendDown,
  WarningCircle,
} from '@phosphor-icons/react';
import type { KpiMetric } from '../../types/dashboard';
import KpiCard from './KpiCard';
import { Skeleton } from '../Skeleton';

interface KpiGridProps {
  kpis: KpiMetric[];
  isLoading?: boolean;
}

export default function KpiGrid({ kpis, isLoading }: KpiGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <div className="mt-3">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="mt-2 h-3.5 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const iconMap: Record<string, JSX.Element> = {
    mrr: <CurrencyDollar size={18} weight="bold" />,
    active_tenants: <Buildings size={18} weight="bold" />,
    total_users: <Users size={18} weight="bold" />,
    arr: <TrendUp size={18} weight="bold" />,
    churn_rate: <TrendDown size={18} weight="bold" />,
    failed_payments: <WarningCircle size={18} weight="bold" />,
  };

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
      {kpis.map((kpi) => (
        <KpiCard
          key={kpi.id}
          metric={kpi}
          icon={iconMap[kpi.id] ?? <CurrencyDollar size={18} />}
        />
      ))}
    </div>
  );
}
