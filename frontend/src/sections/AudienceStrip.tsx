import {
  Crown,
  Buildings,
  IdentificationBadge,
  Barbell,
  UsersThree,
} from '@phosphor-icons/react'
import Container from '../components/Container'
import Reveal from '../components/Reveal'
import SpotlightCard from '../components/SpotlightCard'

const roles = [
  { icon: Crown, label: 'Chủ phòng gym' },
  { icon: Buildings, label: 'Quản lý chi nhánh' },
  { icon: IdentificationBadge, label: 'Lễ tân, nhân viên' },
  { icon: Barbell, label: 'Huấn luyện viên' },
  { icon: UsersThree, label: 'Hội viên' },
]

export default function AudienceStrip() {
  return (
    <section className="border-y border-zinc-200 bg-zinc-50 py-12 dark:border-white/10 dark:bg-zinc-900/40">
      <Container>
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-widest text-zinc-500 uppercase dark:text-zinc-500">
            Một hệ thống, phân quyền riêng cho từng vai trò trong đội ngũ
          </p>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {roles.map(({ icon: Icon, label }) => (
              <SpotlightCard
                key={label}
                className="flex flex-col items-center gap-2.5 rounded-2xl border border-zinc-200 bg-white px-4 py-6 text-center transition-colors hover:border-emerald-600/30 dark:border-white/10 dark:bg-zinc-950"
              >
                <Icon size={24} className="text-emerald-700 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {label}
                </span>
              </SpotlightCard>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
