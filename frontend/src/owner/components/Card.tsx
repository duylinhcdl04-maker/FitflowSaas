import type { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border border-stone-200/70 bg-white shadow-sm shadow-stone-950/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none ${padded ? 'p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
