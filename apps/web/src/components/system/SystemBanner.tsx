'use client'

import { useEffect, useState } from 'react'
import { X, Info, AlertTriangle, AlertCircle, Wrench, ExternalLink } from 'lucide-react'
import { useSystemStore, getVisibleBanners } from '@/stores/systemStore'
import type { SystemBannerType } from '@haude/types'

const bannerStyles: Record<
  SystemBannerType,
  { bg: string; border: string; icon: typeof Info; iconColor: string }
> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-600 dark:text-red-400',
  },
  maintenance: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: Wrench,
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
}

/**
 * 系統公告欄
 *
 * 顯示全站系統通知，支援多種類型：
 * - info: 一般資訊
 * - warning: 警告
 * - error: 錯誤
 * - maintenance: 維護通知
 */
export function SystemBanner() {
  const [isClient, setIsClient] = useState(false)
  const store = useSystemStore()
  const dismissBanner = useSystemStore((state) => state.dismissBanner)

  // SSR 安全：只在客戶端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  const visibleBanners = getVisibleBanners(store)

  if (visibleBanners.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {visibleBanners.map((banner) => {
        const style = bannerStyles[banner.type]
        const Icon = style.icon

        return (
          <div
            key={banner.id}
            className={`${style.bg} ${style.border} border rounded-lg px-4 py-3`}
            role="alert"
          >
            <div className="flex items-start gap-3">
              {/* 圖示 */}
              <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />

              {/* 內容 */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white">
                  {banner.title}
                </p>
                {banner.message && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {banner.message}
                  </p>
                )}
                {banner.link && (
                  <a
                    href={banner.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {banner.link.text}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* 關閉按鈕 */}
              {banner.dismissible && (
                <button
                  onClick={() => dismissBanner(banner.id)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  aria-label="關閉通知"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
