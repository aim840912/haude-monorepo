/**
 * 農場特色 3D 翻轉卡片
 * 正面：放大金邊圖示 + 金色裝飾線 + hover 光暈
 * 背面：背景圖片 + stat（保持不變）
 * scroll-linked 差速視差（兩側慢、中間快）
 * scroll-driven 隨機翻轉 + 手動點擊翻轉
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Sprout, ShieldCheck, Users, Recycle } from 'lucide-react'
import { motion, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion'
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
    desc: '有機無毒栽培',
    detailDesc: '堅持不使用化學農藥與肥料，讓茶樹在最自然的環境生長',
    stat: '15+ 年有機認證',
    link: '/about',
    iconColor: 'text-[#2e7d32]',
    bgColor: 'bg-[#e8f5e9]',
  },
  {
    Icon: ShieldCheck,
    title: '品質認證',
    desc: '嚴格品質把關',
    detailDesc: '從採摘到包裝，每一道工序都經過嚴格的品質檢驗',
    stat: '100% 產地直送',
    link: '/about',
    iconColor: 'text-[#d35400]',
    bgColor: 'bg-[#fff3e0]',
  },
  {
    Icon: Users,
    title: '農場體驗',
    desc: '四季活動豐富',
    detailDesc: '親手採茶、製茶體驗，感受從茶園到茶杯的完整旅程',
    stat: '年接待 2000+ 人',
    link: '/farm-tours',
    iconColor: 'text-[#5d4037]',
    bgColor: 'bg-[#efebe9]',
  },
  {
    Icon: Recycle,
    title: '永續經營',
    desc: '生態平衡共生',
    detailDesc: '友善環境的種植方式，維護梅山生態多樣性',
    stat: '零化學殘留',
    link: '/about',
    iconColor: 'text-[#2e7d32]',
    bgColor: 'bg-[#e8f5e9]',
  },
]

/** scaleIn + fadeInUp 組合入場 variant */
const cardEnter: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.85 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: easing.easeOut },
  },
}

/** Scroll thresholds for progressive card flips */
const FLIP_THRESHOLDS = [0.25, 0.35, 0.45, 0.55]

/** Fisher-Yates shuffle */
function shuffleArray(arr: number[]): number[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function FeatureCards({
  activeFeature: _activeFeature,
  onFeatureClick,
  featureImages,
  scrollYProgress,
}: FeatureCardsProps) {
  // 4 張卡片差速視差：兩側慢、中間快（不能在 .map 中呼叫 hooks）
  const card0Y = useTransform(scrollYProgress, [0, 1], [15, -15])
  const card1Y = useTransform(scrollYProgress, [0, 1], [25, -25])
  const card2Y = useTransform(scrollYProgress, [0, 1], [25, -25])
  const card3Y = useTransform(scrollYProgress, [0, 1], [15, -15])
  const cardYValues = [card0Y, card1Y, card2Y, card3Y]

  // === Scroll-driven random flip ===
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set())
  const flipOrderRef = useRef<number[]>([0, 1, 2, 3])
  const userControlledRef = useRef<Set<number>>(new Set())

  // Randomize flip order on mount
  useEffect(() => {
    flipOrderRef.current = shuffleArray([0, 1, 2, 3])
  }, [])

  // Scroll-driven: progressively flip/unflip cards at thresholds
  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    setFlippedCards((prev) => {
      const next = new Set(prev)
      let changed = false

      FLIP_THRESHOLDS.forEach((threshold, i) => {
        const cardIndex = flipOrderRef.current[i]
        if (userControlledRef.current.has(cardIndex)) return // skip user-overridden

        const shouldFlip = latest >= threshold
        const isCurrentlyFlipped = next.has(cardIndex)

        if (shouldFlip && !isCurrentlyFlipped) {
          next.add(cardIndex)
          changed = true
        } else if (!shouldFlip && isCurrentlyFlipped) {
          next.delete(cardIndex)
          changed = true
        }
      })

      return changed ? next : prev
    })
  })

  // Manual click: toggle + mark as user-controlled (scroll won't override)
  const handleCardClick = (index: number) => {
    userControlledRef.current.add(index)
    setFlippedCards((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
    onFeatureClick(index)
  }

  return (
    <motion.div
      variants={staggerContainer(0.15)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
    >
      {features.map((feature, index) => {
        const isFlipped = flippedCards.has(index)

        return (
          <motion.div
            key={index}
            variants={cardEnter}
            style={{ y: cardYValues[index] }}
            className={`flip-card ${isFlipped ? 'flipped' : ''} transform-gpu`}
            onClick={() => handleCardClick(index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCardClick(index)
              }
            }}
            tabIndex={0}
            role="button"
            aria-pressed={isFlipped}
            aria-label={`${feature.title}: ${feature.desc}。${
              isFlipped ? '按下以返回正面' : '按下以查看更多'
            }`}
          >
            <div className="flip-card-inner">
              {/* 卡片正面 — 金邊圖示 + 裝飾線 */}
              <div className="flip-card-front bg-white dark:bg-[#2d1f1a] shadow-lg flex flex-col items-center justify-center text-center p-6 border-b-2 border-[#d4af37]/20">
                <div className={`w-20 h-20 ${feature.bgColor} dark:bg-opacity-20 rounded-full flex items-center justify-center mb-4 border-2 border-[#d4af37]/30 feature-icon-ring`}>
                  <feature.Icon className={`w-10 h-10 ${feature.iconColor}`} strokeWidth={1.5} />
                </div>
                {/* 金色裝飾短線 */}
                <div className="w-8 h-0.5 bg-[#d4af37]/40 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-[#3e2723] dark:text-[#d7ccc8] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
              </div>

              {/* 卡片背面 — 保持不變 */}
              <div
                className="flip-card-back shadow-lg"
                style={{
                  backgroundImage: featureImages[index]
                    ? `url(${featureImages[index]})`
                    : `linear-gradient(135deg, #3e2723 0%, #5d4037 100%)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* 遮罩層 */}
                <div className="absolute inset-0 bg-black/40 rounded-2xl" />
                {/* 內容 */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-6">
                  <feature.Icon className="w-12 h-12 text-white mb-3" strokeWidth={1.5} />
                  <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/80 text-sm mb-3">{feature.detailDesc}</p>
                  <p className="text-[#d4af37] text-lg font-bold">{feature.stat}</p>
                  <Link href={feature.link} className="mt-3 text-white/60 text-xs underline hover:text-white/80 transition-colors">
                    了解更多
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
