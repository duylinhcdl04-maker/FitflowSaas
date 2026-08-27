import type { Icon } from '@phosphor-icons/react';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import Card from './Card';

type Tone = 'emerald' | 'blue' | 'amber' | 'zinc' | 'violet';

// Wash backgrounds stay under ~10% opacity per dataviz-skill's area-fill spec, so the
// card reads as tinted paper rather than a saturated block — the icon chip alone
// carries the full-strength tone.
const TONE_STYLES: Record<Tone, { chip: string; wash: string; ring: string; spark: string }> = {
  emerald: {
    chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    wash: 'from-emerald-50/80 dark:from-emerald-500/[0.06]',
    ring: 'group-hover:ring-emerald-500/20',
    spark: '#10b981',
  },
  blue: {
    chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    wash: 'from-blue-50/80 dark:from-blue-500/[0.06]',
    ring: 'group-hover:ring-blue-500/20',
    spark: '#2a78d6',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    wash: 'from-amber-50/80 dark:from-amber-500/[0.06]',
    ring: 'group-hover:ring-amber-500/20',
    spark: '#eda100',
  },
  violet: {
    chip: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
    wash: 'from-violet-50/80 dark:from-violet-500/[0.06]',
    ring: 'group-hover:ring-violet-500/20',
    spark: '#7c6ce8',
  },
  zinc: {
    chip: 'bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
    wash: 'from-stone-100/60 dark:from-zinc-500/[0.04]',
    ring: 'group-hover:ring-zinc-400/20',
    spark: '#898781',
  },
};

export default function KpiCard({
  icon: IconComponent,
  tone = 'emerald',
  label,
  value,
  hint,
  growthPct,
  trend,
}: {
  icon: Icon;
  tone?: Tone;
  label: string;
  value: string;
  hint?: string;
  growthPct?: number | null;
  /** Optional 8-16 point history feeding a mini sparkline (dataviz-skill "trend" slot on the stat-tile contract). */
  trend?: number[];
}) {
  const t = TONE_STYLES[tone];
  const hasTrend = trend && trend.length >= 2;

  return (
    <Card
      padded={false}
      // h-full: without it, a card with no growthPct/hint (Check-in, Hội viên hoạt
      // động) sizes to its shorter content and the grid's row-stretch only inflates
      // this *wrapper* — not this actual card box — leaving the 4-up KPI row visibly
      // uneven. flex/flex-col + the value block below lets every card fill the row's
      // tallest sibling instead of trailing whitespace unevenly.
      className={`group relative flex h-full flex-col overflow-hidden ring-1 ring-transparent transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-stone-950/[0.06] dark:hover:shadow-black/20 ${t.ring}`}
    >
      {/* Tonal wash — decorative, stays under the content, never used to carry the number itself. */}
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${t.wash} to-transparent`} />

      <div className="relative flex items-start justify-between gap-3 p-5 pb-3">
        <p className="text-[13px] font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${t.chip}`}>
          <IconComponent size={18} weight="fill" />
        </span>
      </div>

      <div className="relative flex items-end justify-between gap-3 px-5 pb-5">
        <div>
          {/* Proportional figures, not tabular-nums — large standalone values read tighter
              in the font's default figure style (dataviz-skill: "Figures — when the form is a number"). */}
          <p className="font-display text-[28px] font-bold leading-none text-zinc-900 dark:text-zinc-50">{value}</p>
          {growthPct !== undefined && growthPct !== null ? (
            <p
              className={`mt-2 flex items-center gap-1 text-xs font-semibold ${growthPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {growthPct >= 0 ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
              {Math.abs(growthPct)}% so với kỳ trước
            </p>
          ) : (
            hint && <p className="mt-2 text-xs text-zinc-400">{hint}</p>
          )}
        </div>

        {hasTrend && (
          <div className="h-10 w-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend!.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={`spark-${tone}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={t.spark} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={t.spark} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={t.spark} strokeWidth={1.75} fill={`url(#spark-${tone})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}
