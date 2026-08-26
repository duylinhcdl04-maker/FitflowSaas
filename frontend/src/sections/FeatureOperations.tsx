import { CalendarCheck, Wallet, ChartLineUp } from '@phosphor-icons/react'
import Container from '../components/Container'
import Reveal from '../components/Reveal'

export default function FeatureOperations() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <Reveal>
          <h2 className="font-display max-w-lg text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            Từ gói tập đến buổi PT, mọi giao dịch đều có lịch sử rõ ràng
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          <Reveal delay={0.05} className="lg:col-span-3">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-950">
              <div>
                <Wallet size={28} weight="fill" className="text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-display mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                  Gói hội viên và thanh toán QR
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Bán gói tập theo tháng hoặc theo chi nhánh, tạo mã QR thanh
                  toán tại quầy và tự động kích hoạt gói ngay khi tiền về.
                </p>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-zinc-100 pt-6 dark:border-zinc-900">
                <div>
                  <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Trạng thái gói
                  </dt>
                  <dd className="font-mono mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                    Đang hoạt động, hết hạn
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Phạm vi sử dụng
                  </dt>
                  <dd className="font-mono mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                    1 chi nhánh hoặc toàn chuỗi
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>

          <div className="flex flex-col gap-6 lg:col-span-2">
            <Reveal delay={0.1}>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <CalendarCheck size={26} weight="fill" className="text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-display mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Lịch tập với PT
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Đặt buổi tập, PT xác nhận hoàn thành, số buổi trong gói tự
                  trừ theo thực tế.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
                <ChartLineUp size={26} weight="fill" className="text-emerald-700 dark:text-emerald-400" />
                <h3 className="font-display mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Báo cáo doanh thu
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Theo dõi doanh thu, lượt check-in và hội viên mới theo từng
                  chi nhánh hoặc toàn chuỗi.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  )
}
