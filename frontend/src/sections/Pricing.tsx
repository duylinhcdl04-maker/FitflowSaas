import { Check } from '@phosphor-icons/react'
import Container from '../components/Container'
import Button from '../components/Button'
import Reveal from '../components/Reveal'

// Plan codes, names, prices and trial length mirror the live `saas_plans` table.
// Feature-per-plan mapping below is an editorial default (the `saas_plan_features`
// join table has no rows configured yet) and should be revisited once it does.
const plans = [
  {
    code: 'TRIAL',
    name: 'Dùng thử',
    price: 'Miễn phí',
    period: '14 ngày',
    features: [
      'Đầy đủ tính năng của gói Basic',
      'Không cần thẻ thanh toán',
      '1 chi nhánh',
    ],
    cta: 'Dùng thử miễn phí',
    featured: false,
  },
  {
    code: 'BASIC',
    name: 'Basic',
    price: '500.000đ',
    period: '/ tháng',
    features: [
      '1 chi nhánh',
      'Check-in bằng QR',
      'Quản lý hội viên và gói tập',
      'Báo cáo cơ bản',
    ],
    cta: 'Dùng thử miễn phí',
    featured: false,
  },
  {
    code: 'PRO',
    name: 'Pro',
    price: '1.500.000đ',
    period: '/ tháng',
    features: [
      'Nhiều chi nhánh',
      'Nhận diện khuôn mặt',
      'Quản lý PT và lịch tập',
      'Báo cáo nâng cao',
    ],
    cta: 'Dùng thử miễn phí',
    featured: true,
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise',
    price: 'Liên hệ',
    period: '',
    features: [
      'Không giới hạn chi nhánh',
      'Tuỳ chỉnh riêng theo yêu cầu',
      'Hỗ trợ triển khai ưu tiên',
    ],
    cta: 'Liên hệ tư vấn',
    featured: false,
  },
]

export default function Pricing() {
  return (
    <section id="bang-gia" className="py-20 lg:py-28">
      <Container>
        <Reveal>
          <h2 className="font-display max-w-lg text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl dark:text-zinc-50">
            Bảng giá theo quy mô của gym bạn
          </h2>
          <p className="mt-3 max-w-md text-zinc-600 dark:text-zinc-400">
            Bắt đầu miễn phí, nâng cấp khi mở thêm chi nhánh.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <Reveal key={plan.code} delay={i * 0.05}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-6 ${
                  plan.featured
                    ? 'border-emerald-700 bg-emerald-700 text-white dark:border-emerald-400 dark:bg-emerald-500/10'
                    : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'
                }`}
              >
                {plan.featured && (
                  <span className="mb-4 inline-flex w-fit items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold dark:bg-emerald-400/20 dark:text-emerald-300">
                    Phổ biến nhất
                  </span>
                )}
                <h3
                  className={`font-display text-lg font-semibold ${
                    plan.featured ? 'text-white' : 'text-zinc-900 dark:text-zinc-50'
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span
                    className={`font-display text-3xl font-bold ${
                      plan.featured ? 'text-white' : 'text-zinc-900 dark:text-zinc-50'
                    }`}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={`text-sm ${
                        plan.featured ? 'text-emerald-50' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check
                        size={18}
                        weight="bold"
                        className={`mt-0.5 shrink-0 ${
                          plan.featured ? 'text-emerald-200' : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      />
                      <span className={plan.featured ? 'text-emerald-50' : 'text-zinc-700 dark:text-zinc-300'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  href={plan.cta === 'Liên hệ tư vấn' ? '#lien-he' : '/owner/register'}
                  variant={plan.featured ? 'secondary' : 'primary'}
                  className={`mt-6 w-full ${
                    plan.featured
                      ? '!border-white/40 !text-white hover:!bg-white/10 dark:!border-white/30'
                      : ''
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}
