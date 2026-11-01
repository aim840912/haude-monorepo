import { defineRouting } from 'next-intl/routing'
import { locales, defaultLocale } from './config'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // 預設語系不顯示前綴
  // /en only translates the nav and the header has no language switcher, so an English browser
  // must not be redirected there: it would have no way back. Turn back on with the switcher.
  localeDetection: false,
})
