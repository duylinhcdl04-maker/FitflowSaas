import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { List, X, ArrowRight } from '@phosphor-icons/react'

const navLinks = [
  { href: '#features', label: 'Tính năng' },
  { href: '#ecosystem', label: 'Hệ sinh thái' },
  { href: '#showcase', label: 'Bảng điều khiển' },
  { href: '#solutions', label: 'Giải pháp' },
  { href: '#pricing', label: 'Bảng giá' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 40)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'h-16 bg-[#070609]/85 backdrop-blur-md border-b border-white/7'
          : 'h-20 bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo - Typography Based */}
        <a
          href="#"
          className="group flex items-center gap-2.5 text-white focus:outline-none"
        >
          <span className="font-['Be_Vietnam_Pro',sans-serif] text-2xl sm:text-3xl font-black tracking-tight text-white uppercase group-hover:text-purple-400 transition-colors">
            FITFLOW
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-['Plus_Jakarta_Sans',sans-serif] font-medium text-[#A7A1AD] hover:text-[#F5F3F7] transition-colors tracking-wide relative group py-1"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-purple-500 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="/owner/login"
            className="text-sm font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-[#A7A1AD] hover:text-white px-3.5 py-2 transition-colors"
          >
            Đăng nhập
          </a>
          <a
            href="/owner/register"
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-[8px] bg-purple-600 hover:bg-purple-500 text-white font-['Plus_Jakarta_Sans',sans-serif] text-sm font-semibold tracking-wide transition-all shadow-[0_0_24px_rgba(168,85,247,0.25)] hover:shadow-[0_0_32px_rgba(168,85,247,0.4)] active:scale-98"
          >
            <span>Dùng thử miễn phí</span>
            <ArrowRight
              size={15}
              weight="bold"
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </a>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#A7A1AD] hover:text-white focus:outline-none"
          aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <List size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden bg-[#0B090E] border-b border-white/10 px-6 py-5 overflow-hidden"
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-['Plus_Jakarta_Sans',sans-serif] font-medium text-[#A7A1AD] hover:text-white py-1"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 border-t border-white/8 flex flex-col gap-3">
                <a
                  href="/owner/login"
                  className="w-full text-center py-2.5 text-sm font-semibold text-[#A7A1AD] hover:text-white rounded-[8px] bg-white/5"
                >
                  Đăng nhập
                </a>
                <a
                  href="/owner/register"
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-[8px] bg-purple-600 hover:bg-purple-500"
                >
                  <span>Dùng thử miễn phí</span>
                  <ArrowRight size={16} weight="bold" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
