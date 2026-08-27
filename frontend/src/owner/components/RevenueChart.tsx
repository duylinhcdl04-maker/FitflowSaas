import { Info } from '@phosphor-icons/react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useThemeStore } from '../../store/theme-store';

export interface RevenuePoint {
  date: string;
  revenue: number;
}

function formatCompact(n: number) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}Tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-stone-200 bg-white/95 px-3 py-2 shadow-lg shadow-stone-950/10 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/95">
      <p className="text-[11px] font-medium text-zinc-400">{label}</p>
      {/* Value leads, series name follows — dataviz-skill tooltip hierarchy. */}
      <p className="font-display text-sm font-bold text-zinc-900 dark:text-zinc-50">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0].value)}
      </p>
    </div>
  );
}

/**
 * Single-series revenue-over-time area chart. Sequential (magnitude) encoding, one
 * validated emerald hue — no legend needed (dataviz-skill: "a single series needs
 * no legend box"). Line 2px, area wash ~10% opacity, hairline recessive gridlines,
 * crosshair tooltip on hover — per references/marks-and-anatomy.md + interaction.md.
 */
export default function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  // Contrast-checked against this app's real card surfaces (#ffffff / #18181b) with
  // the dataviz skill's validator — both clear the >=3:1 mark-vs-surface floor.
  const stroke = isDark ? '#34d399' : '#059669';
  const grid = isDark ? '#2c2c2a' : '#e1e0d9';
  const tick = '#898781';

  if (data.length === 0) {
    return <div className="flex h-64 items-center justify-center text-sm text-zinc-400">Chưa có dữ liệu doanh thu trong khoảng thời gian này.</div>;
  }

  // A trend line needs >=2 points to draw anything — one lone point floating on an
  // otherwise-empty axis reads as broken, not "no data yet". Per the dataviz skill's
  // form table ("a single current value -> stat tile, not a one-bar bar chart"), the
  // number is already the KPI card above; here we just say why there's no line yet.
  if (data.length === 1) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-sm text-zinc-400">
        <Info size={20} className="text-zinc-300 dark:text-zinc-600" />
        <p>
          Chỉ có 1 mốc dữ liệu trong khoảng đã chọn — số liệu đã hiển thị ở thẻ <strong className="text-zinc-500 dark:text-zinc-400">Doanh thu</strong> phía trên.
          <br />
          Chọn <strong className="text-zinc-500 dark:text-zinc-400">"7 ngày qua"</strong> hoặc <strong className="text-zinc-500 dark:text-zinc-400">"Tháng này"</strong> để xem xu hướng theo đường.
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={grid} strokeDasharray="0" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: tick, fontSize: 11 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: tick, fontSize: 11 }}
          tickFormatter={formatCompact}
          width={48}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: grid, strokeWidth: 1 }} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={stroke}
          strokeWidth={2}
          fill="url(#revenue-fill)"
          activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--chart-surface, #fff)', fill: stroke }}
          // Re-filtering (range/branch/group-by) shouldn't replay a 1.5s draw-in every
          // time — that reads as flicker/lag on a dashboard people filter repeatedly.
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
