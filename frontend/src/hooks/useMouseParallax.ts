import { useEffect, useState } from 'react'

export function useMouseParallax(sensitivity = 1) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, normalizedX: 0, normalizedY: 0 })

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const { innerWidth, innerHeight } = window
      // Normalize from -1 to 1
      const normalizedX = ((e.clientX / innerWidth) * 2 - 1) * sensitivity
      const normalizedY = ((e.clientY / innerHeight) * 2 - 1) * sensitivity

      setMousePos({
        x: e.clientX,
        y: e.clientY,
        normalizedX,
        normalizedY,
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [sensitivity])

  return mousePos
}
