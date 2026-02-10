/**
 * 最新消息區域
 * 包含當季推薦、農場活動、下次市集三個卡片
 * 使用 Framer Motion stagger 入場
 */

'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { NextMarketScheduleCard } from './NextMarketScheduleCard'
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  viewportConfig,
} from '@/lib/motion'

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
  return (
    <section className="py-20 px-6 bg-white dark:bg-[#2d1f1a]">
      <motion.div
        variants={staggerContainer(0.15)}
        initial="hidden"
        whileInView="visible"
        viewport={viewportConfig}
        className="max-w-7xl mx-auto"
      >
        {/* 標題區 */}
        <div className="text-center mb-12">
          <motion.h2
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-serif-display text-[#3e2723] dark:text-[#d7ccc8] mb-4"
          >
            最新消息
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-[#5d4037] dark:text-[#bcaaa4] text-lg"
          >
            農場動態與季節活動
          </motion.p>
        </div>

        {/* 卡片網格 */}
        <motion.div
          variants={staggerContainer(0.15)}
          className="grid md:grid-cols-3 gap-8"
        >
          {/* 當季推薦卡片 */}
          {newsCards.seasonalRecommendation.enabled && (() => {
            const IconComponent = getIcon(newsCards.seasonalRecommendation.icon)
            return (
              <motion.div
                variants={staggerItem}
                className="tea-card bg-white dark:bg-[#2d1f1a] rounded-2xl p-8 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <IconComponent className="w-10 h-10 mr-3 text-[#2e7d32]" strokeWidth={2} />
                  <h3 className="text-2xl font-bold text-[#3e2723] dark:text-[#d7ccc8]">
                    {newsCards.seasonalRecommendation.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                  {newsCards.seasonalRecommendation.description}
                </p>
                <Link
                  href={newsCards.seasonalRecommendation.linkUrl}
                  className="inline-flex items-center text-[#d35400] hover:text-[#e67e22] font-medium transition-colors"
                >
                  {newsCards.seasonalRecommendation.linkText}
                </Link>
              </motion.div>
            )
          })()}

          {/* 農場活動卡片 */}
          {newsCards.farmActivity.enabled && (() => {
            const IconComponent = getIcon(newsCards.farmActivity.icon)
            return (
              <motion.div
                variants={staggerItem}
                className="tea-card bg-white dark:bg-[#2d1f1a] rounded-2xl p-8 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <IconComponent className="w-10 h-10 mr-3 text-[#d35400]" strokeWidth={2} />
                  <h3 className="text-2xl font-bold text-[#3e2723] dark:text-[#d7ccc8]">
                    {newsCards.farmActivity.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                  {newsCards.farmActivity.description}
                </p>
                <Link
                  href={newsCards.farmActivity.linkUrl}
                  className="inline-flex items-center text-[#d35400] hover:text-[#e67e22] font-medium transition-colors"
                >
                  {newsCards.farmActivity.linkText}
                </Link>
              </motion.div>
            )
          })()}

          {/* 下次市集卡片 */}
          <motion.div variants={staggerItem}>
            <NextMarketScheduleCard />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
