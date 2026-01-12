'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { Globe } from 'lucide-react'
import { type Locale } from '@/i18n/config'

const languageNames: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  'en': 'English',
}

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (newLocale: Locale) => {
    // next-intl 的 useRouter 會自動處理 localePrefix: 'as-needed' 配置
    router.replace(pathname, { locale: newLocale })
  }

  const targetLocale = locale === 'zh-TW' ? 'en' : 'zh-TW'

  return (
    <button
      onClick={() => switchLocale(targetLocale)}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`切換語言至 ${languageNames[targetLocale]}`}
    >
      <Globe className="w-4 h-4" />
      <span className="hidden sm:inline">{languageNames[locale]}</span>
    </button>
  )
}
