import type { ReactNode } from 'react';

export const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-2xs transition-colors placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500';

export default function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}
