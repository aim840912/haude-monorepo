import { X, Info, AlertTriangle, AlertCircle, Wrench, ExternalLink } from 'lucide-react'
import { useSystemStore, getVisibleBanners } from '@/stores/systemStore'
import type { SystemBannerType } from '@haude/types'

const bannerStyles: Record<
  SystemBannerType,
  { bg: string; border: string; icon: typeof Info; iconColor: string }
> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Info,
    iconColor: 'text-blue-600',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-600',
  },
  maintenance: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: Wrench,
    iconColor: 'text-purple-600',
  },
}

/**
 * 系統公告欄（Admin 版本）
 */
export function SystemBanner() {
  const store = useSystemStore()
  const dismissBanner = useSystemStore((state) => state.dismissBanner)

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
              <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">
                  {banner.title}
                </p>
                {banner.message && (
                  <p className="mt-1 text-sm text-gray-600">
                    {banner.message}
                  </p>
                )}
                {banner.link && (
                  <a
                    href={banner.link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                  >
                    {banner.link.text}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {banner.dismissible && (
                <button
                  onClick={() => dismissBanner(banner.id)}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 transition-colors"
                  aria-label="關閉通知"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
