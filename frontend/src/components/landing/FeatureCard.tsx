import { motion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

interface FeatureCardProps {
  number: string
  title: string
  description: string
  detail?: string
  className?: string
  accent?: boolean
}

export default function FeatureCard({
  number,
  title,
  description,
  detail,
  className = '',
  accent = false,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, ease: CINEMATIC_EASE }}
      whileHover={{ y: -5 }}
      className={`group relative rounded-[8px] border transition-all duration-300 p-6 sm:p-8 flex flex-col justify-between overflow-hidden ${
        accent
          ? 'bg-gradient-to-b from-[#1B1521] to-[#151119] border-purple-500/30 hover:border-purple-500/60 shadow-[0_4px_32px_rgba(168,85,247,0.12)]'
          : 'bg-[#151119] hover:bg-[#1B1521] border-white/8 hover:border-white/20'
      } ${className}`}
    >
      {/* Background Accent Highlight on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/15 transition-all duration-500 pointer-events-none" />

      {/* Top Header with index number */}
      <div className="flex items-start justify-between mb-8 z-10">
        <span className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-3xl sm:text-4xl text-[#6F6877] group-hover:text-purple-400 transition-colors tracking-tight">
          {number}
        </span>
        {detail && (
          <span className="text-[11px] font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-wider text-purple-300 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-500/20 uppercase">
            {detail}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="z-10 mt-auto">
        <h3 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-xl sm:text-2xl uppercase tracking-tight text-[#F5F3F7] group-hover:text-white transition-colors mb-3">
          {title}
        </h3>
        <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm sm:text-base text-[#A7A1AD] leading-relaxed mb-6">
          {description}
        </p>

        {/* Arrow Action Indicator */}
        <div className="flex items-center gap-2 text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-wider text-purple-400 group-hover:text-purple-300 uppercase">
          <span>Tìm hiểu tính năng</span>
          <ArrowRight
            size={14}
            weight="bold"
            className="transition-transform duration-300 group-hover:translate-x-1.5"
          />
        </div>
      </div>
    </motion.div>
  )
}
