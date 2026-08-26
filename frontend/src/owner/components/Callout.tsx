import type { ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { CheckCircle, Info, Warning, XCircle } from '@phosphor-icons/react';

type Tone = 'info' | 'warning' | 'danger' | 'success';

const TONE_STYLES: Record<Tone, { box: string; icon: string }> = {
  info: {
    box: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-500/10',
    icon: 'text-blue-500 dark:text-blue-400',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-500/10',
    icon: 'text-amber-500 dark:text-amber-400',
  },
  danger: {
    box: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-500/10',
    icon: 'text-red-500 dark:text-red-400',
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10',
    icon: 'text-emerald-500 dark:text-emerald-400',
  },
};

const DEFAULT_ICONS: Record<Tone, Icon> = { info: Info, warning: Warning, danger: XCircle, success: CheckCircle };

export default function Callout({
  tone = 'info',
  icon,
  action,
  children,
  className = '',
}: {
  tone?: Tone;
  icon?: Icon;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const style = TONE_STYLES[tone];
  const IconComponent = icon ?? DEFAULT_ICONS[tone];
  return (
    <div className={`flex flex-wrap items-center gap-3 rounded-2xl border p-4 text-sm ${style.box} ${className}`}>
      <IconComponent size={18} weight="fill" className={`shrink-0 ${style.icon}`} />
      <div className="min-w-0 flex-1 leading-relaxed text-zinc-700 dark:text-zinc-300">{children}</div>
      {action}
    </div>
  );
}
