import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: ReactNode;
  to?: string;
  href?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  form?: string;
};

// Owner Portal button — pill-shaped, mirrors the marketing site's consumer-
// facing language (src/components/Button.tsx) rather than the Admin
// console's rounded-lg "enterprise" style. Deliberately warmer/friendlier.
const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-transform duration-200 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:pointer-events-none disabled:opacity-50';

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

const variants: Record<Variant, string> = {
  primary:
    'bg-emerald-700 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-800 dark:bg-emerald-400 dark:text-zinc-950 dark:hover:bg-emerald-300',
  secondary:
    'border border-stone-300 bg-white text-zinc-800 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
  ghost: 'text-zinc-600 hover:bg-stone-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
};

export default function Button({
  children,
  to,
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  form,
}: ButtonProps) {
  const classes = `${base} ${sizes[size]} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} form={form} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
