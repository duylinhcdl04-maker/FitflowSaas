import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import {
  TrendUp,
  Users,
  CheckCircle,
  CurrencyCircleDollar,
  MagnifyingGlass,
  Bell,
  CaretUp,
  DotOutline,
} from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'
import { useIsMobile, usePrefersReducedMotion } from '../../hooks/useMediaQuery'

export default function DashboardShowcase() {
  const isMobile = useIsMobile()
  const prefersReduced = usePrefersReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse tilt coordinates
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 25, stiffness: 180, mass: 0.5 }
  const smoothMouseX = useSpring(mouseX, springConfig)
  const smoothMouseY = useSpring(mouseY, springConfig)

  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [3, -3])
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-4, 4])

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isMobile || prefersReduced || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <section id="showcase" className="relative py-28 sm:py-36 bg-[#070609] bg-grain overflow-hidden">
      {/* Background radial atmosphere */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-purple-900/15 rounded-full blur-[180px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#151119] mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-widest text-purple-300 uppercase">
              TRUNG TÂM VẬN HÀNH TRỰC TUYẾN
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: CINEMATIC_EASE }}
            className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#F5F3F7] leading-[1.18] mb-6"
          >
            QUẢN TRỊ PHÒNG GYM <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F3F7] via-[#C084FC] to-purple-400">
              TRONG TẦM TAY.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
            className="font-['Plus_Jakarta_Sans',sans-serif] text-base sm:text-lg text-[#A7A1AD] leading-relaxed"
          >
            Bảng điều khiển trực quan, chuẩn xác theo thời gian thực dành cho chủ phòng gym. Kiểm soát doanh thu, hội viên và nhân sự mọi lúc mọi nơi.
          </motion.p>
        </div>

        {/* 3D Perspective Tilt Container */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ perspective: 1200 }}
          className="w-full flex justify-center"
        >
          <motion.div
            initial={
              prefersReduced
                ? { opacity: 1 }
                : { opacity: 0, scale: 0.9, y: 60, rotateX: 6 }
            }
            whileInView={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 1.1, ease: CINEMATIC_EASE }}
            style={{
              rotateX: isMobile || prefersReduced ? 0 : rotateX,
              rotateY: isMobile || prefersReduced ? 0 : rotateY,
            }}
            className="w-full max-w-6xl rounded-[12px] border border-white/12 bg-[#0E0C13] shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_40px_rgba(168,85,247,0.15)] overflow-hidden"
          >
            {/* Mockup Dashboard Window Bar */}
            <div className="h-12 bg-[#151119] border-b border-white/8 px-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/60" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="ml-3 font-['Plus_Jakarta_Sans',sans-serif] text-xs font-semibold text-[#A7A1AD] tracking-wide">
                  FitFlow HQ Suite v2.4 • Chi nhánh #01 Sài Gòn
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded bg-[#1B1521] border border-white/6 text-xs text-[#A7A1AD]">
                  <MagnifyingGlass size={13} />
                  <span>Tìm hội viên, hợp đồng...</span>
                </div>
                <div className="p-1.5 text-[#A7A1AD] hover:text-white">
                  <Bell size={16} />
                </div>
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center font-['Be_Vietnam_Pro',sans-serif] font-bold text-[11px] text-white">
                  FF
                </div>
              </div>
            </div>

            {/* Dashboard Inner Body */}
            <div className="p-4 sm:p-8 bg-[#0B090E]">
              {/* 4 Key Metrics Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                {/* Metric 1 */}
                <div className="p-5 rounded-[12px] bg-[#151119] border border-white/8">
                  <div className="flex items-center justify-between text-[#A7A1AD] text-xs font-['Plus_Jakarta_Sans',sans-serif] mb-2">
                    <span>Doanh thu tháng</span>
                    <CurrencyCircleDollar size={18} className="text-purple-400" />
                  </div>
                  <div className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl sm:text-3xl text-white tracking-tight">
                    ₫482,500,000
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-['Plus_Jakarta_Sans',sans-serif] text-emerald-400 font-semibold mt-2">
                    <TrendUp size={13} weight="bold" />
                    <span>+14.8% so với tháng trước</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="p-5 rounded-[12px] bg-[#151119] border border-white/8">
                  <div className="flex items-center justify-between text-[#A7A1AD] text-xs font-['Plus_Jakarta_Sans',sans-serif] mb-2">
                    <span>Hội viên kích hoạt</span>
                    <Users size={18} className="text-purple-400" />
                  </div>
                  <div className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl sm:text-3xl text-white tracking-tight">
                    2,841
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-['Plus_Jakarta_Sans',sans-serif] text-emerald-400 font-semibold mt-2">
                    <CaretUp size={13} weight="bold" />
                    <span>+186 đăng ký mới</span>
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="p-5 rounded-[12px] bg-[#151119] border border-white/8">
                  <div className="flex items-center justify-between text-[#A7A1AD] text-xs font-['Plus_Jakarta_Sans',sans-serif] mb-2">
                    <span>Tỷ lệ điểm danh</span>
                    <CheckCircle size={18} className="text-purple-400" />
                  </div>
                  <div className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl sm:text-3xl text-white tracking-tight">
                    87.4%
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-['Plus_Jakarta_Sans',sans-serif] text-purple-300 mt-2">
                    <DotOutline size={16} weight="fill" className="text-emerald-400" />
                    <span>Giờ vàng: 17:30 — 20:00</span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="p-5 rounded-[12px] bg-[#151119] border border-white/8">
                  <div className="flex items-center justify-between text-[#A7A1AD] text-xs font-['Plus_Jakarta_Sans',sans-serif] mb-2">
                    <span>Hợp đồng có hiệu lực</span>
                    <Users size={18} className="text-purple-400" />
                  </div>
                  <div className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl sm:text-3xl text-white tracking-tight">
                    2,314
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-['Plus_Jakarta_Sans',sans-serif] text-emerald-400 font-semibold mt-2">
                    <TrendUp size={13} weight="bold" />
                    <span>94.2% Tái ký hợp đồng</span>
                  </div>
                </div>
              </div>

              {/* Charts & Operational Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Revenue Momentum Chart */}
                <div className="lg:col-span-8 p-6 rounded-[12px] bg-[#151119] border border-white/8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-lg text-white tracking-tight uppercase">
                        TĂNG TRƯỞNG DOANH THU (QUÝ 1 - QUÝ 3)
                      </h4>
                      <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-[#A7A1AD]">
                        Dòng tiền VietQR & Phí gia hạn định kỳ tự động
                      </p>
                    </div>
                    <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold px-2.5 py-1 rounded bg-purple-950/70 border border-purple-500/30 text-purple-300">
                      Realtime API
                    </span>
                  </div>

                  {/* Synthetic high-precision CSS Chart */}
                  <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-4 pt-6 border-b border-white/8 pb-2">
                    {[
                      { month: 'T1', val: 55, rev: '320 Tr' },
                      { month: 'T2', val: 62, rev: '350 Tr' },
                      { month: 'T3', val: 70, rev: '390 Tr' },
                      { month: 'T4', val: 68, rev: '380 Tr' },
                      { month: 'T5', val: 82, rev: '420 Tr' },
                      { month: 'T6', val: 78, rev: '410 Tr' },
                      { month: 'T7', val: 88, rev: '450 Tr' },
                      { month: 'T8', val: 95, rev: '482 Tr' },
                    ].map((bar, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                        <span className="text-[10px] font-['JetBrains_Mono'] text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          {bar.rev}
                        </span>
                        <div
                          style={{ height: `${bar.val}%` }}
                          className={`w-full rounded-t-[4px] transition-all duration-300 ${
                            i === 7
                              ? 'bg-gradient-to-t from-purple-700 to-purple-400 shadow-[0_0_16px_rgba(168,85,247,0.4)]'
                              : 'bg-purple-900/40 group-hover:bg-purple-800/70'
                          }`}
                        />
                        <span className="text-[11px] font-['Plus_Jakarta_Sans',sans-serif] text-[#6F6877] font-semibold">
                          {bar.month}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Member Check-ins & Transactions */}
                <div className="lg:col-span-4 p-6 rounded-[12px] bg-[#151119] border border-white/8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-lg text-white tracking-tight uppercase">
                        CHECK-IN TRỰC TIẾP
                      </h4>
                      <span className="text-[10px] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-emerald-400 uppercase tracking-wider">
                        • Face AI Sync
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {[
                        { name: 'Nguyễn Văn An', plan: 'VIP 12 Tháng', time: '1 phút trước', status: 'Hợp lệ' },
                        { name: 'Trần Thị Mai', plan: 'Gói PT 24 Buổi', time: '3 phút trước', status: 'Hợp lệ' },
                        { name: 'Lê Hoàng Long', plan: 'Vé ngày (VietQR)', time: '7 phút trước', status: 'Hợp lệ' },
                        { name: 'Phạm Minh Đức', plan: 'Standard 6 Tháng', time: '12 phút trước', status: 'Hợp lệ' },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-[8px] bg-[#1B1521]/70 border border-white/5"
                        >
                          <div>
                            <div className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold text-white">
                              {item.name}
                            </div>
                            <div className="font-['Plus_Jakarta_Sans',sans-serif] text-[11px] text-[#A7A1AD]">
                              {item.plan}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-emerald-400 font-semibold block">
                              {item.status}
                            </span>
                            <span className="text-[10px] text-[#6F6877]">{item.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/6 text-center">
                    <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-purple-400 hover:text-purple-300 cursor-pointer">
                      Xem tất cả 142 lượt check-in hôm nay →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
