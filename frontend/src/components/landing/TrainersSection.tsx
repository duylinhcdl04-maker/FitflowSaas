import { motion } from 'motion/react'
import { Trophy, Star, ArrowUpRight, ShieldCheck, Heartbeat } from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

interface Trainer {
  name: string
  role: string
  specialty: string
  image: string
  cert: string
}

const trainers: Trainer[] = [
  {
    name: 'Luther Howard',
    role: 'Head Strength Coach',
    specialty: 'Huấn luyện sức mạnh & Thể lực thi đấu (CSCS)',
    image: '/images/trainer-1.jpg',
    cert: 'NASM / CSCS Certified',
  },
  {
    name: 'Elena Rostova',
    role: 'Functional & HIIT Specialist',
    specialty: 'Phục hồi chuyển động & Đốt mỡ cường độ cao',
    image: '/images/trainer-2.jpg',
    cert: 'ACE Master Trainer',
  },
  {
    name: 'Marcus Vance',
    role: 'Bodybuilding & Nutrition Master',
    specialty: 'Tăng cơ chuyên sâu & Dinh dưỡng cá nhân hóa',
    image: '/images/trainer-3.jpg',
    cert: 'ISSA Elite Coach',
  },
]

export default function TrainersSection() {
  return (
    <section id="trainers" className="relative py-24 sm:py-32 bg-[#070609] bg-grain overflow-hidden">
      {/* Ambient Lighting */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 right-1/4 w-[600px] h-[500px] bg-purple-900/10 rounded-full blur-[160px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header - WellFlex Style */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/25 bg-[#151119] mb-4"
          >
            <Trophy size={14} className="text-purple-400" weight="fill" />
            <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-widest text-purple-300 uppercase">
              ĐỘI NGŨ CHUYÊN GIA
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: CINEMATIC_EASE }}
            className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#F5F3F7] leading-[1.15]"
          >
            Expert{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F3F7] via-[#C084FC] to-purple-400">
              Trainers
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
            className="mt-4 font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base text-[#A7A1AD] max-w-xl mx-auto leading-relaxed"
          >
            Đội ngũ huấn luyện viên được tuyển chọn khắt khe với chứng chỉ quốc tế, đồng hành và thiết kế lộ trình tập luyện độc quyền.
          </motion.p>
        </div>

        {/* 3 Portrait Trainer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 sm:gap-8">
          {trainers.map((trainer, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: CINEMATIC_EASE }}
              className="group relative rounded-2xl sm:rounded-3xl border border-white/10 hover:border-purple-500/50 bg-[#0E0A16] overflow-hidden shadow-2xl transition-all duration-500"
            >
              {/* Image Container with Aspect Ratio */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#070609]">
                <img
                  src={trainer.image}
                  alt={trainer.name}
                  className="w-full h-full object-cover object-center filter grayscale contrast-110 group-hover:scale-105 group-hover:contrast-125 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Subtle Purple Neon Rim Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0A16] via-[#0E0A16]/30 to-transparent" />
                <div className="absolute inset-0 bg-purple-600/10 mix-blend-color pointer-events-none" />

                {/* Top Badge: Certification */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-[#161022]/80 backdrop-blur-md text-[11px] font-['JetBrains_Mono'] text-purple-200">
                    <ShieldCheck size={13} weight="bold" className="text-emerald-400" />
                    {trainer.cert}
                  </span>
                </div>
              </div>

              {/* Bottom Info Card Container */}
              <div className="relative z-10 p-6 sm:p-7 bg-[#0E0A16] border-t border-white/5 -mt-6">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-xl text-white group-hover:text-purple-300 transition-colors">
                    {trainer.name}
                  </h3>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
                    <Star size={13} weight="fill" />
                    <span>5.0</span>
                  </div>
                </div>

                <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2.5">
                  {trainer.role}
                </p>

                <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-[#A7A1AD] leading-relaxed mb-4">
                  {trainer.specialty}
                </p>

                {/* Action Link */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-[#F5F3F7]">
                  <span className="text-[#6F6877] group-hover:text-[#A7A1AD] transition-colors">
                    Quản lý lịch qua FitFlow PT
                  </span>
                  <span className="inline-flex items-center gap-1 text-purple-400 group-hover:translate-x-1 transition-transform font-semibold">
                    Đặt lịch <ArrowUpRight size={13} weight="bold" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Supporting Trust Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4, ease: CINEMATIC_EASE }}
          className="mt-14 sm:mt-18 rounded-2xl border border-white/8 bg-[#110D1A]/70 backdrop-blur-md p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
        >
          <div>
            <div className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-2xl sm:text-3xl text-white">
              150+
            </div>
            <div className="text-xs text-[#A7A1AD] uppercase tracking-wider mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
              HLV Được Xác Thực
            </div>
          </div>
          <div>
            <div className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-2xl sm:text-3xl text-purple-400">
              100%
            </div>
            <div className="text-xs text-[#A7A1AD] uppercase tracking-wider mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Lịch Hẹn Tự Động
            </div>
          </div>
          <div>
            <div className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-2xl sm:text-3xl text-white">
              98.4%
            </div>
            <div className="text-xs text-[#A7A1AD] uppercase tracking-wider mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Đánh Giá 5 Sao
            </div>
          </div>
          <div>
            <div className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-2xl sm:text-3xl text-emerald-400">
              0 Sai Sót
            </div>
            <div className="text-xs text-[#A7A1AD] uppercase tracking-wider mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Đối Soát Hoa Hồng
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
