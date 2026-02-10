/**
 * MotionWrapper - 滾動觸發動畫包裝器
 *
 * 使用 Framer Motion 的 whileInView 實現滾動進場動畫。
 * 支援自訂 variants、delay、className。
 */

'use client'

import { type ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import { fadeInUp, viewportConfig } from '@/lib/motion'

interface MotionWrapperProps {
  children: ReactNode
  variants?: Variants
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'article' | 'aside'
}

export function MotionWrapper({
  children,
  variants = fadeInUp,
  className,
  delay = 0,
  as = 'div',
}: MotionWrapperProps) {
  const Component = motion.create(as)

  return (
    <Component
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      transition={delay ? { delay } : undefined}
      className={className}
    >
      {children}
    </Component>
  )
}
