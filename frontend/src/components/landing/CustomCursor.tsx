import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useIsMobile, useIsTouchDevice, usePrefersReducedMotion } from '../../hooks/useMediaQuery'

export default function CustomCursor() {
  const isMobile = useIsMobile()
  const isTouch = useIsTouchDevice()
  const prefersReduced = usePrefersReducedMotion()
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [cursorState, setCursorState] = useState<'default' | 'button' | 'image'>('default')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isMobile || isTouch || prefersReduced) return

    function handleMouseMove(e: MouseEvent) {
      setPos({ x: e.clientX, y: e.clientY })
      if (!visible) setVisible(true)

      const target = e.target as HTMLElement | null
      if (!target) return

      const isButtonOrLink = target.closest('button, a, input, [role="button"]')
      const isInteractiveImage = target.closest('[data-cursor="image"]')

      if (isInteractiveImage) {
        setCursorState('image')
      } else if (isButtonOrLink) {
        setCursorState('button')
      } else {
        setCursorState('default')
      }
    }

    function handleMouseLeave() {
      setVisible(false)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isMobile, isTouch, prefersReduced, visible])

  if (isMobile || isTouch || prefersReduced || !visible) return null

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed z-9999 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-medium tracking-wider text-[9px] uppercase transition-colors"
      animate={{
        x: pos.x,
        y: pos.y,
        width: cursorState === 'image' ? 56 : cursorState === 'button' ? 28 : 6,
        height: cursorState === 'image' ? 56 : cursorState === 'button' ? 28 : 6,
        backgroundColor:
          cursorState === 'image'
            ? 'rgba(168, 85, 247, 0.9)'
            : cursorState === 'button'
            ? 'rgba(192, 132, 252, 0.25)'
            : '#ffffff',
        border:
          cursorState === 'button'
            ? '1px solid rgba(168, 85, 247, 0.6)'
            : 'none',
        backdropFilter: cursorState === 'image' ? 'blur(4px)' : 'none',
      }}
      transition={{
        type: 'spring',
        damping: 28,
        stiffness: 400,
        mass: 0.2,
      }}
    >
      {cursorState === 'image' && (
        <span className="text-zinc-950 font-bold tracking-widest">XEM</span>
      )}
    </motion.div>
  )
}
