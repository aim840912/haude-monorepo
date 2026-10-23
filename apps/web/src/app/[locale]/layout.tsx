import { Noto_Sans_TC, Inter, Noto_Serif_TC } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { ThemeProvider } from '@/contexts/ThemeContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-tc',
  display: 'swap',
})

const notoSerifTC = Noto_Serif_TC({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif-tc',
  display: 'swap',
})
import { ToastProvider } from '@/components/ui/feedback/toast'
import { Header } from '@/components/layouts/common/Header'
import { MainShell } from '@/components/layouts/common/MainShell'
import { Footer } from '@/components/layouts/common/Footer'
import { OrganizationSchema } from '@/components/seo'
import { routing } from '@/i18n/routing'
import { ErrorBoundary } from '@/components/errors'
import { SystemStatusProvider, SystemBanner } from '@/components/system'
import { WebVitals } from '@/components/analytics/WebVitals'
import { AgentationOverlay } from '@/components/dev/AgentationOverlay'
import { AISupportWidget } from '@/components/integrations'
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
    <html
      lang={locale}
      className={`${inter.variable} ${notoSansTC.variable} ${notoSerifTC.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
          Apply the saved theme before first paint. ThemeProvider only adds .dark in an effect,
          so without this dark-mode users see a light flash on every full page load.
          Mirrors ThemeContext.resolveTheme: only 'dark' is dark ('system' resolves to light).
          Inline scripts are allowed by the CSP (script-src keeps 'unsafe-inline', see next.config.ts).
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('haude-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
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
                  <MainShell>{children}</MainShell>
                  <Footer />
                  <AISupportWidget />
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
