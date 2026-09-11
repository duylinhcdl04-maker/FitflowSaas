import { CheckCircle, Buildings } from '@phosphor-icons/react'
import { motion, useReducedMotion } from 'motion/react'
import Container from '../components/Container'
import Reveal from '../components/Reveal'

const points = [
  'Mỗi chi nhánh có bảng giá và gói hội viên riêng',
  'Dữ liệu từng chi nhánh tách biệt, không lẫn giữa các gym',
  'Hội viên chọn tập tại một chi nhánh hoặc toàn chuỗi',
  'Chủ gym xem báo cáo gộp của toàn bộ hệ thống',
]

// Mô phỏng UI thật của sản phẩm (bộ chọn chi nhánh) thay ảnh stock không liên quan —
// xem ghi chú trong FeatureCheckin.tsx.
const branches = [
  { name: 'Chi nhánh Quận 3', members: 412, revenue: '84,2tr' },
  { name: 'Chi nhánh Quận 7', members: 268, revenue: '51,6tr' },
  { name: 'Chi nhánh Thủ Đức', members: 195, revenue: '37,9tr' },
]

export default function FeatureBranches() {
  const reduce = useReducedMotion()

  return (
    <section id="tinh-nang" className="py-20 lg:py-28">
      <Container className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-emerald-50/40 p-6 dark:border-white/10 dark:from-zinc-900 dark:to-emerald-950/20">
            <div aria-hidden className="bg-grain pointer-events-none absolute inset-0 opacity-[0.03]" />
            <div className="relative flex h-full flex-col justify-center gap-3">
              {branches.map((b, i) => (
                <motion.div
                  key={b.name}
                  initial={reduce ? false : { opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.5, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex items-center justify-between rounded-2xl border p-4 shadow-sm ${
                    i === 0
                      ? 'border-emerald-600/30 bg-white shadow-emerald-900/5 dark:border-emerald-400/25 dark:bg-zinc-950'
                      : 'border-zinc-200 bg-white/70 dark:border-white/10 dark:bg-zinc-950/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        i === 0
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400'
                      }`}
                    >
                      <Buildings size={18} weight="fill" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{b.name}</p>
                      <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{b.members} hội viên</p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {b.revenue}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <h2 className="font-display max-w-md text-3xl font-extrabold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            Vận hành nhiều chi nhánh như một hệ thống duy nhất
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Mở rộng thêm chi nhánh mà không cần đổi phần mềm hay quản lý rời
            rạc từng nơi.
          </p>
          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle
                  size={22}
                  weight="fill"
                  className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400"
                />
                <span className="text-zinc-700 dark:text-zinc-300">{point}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  )
}
