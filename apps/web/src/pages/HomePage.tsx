/**
 * 首頁
 * 整合 HeroSection、FeaturesSection、NewsSection
 */

import { useState, useEffect } from 'react'
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
import { HeroSection, FeaturesSection, NewsSection } from '@/components/features/home'
import { useHomeSettings } from '@/hooks/useSiteSettings'
import { SETTING_KEYS } from '@/types/siteSettings'
import { DEFAULT_HERO_IMAGES, DEFAULT_FEATURE_CARD_IMAGES } from '@/constants/images'

// 圖示映射函數
const iconMap: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
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

export function HomePage() {
  // 狀態
  const [scrollY, setScrollY] = useState(0)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const [activeFeature, setActiveFeature] = useState(-1)

  // 載入首頁設定
  const { settings, loading: settingsLoading } = useHomeSettings()

  // 解析 Hero 圖片
  const heroImages = (() => {
    if (settingsLoading) return DEFAULT_HERO_IMAGES.home

    const heroSetting = settings[SETTING_KEYS.HOME_HERO_IMAGES]
    if (!heroSetting) return DEFAULT_HERO_IMAGES.home

    try {
      const parsed = JSON.parse(heroSetting.value)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_HERO_IMAGES.home
    } catch {
      return DEFAULT_HERO_IMAGES.home
    }
  })()

  // 解析特色卡片圖片
  const featureCardImages = [
    settings[SETTING_KEYS.HOME_FEATURE_CARD_1_IMAGE]?.value || DEFAULT_FEATURE_CARD_IMAGES[0],
    settings[SETTING_KEYS.HOME_FEATURE_CARD_2_IMAGE]?.value || DEFAULT_FEATURE_CARD_IMAGES[1],
    settings[SETTING_KEYS.HOME_FEATURE_CARD_3_IMAGE]?.value || DEFAULT_FEATURE_CARD_IMAGES[2],
    settings[SETTING_KEYS.HOME_FEATURE_CARD_4_IMAGE]?.value || DEFAULT_FEATURE_CARD_IMAGES[3],
  ]

  // 最新消息卡片資料
  const newsCards = {
    seasonalRecommendation: {
      enabled:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED]?.value === 'true' ||
        !settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ENABLED],
      title:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_TITLE]?.value || '當季推薦',
      icon: settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_ICON]?.value || 'sprout',
      description:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_DESCRIPTION]?.value ||
        '春季特選紅肉李正在盛產中！果肉飽滿、甜度高，限量供應中',
      linkUrl:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_URL]?.value || '/products',
      linkText:
        settings[SETTING_KEYS.HOME_NEWS_SEASONAL_RECOMMENDATION_LINK_TEXT]?.value || '查看產品 →',
    },
    farmActivity: {
      enabled:
        settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ENABLED]?.value === 'true' ||
        !settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ENABLED],
      title: settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_TITLE]?.value || '農場活動',
      icon: settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_ICON]?.value || 'party-popper',
      description:
        settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_DESCRIPTION]?.value ||
        '週末採果體驗活動熱烈報名中！帶孩子來體驗親手採摘的樂趣',
      linkUrl:
        settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_URL]?.value || '/farm-tours',
      linkText: settings[SETTING_KEYS.HOME_NEWS_FARM_ACTIVITY_LINK_TEXT]?.value || '立即預約 →',
    },
  }

  // 視差滾動效果
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 滾動觸發動畫
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections((prev) => new Set(prev).add(entry.target.id))
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )

    const sections = document.querySelectorAll('[data-animate]')
    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen">
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
        isVisible={visibleSections.has('features')}
      />

      {/* 最新消息區域 */}
      <NewsSection
        newsCards={newsCards}
        getIcon={getIcon}
        isVisible={visibleSections.has('news')}
      />
    </div>
  )
}
