import { motion } from 'motion/react'
import { ArrowRight, CheckCircle } from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

export default function FinalCTA() {
  return (
    <section className="relative min-h-[85vh] bg-[#070609] bg-grain flex items-center justify-center py-28 overflow-hidden border-t border-white/6">
      {/* Background Ambience Glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[500px] bg-purple-600/12 rounded-full blur-[180px] pointer-events-none"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center flex flex-col items-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/20 bg-[#151119] mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-wider text-purple-300 uppercase">
            KHỞI ĐỘNG NHANH CHÓNG • TƯƠNG THÍCH MỌI THIẾT BỊ
          </span>
        </motion.div>

        {/* Large Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, delay: 0.1, ease: CINEMATIC_EASE }}
          className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-[#F5F3F7] leading-[1.18] mb-8"
        >
          NÂNG TẦM QUẢN TRỊ PHÒNG GYM. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F3F7] via-[#C084FC] to-purple-400">
            BẮT ĐẦU VỚI FITFLOW NGAY HÔM NAY.
          </span>
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
          className="font-['Plus_Jakarta_Sans',sans-serif] text-base sm:text-xl text-[#A7A1AD] max-w-2xl leading-relaxed mb-10"
        >
          Gia nhập hàng trăm chủ phòng gym, fitness center và huấn luyện viên đang tối ưu hoá vận hành và bứt phá doanh thu cùng FitFlow.
        </motion.p>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: CINEMATIC_EASE }}
          className="flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto mb-10"
        >
          <a
            href="/owner/register"
            className="group relative inline-flex items-center justify-center gap-3 px-9 py-4 rounded-[8px] bg-purple-600 hover:bg-purple-500 text-white font-['Plus_Jakarta_Sans',sans-serif] text-base font-bold tracking-wide transition-all shadow-[0_0_32px_rgba(168,85,247,0.35)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] active:scale-98"
          >
            <span>DÙNG THỬ MIỄN PHÍ</span>
            <ArrowRight
              size={18}
              weight="bold"
              className="transition-transform duration-300 group-hover:translate-x-1.5"
            />
          </a>

          <a
            href="/owner/login"
            className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-[8px] border border-white/10 hover:border-white/25 bg-white/4 hover:bg-white/8 text-[#F5F3F7] font-['Plus_Jakarta_Sans',sans-serif] text-sm font-semibold tracking-wide transition-all active:scale-98"
          >
            <span>ĐĂNG NHẬP CHỦ PHÒNG</span>
          </a>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: CINEMATIC_EASE }}
          className="flex flex-wrap items-center justify-center gap-6 text-xs font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]"
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle size={15} weight="fill" className="text-purple-400" />
            14 ngày trải nghiệm đầy đủ tính năng
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={15} weight="fill" className="text-purple-400" />
            Không yêu cầu thẻ tín dụng
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={15} weight="fill" className="text-purple-400" />
            Khởi tạo xong trong 2 phút
          </span>
        </motion.div>
      </div>
    </section>
  )
}
