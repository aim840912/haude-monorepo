'use client'

/**
 * 首頁客戶端元件
 *
 * 處理所有客戶端互動邏輯：
 * - 視差滾動效果（Hero）
 * - 輪播狀態（Hero）
 * - 翻轉卡片狀態（Features）
 * - 滾動進度指示器
 *
 * 各 section 使用 Framer Motion whileInView 自管理入場動畫，
 * 不再需要集中式 IntersectionObserver。
 */

import { useState, useEffect } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import {
  Sprout,
  Apple,
  Wheat,
  Leaf,
  PartyPopper,
  Calendar,
  Users,
  Sparkles,
} from 'lucide-react'
import {
  HeroSection,
  FeaturesSection,
  NewsSection,
  BrandStorySection,
  TestimonialsSection,
  CTASection,
  TeaCeremonySection,
} from '@/components/features/home'
import { ProductsSection } from '@/components/features/products/section/ProductsSection'
import { useHomeSettings } from '@/hooks/useSiteSettings'
import { SETTING_KEYS } from '@/types/siteSettings'
import {
  DEFAULT_HERO_IMAGES,
  DEFAULT_FEATURE_CARD_IMAGES,
} from '@/constants/images'

// 圖示映射函數
const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; strokeWidth?: number }>
> = {
  sprout: Sprout,
  apple: Apple,
  wheat: Wheat,
  leaf: Leaf,
  'party-popper': PartyPopper,
  calendar: Calendar,
  users: Users,
  sparkles: Sparkles,
}

const getIcon = (iconName: string) => {
  return iconMap[iconName.toLowerCase()] || Sprout
}

export function HomePageClient() {
  // 狀態 — 僅保留 Hero 視差、輪播、翻轉卡片所需
  const [scrollY, setScrollY] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeFeature, setActiveFeature] = useState(-1)
  const [mounted, setMounted] = useState(false)

  // 滾動進度條
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  // 載入首頁設定
  const { settings, loading: settingsLoading } = useHomeSettings()

  // 解析 Hero 圖片
  const heroImages = (() => {
    if (settingsLoading) return DEFAULT_HERO_IMAGES.home

    const heroSetting = settings[SETTING_KEYS.HOME_HERO_IMAGES]
    if (!heroSetting) return DEFAULT_HERO_IMAGES.home

    try {
      const parsed = JSON.parse(heroSetting.value)
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : DEFAULT_HERO_IMAGES.home
    } catch {
      return DEFAULT_HERO_IMAGES.home
    }
  })()

  // 解析特色卡片圖片
  const featureCardImages = [
    settings[SETTING_KEYS.HOME_FEATURE_CARD_1_IMAGE]?.value ||
      DEFAULT_FEATURE_CARD_IMAGES[0],
    settings[SETTING_KEYS.HOME_FEATURE_CARD_2_IMAGE]?.value ||
      DEFAULT_FEATURE_CARD_IMAGES[1],
    settings[SETTING_KEYS.HOME_FEATURE_CARD_3_IMAGE]?.value ||
      DEFAULT_FEATURE_CARD_IMAGES[2],
    settings[SETTING_KEYS.HOME_FEATURE_CARD_4_IMAGE]?.value ||
      DEFAULT_FEATURE_CARD_IMAGES[3],
  ]

  // 最新消息卡片資料
  const newsCards = {
    seasonalRecommendation: {
      enabled:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED]
          ?.value === 'true' ||
        !settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED],
      title:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_TITLE]?.value ||
        '當季推薦',
      icon:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ICON]?.value ||
        'sprout',
      description:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_DESCRIPTION]
          ?.value ||
        '春季特選紅肉李正在盛產中！果肉飽滿、甜度高，限量供應中',
      linkUrl:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_URL]
          ?.value || '/products',
      linkText:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_TEXT]
          ?.value || '查看產品 →',
    },
    farmActivity: {
      enabled:
        settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ENABLED]?.value ===
          'true' ||
        !settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ENABLED],
      title:
        settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_TITLE]?.value ||
        '農場活動',
      icon:
        settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ICON]?.value ||
        'party-popper',
      description:
        settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_DESCRIPTION]?.value ||
        '週末採果體驗活動熱烈報名中！帶孩子來體驗親手採摘的樂趣',
      linkUrl:
        settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_URL]?.value ||
        '/farm-tours',
      linkText:
        settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_TEXT]?.value ||
        '立即預約 →',
    },
  }

  // 客戶端掛載標記（避免 SSR hydration mismatch）
  useEffect(() => {
    setMounted(true)
  }, [])

  // 視差滾動效果（僅 Hero 區需要）
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen">
      {/* 滾動進度指示器 — 僅客戶端掛載後渲染，避免 MotionValue hydration mismatch */}
      {mounted && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[3px] bg-[#d4af37] z-50 origin-left"
          style={{ scaleX }}
        />
      )}

      {/* Hero 區域 */}
      <HeroSection
        images={heroImages}
        scrollY={scrollY}
        currentSlide={currentSlide}
        onSlideChange={setCurrentSlide}
      />

      {/* 農場特色區域 */}
      <FeaturesSection
        activeFeature={activeFeature}
        onFeatureClick={setActiveFeature}
        featureImages={featureCardImages}
      />

      {/* 滾動驅動泡茶動畫 — 製茶過程視覺敘事 */}
      <TeaCeremonySection />

      {/* 精選產品區域 */}
      <ProductsSection
        limit={4}
        title="精選好茶"
        subtitle="嚴選自梅山高山的優質茶品"
      />

      {/* 品牌故事區域 */}
      <BrandStorySection />

      {/* 客戶評價區域 */}
      <TestimonialsSection />

      {/* 最新消息區域 */}
      <NewsSection
        newsCards={newsCards}
        getIcon={getIcon}
      />

      {/* 訂閱 CTA 區域 */}
      <CTASection />
    </div>
  )
}
