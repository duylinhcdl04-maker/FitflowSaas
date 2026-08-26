import type { Icon } from '@phosphor-icons/react';

export default function EmptyState({
  icon: IconComponent,
  title,
  description,
}: {
  icon: Icon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        <IconComponent size={22} />
      </span>
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      {description && <p className="max-w-xs text-xs text-zinc-400">{description}</p>}
    </div>
  );
}
