'use client'

/**
 * 農場特色 — 方向 A「編輯式分欄」
 *
 * 取代原本的 3D 翻轉卡 + scroll-driven 隨機翻牌：
 * - 改為四欄編輯式版面，欄與欄之間以細金線分隔
 * - 圖示統一為茶褐色線性圖示（不再混綠 / 橘 / 棕、無粉彩底圈）
 * - 每欄一個具體數字（金色襯線）
 * - 保留 Framer Motion stagger 入場
 *
 * Props 與原版相同，可直接替換。featureImages / scrollYProgress / activeFeature
 * 在此版本不再需要（保留於介面以維持相容）。
 */

import { useRef } from 'react'
import Link from 'next/link'
import { Sprout, ShieldCheck, Mountain, Recycle } from 'lucide-react'
import { motion, type MotionValue } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { staggerContainer, viewportConfig, easing } from '@/lib/motion'

interface FeatureCardsProps {
  activeFeature: number
  onFeatureClick: (index: number) => void
  featureImages: string[]
  scrollYProgress: MotionValue<number>
}

const features = [
  {
    Icon: Sprout,
    title: '自然農法',
    desc: '不使用化學農藥與肥料，讓茶樹在最自然的環境生長',
    statNum: '15+',
    statUnit: '年有機栽培',
    link: '/about',
  },
  {
    Icon: ShieldCheck,
    title: '品質把關',
    desc: '從採摘到包裝，每一道工序皆經過嚴格的品質檢驗',
    statNum: '100%',
    statUnit: '產地直送',
    link: '/about',
  },
  {
    Icon: Mountain,
    title: '高山茶園',
    desc: '海拔一千公尺以上，雲霧繚繞孕育清甜的高山茶香',
    statNum: '1,200',
    statUnit: '公尺海拔',
    link: '/farm-tours',
  },
  {
    Icon: Recycle,
    title: '永續共生',
    desc: '友善環境的種植方式，維護梅山生態的多樣性',
    statNum: '零',
    statUnit: '化學殘留',
    link: '/about',
  },
]

const colEnter: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easing.easeOut } },
}

export function FeatureCards({
  onFeatureClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activeFeature: _activeFeature,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  featureImages: _featureImages,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  scrollYProgress: _scrollYProgress,
}: FeatureCardsProps) {
  const ref = useRef<HTMLDivElement>(null)

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer(0.12)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-10 mb-12"
    >
      {features.map((f, index) => (
        <motion.div key={f.title} variants={colEnter}>
          <Link
            href={f.link}
            onClick={() => onFeatureClick(index)}
            className="group block h-full px-0 lg:px-8 lg:border-l lg:first:border-l-0 lg:first:pl-0 border-[#e7ded3] dark:border-[#5d4037]"
          >
            <div className="font-serif text-[#d4af37] text-base tracking-[0.2em] mb-5">
              {String(index + 1).padStart(2, '0')}
            </div>
            <f.Icon
              className="w-9 h-9 text-[#3e2723] dark:text-[#d7ccc8] mb-5 transition-transform duration-300 group-hover:-translate-y-0.5"
              strokeWidth={1.4}
            />
            <h3 className="font-serif text-xl font-semibold text-[#3e2723] dark:text-[#d7ccc8] mb-2">
              {f.title}
            </h3>
            <p className="text-sm text-[#5d4037] dark:text-[#bcaaa4] leading-relaxed mb-6">
              {f.desc}
            </p>
            <div className="flex items-baseline gap-2 pt-4 border-t border-[#e7ded3] dark:border-[#5d4037]">
              <span className="font-serif text-2xl font-bold text-[#d4af37]">{f.statNum}</span>
              <span className="text-xs text-[#695a52] dark:text-[#a69187] tracking-wide">
                {f.statUnit}
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
