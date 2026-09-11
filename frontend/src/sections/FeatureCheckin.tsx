import { ScanSmiley, QrCode, Timer } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import Container from '../components/Container'
import Reveal from '../components/Reveal'

export default function FeatureCheckin() {
  const reduce = useReducedMotion()

  return (
    <section className="bg-zinc-50 py-20 lg:py-28 dark:bg-zinc-900/40">
      <Container>
        <Reveal>
          <h2 className="font-display max-w-lg text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            Check-in nhanh, không cần xếp hàng ở quầy lễ tân
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Reveal delay={0.05} className="md:col-span-2">
            <div className="relative flex h-full min-h-80 flex-col justify-end overflow-hidden rounded-3xl bg-zinc-950 p-8">
              <div
                aria-hidden
                className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(16,185,129,0.28),transparent_60%)]"
              />
              <div aria-hidden className="bg-grain pointer-events-none absolute inset-0 opacity-[0.05]" />

              {/* Vòng quét mô phỏng kiosk nhận diện khuôn mặt — thay ảnh stock, thể hiện đúng
                  tính năng thật (xem backend/docs/face-checkin.md). */}
              <div aria-hidden className="absolute top-8 right-8 hidden h-40 w-40 sm:block">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-emerald-400/40"
                  animate={reduce ? {} : { scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="absolute inset-6 rounded-full border border-emerald-400/60" />
                <div className="absolute inset-12 flex items-center justify-center rounded-full bg-emerald-500/10">
                  <ScanSmiley size={32} weight="fill" className="text-emerald-400" />
                </div>
              </div>

              <div className="relative">
                <ScanSmiley size={28} weight="fill" className="text-emerald-400" />
                <h3 className="font-display mt-3 text-xl font-semibold text-white">
                  Nhận diện khuôn mặt
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
                  Hội viên bước qua cổng, hệ thống tự nhận diện và ghi nhận
                  lượt tập trong chưa đầy một giây.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal delay={0.1}>
              <div className="rounded-3xl bg-emerald-600 p-6 text-white dark:bg-emerald-500 dark:text-zinc-950">
                <QrCode size={26} weight="fill" />
                <h3 className="font-display mt-3 text-lg font-semibold">
                  Check-in bằng QR
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-emerald-50 dark:text-zinc-900/80">
                  Hội viên quét mã hội viên riêng, không cần thẻ từ hay giấy
                  tờ.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-zinc-950">
                <Timer size={26} weight="fill" className="text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-display mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Tự động check-out
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Đặt thời lượng mỗi lượt tập, hệ thống tự đóng phiên nếu
                  hội viên quên check-out.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
