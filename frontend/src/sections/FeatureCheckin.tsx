import { ScanSmiley, QrCode, Timer } from '@phosphor-icons/react'
import Container from '../components/Container'
import Reveal from '../components/Reveal'

export default function FeatureCheckin() {
  return (
    <section className="bg-zinc-50 py-20 lg:py-28 dark:bg-zinc-900/40">
      <Container>
        <Reveal>
          <h2 className="font-display max-w-lg text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            Check-in nhanh, không cần xếp hàng ở quầy lễ tân
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Reveal delay={0.05} className="md:col-span-2">
            <div className="relative flex h-full min-h-72 flex-col justify-end overflow-hidden rounded-2xl p-8">
              <img
                src="https://picsum.photos/seed/fitflow-face-checkin/900/600"
                alt="Cổng check-in bằng nhận diện khuôn mặt tại sảnh gym"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent" />
              <div className="relative">
                <ScanSmiley size={28} weight="fill" className="text-emerald-400" />
                <h3 className="font-display mt-3 text-xl font-semibold text-white">
                  Nhận diện khuôn mặt
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-200">
                  Hội viên bước qua cổng, hệ thống tự nhận diện và ghi nhận
                  lượt tập trong chưa đầy một giây.
                </p>
              </div>
            </div>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal delay={0.1}>
              <div className="rounded-2xl bg-emerald-700 p-6 text-white dark:bg-emerald-600">
                <QrCode size={26} weight="fill" />
                <h3 className="font-display mt-3 text-lg font-semibold">
                  Check-in bằng QR
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-emerald-50">
                  Hội viên quét mã hội viên riêng, không cần thẻ từ hay giấy
                  tờ.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
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
