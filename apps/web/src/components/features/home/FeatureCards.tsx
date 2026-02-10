/**
 * 農場特色 3D 翻轉卡片
 * 正面顯示圖示和標題，背面顯示背景圖片
 * 使用 Framer Motion stagger 入場，保留 CSS flip-card 翻轉效果
 */

'use client'

import Link from 'next/link'
import { Sprout, ShieldCheck, Users, Recycle } from 'lucide-react'
import { motion } from 'framer-motion'
import { staggerContainer, staggerItem, viewportConfig } from '@/lib/motion'

interface FeatureCardsProps {
  activeFeature: number
  onFeatureClick: (index: number) => void
  featureImages: string[]
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

export function FeatureCards({
  activeFeature,
  onFeatureClick,
  featureImages,
}: FeatureCardsProps) {
  return (
    <motion.div
      variants={staggerContainer(0.15)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20"
    >
      {features.map((feature, index) => {
        const isFlipped = activeFeature === index

        return (
          <motion.div
            key={index}
            variants={staggerItem}
            className={`flip-card ${isFlipped ? 'flipped' : ''}`}
            onClick={() => onFeatureClick(isFlipped ? -1 : index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onFeatureClick(isFlipped ? -1 : index)
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
              {/* 卡片正面 */}
              <div className="flip-card-front bg-white dark:bg-[#2d1f1a] shadow-lg flex flex-col items-center justify-center text-center p-6">
                <div className={`w-16 h-16 ${feature.bgColor} dark:bg-opacity-20 rounded-full flex items-center justify-center mb-4`}>
                  <feature.Icon className={`w-10 h-10 ${feature.iconColor}`} strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-[#3e2723] dark:text-[#d7ccc8] mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.desc}</p>
              </div>

              {/* 卡片背面 */}
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
