import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

export const metadata: Metadata = {
  title: '產品列表 | 豪德製茶所',
  description:
    '探索豪德製茶所的優質茶葉產品。台灣高山茶、阿里山烏龍茶、蜜香紅茶等精選茶品，傳承三代製茶工藝。',
  keywords: ['台灣茶', '高山茶', '烏龍茶', '阿里山茶', '茶葉', '豪德製茶所'],
  openGraph: {
    title: '產品列表 | 豪德製茶所',
    description: '探索豪德製茶所的優質茶葉產品',
    url: `${SITE_URL}/products`,
    siteName: '豪德製茶所',
    locale: 'zh_TW',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '產品列表 | 豪德製茶所',
    description: '探索豪德製茶所的優質茶葉產品',
  },
  alternates: {
    canonical: `${SITE_URL}/products`,
  },
}

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
