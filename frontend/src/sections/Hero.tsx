import { lazy, Suspense } from 'react'
import { CheckCircle, ArrowRight, ScanSmiley } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import Container from '../components/Container'
import Button from '../components/Button'

// three.js/@react-three/fiber cộng thêm ~230KB gzip vào bundle — tách riêng bằng lazy() để
// CHỈ trang chủ marketing tải phần này (Vite tự tách thành chunk riêng), không cộng dồn vào
// bundle chung của các app Owner/Manager/Staff/PT/Customer vốn không dùng tới.
const GymOrb = lazy(() => import('../components/GymOrb'))

export default function Hero() {
  const reduce = useReducedMotion()

  return (
    <section className="relative overflow-hidden bg-zinc-950 pt-20 pb-24 lg:pt-28 lg:pb-32">
      {/* Nền: gradient tối + hạt grain phá vỡ mảng phẳng, không dùng ảnh stock (xem lịch sử —
          picsum trả ảnh ngẫu nhiên không khớp seed). */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_0%,rgba(16,185,129,0.16),transparent)]"
      />
      <div aria-hidden className="bg-grain pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay" />

      <Container className="relative grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-emerald-300">
            <ScanSmiley size={15} weight="fill" />
            Check-in nhận diện khuôn mặt · đa chi nhánh
          </span>

          <h1 className="font-display mt-6 max-w-xl text-[2.75rem] leading-[1.05] font-extrabold tracking-tight text-white text-balance md:text-6xl lg:text-[3.75rem]">
            Vận hành phòng gym{' '}
            <span className="text-emerald-400">gọn gàng hơn</span> mỗi ngày
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-400 text-pretty">
            Quản lý hội viên, check-in, PT và thanh toán của mọi chi nhánh,
            gọn trong một bảng điều khiển duy nhất.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button href="/owner/register" variant="primary">
              Dùng thử miễn phí
              <ArrowRight size={18} weight="bold" />
            </Button>
            <Button
              href="#bang-gia"
              variant="secondary"
              className="!border-white/15 !text-white hover:!bg-white/5"
            >
              Xem bảng giá
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-3 text-xs text-zinc-500">
            <div className="flex h-2 w-2 shrink-0 items-center justify-center">
              <span className="h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            </div>
            Dùng thử 14 ngày, không cần thẻ thanh toán
          </div>
        </motion.div>

        <motion.div
          className="relative"
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <Suspense
            fallback={
              <div className="aspect-square w-full animate-pulse rounded-full bg-emerald-500/10" />
            }
          >
            <GymOrb reducedMotion={Boolean(reduce)} />
          </Suspense>

          <motion.div
            className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/90 p-4 shadow-2xl shadow-black/40 backdrop-blur-sm lg:left-0 lg:translate-x-0"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle size={20} weight="fill" />
            </span>
            <div className="text-sm">
              <p className="font-semibold text-white">Đã check-in</p>
              <p className="font-mono text-xs text-zinc-500">Chi nhánh Quận 3 · 06:42</p>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}
