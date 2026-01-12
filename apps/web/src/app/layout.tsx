import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

export const metadata: Metadata = {
  // 基本資訊
  title: {
    default: '豪德製茶所 | Haude Tea',
    template: '%s | 豪德製茶所',
  },
  description:
    '傳承三代的製茶工藝，堅持手工採摘、精心烘焙，為您呈現台灣高山茶的純粹風味。阿里山烏龍茶、蜜香紅茶、高山茶專賣。',
  keywords: ['台灣茶', '高山茶', '烏龍茶', '阿里山', '茶葉', '製茶', '豪德製茶所', '茶園體驗'],

  // 網站基本設定
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },

  // Open Graph（Facebook、Line 等）
  openGraph: {
    title: '豪德製茶所 | Haude Tea',
    description: '傳承三代的製茶工藝，堅持手工採摘、精心烘焙，為您呈現台灣高山茶的純粹風味。',
    url: SITE_URL,
    siteName: '豪德製茶所',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: '豪德製茶所 - 傳承三代的製茶工藝',
      },
    ],
    locale: 'zh_TW',
    type: 'website',
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: '豪德製茶所 | Haude Tea',
    description: '傳承三代的製茶工藝，堅持手工採摘、精心烘焙',
    images: ['/og-default.jpg'],
    creator: '@haudetea',
  },

  // 其他 SEO 設定
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
