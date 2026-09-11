import { ArrowRight } from '@phosphor-icons/react'
import Container from '../components/Container'
import Button from '../components/Button'
import Reveal from '../components/Reveal'

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-20 lg:py-28">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,rgba(16,185,129,0.18),transparent)]"
      />
      <div aria-hidden className="bg-grain pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay" />

      <Container className="relative text-center">
        <Reveal>
          <h2 className="font-display mx-auto max-w-xl text-3xl font-extrabold tracking-tight text-white text-balance md:text-4xl">
            Sẵn sàng đưa phòng gym của bạn lên một nền tảng
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-400">
            Tạo chi nhánh đầu tiên trong hôm nay, không cần thẻ thanh toán.
          </p>
          <div className="mt-9 flex justify-center">
            <Button href="/owner/register" variant="primary">
              Dùng thử miễn phí
              <ArrowRight size={18} weight="bold" />
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
