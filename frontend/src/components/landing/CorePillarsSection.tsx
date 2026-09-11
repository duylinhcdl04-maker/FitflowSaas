import { motion } from 'motion/react'
import {
  ScanSmiley,
  Buildings,
  QrCode,
  ShieldCheck,
  CheckCircle,
  Lightning,
  ArrowUpRight,
  ChartLineUp,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

interface Pillar {
  number: string
  tag: string
  title: string
  highlight: string
  description: string
  image: string
  kpi: string
  kpiDesc: string
  badgeText: string
  badgeType: 'face' | 'branch' | 'pay'
}

const pillars: Pillar[] = [
  {
    number: '01',
    tag: 'AN NINH SINH TRẮC HỌC',
    title: 'Triệt Tiêu Thất Thoát Vé & Thẻ Mượn',
    highlight: 'Face Biometrics & Cổng Tự Động',
    description:
      'Nhận diện hội viên dưới 0.2s qua camera AI thông minh, điều khiển trực tiếp cổng xoay flap barrier/tripod. Chấm dứt hoàn toàn tình trạng mượn thẻ, quẹt thẻ hộ hay nhân sự cho người quen vào tập miễn phí.',
    image: '/images/trainer-2.jpg',
    kpi: '0% Gian Lận',
    kpiDesc: 'Loại bỏ hoàn toàn thẻ mượn & quẹt hộ',
    badgeText: 'Face AI < 0.2s · Match 99.98%',
    badgeType: 'face',
  },
  {
    number: '02',
    tag: 'MỞ RỘNG QUY MÔ',
    title: 'Một Bảng Điều Khiển — Quản Trị Toàn Chuỗi',
    highlight: 'Đồng Bộ Hóa Đám Mây Tập Trung',
    description:
      'Mở rộng từ 1 phòng gym độc lập lên chuỗi 50 cơ sở mà không cần thay đổi quy trình. Theo dõi dòng tiền P&L hợp nhất theo thời gian thực, phân quyền chi tiết cho từng quản lý quầy và điều phối hội viên liên chi nhánh.',
    image: '/images/trainer-1.jpg',
    kpi: '50+ Chi Nhánh',
    kpiDesc: 'Kiến trúc Multi-tenant không giới hạn',
    badgeText: 'Multi-Branch Sync · 0ms Độ trễ',
    badgeType: 'branch',
  },
  {
    number: '03',
    tag: 'DÒNG TIỀN TỰ ĐỘNG',
    title: 'Cỗ Máy Tự Động Gia Hạn & Thu Phí VietQR',
    highlight: 'Tăng 35% Tỷ Lệ Tái Tục Hợp Đồng',
    description:
      'Tạo mã VietQR động theo từng hợp đồng, đối soát tức thì ngay khi tiền vào tài khoản ngân hàng. Hệ thống tự động gửi tin nhắn thông báo nhắc hạn kèm link thanh toán 1 chạm qua Zalo ZNS / Telegram Bot trước 7 ngày.',
    image: '/images/trainer-3.jpg',
    kpi: '+35% Tái Ký',
    kpiDesc: 'Tự động đối soát ngân hàng 100%',
    badgeText: 'VietQR Auto-Pay & Zalo ZNS',
    badgeType: 'pay',
  },
]

export default function CorePillarsSection() {
  return (
    <section id="pillars" className="relative py-24 sm:py-32 bg-[#070609] bg-grain overflow-hidden select-none">
      {/* Background Ambience */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-purple-900/10 rounded-full blur-[160px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/25 bg-[#151119] mb-4"
          >
            <Lightning size={14} className="text-purple-400" weight="fill" />
            <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-widest text-purple-300 uppercase">
              3 TRỤ CỘT ĐỘT PHÁ VẬN HÀNH SAAS
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: CINEMATIC_EASE }}
            className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#F5F3F7] leading-[1.15]"
          >
            Cốt Lõi Tăng Trưởng &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F3F7] via-[#C084FC] to-purple-400">
              Chống Thất Thoát
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
            className="mt-4 font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base text-[#A7A1AD] max-w-2xl mx-auto leading-relaxed"
          >
            Giải quyết dứt điểm 3 bài toán nhức nhối nhất của chủ phòng gym: Thất thoát doanh thu vé, rào cản mở rộng chuỗi và tỷ lệ hội viên rời bỏ sau khi hết hạn.
          </motion.p>
        </div>

        {/* 3 Core SaaS Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 sm:gap-8">
          {pillars.map((pillar, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: CINEMATIC_EASE }}
              className="group relative rounded-2xl sm:rounded-3xl border border-white/10 hover:border-purple-500/50 bg-[#0E0A16] overflow-hidden shadow-2xl transition-all duration-500 flex flex-col justify-between"
            >
              {/* Image & Interactive HUD Layer */}
              <div className="relative aspect-[4/3] sm:aspect-[3/4] w-full overflow-hidden bg-[#070609]">
                <img
                  src={pillar.image}
                  alt={pillar.title}
                  className="w-full h-full object-cover object-top filter grayscale contrast-115 group-hover:scale-105 group-hover:contrast-125 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Subtle Purple Neon Rim Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0E0A16] via-[#0E0A16]/40 to-transparent" />
                <div className="absolute inset-0 bg-purple-600/10 mix-blend-color pointer-events-none" />

                {/* Top Corner Index Number */}
                <div className="absolute top-4 right-4 z-10">
                  <span className="font-['Be_Vietnam_Pro',sans-serif] font-black text-2xl text-white/30 group-hover:text-purple-400/80 transition-colors">
                    {pillar.number}
                  </span>
                </div>

                {/* Top Left SaaS Capability Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-500/30 bg-[#161022]/85 backdrop-blur-md text-[10px] sm:text-[11px] font-['JetBrains_Mono'] text-purple-200 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {pillar.badgeText}
                  </span>
                </div>

                {/* HUD Interactive Overlays depending on pillar type */}
                {pillar.badgeType === 'face' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[16%] left-1/2 -translate-x-1/2 w-24 h-28 border border-purple-400/45 rounded-2xl group-hover:border-purple-400/90 transition-colors shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                      {/* Corner Targeting Reticles */}
                      <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-purple-400" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-purple-400" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-purple-400" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-purple-400" />
                      {/* Biometric Scanning Line */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent absolute top-1/2 -translate-y-1/2 opacity-80 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-['JetBrains_Mono'] text-purple-300 bg-[#161022]/90 px-1.5 py-0.5 rounded border border-purple-500/30">
                        MATCH 99.98%
                      </div>
                    </div>
                  </div>
                )}

                {pillar.badgeType === 'branch' && (
                  <>
                    <div className="absolute top-[20%] right-4 z-10 hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#161022]/90 border border-purple-500/30 backdrop-blur-md text-[9px] font-['JetBrains_Mono'] text-purple-200 shadow-lg">
                      <ArrowsClockwise size={11} className="text-purple-400 animate-spin" />
                      <span>SYNC: CN1 ↔ CN2 ↔ HQ</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between p-2 rounded-xl bg-[#151119]/90 border border-white/10 backdrop-blur-md text-[10px] font-['JetBrains_Mono'] text-[#A7A1AD]">
                      <span className="flex items-center gap-1.5 text-white">
                        <Buildings size={13} className="text-purple-400" />
                        HQ · 12 Chi Nhánh
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Real-time
                      </span>
                    </div>
                  </>
                )}

                {pillar.badgeType === 'pay' && (
                  <>
                    <div className="absolute top-[20%] right-4 z-10 hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#161022]/90 border border-emerald-500/30 backdrop-blur-md text-[9px] font-['JetBrains_Mono'] text-emerald-300 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>+1.500.000đ · Đã khớp</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between p-2 rounded-xl bg-[#151119]/90 border border-white/10 backdrop-blur-md text-[10px] font-['JetBrains_Mono'] text-[#A7A1AD]">
                      <span className="flex items-center gap-1.5 text-white">
                        <QrCode size={13} className="text-purple-400" />
                        VietQR Auto
                      </span>
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle size={12} weight="fill" />
                        Đã đối soát
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Bottom Content Area */}
              <div className="relative z-10 p-6 sm:p-7 bg-[#0E0A16] border-t border-white/5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-['JetBrains_Mono'] font-semibold text-purple-400 tracking-widest uppercase mb-1.5 block">
                    {pillar.tag}
                  </span>

                  <h3 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-xl text-white group-hover:text-purple-300 transition-colors mb-2 leading-snug">
                    {pillar.title}
                  </h3>

                  <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-[#A7A1AD] leading-relaxed mb-5">
                    {pillar.description}
                  </p>
                </div>

                {/* KPI Highlight Strip */}
                <div className="pt-4 border-t border-white/8 flex items-center justify-between">
                  <div>
                    <div className="font-['Be_Vietnam_Pro',sans-serif] font-black text-lg text-white group-hover:text-purple-200 transition-colors">
                      {pillar.kpi}
                    </div>
                    <div className="text-[10px] text-[#6F6877] font-['Plus_Jakarta_Sans',sans-serif]">
                      {pillar.kpiDesc}
                    </div>
                  </div>

                  <a
                    href="#features"
                    className="inline-flex items-center gap-1 text-xs text-purple-400 group-hover:text-purple-300 font-semibold transition-colors"
                  >
                    <span>Chi tiết</span>
                    <ArrowUpRight
                      size={14}
                      weight="bold"
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Supporting Executive Trust Stats Strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4, ease: CINEMATIC_EASE }}
          className="mt-14 sm:mt-18 rounded-2xl border border-white/8 bg-[#110D1A]/70 backdrop-blur-md p-6 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
        >
          <div>
            <div className="font-['Be_Vietnam_Pro',sans-serif] font-black text-2xl sm:text-3xl text-emerald-400">
              0%
            </div>
            <div className="text-xs text-[#A7A1AD] uppercase tracking-wider mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Thất Thoát & Quẹt Hộ
            </div>
          </div>
          <div>
            <div className="font-['Be_Vietnam_Pro',sans-serif] font-black text-2xl sm:text-3xl text-white">
              50+
            </div>
            <div className="text-xs text-[#A7A1AD] uppercase tracking-wider mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Chi Nhánh Quản Lý Chuỗi
            </div>
          </div>
          <div>
            <div className="font-['Be_Vietnam_Pro',sans-serif] font-black text-2xl sm:text-3xl text-purple-400">
              +35%
            </div>
            <div className="text-xs text-[#A7A1AD] uppercase tracking-wider mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Tỷ Lệ Tái Ký Hội Viên
            </div>
          </div>
          <div>
            <div className="font-['Be_Vietnam_Pro',sans-serif] font-black text-2xl sm:text-3xl text-white">
              &lt; 0.2s
            </div>
            <div className="text-xs text-[#A7A1AD] uppercase tracking-wider mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
              Tốc Độ Mở Cổng Tự Động
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
