/**
 * 觀光果園 HeroSection — 方向 A
 *
 * 與原版差異：
 * - 暖色方向漸層遮罩（取代純黑漸層）
 * - 金色 eyebrow（季節限定體驗・嘉義梅山秘境）置於標題上方
 * - 主標改襯線（font-serif）
 * - 副標 green-300 → 暖白；CTA 由白底綠字 → 品牌金（深褐字）
 *
 * Props 與原版相同，可直接覆蓋 components/features/farm-tour/HeroSection.tsx
 */

import { Sparkles } from 'lucide-react'
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
        backgroundColor: '#2a160d',
      }}
    >
      {/* 暖色漸層遮罩確保文字可讀性 */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(180deg, rgba(40,20,12,0.55) 0%, rgba(40,20,12,0.35) 45%, rgba(30,15,9,0.78) 100%)',
        }}
      ></div>

      {/* Hero 內容 */}
      <div className="relative z-20 px-6">
        <div className="text-center max-w-7xl mx-auto mb-8">
          <p className="inline-flex items-center justify-center gap-2 text-sm md:text-base tracking-[0.3em] uppercase text-[#d4af37] mb-6">
            <Sparkles className="w-4 h-4" />
            季節限定體驗・嘉義梅山秘境
          </p>
          <h1 className="font-serif text-5xl md:text-7xl text-white mb-6 drop-shadow-2xl tracking-wide">
            豪德觀光果園
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto drop-shadow-lg font-light">
            走進山間果園，體驗四季農情
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={onActivityClick}
            className="bg-[#d4af37] hover:bg-[#c5a028] text-[#3a2a08] px-8 py-4 rounded-sm font-semibold shadow-lg hover:shadow-xl transition-[background-color,box-shadow,transform] duration-300 hover:-translate-y-0.5"
          >
            季節體驗活動
          </button>
        </div>
      </div>
    </section>
  )
}
