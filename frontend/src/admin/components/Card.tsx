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
      className={`rounded-2xl border border-zinc-200/80 bg-white shadow-sm shadow-zinc-950/[0.03] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none ${padded ? 'p-5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
