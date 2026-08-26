import { CheckCircle } from '@phosphor-icons/react'
import Container from '../components/Container'
import Reveal from '../components/Reveal'

const points = [
  'Mỗi chi nhánh có bảng giá và gói hội viên riêng',
  'Dữ liệu từng chi nhánh tách biệt, không lẫn giữa các gym',
  'Hội viên chọn tập tại một chi nhánh hoặc toàn chuỗi',
  'Chủ gym xem báo cáo gộp của toàn bộ hệ thống',
]

export default function FeatureBranches() {
  return (
    <section id="tinh-nang" className="py-20 lg:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-2 lg:order-1">
          <div className="aspect-4/3 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-900">
            <img
              src="https://picsum.photos/seed/fitflow-multi-branch/1000/750"
              alt="Nhân viên lễ tân thao tác trên hệ thống quản lý chi nhánh"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <h2 className="font-display max-w-md text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
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
