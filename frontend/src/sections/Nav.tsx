import { useEffect, useState } from 'react'
import { List, X, Lightning } from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'motion/react'
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
  // Nền nav chỉ đặc lại khi đã cuộn qua Hero (luôn tối) — tránh chữ trắng của Hero chồng lên
  // nền nav trắng ngay từ đầu trang.
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 32)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? 'border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/70'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <Container className="flex h-16 items-center justify-between lg:h-20">
        <a href="#" className="font-display flex items-center gap-2.5 text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.6)]">
            <Lightning size={18} weight="fill" />
          </span>
          FitFlow
        </a>

        <nav className="hidden items-center gap-9 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <a
            href="/owner/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-zinc-200 bg-white px-4 lg:hidden dark:border-white/10 dark:bg-zinc-950"
          >
            <nav className="flex flex-col gap-1 py-4">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/owner/login"
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-white/5"
              >
                Đăng nhập
              </a>
            </nav>
            <Button href="/owner/register" className="mb-4 w-full">
              Dùng thử miễn phí
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
