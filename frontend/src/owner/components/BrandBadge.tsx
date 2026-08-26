interface BrandBadgeProps {
  brandName?: string;
  className?: string;
}

export default function BrandBadge({ brandName = 'FitFlow', className = '' }: BrandBadgeProps) {
  const initial = (brandName || 'FitFlow').trim().charAt(0).toUpperCase() || 'F';
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white shadow-md shadow-emerald-600/20 dark:bg-emerald-400 dark:text-zinc-950 shrink-0 transition-transform hover:scale-105 ${className}`}>
      {initial}
    </span>
  );
}
