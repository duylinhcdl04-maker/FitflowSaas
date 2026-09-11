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
      className={`rounded-2xl border border-stone-200/80 bg-white text-zinc-900 shadow-2xs dark:border-zinc-800/80 dark:bg-zinc-900 dark:text-zinc-50 ${padded ? 'p-6' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
