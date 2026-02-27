import { useState, useEffect, useCallback } from 'react'
import { ImageIcon, Loader2, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import { siteSettingsApi, type SiteSetting } from '../services/api/site-settings.api'
import { SiteImageUploader } from '../components/SiteImageUploader'
import { MultiImageUploader } from '../components/MultiImageUploader'
import logger from '../lib/logger'

export type Locale = 'zh' | 'en'

// Image setting definitions grouped by page
interface ImageSettingConfig {
  key: string
  label: Record<Locale, string>
  description?: Record<Locale, string>
  dimensions?: string
  /** When > 1, uses MultiImageUploader instead of SiteImageUploader */
  maxImages?: number
}

interface ImageGroup {
  id: string
  title: Record<Locale, string>
  description: Record<Locale, string>
  settings: ImageSettingConfig[]
}

const IMAGE_GROUPS: ImageGroup[] = [
  // ── 首頁 — 主視覺輪播 ──
  {
    id: 'home-hero',
    title: { zh: '首頁 — 主視覺輪播', en: 'Homepage — Hero Carousel' },
    description: { zh: '首頁頂部全幅輪播大圖', en: 'Full-width hero carousel at the top' },
    settings: [
      {
        key: 'home.hero_images',
        label: { zh: '主視覺輪播圖片', en: 'Hero Carousel Images' },
        description: { zh: '首頁主視覺輪播（最多 3 張）', en: 'Homepage hero carousel (up to 3)' },
        dimensions: '1920 x 1080 px',
        maxImages: 3,
      },
    ],
  },
  // ── 首頁 — 特色卡片 ──
  {
    id: 'home-features',
    title: { zh: '首頁 — 特色卡片', en: 'Homepage — Feature Cards' },
    description: { zh: '四大品牌特色介紹圖片', en: 'Four brand feature card images' },
    settings: [
      {
        key: 'home.feature_card_1_image',
        label: { zh: '特色卡片 1 — 自然農法', en: 'Feature Card 1 — Natural Farming' },
        dimensions: '400 x 300 px',
      },
      {
        key: 'home.feature_card_2_image',
        label: { zh: '特色卡片 2 — 品質認證', en: 'Feature Card 2 — Quality Certification' },
        dimensions: '400 x 300 px',
      },
      {
        key: 'home.feature_card_3_image',
        label: { zh: '特色卡片 3 — 農場體驗', en: 'Feature Card 3 — Farm Experience' },
        dimensions: '400 x 300 px',
      },
      {
        key: 'home.feature_card_4_image',
        label: { zh: '特色卡片 4 — 永續經營', en: 'Feature Card 4 — Sustainability' },
        dimensions: '400 x 300 px',
      },
    ],
  },
  // ── 首頁 — 品牌故事 ──
  {
    id: 'home-brand',
    title: { zh: '首頁 — 品牌故事', en: 'Homepage — Brand Story' },
    description: { zh: '品牌故事區域圖片', en: 'Brand story section image' },
    settings: [
      {
        key: 'home.brand_story_image',
        label: { zh: '品牌故事圖片', en: 'Brand Story Image' },
        description: { zh: '品牌故事區域顯示的圖片', en: 'Image shown in the brand story section' },
        dimensions: '800 x 1067 px',
      },
    ],
  },
  // ── 關於我們 ──
  {
    id: 'about',
    title: { zh: '關於我們', en: 'About Us' },
    description: { zh: '主視覺橫幅與故事圖片', en: 'Hero banner and story images' },
    settings: [
      {
        key: 'about.hero_image',
        label: { zh: '主視覺橫幅', en: 'Hero Banner' },
        description: { zh: '關於我們頁面主視覺背景', en: 'About page hero background' },
        dimensions: '1920 x 800 px',
      },
      {
        key: 'about.story_image_1',
        label: { zh: '故事圖片 1 — 傳承', en: 'Story Image 1 — Heritage' },
        description: { zh: '三代傳承故事', en: 'Three-generation heritage story' },
        dimensions: '800 x 600 px',
      },
      {
        key: 'about.story_image_2',
        label: { zh: '故事圖片 2 — 自然農法', en: 'Story Image 2 — Natural Farming' },
        description: { zh: '自然農法理念', en: 'Natural farming philosophy' },
        dimensions: '800 x 600 px',
      },
    ],
  },
  // ── 最新消息 ──
  {
    id: 'news',
    title: { zh: '最新消息', en: 'Latest News' },
    description: { zh: '最新消息頁面主視覺', en: 'News page hero image' },
    settings: [
      {
        key: 'news.hero_image',
        label: { zh: '主視覺橫幅', en: 'Hero Banner' },
        description: { zh: '最新消息頁面主視覺背景', en: 'News page hero background' },
        dimensions: '1920 x 800 px',
      },
    ],
  },
  // ── 觀光果園 ──
  {
    id: 'farm-tours',
    title: { zh: '觀光果園', en: 'Farm Tours' },
    description: { zh: '觀光果園頁面主視覺背景', en: 'Farm tours page hero background' },
    settings: [
      {
        key: 'farm_tour.hero_background',
        label: { zh: '主視覺背景', en: 'Hero Background' },
        description: { zh: '觀光果園頁面頂部背景圖', en: 'Farm tours page hero background' },
        dimensions: '1920 x 800 px',
      },
    ],
  },
]

// Page-level translations
const PAGE_TEXT = {
  zh: {
    pageTitle: '網站圖片管理',
    pageDescription: '上傳並管理網站各頁面的品牌圖片',
    refresh: '重新整理',
    loading: '載入網站圖片中...',
    loadError: '載入設定失敗，請重新整理。',
    imageCount: (n: number) => `${n} 張圖片`,
  },
  en: {
    pageTitle: 'Site Image Management',
    pageDescription: 'Upload and manage brand images across the website',
    refresh: 'Refresh',
    loading: 'Loading site images...',
    loadError: 'Failed to load settings. Please refresh.',
    imageCount: (n: number) => `${n} images`,
  },
} as const

export function SiteImagesPage() {
  const [settings, setSettings] = useState<Record<string, SiteSetting>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locale, setLocale] = useState<Locale>('zh')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['home-hero']) // Only first group expanded by default
  )

  const t = PAGE_TEXT[locale]

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await siteSettingsApi.getAll()
      const map: Record<string, SiteSetting> = {}
      data.forEach((s) => {
        map[s.key] = s
      })
      setSettings(map)
    } catch (err) {
      logger.error('Failed to fetch site settings', { error: err })
      setError('Failed to load settings. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleImageUpdated = (key: string, newUrl: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: newUrl,
        updatedAt: new Date().toISOString(),
      } as SiteSetting,
    }))
  }

  const handleImageDeleted = (key: string) => {
    setSettings((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
        <span className="ml-3 text-gray-600">{t.loading}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-7 h-7 text-green-600" />
            {t.pageTitle}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {t.pageDescription}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button
              onClick={() => setLocale('zh')}
              className={`px-3 py-1.5 transition-colors ${
                locale === 'zh'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              中文
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1.5 transition-colors ${
                locale === 'en'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              EN
            </button>
          </div>
          <button
            onClick={fetchSettings}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Image groups (accordion) */}
      {IMAGE_GROUPS.map((group) => {
        const isExpanded = expandedGroups.has(group.id)

        return (
          <div
            key={group.id}
            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
          >
            {/* Accordion header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{group.title[locale]}</h2>
                <p className="text-sm text-gray-500">{group.description[locale]}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                  {t.imageCount(group.settings.length)}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Accordion body */}
            {isExpanded && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                  {group.settings.map((config) =>
                    config.maxImages && config.maxImages > 1 ? (
                      <MultiImageUploader
                        key={config.key}
                        settingKey={config.key}
                        currentValue={settings[config.key]?.value || ''}
                        label={config.label[locale]}
                        description={config.description?.[locale]}
                        dimensions={config.dimensions}
                        maxImages={config.maxImages}
                        locale={locale}
                        onImagesUpdated={(newValue) => handleImageUpdated(config.key, newValue)}
                      />
                    ) : (
                      <SiteImageUploader
                        key={config.key}
                        settingKey={config.key}
                        currentUrl={settings[config.key]?.value || ''}
                        label={config.label[locale]}
                        description={config.description?.[locale]}
                        dimensions={config.dimensions}
                        locale={locale}
                        onImageUpdated={(newUrl) => handleImageUpdated(config.key, newUrl)}
                        onImageDeleted={() => handleImageDeleted(config.key)}
                      />
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
