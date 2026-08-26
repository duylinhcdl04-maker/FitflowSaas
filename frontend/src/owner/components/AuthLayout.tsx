import type { ReactNode } from 'react';
import { Buildings, ChartLineUp, UsersThree } from '@phosphor-icons/react';
import BrandBadge from './BrandBadge';

const HIGHLIGHTS = [
  { icon: Buildings, label: 'Quản lý đa chi nhánh trong một nơi duy nhất' },
  { icon: UsersThree, label: 'Theo dõi hội viên, PT và lịch tập real-time' },
  { icon: ChartLineUp, label: 'Báo cáo doanh thu tự động, không cần Excel' },
];

// Khung dùng chung cho toàn bộ luồng đăng nhập/đăng ký (FindStore, Login,
// Register, VerifyOtp, Welcome) — bố cục split-screen: panel thương hiệu bên
// trái (ẩn dưới lg) + form bên phải, thay cho một thẻ nhỏ nằm giữa nền phẳng.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-stone-50 dark:bg-zinc-950">
      <aside className="relative hidden w-[40%] shrink-0 overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-950 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/30 blur-[100px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-emerald-950/60 blur-[110px]" />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[length:28px_28px]" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-base font-bold text-white ring-1 ring-white/20 backdrop-blur">
            F
          </span>
          <span className="font-display text-lg font-bold text-white">FitFlow</span>
        </div>

        <div className="relative flex flex-col gap-8">
          <h2 className="font-display max-w-sm text-3xl leading-tight font-bold tracking-tight text-white xl:text-4xl">
            Vận hành phòng gym gọn gàng hơn mỗi ngày
          </h2>
          <ul className="flex flex-col gap-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.label} className="flex items-center gap-3 text-sm text-emerald-50/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/15">
                  <item.icon size={18} weight="fill" />
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-emerald-100/60">© {new Date().getFullYear()} FitFlow. Nền tảng quản lý phòng gym.</p>
      </aside>

      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-10rem] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-[100px] lg:hidden dark:bg-emerald-500/10"
        />
        <div className="relative mb-6 flex items-center gap-2.5 lg:hidden">
          <BrandBadge />
          <span className="font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">FitFlow</span>
        </div>
        {children}
      </div>
    </div>
  );
}
