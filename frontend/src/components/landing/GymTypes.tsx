import { motion } from 'motion/react'
import { ArrowRight, Barbell, Sparkle, Buildings } from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

interface GymTypeItem {
  id: string
  name: string
  tag: string
  description: string
  features: string[]
  icon: React.ReactNode
  span: string
}

const gymTypes: GymTypeItem[] = [
  {
    id: 'studio',
    name: 'BOUTIQUE FITNESS & YOGA STUDIO',
    tag: 'PILATES • YOGA • BOXING • HI-INTENSITY',
    description:
      'Giới hạn sĩ số lớp học tự động, xếp lịch huấn luyện viên, bán gói tập theo lượt tín dụng và kích hoạt các vòng lặp giữ chân hội viên VIP.',
    features: ['Quản lý danh sách lớp tập', 'Trừ lượt tập tự động', 'Hàng chờ tự động bù chỗ'],
    icon: <Sparkle size={24} className="text-purple-400" />,
    span: 'lg:col-span-7',
  },
  {
    id: 'performance',
    name: 'PHÒNG GYM THỂ HÌNH CHUYÊN SÂU',
    tag: 'BODYBUILDING • POWERLIFTING • CROSSFIT',
    description:
      'Cổng kiểm soát ra vào bằng Face AI tốc độ cao, quản lý vận hành 24/7, tự động đối soát hoa hồng buổi dạy PT và bán lẻ nước uống tại quầy lễ tân.',
    features: ['Face check-in dưới 0.2s', 'Chia hoa hồng HLV tự động', 'Bán lẻ đồ uống POS'],
    icon: <Barbell size={24} className="text-purple-400" />,
    span: 'lg:col-span-5',
  },
  {
    id: 'chain',
    name: 'CHUỖI PHÒNG GYM THƯƠNG MẠI',
    tag: 'DOANH NGHIỆP • ĐA TỈNH THÀNH • CHUỖI NHƯỢNG QUYỀN',
    description:
      'Kiểm soát toàn diện trên nền tảng đám mây Multi-tenant. Cho phép hội viên tập liên cơ sở, đồng bộ chiến dịch khuyến mãi toàn quốc và báo cáo tài chính hợp nhất.',
    features: ['Hội viên tập đa chi nhánh', 'Báo cáo tài chính hợp nhất', 'Ma trận phân quyền nhân sự'],
    icon: <Buildings size={24} className="text-purple-400" />,
    span: 'lg:col-span-12',
  },
]

export default function GymTypes() {
  return (
    <section id="solutions" className="py-28 sm:py-36 bg-[#070609] bg-grain overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#151119] mb-4"
            >
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-widest text-purple-300 uppercase">
                GIẢI PHÁP TÙY BIẾN
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1, ease: CINEMATIC_EASE }}
              className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#F5F3F7] leading-[1.18]"
            >
              THIẾT KẾ DÀNH RIÊNG CHO <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F3F7] via-[#C084FC] to-purple-400">
                MỌI MÔ HÌNH FITNESS.
              </span>
            </motion.h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
            className="font-['Plus_Jakarta_Sans',sans-serif] text-base sm:text-lg text-[#A7A1AD] max-w-md leading-relaxed"
          >
            Dù bạn đang vận hành 1 studio boutique chuyên biệt hay mở rộng chuỗi phòng tập toàn quốc, FitFlow luôn thích ứng hoàn hảo với quy trình của bạn.
          </motion.p>
        </div>

        {/* Asymmetric Composition Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {gymTypes.map((gym, idx) => (
            <motion.div
              key={gym.id}
              data-cursor="image"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, delay: idx * 0.1, ease: CINEMATIC_EASE }}
              whileHover={{ y: -4 }}
              className={`${gym.span} group relative rounded-[16px] border border-white/8 hover:border-purple-500/40 bg-[#151119] hover:bg-[#1B1521] p-8 sm:p-10 transition-all duration-300 overflow-hidden flex flex-col justify-between`}
            >
              {/* Subtle background glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/15 transition-all duration-500 pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="p-3 rounded-xl bg-[#0B090E] border border-white/10 group-hover:border-purple-500/40 transition-colors">
                    {gym.icon}
                  </div>
                  <span className="text-[11px] font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-wider text-[#A7A1AD] uppercase">
                    {gym.tag}
                  </span>
                </div>

                <h3 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl sm:text-3xl text-white tracking-tight mb-3">
                  {gym.name}
                </h3>
                <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base text-[#A7A1AD] max-w-2xl leading-relaxed mb-8">
                  {gym.description}
                </p>
              </div>

              <div className="pt-6 border-t border-white/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {gym.features.map((feat, i) => (
                    <span
                      key={i}
                      className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-purple-300 px-3 py-1 rounded-md bg-[#0B090E] border border-white/6"
                    >
                      ✓ {feat}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white group-hover:text-purple-300 transition-colors uppercase tracking-wider">
                  <span>Xem chi tiết giải pháp</span>
                  <ArrowRight size={14} weight="bold" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
