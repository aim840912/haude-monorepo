import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

export const metadata: Metadata = {
  title: '茶園體驗 | 豪德製茶所',
  description:
    '預約豪德製茶所的茶園體驗活動。採茶體驗、製茶工坊、品茶導覽，親身感受台灣茶文化的魅力。',
  keywords: ['茶園體驗', '採茶', '製茶體驗', '農場體驗', '台灣茶文化', '豪德製茶所'],
  openGraph: {
    title: '茶園體驗 | 豪德製茶所',
    description: '預約豪德製茶所的茶園體驗活動，親身感受台灣茶文化',
    url: `${SITE_URL}/farm-tours`,
    siteName: '豪德製茶所',
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '茶園體驗 | 豪德製茶所',
    description: '預約豪德製茶所的茶園體驗活動',
  },
  alternates: {
    canonical: `${SITE_URL}/farm-tours`,
  },
}

export default function FarmToursLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
