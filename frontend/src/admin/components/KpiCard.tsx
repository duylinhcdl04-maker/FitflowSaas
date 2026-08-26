import type { Icon } from '@phosphor-icons/react';
import Card from './Card';

type Tone = 'emerald' | 'blue' | 'amber' | 'red';

const TONE_STYLES: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
};

export default function KpiCard({
  icon: IconComponent,
  tone,
  label,
  value,
  hint,
}: {
  icon: Icon;
  tone: Tone;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${TONE_STYLES[tone]}`}>
          <IconComponent size={18} weight="bold" />
        </span>
      </div>
      <p className="font-mono mt-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>}
    </Card>
  );
}
