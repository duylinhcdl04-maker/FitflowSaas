import { type ReactNode, useRef } from 'react'

/**
 * Bọc quanh 1 card để viền sáng nhẹ theo vị trí con trỏ (redesign-existing-projects:
 * "Surface Upgrades: spotlight borders"). Set trực tiếp CSS variable qua ref thay vì
 * useState — tránh re-render toàn bộ card mỗi lần pointermove (chạy rất thường xuyên).
 */
export default function SpotlightCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`)
  }

  return (
    <div ref={ref} onPointerMove={handlePointerMove} className={`spotlight-card ${className}`}>
      {children}
    </div>
  )
}
