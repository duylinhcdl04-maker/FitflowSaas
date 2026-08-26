import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

export default function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** Sticky action bar, visually separated from the (optionally scrollable) body. */
  footer?: ReactNode;
  size?: keyof typeof SIZES;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-[2px] animate-[admin-backdrop-in_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        className={`flex max-h-[min(88vh,42rem)] w-full ${SIZES[size]} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-zinc-950/10 ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/40 dark:ring-white/10 animate-[admin-modal-in_150ms_ease-out]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div>
            <h2 className="font-display text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6">{children}</div>

        {footer && (
          <div className="shrink-0 border-t border-zinc-100 bg-zinc-50/60 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
