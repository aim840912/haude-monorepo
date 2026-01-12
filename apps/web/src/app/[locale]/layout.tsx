import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/feedback/toast'
import { Header } from '@/components/layouts/common/Header'
import { Footer } from '@/components/layouts/common/Footer'
import { OrganizationSchema } from '@/components/seo'
import { routing } from '@/i18n/routing'

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
    <NextIntlClientProvider messages={messages}>
      <OrganizationSchema />
      <ThemeProvider>
        <ToastProvider>
          <Header />
          <main className="pt-[var(--header-height)]">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  )
}
