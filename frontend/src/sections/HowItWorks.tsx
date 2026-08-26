import { Buildings, UsersThree, QrCode, ChartLineUp } from '@phosphor-icons/react'
import Container from '../components/Container'
import Reveal from '../components/Reveal'

const steps = [
  {
    icon: Buildings,
    title: 'Tạo chi nhánh và mời nhân viên',
    body: 'Thêm chi nhánh đầu tiên, mời quản lý, lễ tân và PT vào hệ thống với quyền phù hợp.',
  },
  {
    icon: UsersThree,
    title: 'Thêm gói hội viên và mức giá',
    body: 'Cấu hình gói tập, giá theo chi nhánh và phạm vi sử dụng cho hội viên.',
  },
  {
    icon: QrCode,
    title: 'Check-in và thu tiền tại quầy',
    body: 'Hội viên check-in bằng khuôn mặt hoặc QR, thanh toán được ghi nhận ngay lập tức.',
  },
  {
    icon: ChartLineUp,
    title: 'Theo dõi doanh thu theo thời gian thực',
    body: 'Xem báo cáo từng chi nhánh và toàn chuỗi trên cùng một bảng điều khiển.',
  },
]

export default function HowItWorks() {
  return (
    <section id="cach-hoat-dong" className="bg-zinc-50 py-20 lg:py-28 dark:bg-zinc-900/40">
      <Container>
        <Reveal>
          <h2 className="font-display max-w-lg text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            Bắt đầu trong bốn bước
          </h2>
        </Reveal>

        <div className="relative mt-12 grid gap-8 md:grid-cols-4">
          <div
            aria-hidden
            className="absolute top-6 right-0 left-0 hidden h-px bg-zinc-200 md:block dark:bg-zinc-800"
          />
          {steps.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="relative flex flex-col gap-4">
                <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white text-emerald-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-emerald-400">
                  <Icon size={22} weight="bold" />
                </span>
                <h3 className="font-display text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
