import { CheckCircle, ArrowRight } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import Container from '../components/Container'
import Button from '../components/Button'

export default function Hero() {
  const reduce = useReducedMotion()

  return (
    <section className="relative overflow-hidden pt-16 pb-20 lg:pt-20 lg:pb-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display max-w-2xl text-4xl leading-[1.1] font-bold tracking-tight text-zinc-900 md:text-5xl lg:text-6xl dark:text-zinc-50">
            Một nền tảng cho cả chuỗi phòng gym
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Quản lý hội viên, check-in, PT và thanh toán của mọi chi nhánh, gọn
            trong một bảng điều khiển duy nhất.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button href="/owner/register" variant="primary">
              Dùng thử miễn phí
              <ArrowRight size={18} weight="bold" />
            </Button>
            <Button href="#bang-gia" variant="secondary">
              Xem bảng giá
            </Button>
          </div>
        </motion.div>

        <motion.div
          className="relative"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          <div className="aspect-4/5 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            {/* TODO: replace with real FitFlow product/brand photography before launch */}
            <img
              src="https://picsum.photos/seed/fitflow-branch-floor/900/1125"
              alt="Sàn tập của một chi nhánh phòng gym"
              className="h-full w-full object-cover"
              loading="eager"
            />
          </div>

          <div className="absolute -bottom-6 -left-6 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              <CheckCircle size={20} weight="fill" />
            </span>
            <div className="text-sm">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Đã check-in</p>
              <p className="text-zinc-500 dark:text-zinc-400">Chi nhánh Quận 3, 06:42</p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  )
}
