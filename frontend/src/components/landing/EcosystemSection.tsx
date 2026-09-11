import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import EcosystemScene from './EcosystemScene'
import { CINEMATIC_EASE } from '../../lib/motion'
import { Users, UserGear, IdentificationBadge, CreditCard, Buildings, ChartLineUp } from '@phosphor-icons/react'

const nodeDetails: Record<
  string,
  { title: string; subtitle: string; desc: string; icon: React.ReactNode; stats: string; label: string }
> = {
  members: {
    label: 'Hội viên',
    title: 'HỆ THỐNG HỘI VIÊN',
    subtitle: 'Nhận diện khuôn mặt & vòng đời hội viên',
    desc: 'Tự động hóa check-in bằng Face AI dưới 0.2s, thẻ thành viên số, nhật ký ra vào thời gian thực và quản lý chỉ số cơ thể trong một hồ sơ thống nhất.',
    icon: <Users size={22} className="text-purple-400" />,
    stats: '2,840+ Hội viên hoạt động',
  },
  trainers: {
    label: 'Huấn luyện viên',
    title: 'HUẤN LUYỆN VIÊN & PT',
    subtitle: 'Điều phối lịch tập & tính hoa hồng tự động',
    desc: 'Lên lịch buổi tập PT trực quan, nhật ký buổi tập với học viên, tự động tính hoa hồng theo số buổi hoàn thành mà không cần bảng tính thủ công.',
    icon: <UserGear size={22} className="text-purple-400" />,
    stats: '48 Huấn luyện viên',
  },
  memberships: {
    label: 'Gói tập',
    title: 'QUẢN LÝ GÓI TẬP',
    subtitle: 'Đa dạng thẻ tập, vé ngày & gói định kỳ',
    desc: 'Thiết lập linh hoạt các hạng thẻ VIP, Classic, gói kèm PT, quy trình bảo lưu, chuyển nhượng và gửi tin nhắn tự động nhắc gia hạn.',
    icon: <IdentificationBadge size={22} className="text-purple-400" />,
    stats: '94% Tỷ lệ tái ký đúng hạn',
  },
  payments: {
    label: 'Thanh toán',
    title: 'THANH TOÁN & POS QUẦY',
    subtitle: 'Thanh toán không tiền mặt đa kênh liền mạch',
    desc: 'Tạo mã VietQR động theo đơn hàng, quẹt thẻ POS, thanh toán nước uống & thực phẩm bổ sung tại quầy lễ tân với đối soát tự động.',
    icon: <CreditCard size={22} className="text-purple-400" />,
    stats: '₫482.5M Doanh thu tháng',
  },
  branches: {
    label: 'Đa chi nhánh',
    title: 'HỆ THỐNG ĐA CHI NHÁNH',
    subtitle: 'Kiểm soát đồng bộ toàn bộ chuỗi phòng gym',
    desc: 'Kiến trúc Multi-tenant tập trung. Triển khai gói khuyến mãi trên toàn hệ thống, luân chuyển hội viên và giám sát quản lý từng cơ sở.',
    icon: <Buildings size={22} className="text-purple-400" />,
    stats: '6 Chi nhánh đang chạy',
  },
  analytics: {
    label: 'Báo cáo',
    title: 'BÁO CÁO THỜI GIAN THỰC',
    subtitle: 'Chỉ số đo lường hiệu suất kinh doanh chuẩn xác',
    desc: 'Biểu đồ nhiệt giờ cao điểm, phân tích giữ chân hội viên, tốc độ tăng trưởng doanh thu và năng suất đào tạo của từng huấn luyện viên.',
    icon: <ChartLineUp size={22} className="text-purple-400" />,
    stats: '87.4% Tỷ lệ điểm danh',
  },
}

export default function EcosystemSection() {
  const [activeNode, setActiveNode] = useState<string | null>('members')

  const currentInfo = activeNode ? nodeDetails[activeNode] : nodeDetails.members

  return (
    <section id="ecosystem" className="relative py-28 sm:py-36 bg-[#0B090E] bg-grain overflow-hidden border-t border-white/6">
      {/* Background Accent glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-purple-900/10 rounded-full blur-[180px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#151119] mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-widest text-purple-300 uppercase">
              HẠ TẦNG KẾT NỐI LIỀN MẠCH
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: CINEMATIC_EASE }}
            className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#F5F3F7] leading-[1.18] mb-6"
          >
            MỘT HỆ ĐIỀU HÀNH. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F3F7] via-[#C084FC] to-purple-400">
              ĐỒNG BỘ TOÀN DIỆN.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
            className="font-['Plus_Jakarta_Sans',sans-serif] text-base sm:text-lg text-[#A7A1AD] leading-relaxed"
          >
            Không còn tình trạng phân mảnh hay ghi chép thủ công. Mọi nghiệp vụ phòng gym đều đồng bộ trực tiếp theo thời gian thực.
          </motion.p>
        </div>

        {/* 3D Ecosystem Graph + Node Controller */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3D Scene View */}
          <div className="lg:col-span-7 relative flex items-center justify-center">
            <EcosystemScene activeNode={activeNode} onHoverNode={setActiveNode} />

            {/* Hint Badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full border border-white/10 bg-[#151119]/80 backdrop-blur-md text-[11px] font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD] pointer-events-none text-center whitespace-nowrap">
              Rê chuột vào các node 3D để xem liên kết hệ thống
            </div>
          </div>

          {/* Node Inspector Info Panel */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Quick Node Selector Pills */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {Object.entries(nodeDetails).map(([key, item]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveNode(key)}
                  className={`py-2 px-3 rounded-[8px] text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold uppercase tracking-wider transition-all border ${
                    activeNode === key
                      ? 'bg-purple-600/30 border-purple-500 text-white shadow-[0_0_16px_rgba(168,85,247,0.25)]'
                      : 'bg-[#151119] border-white/8 text-[#A7A1AD] hover:border-white/20 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Active Card Details */}
            <AnimatePresence mode="wait">
              {currentInfo && (
                <motion.div
                  key={activeNode || 'default'}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: CINEMATIC_EASE }}
                  className="rounded-[16px] border border-purple-500/30 bg-gradient-to-b from-[#1B1521] to-[#151119] p-7 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-purple-950/60 border border-purple-500/30">
                      {currentInfo.icon}
                    </div>
                    <span className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-sm text-purple-300 tracking-wider">
                      {currentInfo.stats}
                    </span>
                  </div>

                  <h3 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl text-white tracking-tight uppercase mb-1">
                    {currentInfo.title}
                  </h3>
                  <div className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-medium text-purple-400 tracking-wide uppercase mb-4">
                    {currentInfo.subtitle}
                  </div>
                  <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base text-[#A7A1AD] leading-relaxed">
                    {currentInfo.desc}
                  </p>

                  <div className="mt-6 pt-5 border-t border-white/8 flex items-center justify-between text-xs text-[#6F6877] font-['Plus_Jakarta_Sans',sans-serif]">
                    <span>Giao thức: FitFlow Realtime Event Bus</span>
                    <span className="text-emerald-400 font-semibold">Đã đồng bộ</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
