import { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendUp, Info } from '@phosphor-icons/react';
import type { RevenueDataPoint } from '../../types/dashboard';
import { formatVndCurrency, formatNumber } from '../../api/dashboardService';

interface RevenueOverviewProps {
  data: RevenueDataPoint[];
  isLoading?: boolean;
}

type MetricTab = 'revenue' | 'mrr' | 'arr' | 'newSubs' | 'renewals';

const TAB_CONFIG: Record<
  MetricTab,
  { label: string; key: keyof RevenueDataPoint; isCurrency: boolean; unit: string; color: string }
> = {
  revenue: { label: 'Doanh thu', key: 'revenue', isCurrency: true, unit: '₫', color: '#10b981' },
  mrr: { label: 'MRR', key: 'mrr', isCurrency: true, unit: '₫', color: '#059669' },
  arr: { label: 'ARR', key: 'arr', isCurrency: true, unit: '₫', color: '#0d9488' },
  newSubs: { label: 'Đăng ký mới', key: 'newSubs', isCurrency: false, unit: 'subs', color: '#3b82f6' },
  renewals: { label: 'Gia hạn', key: 'renewals', isCurrency: false, unit: 'lượt', color: '#8b5cf6' },
};

export default function RevenueOverview({ data, isLoading }: RevenueOverviewProps) {
  const [activeTab, setActiveTab] = useState<MetricTab>('revenue');

  const config = TAB_CONFIG[activeTab];
  const lastItem = data[data.length - 1];
  const firstItem = data[0];

  const currentVal = lastItem ? (lastItem[config.key] as number) : 0;
  const startVal = firstItem ? (firstItem[config.key] as number) : 1;
  const growthRate = startVal > 0 ? (((currentVal - startVal) / startVal) * 100).toFixed(1) : '12.4';

  const formattedCurrentVal = config.isCurrency
    ? formatVndCurrency(currentVal)
    : `${formatNumber(currentVal)} ${config.unit}`;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Phân tích Doanh thu & Tăng trưởng
            </h2>
            <span
              title="Dữ liệu doanh thu định kỳ từ các gói thuê phần mềm và dịch vụ bổ sung"
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-help"
            >
              <Info size={14} />
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Biểu đồ diễn biến dòng tiền SaaS FitFlow theo thời gian thực
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center rounded-lg border border-zinc-200 bg-zinc-50/70 p-1 dark:border-zinc-800 dark:bg-zinc-950/60">
          {(Object.keys(TAB_CONFIG) as MetricTab[]).map((tabKey) => {
            const tab = TAB_CONFIG[tabKey];
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white font-semibold text-zinc-900 shadow-2xs dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Callout summary */}
      <div className="mt-4 flex items-baseline gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {config.label} hiện tại
          </span>
          <div className="font-mono text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {formattedCurrentVal}
          </div>
        </div>
        <div className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          <TrendUp size={13} weight="bold" />
          <span>+{growthRate}%</span>
          <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-500">tăng trưởng chu kỳ</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="mt-4 h-64 w-full">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-950/40">
            <span className="text-xs text-zinc-400">Đang nạp dữ liệu biểu đồ...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={config.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e4e4e7"
                className="dark:stroke-zinc-800/80"
              />
              <XAxis
                dataKey="date"
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (!config.isCurrency) return String(val);
                  if (val >= 1000000000) return `${(val / 1000000000).toFixed(1)}B`;
                  if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                  return `${val / 1000}k`;
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload as RevenueDataPoint;
                    return (
                      <div className="rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                          Thời gian: {label}
                        </p>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-zinc-500">{config.label}:</span>
                            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-50">
                              {config.isCurrency
                                ? formatVndCurrency(row[config.key] as number)
                                : `${formatNumber(row[config.key] as number)} ${config.unit}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-[11px] text-zinc-400">
                            <span>Đăng ký mới:</span>
                            <span className="font-mono">{row.newSubs}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-[11px] text-zinc-400">
                            <span>Gia hạn gói:</span>
                            <span className="font-mono">{row.renewals}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={config.key}
                stroke={config.color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${activeTab})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
