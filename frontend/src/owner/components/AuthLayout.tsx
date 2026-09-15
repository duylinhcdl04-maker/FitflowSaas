import type { ReactNode } from 'react';
import { Buildings, ChartLineUp, UsersThree, Lightning } from '@phosphor-icons/react';
import BrandBadge from './BrandBadge';
import { buildDiscoveryUrl } from '../../tenant/tenant-context';

const HIGHLIGHTS = [
  { icon: Buildings, label: 'Quản lý đa chi nhánh trong một nơi duy nhất' },
  { icon: UsersThree, label: 'Theo dõi hội viên, PT và lịch tập real-time' },
  { icon: ChartLineUp, label: 'Báo cáo doanh thu tự động, đối soát VietQR' },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-[#070609] text-[#F5F3F7]">
      {/* Left Branding Showcase (Desktop) */}
      <aside className="relative hidden w-[42%] shrink-0 overflow-hidden bg-gradient-to-br from-[#120D1D] via-[#1A122B] to-[#0A0710] border-r border-white/8 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* Background Ambient Glows */}
        <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-purple-600/25 blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-purple-900/30 blur-[140px]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] bg-[length:24px_24px]" />

        {/* Brand Header */}
        <div className="relative flex items-center gap-3">
          <a href={buildDiscoveryUrl('/')} className="flex items-center gap-2.5 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <Lightning size={20} weight="fill" />
            </span>
            <span className="font-['Be_Vietnam_Pro',sans-serif] text-2xl font-black tracking-tight text-white uppercase group-hover:text-purple-300 transition-colors">
              FitFlow
            </span>
          </a>
        </div>

        {/* Value Proposition Highlights */}
        <div className="relative flex flex-col gap-8 my-auto py-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-4">
              NỀN TẢNG QUẢN TRỊ FITNESS
            </div>
            <h2 className="font-['Be_Vietnam_Pro',sans-serif] max-w-sm text-3xl xl:text-4xl leading-tight font-extrabold tracking-tight text-white">
              Vận hành phòng gym gọn gàng & bứt phá quy mô
            </h2>
          </div>

          <ul className="flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.label} className="flex items-center gap-3.5 text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#C5C0CD]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-950/80 border border-purple-500/25 text-purple-400">
                  <item.icon size={18} weight="fill" />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-between text-xs text-[#7A7485]">
          <span>© {new Date().getFullYear()} FitFlow Inc.</span>
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Máy chủ hoạt động 100%
          </span>
        </div>
      </aside>

      {/* Right Form Body */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 h-[28rem] w-[28rem] rounded-full bg-purple-600/15 blur-[140px]"
        />

        {/* Mobile Header */}
        <div className="relative mb-8 flex items-center gap-2.5 lg:hidden">
          <BrandBadge />
          <span className="font-['Be_Vietnam_Pro',sans-serif] text-2xl font-black tracking-tight text-white">
            FitFlow
          </span>
        </div>

        <div className="relative w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
