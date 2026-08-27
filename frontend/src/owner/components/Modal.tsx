import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  title,
  onClose,
  children,
  size = 'md',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-zinc-950/60 p-3 sm:p-6 backdrop-blur-sm transition-all"
      onClick={onClose}
    >
      <div
        className={`relative my-auto flex max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] w-full ${SIZE_CLASSES[size]} flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl shadow-stone-950/30 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/70`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-stone-100 px-5 sm:px-6 py-4 dark:border-zinc-800">
          <h2 className="font-display text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-stone-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 sm:p-6 text-sm">{children}</div>
      </div>
    </div>,
    document.body
  );
}
