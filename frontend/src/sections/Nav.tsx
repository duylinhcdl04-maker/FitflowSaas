import { useState } from 'react'
import { List, X } from '@phosphor-icons/react'
import Container from '../components/Container'
import Button from '../components/Button'

const links = [
  { href: '#tinh-nang', label: 'Tính năng' },
  { href: '#cach-hoat-dong', label: 'Cách hoạt động' },
  { href: '#bang-gia', label: 'Bảng giá' },
  { href: '#lien-he', label: 'Liên hệ' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/80">
      <Container className="flex h-16 items-center justify-between">
        <a href="#" className="font-display flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-sm text-white dark:bg-emerald-400 dark:text-zinc-950">
            F
          </span>
          FitFlow
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href="/owner/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Đăng nhập
          </a>
          <Button href="/owner/register" className="px-5 py-2.5">
            Dùng thử miễn phí
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 lg:hidden dark:text-zinc-200"
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
        >
          {open ? <X size={22} /> : <List size={22} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-zinc-200 bg-white px-4 py-4 lg:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/owner/login"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Đăng nhập
            </a>
          </nav>
          <Button href="/owner/register" className="mt-3 w-full">
            Dùng thử miễn phí
          </Button>
        </div>
      )}
    </header>
  )
}
