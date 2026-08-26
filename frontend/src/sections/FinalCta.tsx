import { ArrowRight } from '@phosphor-icons/react'
import Container from '../components/Container'
import Button from '../components/Button'
import Reveal from '../components/Reveal'

export default function FinalCta() {
  return (
    <section className="bg-zinc-900 py-20 lg:py-28 dark:bg-zinc-950">
      <Container className="text-center">
        <Reveal>
          <h2 className="font-display mx-auto max-w-xl text-3xl font-bold tracking-tight text-white md:text-4xl">
            Sẵn sàng đưa phòng gym của bạn lên một nền tảng
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-400">
            Tạo chi nhánh đầu tiên trong hôm nay, không cần thẻ thanh toán.
          </p>
          <div className="mt-8 flex justify-center">
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
