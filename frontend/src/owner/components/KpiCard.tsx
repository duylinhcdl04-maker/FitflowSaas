import type { Icon } from '@phosphor-icons/react';
import { ArrowDown, ArrowUp } from '@phosphor-icons/react';
import Card from './Card';

type Tone = 'emerald' | 'blue' | 'amber' | 'zinc';

const TONE_STYLES: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  zinc: 'bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
};

export default function KpiCard({
  icon: IconComponent,
  tone = 'emerald',
  label,
  value,
  hint,
  growthPct,
}: {
  icon: Icon;
  tone?: Tone;
  label: string;
  value: string;
  hint?: string;
  growthPct?: number | null;
}) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${TONE_STYLES[tone]}`}>
          <IconComponent size={20} weight="fill" />
        </span>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
      <p className="font-display mt-3 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
      {growthPct !== undefined && growthPct !== null ? (
        <p
          className={`mt-1 flex items-center gap-1 text-xs font-medium ${growthPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
        >
          {growthPct >= 0 ? <ArrowUp size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
          {Math.abs(growthPct)}% so với kỳ trước
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>
      )}
    </Card>
  );
}
