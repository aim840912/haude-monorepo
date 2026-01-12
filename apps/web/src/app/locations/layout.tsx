import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

export const metadata: Metadata = {
  title: '門市據點 | 豪德製茶所',
  description:
    '尋找豪德製茶所的門市據點。阿里山茶園總部、各地門市地址、營業時間、聯絡方式一覽。',
  keywords: ['豪德製茶所', '門市', '據點', '茶葉店', '阿里山'],
  openGraph: {
    title: '門市據點 | 豪德製茶所',
    description: '尋找豪德製茶所的門市據點',
    url: `${SITE_URL}/locations`,
    siteName: '豪德製茶所',
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '門市據點 | 豪德製茶所',
    description: '尋找豪德製茶所的門市據點',
  },
  alternates: {
    canonical: `${SITE_URL}/locations`,
  },
}

export default function LocationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
