/**
 * HeroSection 元件
 *
 * 顯示觀光果園的 Hero 區塊，包含：
 * - 背景圖片
 * - 標題與副標題
 * - CTA 按鈕
 */

import { Leaf, Sparkles } from 'lucide-react'
import { DEFAULT_HERO_IMAGES } from '@/constants/images'

interface HeroSectionProps {
  /** 背景圖片 URL */
  heroBackground?: string
  /** 點擊「季節體驗活動」按鈕的處理函數 */
  onActivityClick: () => void
}

export function HeroSection({
  heroBackground = DEFAULT_HERO_IMAGES.farmTours,
  onActivityClick,
}: HeroSectionProps) {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center text-center pt-[var(--header-height)] overflow-hidden"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#1f2937',
      }}
    >
      {/* 漸層遮罩確保文字可讀性 */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/70 z-10"></div>

      {/* Hero 內容 */}
      <div className="relative z-20 px-6">
        <div className="text-center max-w-7xl mx-auto mb-8">
          <h1 className="text-6xl md:text-8xl font-light text-white mb-6 drop-shadow-2xl">
            豪德觀光果園
          </h1>
          <p className="text-xl md:text-3xl text-white/95 max-w-3xl mx-auto drop-shadow-lg mb-4 font-light flex items-center justify-center gap-3">
            <Leaf className="w-8 h-8" />
            走進山間果園，體驗四季農情
          </p>
          <p className="text-lg md:text-xl text-green-300 font-medium drop-shadow-md flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" />
            季節限定體驗・嘉義梅山秘境
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={onActivityClick}
              className="bg-white/90 backdrop-blur-sm text-green-900 border-2 border-white/50 px-8 py-4 rounded-full hover:bg-white/95 transition-[background-color,box-shadow] duration-300 font-medium shadow-lg hover:shadow-xl"
            >
              季節體驗活動
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
