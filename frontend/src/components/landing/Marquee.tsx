import { motion } from 'motion/react'

const marqueeItems = [
  'FitFlow',
  'Next-Gen Gym OS',
  'FitFlow',
  'Face Check-in AI',
  'FitFlow',
  'Multi-Branch Sync',
  'FitFlow',
  'VietQR Auto Pay',
  'FitFlow',
  'PT Coaching App',
  'FitFlow',
  'Realtime FinOps',
]

export default function Marquee() {
  return (
    <div className="relative w-full h-14 sm:h-16 bg-[#0E0A17] border-y border-purple-500/20 flex items-center overflow-hidden select-none z-20 shadow-[0_0_30px_rgba(168,85,247,0.08)]">
      {/* Side Vignette Fades */}
      <div className="absolute left-0 inset-y-0 w-16 sm:w-32 bg-gradient-to-r from-[#070609] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-16 sm:w-32 bg-gradient-to-l from-[#070609] to-transparent z-10 pointer-events-none" />

      {/* Infinite Scrolling Track */}
      <motion.div
        className="flex items-center gap-8 sm:gap-12 whitespace-nowrap will-change-transform"
        animate={{ x: ['0%', '-50%'] }}
        transition={{
          duration: 22,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, idx) => (
          <div key={idx} className="flex items-center gap-8 sm:gap-12">
            <span className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-sm sm:text-base tracking-widest text-[#E9D5FF] flex items-center gap-3 uppercase">
              <span className="text-purple-400 font-bold text-lg leading-none">+</span>
              <span className="hover:text-white transition-colors">{item}</span>
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
