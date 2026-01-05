/**
 * 最新消息區域
 * 包含當季推薦、農場活動、下次市集、聯絡我們四個卡片
 */

import Link from 'next/link'
import { Phone } from 'lucide-react'
import { NextMarketScheduleCard } from './NextMarketScheduleCard'

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
  isVisible: boolean
}

export function NewsSection({ newsCards, getIcon, isVisible }: NewsSectionProps) {
  return (
    <section
      id="news"
      data-animate
      className="py-20 px-6 bg-[#f8f5f0] dark:bg-[#1a120d]"
    >
      <div className="max-w-7xl mx-auto">
        {/* 標題區 */}
        <div className="text-center mb-12">
          <h2
            className={`text-4xl md:text-5xl font-serif-display text-[#3e2723] dark:text-[#d7ccc8] mb-4 ${
              isVisible ? 'animate-fade-in' : 'opacity-0'
            }`}
          >
            最新消息
          </h2>
          <p
            className={`text-[#5d4037] dark:text-[#bcaaa4] text-lg ${
              isVisible ? 'animate-fade-in animation-delay-150' : 'opacity-0'
            }`}
          >
            農場動態與季節活動
          </p>
        </div>

        {/* 卡片網格 */}
        <div
          className={`grid md:grid-cols-2 gap-8 ${
            isVisible ? 'animate-slide-up animation-delay-300' : 'opacity-0'
          }`}
        >
          {/* 當季推薦卡片 */}
          {newsCards.seasonalRecommendation.enabled && (() => {
            const IconComponent = getIcon(newsCards.seasonalRecommendation.icon)
            return (
              <div className="bg-white dark:bg-[#2d1f1a] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
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
              </div>
            )
          })()}

          {/* 農場活動卡片 */}
          {newsCards.farmActivity.enabled && (() => {
            const IconComponent = getIcon(newsCards.farmActivity.icon)
            return (
              <div className="bg-white dark:bg-[#2d1f1a] rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
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
              </div>
            )
          })()}

          {/* 下次市集卡片 */}
          <NextMarketScheduleCard />

          {/* 聯絡我們卡片 */}
          <div className="bg-white dark:bg-[#2d1f1a] rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex justify-center mb-4">
              <Phone className="w-12 h-12 text-[#d35400]" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-[#3e2723] dark:text-[#d7ccc8] mb-4">
              聯絡我們
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
              有任何問題歡迎與我們聯繫
            </p>
            <Link
              href="/contact"
              className="inline-block bg-[#d35400] hover:bg-[#e67e22] text-white px-8 py-3 rounded-full font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              立即聯繫
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
