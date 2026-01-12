import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

export default createMiddleware(routing)

export const config = {
  // 匹配所有路徑，排除 api、_next、靜態檔案
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
