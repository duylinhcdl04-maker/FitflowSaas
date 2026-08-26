import {
  Crown,
  Buildings,
  IdentificationBadge,
  Barbell,
  UsersThree,
} from '@phosphor-icons/react'
import Container from '../components/Container'
import Reveal from '../components/Reveal'

const roles = [
  { icon: Crown, label: 'Chủ phòng gym' },
  { icon: Buildings, label: 'Quản lý chi nhánh' },
  { icon: IdentificationBadge, label: 'Lễ tân, nhân viên' },
  { icon: Barbell, label: 'Huấn luyện viên' },
  { icon: UsersThree, label: 'Hội viên' },
]

export default function AudienceStrip() {
  return (
    <section className="border-y border-zinc-200 bg-zinc-50 py-10 dark:border-zinc-800 dark:bg-zinc-900/40">
      <Container>
        <Reveal>
          <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Một hệ thống, phân quyền riêng cho từng vai trò trong đội ngũ
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {roles.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-5 text-center dark:border-zinc-800 dark:bg-zinc-950"
              >
                <Icon size={22} className="text-emerald-700 dark:text-emerald-400" />
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
