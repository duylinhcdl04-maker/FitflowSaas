import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type ButtonProps = {
  children: ReactNode
  href?: string
  variant?: 'primary' | 'secondary'
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500'

const variants = {
  primary:
    'bg-emerald-500 text-zinc-950 shadow-[0_8px_24px_-8px_rgba(16,185,129,0.55)] hover:bg-emerald-400 dark:bg-emerald-400 dark:hover:bg-emerald-300',
  secondary:
    'border border-zinc-300 text-zinc-900 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-50 dark:hover:bg-white/5',
}

// Nhấn nảy nhẹ có lực (spring) thay vì scale tuyến tính cứng — cảm giác "vật lý" hơn khi
// hover/bấm, đúng tinh thần motion design được yêu cầu.
const springTap = { type: 'spring', stiffness: 500, damping: 25 } as const

export default function Button({
  children,
  href,
  variant = 'primary',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}: ButtonProps) {
  const reduce = useReducedMotion()
  const classes = `${base} ${variants[variant]} ${className} ${disabled ? 'pointer-events-none opacity-60' : ''}`
  const motionProps = reduce
    ? {}
    : {
        whileHover: { scale: 1.035, y: -1 },
        whileTap: { scale: 0.96 },
        transition: springTap,
      }

  if (href) {
    return (
      <motion.a href={href} className={classes} {...motionProps}>
        {children}
      </motion.a>
    )
  }

  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} className={classes} {...motionProps}>
      {children}
    </motion.button>
  )
}
