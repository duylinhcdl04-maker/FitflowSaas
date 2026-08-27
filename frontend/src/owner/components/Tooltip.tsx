import { useState, type ReactNode } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  type Placement,
} from '@floating-ui/react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: Placement;
  disabled?: boolean;
}

export default function Tooltip({
  content,
  children,
  placement = 'right',
  disabled = false,
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen && !disabled,
    onOpenChange: setIsOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(10), flip(), shift({ padding: 8 })],
  });

  const hover = useHover(context, { move: false });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  if (disabled || !content) return <>{children}</>;

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} className="inline-flex">
        {children}
      </div>
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-100 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 animate-in fade-in zoom-in-95 duration-150"
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
