import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LocationDetailClient, type LocationData } from './LocationDetailClient'
import { LocalBusinessSchema, BreadcrumbSchema } from '@/components/seo'
import { API_URL } from '@/lib/api-url'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

interface LocationDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * 從 API 獲取地點資料
 */
async function getLocation(id: string): Promise<LocationData | null> {
  try {
    const res = await fetch(`${API_URL}/locations/${id}`, {
      next: { revalidate: 300 }, // 5 分鐘快取（據點資料較少變動）
    })

    if (!res.ok) {
      return null
    }

    return res.json()
  } catch {
    return null
  }
}

/**
 * 動態生成 Metadata（SEO）
 */
export async function generateMetadata({
  params,
}: LocationDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const location = await getLocation(id)

  if (!location) {
    return {
      title: '據點不存在 | 豪德製茶所',
    }
  }

  const title = location.title || location.name
  const description = `豪德製茶所 ${title} - ${location.address}。${location.hours ? `營業時間：${location.hours}` : ''}`

  return {
    title: `${title} | 門市據點 | 豪德製茶所`,
    description: description,
    keywords: ['豪德製茶所', '門市', '據點', location.name, location.address.split(' ')[0]],
    openGraph: {
      title: `${title} | 豪德製茶所門市據點`,
      description: description,
      url: `${SITE_URL}/locations/${id}`,
      siteName: '豪德製茶所',
      images: [
        {
          url: location.image || `${SITE_URL}/og-default.jpg`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'zh_TW',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | 豪德製茶所門市據點`,
      description: description,
      images: [location.image || `${SITE_URL}/og-default.jpg`],
    },
    alternates: {
      canonical: `${SITE_URL}/locations/${id}`,
    },
  }
}

/**
 * 靜態路由生成
 */
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/locations`)
    if (!res.ok) return []

    const locations = await res.json()
    return locations
      .filter((loc: { isActive?: boolean }) => loc.isActive !== false)
      .map((loc: { id: string }) => ({
        id: loc.id,
      }))
  } catch {
    return []
  }
}

/**
 * 據點詳情頁 - Server Component
 */
export default async function LocationDetailPage({
  params,
}: LocationDetailPageProps) {
  const { id } = await params
  const location = await getLocation(id)

  if (!location) {
    notFound()
  }

  // 麵包屑資料
  const breadcrumbs = [
    { name: '首頁', url: '/' },
    { name: '門市據點', url: '/locations' },
    { name: location.title || location.name, url: `/locations/${id}` },
  ]

  // 轉換座標格式給 Schema
  const schemaLocation = {
    ...location,
    lat: location.coordinates?.lat,
    lng: location.coordinates?.lng,
  }

  return (
    <>
      {/* JSON-LD 結構化資料 */}
      <LocalBusinessSchema location={schemaLocation} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* 頁面內容 */}
      <LocationDetailClient location={location} />
    </>
  )
}
