import type { Metadata } from 'next'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { ToastProvider } from '@/components/ui/feedback/toast'
import { Header } from '@/components/layouts/common/Header'
import { Footer } from '@/components/layouts/common/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: '豪德製茶所 | Haude Tea',
  description: '傳承三代的製茶工藝，堅持手工採摘、精心烘焙，為您呈現台灣高山茶的純粹風味。',
  keywords: ['台灣茶', '高山茶', '烏龍茶', '阿里山', '茶葉', '製茶'],
  openGraph: {
    title: '豪德製茶所 | Haude Tea',
    description: '傳承三代的製茶工藝，堅持手工採摘、精心烘焙',
    type: 'website',
    locale: 'zh_TW',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <Header />
            <main className="pt-[var(--header-height)]">
              {children}
            </main>
            <Footer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
