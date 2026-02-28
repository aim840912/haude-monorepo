import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/feedback/toast'
import { Header } from '@/components/layouts/common/Header'
import { Footer } from '@/components/layouts/common/Footer'
import { OrganizationSchema } from '@/components/seo'
import { routing } from '@/i18n/routing'
import { ErrorBoundary } from '@/components/errors'
import { SystemStatusProvider, SystemBanner } from '@/components/system'
import { WebVitals } from '@/components/analytics/WebVitals'
import { AgentationOverlay } from '@/components/dev/AgentationOverlay'
import '../globals.css'

// 靜態生成所有語系的頁面
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // 啟用靜態渲染
  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <WebVitals />
        <NextIntlClientProvider messages={messages}>
          <OrganizationSchema />
          <ThemeProvider>
            <SystemStatusProvider>
              <ErrorBoundary>
                <ToastProvider>
                  {/* 系統公告欄 - 顯示在頁面頂部 */}
                  <div className="fixed top-0 left-0 right-0 z-50 p-2">
                    <SystemBanner />
                  </div>
                  <Header />
                  <main className="pt-[var(--header-height)]">
                    {children}
                  </main>
                  <Footer />
                </ToastProvider>
              </ErrorBoundary>
            </SystemStatusProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <AgentationOverlay />
      </body>
    </html>
  )
}
