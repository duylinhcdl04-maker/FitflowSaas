import type { ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { CheckCircle, Info, Warning, XCircle } from '@phosphor-icons/react';

type Tone = 'info' | 'warning' | 'danger' | 'success';

const TONE_STYLES: Record<Tone, { box: string; icon: string; title: string }> = {
  info: {
    box: 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-500/10',
    icon: 'text-blue-500 dark:text-blue-400',
    title: 'text-blue-800 dark:text-blue-300',
  },
  warning: {
    box: 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-500/10',
    icon: 'text-amber-500 dark:text-amber-400',
    title: 'text-amber-800 dark:text-amber-300',
  },
  danger: {
    box: 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-500/10',
    icon: 'text-red-500 dark:text-red-400',
    title: 'text-red-800 dark:text-red-300',
  },
  success: {
    box: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-500/10',
    icon: 'text-emerald-500 dark:text-emerald-400',
    title: 'text-emerald-800 dark:text-emerald-300',
  },
};

const DEFAULT_ICONS: Record<Tone, Icon> = {
  info: Info,
  warning: Warning,
  danger: XCircle,
  success: CheckCircle,
};

/** Shared visual language for inline notices — replaces one-off colored `<div>`s across CRUD popups. */
export default function Callout({
  tone = 'info',
  title,
  icon,
  children,
  className = '',
}: {
  tone?: Tone;
  title?: string;
  icon?: Icon;
  children?: ReactNode;
  className?: string;
}) {
  const style = TONE_STYLES[tone];
  const IconComponent = icon ?? DEFAULT_ICONS[tone];

  return (
    <div className={`flex gap-2.5 rounded-lg border p-3 text-xs ${style.box} ${className}`}>
      <IconComponent size={16} weight="fill" className={`mt-0.5 shrink-0 ${style.icon}`} />
      <div className="min-w-0 flex-1 leading-relaxed text-zinc-700 dark:text-zinc-300">
        {title && <p className={`font-semibold ${style.title}`}>{title}</p>}
        {children}
      </div>
    </div>
  );
}
