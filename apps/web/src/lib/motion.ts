/**
 * Framer Motion 共用動畫配置
 *
 * 集中管理 easing curves、spring presets、variant 工廠函數，
 * 確保全站動畫語言一致。
 */

import type { Variants, Transition } from 'framer-motion'

// ===== Easing Curves =====

export const easing = {
  /** 自然減速，適合入場動畫 */
  easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** 柔和彈性，適合注意力引導 */
  easeInOut: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** 茶藝風格：緩慢優雅的展開 */
  teaCeremony: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
}

// ===== Spring Presets =====

export const spring = {
  /** 柔和彈入，適合 CTA 按鈕 */
  bounce: { type: 'spring', stiffness: 300, damping: 20 } as Transition,
  /** 輕微彈性，適合卡片入場 */
  gentle: { type: 'spring', stiffness: 200, damping: 25 } as Transition,
  /** 快速響應，適合 hover 效果 */
  snappy: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
}

// ===== Variant 工廠函數 =====

/** fadeInUp：從下方淡入（最常用） */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easing.easeOut },
  },
}

/** fadeInDown：從上方淡入 */
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easing.easeOut },
  },
}

/** fadeInLeft：從左方滑入 */
export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: easing.easeOut },
  },
}

/** fadeInRight：從右方滑入 */
export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: easing.easeOut },
  },
}

/** scaleIn：縮放彈入 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: spring.bounce,
  },
}

/** clipReveal：clipPath 從底部展開（用於圖片揭示） */
export const clipReveal: Variants = {
  hidden: { clipPath: 'inset(0 0 100% 0)' },
  visible: {
    clipPath: 'inset(0 0 0% 0)',
    transition: { duration: 1.0, delay: 0.3, ease: easing.teaCeremony },
  },
}

/** Stagger Container：子元素依次入場 */
export function staggerContainer(
  staggerChildren = 0.15,
  delayChildren = 0
): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren,
        delayChildren,
      },
    },
  }
}

/** Stagger Item：搭配 staggerContainer 使用的子元素 variant */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easing.easeOut },
  },
}

/** 標題逐字揭示用 variant（搭配 custom prop 傳入 index） */
export const charReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    rotateX: 90,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: easing.easeOut,
    },
  }),
}

// ===== 共用 whileInView 設定 =====

export const viewportConfig = {
  once: true,
  amount: 0.2,
  margin: '0px 0px -80px 0px',
} as const

// ===== 滾動驅動動畫配置 =====

/** 滾動區段預設配置 */
export const scrollSectionConfig = {
  /** 茶道動畫：300vh 滾動距離，完整映射 */
  teaCeremony: {
    height: '300vh',
    mobileHeight: '200vh',
    offset: ['start start', 'end end'] as ['start start', 'end end'],
  },
  /** 視差效果：元素在視窗中的可見範圍 */
  parallax: {
    offset: ['start end', 'end start'] as ['start end', 'end start'],
  },
}

/** 茶道動畫 easing */
export const teaEasing = {
  /** 倒茶的柔和曲線 */
  pour: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
} as const
