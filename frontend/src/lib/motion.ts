import type { Transition, Variants } from 'motion/react'

export const CINEMATIC_EASE = [0.22, 1, 0.36, 1] as const

export const defaultTransition: Transition = {
  duration: 0.8,
  ease: CINEMATIC_EASE,
}

export const microTransition: Transition = {
  duration: 0.3,
  ease: CINEMATIC_EASE,
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: CINEMATIC_EASE,
    },
  },
}

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.85,
      ease: CINEMATIC_EASE,
    },
  },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

export const heroLineReveal: Variants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.9,
      ease: CINEMATIC_EASE,
    },
  },
}
