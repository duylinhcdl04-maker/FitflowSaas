import { motion } from 'motion/react'
import {
  Users,
  Buildings,
  Trophy,
  Ticket,
  QrCode,
  ScanSmiley,
  ArrowUpRight,
} from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

interface DifferenceItem {
  icon: React.ElementType
  title: string
  highlight: string
  description: string
}

const differences: DifferenceItem[] = [
  {
    icon: Users,
    title: 'Tin Cậy 50,000+ Hội Viên',
    highlight: 'Dữ liệu an toàn & bảo mật',
    description: 'Hàng chục ngàn hội viên check-in mỗi ngày mượt mà, lưu trữ lịch sử tập luyện và nhận diện sinh trắc học chuẩn mã hóa.',
  },
  {
    icon: Buildings,
    title: 'Chuỗi Đa Chi Nhánh',
    highlight: 'Đồng bộ hóa tức thì',
    description: 'Kiến trúc Multi-tenant kiểm soát chéo không độ trễ. Phân quyền chi tiết cho từng cơ sở, quản lý phòng tập từ xa.',
  },
  {
    icon: Trophy,
    title: 'Điều Phối PT Chuyên Nghiệp',
    highlight: 'Hoa hồng & KPI tự động',
    description: 'Lên lịch huấn luyện viên trực quan, phân chia hoa hồng tự động minh bạch và cung cấp portal học viên riêng cho HLV.',
  },
  {
    icon: Ticket,
    title: 'Gói Tập & Hợp Đồng Linh Hoạt',
    highlight: 'Gia hạn & ký hợp đồng số',
    description: 'Tùy biến gói tháng, gói năm, thẻ tập theo lượt, bảo lưu ngày tập và thông báo nhắc nhở gia hạn tự động qua Zalo/Telegram.',
  },
  {
    icon: QrCode,
    title: 'Thanh Toán Tự Động VietQR',
    highlight: 'Đối soát ngân hàng tức thì',
    description: 'Tích hợp mã VietQR động theo từng giao dịch, tự động kích hoạt gói tập ngay khi tiền về tài khoản ngân hàng.',
  },
  {
    icon: ScanSmiley,
    title: 'Hạ Tầng Check-in Face AI',
    highlight: '< 0.2s nhận diện khuôn mặt',
    description: 'Tương thích mọi camera giám sát và cổng xoay Flap Barrier/Tripod. Chống hoàn toàn hành vi quẹt thẻ hộ hay gian lận.',
  },
]

export default function DifferenceSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32 bg-[#070609] bg-grain overflow-hidden">
      {/* Background Soft Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-900/10 rounded-full blur-[160px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Centered Section Header - WellFlex Style */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/25 bg-[#151119] mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-widest text-purple-300 uppercase">
              SỰ KHÁC BIỆT CỦA FITFLOW
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: CINEMATIC_EASE }}
            className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#F5F3F7] leading-[1.15]"
          >
            The FitFlow{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F3F7] via-[#C084FC] to-purple-400">
              Difference
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
            className="mt-4 font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base text-[#A7A1AD] max-w-xl mx-auto leading-relaxed"
          >
            10+ năm kinh nghiệm đồng hành và chuẩn hóa tự động vận hành cho 500+ chuỗi phòng gym & fitness chuyên nghiệp.
          </motion.p>
        </div>

        {/* 6 Bento Grid Cards (3 cols x 2 rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {differences.map((item, idx) => {
            const IconComponent = item.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.08, ease: CINEMATIC_EASE }}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl border border-white/8 hover:border-purple-500/40 bg-gradient-to-b from-[#130f1c] to-[#0d0a14] p-6 sm:p-7 flex flex-col justify-between overflow-hidden shadow-lg transition-all duration-300"
              >
                {/* Subtle spotlight glow on card hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/15 transition-all duration-500 pointer-events-none" />

                <div>
                  {/* Icon in Rounded Box */}
                  <div className="flex items-center gap-3.5 mb-5">
                    <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] group-hover:border-purple-400 group-hover:text-purple-200 transition-colors">
                      <IconComponent size={24} weight="fill" />
                    </div>
                    <div>
                      <h3 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-base sm:text-lg text-white group-hover:text-purple-200 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] font-['Plus_Jakarta_Sans',sans-serif] text-purple-300/80 font-medium tracking-wide">
                        {item.highlight}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm text-[#A7A1AD] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom Centered Button - WellFlex Style */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: CINEMATIC_EASE }}
          className="mt-12 sm:mt-16 flex justify-center"
        >
          <a
            href="/owner/register"
            className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full border border-purple-500/30 hover:border-purple-400 bg-[#161022] hover:bg-purple-900/30 text-white font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] active:scale-95"
          >
            <span>Khám Phá Toàn Bộ Tính Năng</span>
            <ArrowUpRight size={16} weight="bold" className="text-purple-400" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
