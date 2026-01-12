'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  HeroSection,
  FarmTourList,
  FacilitiesSection,
  InfoSection,
  FAQSection,
  FloatingCTA,
} from '@/components/features/farm-tour'
// 靜態配置資料（網站內容，非動態 API 資料）
import { facilities, faqs, visitInfo, visitNotes } from '@/config/farm-tour.config'

type TabType = 'activities' | 'facilities' | 'info'

/**
 * 觀光果園頁面
 *
 * 功能：
 * - 全螢幕 Hero 區塊
 * - Tab 切換：體驗活動 / 農場設施 / 參觀資訊
 * - FAQ 區塊
 * - 浮動聯絡按鈕
 */
export default function FarmToursPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('activities')

  const handleTourClick = (tourId: string) => {
    router.push(`/farm-tours/${tourId}`)
  }

  const scrollToContent = () => {
    const element = document.getElementById('content-section')
    if (element) {
      const offset = 80
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      })
    }
  }

  const handleTabClick = (tab: TabType) => {
    setActiveTab(tab)
    setTimeout(() => scrollToContent(), 100)
  }

  const tabButtonClass = (tab: TabType) =>
    `flex-1 py-4 px-6 rounded-lg font-medium transition-all ${
      activeTab === tab
        ? 'bg-green-900 text-white'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
    }`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Section */}
      <HeroSection onActivityClick={() => handleTabClick('activities')} />

      {/* Content Section */}
      <div id="content-section" className="max-w-7xl mx-auto px-6 py-16">
        {/* Navigation Tabs */}
        <div className="flex mb-12 bg-white dark:bg-slate-800 rounded-lg shadow-sm p-2">
          <button onClick={() => setActiveTab('activities')} className={tabButtonClass('activities')}>
            季節體驗活動
          </button>
          <button onClick={() => setActiveTab('facilities')} className={tabButtonClass('facilities')}>
            農場設施
          </button>
          <button onClick={() => setActiveTab('info')} className={tabButtonClass('info')}>
            參觀資訊
          </button>
        </div>

        {/* 季節體驗活動 */}
        {activeTab === 'activities' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-light text-green-900 dark:text-green-300">
                四季農園體驗
              </h2>
            </div>
            <FarmTourList onTourClick={handleTourClick} />
          </div>
        )}

        {/* 農場設施 */}
        {activeTab === 'facilities' && <FacilitiesSection facilities={facilities} />}

        {/* 參觀資訊 */}
        {activeTab === 'info' && <InfoSection visitInfo={visitInfo} visitNotes={visitNotes} />}
      </div>

      {/* FAQ 區塊 */}
      <FAQSection faqs={faqs} />

      {/* 浮動 CTA 按鈕 */}
      <FloatingCTA />
    </div>
  )
}
