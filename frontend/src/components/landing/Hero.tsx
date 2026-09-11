import { useState, useRef } from 'react'
import { motion } from 'motion/react'
import { ArrowRight, ArrowUpRight, Lightning, UsersThree, ShieldCheck, CheckCircle, Play } from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Smooth normalized mouse parallax coordinates [-1, 1]
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setMousePos({ x, y })
  }

  function handleMouseLeave() {
    setMousePos({ x: 0, y: 0 })
  }

  return (
    <section className="relative w-full bg-[#070609] pt-16 sm:pt-20 pb-4 sm:pb-8 px-3 sm:px-6 lg:px-8 overflow-hidden select-none">
      {/* Outer Shell - WellFlex Dark Luxury Rounded Card Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative max-w-[1360px] mx-auto rounded-[24px] sm:rounded-[32px] border border-purple-500/20 bg-gradient-to-b from-[#0e0a16] via-[#09070d] to-[#070609] overflow-hidden shadow-[0_0_100px_rgba(168,85,247,0.12)] flex flex-col justify-between pt-4 sm:pt-6 pb-6 sm:pb-7 px-4 sm:px-8 lg:px-10"
      >
        {/* Ambient Glows & Subtle Dust Backdrops */}
        <div
          aria-hidden="true"
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[650px] h-[260px] sm:h-[380px] bg-purple-600/25 rounded-full blur-[120px] pointer-events-none transition-transform duration-700 ease-out"
          style={{
            transform: `translate(calc(-50% + ${mousePos.x * 25}px), calc(-50% + ${mousePos.y * 18}px))`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-purple-900/15 rounded-full blur-[100px] pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute top-10 right-10 w-[260px] h-[260px] bg-purple-500/10 rounded-full blur-[90px] pointer-events-none"
        />

        {/* Top Floating Badge & Metric Strip */}
        <div className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-2.5 w-full mb-1">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: CINEMATIC_EASE }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-[#161022]/80 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.15)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-400" />
            </span>
            <span className="font-['Plus_Jakarta_Sans',sans-serif] text-[10px] sm:text-[11px] font-semibold tracking-wider text-purple-200 uppercase">
              NỀN TẢNG QUẢN TRỊ FITNESS THẾ HỆ MỚI
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: CINEMATIC_EASE }}
            className="hidden sm:flex items-center gap-5 text-xs text-[#A7A1AD] font-['JetBrains_Mono']"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              99.9% Uptime SLA
            </span>
            <span className="flex items-center gap-1.5">
              <Lightning size={13} className="text-purple-400" weight="fill" />
              Face Check-in &lt; 0.2s
            </span>
          </motion.div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* CENTERPIECE: Layered Typography & Cloudinary Athlete Parallax      */}
        {/* ----------------------------------------------------------------- */}
        <div className="relative w-full flex-1 flex flex-col items-center justify-center my-1 sm:my-2 min-h-[220px] sm:min-h-[270px] lg:min-h-[310px]">
          {/* Layer 1: Giant Typographic "FITFLOW" Backdrop */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2, ease: CINEMATIC_EASE }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-transform duration-500 ease-out"
            style={{
              transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 8}px)`,
            }}
          >
            <h1 className="font-['Be_Vietnam_Pro',sans-serif] font-black text-[13vw] sm:text-[11vw] lg:text-[135px] xl:text-[165px] leading-none tracking-tight sm:tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#F3E8FF] to-[#A855F7]/30 drop-shadow-[0_0_80px_rgba(168,85,247,0.3)] select-none text-center">
              FITFLOW
            </h1>
          </motion.div>

          {/* Layer 2: Cloudinary Bodybuilder Athlete Cutout with Inverse Parallax */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.0, delay: 0.35, ease: CINEMATIC_EASE }}
            className="relative z-20 flex items-center justify-center w-full max-w-[620px] lg:max-w-[740px] px-2 transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -12}px)`,
            }}
          >
            <img
              src="/images/hero-athlete.png"
              alt="FitFlow Athletic Ambassador"
              className="w-full h-auto object-contain max-h-[210px] sm:max-h-[260px] lg:max-h-[310px] drop-shadow-[0_20px_50px_rgba(0,0,0,0.95)] pointer-events-none"
              loading="eager"
            />
          </motion.div>

          {/* Layer 3: Floating Left Glass Telemetry Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: CINEMATIC_EASE }}
            className="hidden lg:flex absolute left-4 xl:left-8 top-1/2 -translate-y-1/2 z-30 flex-col gap-1 p-2.5 rounded-2xl border border-white/10 bg-[#151119]/80 backdrop-blur-xl shadow-2xl shadow-black/60 max-w-[185px] transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${mousePos.x * 16}px, calc(-50% + ${mousePos.y * 12}px))`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400">
                <Lightning size={14} weight="fill" />
              </span>
              <div>
                <p className="text-[9px] text-[#A7A1AD] uppercase font-['Plus_Jakarta_Sans',sans-serif] tracking-wider">
                  Check-in AI
                </p>
                <p className="text-xs font-bold text-white font-['JetBrains_Mono']">&lt; 0.2s tức thì</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-emerald-400 border-t border-white/5 pt-1 mt-0.5">
              <CheckCircle size={11} weight="fill" />
              <span>Chống quẹt thẻ hộ</span>
            </div>
          </motion.div>

          {/* Layer 4: Floating Right Glass Telemetry Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.7, ease: CINEMATIC_EASE }}
            className="hidden lg:flex absolute right-4 xl:right-8 top-1/2 -translate-y-1/2 z-30 flex-col gap-1 p-2.5 rounded-2xl border border-white/10 bg-[#151119]/80 backdrop-blur-xl shadow-2xl shadow-black/60 max-w-[190px] transition-transform duration-300 ease-out"
            style={{
              transform: `translate(${mousePos.x * -16}px, calc(-50% + ${mousePos.y * -10}px))`,
            }}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                <UsersThree size={14} weight="fill" />
              </span>
              <div>
                <p className="text-[9px] text-[#A7A1AD] uppercase font-['Plus_Jakarta_Sans',sans-serif] tracking-wider">
                  Hội viên hôm nay
                </p>
                <p className="text-xs font-bold text-white font-['JetBrains_Mono']">842 / 1,000 lượt</p>
              </div>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 rounded-full w-[84%]" />
            </div>
          </motion.div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* HERO CALLOUT & CTA BUTTONS (Directly beneath athlete, WellFlex style)*/}
        {/* ----------------------------------------------------------------- */}
        <div className="relative z-30 flex flex-col items-center text-center max-w-2xl mx-auto mt-1 sm:mt-2">
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: CINEMATIC_EASE }}
            className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-xl sm:text-3xl lg:text-[38px] leading-[1.2] tracking-tight text-[#F5F3F7]"
          >
            VẬN HÀNH TINH GỌN.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F3F7] via-[#C084FC] to-purple-400">
              BỨT PHÁ TĂNG TRƯỞNG.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6, ease: CINEMATIC_EASE }}
            className="mt-2 font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm text-[#A7A1AD] max-w-md sm:max-w-lg leading-relaxed"
          >
            Hệ điều hành quản trị Gym All-in-One: Quản lý hội viên, Face Check-in AI, thanh toán VietQR tự động và điều phối HLV PT chuyên sâu.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75, ease: CINEMATIC_EASE }}
            className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            {/* Primary Pill Button - WellFlex Style with Glowing Neon Purple */}
            <a
              href="/owner/register"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:to-purple-400 text-white font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm font-bold tracking-wide transition-all shadow-[0_0_35px_rgba(168,85,247,0.45)] hover:shadow-[0_0_55px_rgba(168,85,247,0.7)] active:scale-95"
            >
              <span>DÙNG THỬ MIỄN PHÍ</span>
              <ArrowUpRight
                size={16}
                weight="bold"
                className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </a>

            {/* Secondary Glass Pill Button */}
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 rounded-full border border-white/10 hover:border-white/25 bg-white/5 hover:bg-white/10 text-[#F5F3F7] font-['Plus_Jakarta_Sans',sans-serif] text-xs sm:text-sm font-semibold tracking-wide transition-all active:scale-95 backdrop-blur-md"
            >
              <Play size={14} weight="fill" className="text-purple-400" />
              <span>KHÁM PHÁ GIẢI PHÁP</span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
