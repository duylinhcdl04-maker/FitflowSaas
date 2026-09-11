import { Lightning } from '@phosphor-icons/react'
import Container from '../components/Container'

const columns = [
  {
    title: 'Sản phẩm',
    links: [
      { label: 'Tính năng', href: '#tinh-nang' },
      { label: 'Cách hoạt động', href: '#cach-hoat-dong' },
      { label: 'Bảng giá', href: '#bang-gia' },
    ],
  },
  {
    title: 'Công ty',
    links: [
      { label: 'Giới thiệu', href: '#' },
      { label: 'Liên hệ', href: '#lien-he' },
    ],
  },
  {
    title: 'Pháp lý',
    links: [
      { label: 'Điều khoản dịch vụ', href: '#' },
      { label: 'Chính sách bảo mật', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer id="lien-he" className="border-t border-zinc-200 py-16 dark:border-white/10">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <a href="#" className="font-display flex items-center gap-2.5 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.6)]">
                <Lightning size={18} weight="fill" />
              </span>
              FitFlow
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Nền tảng quản lý phòng gym và fitness đa chi nhánh cho các
              doanh nghiệp tại Việt Nam.
            </p>
            {/* TODO: swap for the real support inbox before launch */}
            <a
              href="mailto:hello@fitflow.vn"
              className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              hello@fitflow.vn
            </a>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-zinc-200 pt-8 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
          © {new Date().getFullYear()} FitFlow. Đã đăng ký bản quyền.
        </div>
      </Container>
    </footer>
  )
}
