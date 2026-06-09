'use client'

/**
 * 最新消息區段 — 方向 A
 *
 * 與原版差異：
 * - 將「下次市集」升為主角（左側較寬欄位），兩則消息收為右側次要欄
 * - 連結色由 off-brand 橘 #d35400 改為品牌金 accent-gold
 * - 卡片由厚陰影圓角改為細邊框 + 較收斂的圓角
 * - 標題區加金色 eyebrow 與菱形細線，與其他區段一致
 *
 * Props / 介面與原版相同，可直接替換。
 * （搭配同資料夾的 NextMarketScheduleCard 橘→金修正效果最佳，見 APPLY.md）
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { NextMarketScheduleCard } from './NextMarketScheduleCard'
import { fadeInUp, staggerContainer, staggerItem, viewportConfig } from '@/lib/motion'

interface NewsCard {
  enabled: boolean
  title: string
  icon: string
  description: string
  linkUrl: string
  linkText: string
}

interface NewsSectionProps {
  newsCards: {
    seasonalRecommendation: NewsCard
    farmActivity: NewsCard
  }
  getIcon: (iconName: string) => React.ComponentType<{ className?: string; strokeWidth?: number }>
}

export function NewsSection({ newsCards, getIcon }: NewsSectionProps) {
  const items = [newsCards.seasonalRecommendation, newsCards.farmActivity].filter((c) => c.enabled)

  return (
    <section className="py-24 px-6 bg-white dark:bg-[#2d1f1a]">
      <motion.div
        variants={staggerContainer(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        className="max-w-7xl mx-auto"
      >
        {/* 標題區 */}
        <div className="text-center mb-12">
          <motion.p
            variants={fadeInUp}
            className="text-xs tracking-[0.34em] uppercase text-[#d4af37] mb-3"
          >
            News &amp; Markets
          </motion.p>
          <motion.div variants={fadeInUp} className="flex items-center justify-center gap-3 mb-5">
            <span className="block w-12 h-px bg-[#d4af37]/50" />
            <span className="block w-2 h-2 rotate-45 border border-[#d4af37]/60" />
            <span className="block w-12 h-px bg-[#d4af37]/50" />
          </motion.div>
          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-serif-display text-[#3e2723] dark:text-[#d7ccc8] mb-4"
          >
            最新消息
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-[#5d4037] dark:text-[#bcaaa4] text-lg">
            農場動態、季節活動與下次市集擺攤資訊
          </motion.p>
        </div>

        {/* 主角：市集（寬） + 次要：兩則消息（窄） */}
        <div className="grid lg:grid-cols-5 gap-8 items-stretch">
          <motion.div variants={staggerItem} className="lg:col-span-3">
            <NextMarketScheduleCard />
          </motion.div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            {items.map((card, i) => {
              const IconComponent = getIcon(card.icon)
              return (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="flex-1 bg-white dark:bg-[#2d1f1a] border border-[#e7ded3] dark:border-[#5d4037] rounded-lg p-7 flex flex-col justify-center transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center mb-3">
                    <IconComponent className="w-7 h-7 mr-3 text-[#2e7d32]" strokeWidth={1.8} />
                    <h3 className="text-xl font-serif font-semibold text-[#3e2723] dark:text-[#d7ccc8]">
                      {card.title}
                    </h3>
                  </div>
                  <p className="text-[#5d4037] dark:text-gray-400 mb-5 leading-relaxed">
                    {card.description}
                  </p>
                  <Link
                    href={card.linkUrl}
                    className="inline-flex items-center self-start text-[#3e2723] dark:text-[#d7ccc8] border-b border-[#d4af37] pb-0.5 hover:text-[#5d4037] transition-colors"
                  >
                    {card.linkText}
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
