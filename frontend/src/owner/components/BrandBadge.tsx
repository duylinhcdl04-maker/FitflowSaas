interface BrandBadgeProps {
  brandName?: string;
  className?: string;
}

export default function BrandBadge({ brandName = 'FitFlow', className = '' }: BrandBadgeProps) {
  const initial = (brandName || 'FitFlow').trim().charAt(0).toUpperCase() || 'F';
  return (
    <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 text-sm font-bold text-white shadow-lg shadow-purple-600/30 shrink-0 transition-transform hover:scale-105 ${className}`}>
      {initial}
    </span>
  );
}
