export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-stone-200/70 dark:bg-zinc-800 ${className}`} />;
}
