import type { ReactNode } from 'react';
import { X } from '@phosphor-icons/react';

// Owner Portal modal — rounded-3xl, stone-tinted, cùng bộ nhận diện với Card
// (components/Card.tsx), tách biệt khỏi Modal.tsx bên Admin console.
export default function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(88vh,42rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-xl shadow-stone-950/10 dark:bg-zinc-900 dark:shadow-black/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 pt-6 pb-4">
          <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-stone-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            aria-label="Đóng"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
