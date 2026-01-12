import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FarmTourDetailClient, type FarmTourData } from './FarmTourDetailClient'
import { EventSchema, BreadcrumbSchema } from '@/components/seo'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

interface FarmTourDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * 從 API 獲取農場體驗資料
 */
async function getFarmTour(id: string): Promise<FarmTourData | null> {
  try {
    const res = await fetch(`${API_URL}/farm-tours/${id}`, {
      next: { revalidate: 60 },
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
}: FarmTourDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const tour = await getFarmTour(id)

  if (!tour) {
    return {
      title: '活動不存在 | 豪德製茶所',
    }
  }

  const description =
    tour.description.length > 155
      ? `${tour.description.slice(0, 155)}...`
      : tour.description

  const imageUrl = tour.imageUrl || `${SITE_URL}/og-default.jpg`

  return {
    title: `${tour.name} | 茶園體驗 | 豪德製茶所`,
    description: description,
    keywords: ['茶園體驗', '農場體驗', '採茶', '製茶', tour.name, tour.location],
    openGraph: {
      title: `${tour.name} | 茶園體驗`,
      description: description,
      url: `${SITE_URL}/farm-tours/${id}`,
      siteName: '豪德製茶所',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: tour.name,
        },
      ],
      locale: 'zh_TW',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tour.name} | 茶園體驗`,
      description: description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/farm-tours/${id}`,
    },
  }
}

/**
 * 靜態路由生成
 */
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/farm-tours`)
    if (!res.ok) return []

    const tours = await res.json()
    return tours
      .filter((tour: { isActive?: boolean }) => tour.isActive !== false)
      .map((tour: { id: string }) => ({
        id: tour.id,
      }))
  } catch {
    return []
  }
}

/**
 * 農場體驗詳情頁 - Server Component
 */
export default async function FarmTourDetailPage({
  params,
}: FarmTourDetailPageProps) {
  const { id } = await params
  const tour = await getFarmTour(id)

  if (!tour) {
    notFound()
  }

  // 麵包屑資料
  const breadcrumbs = [
    { name: '首頁', url: '/' },
    { name: '茶園體驗', url: '/farm-tours' },
    { name: tour.name, url: `/farm-tours/${id}` },
  ]

  return (
    <>
      {/* JSON-LD 結構化資料 */}
      <EventSchema event={tour} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* 頁面內容 */}
      <FarmTourDetailClient tour={tour} />
    </>
  )
}
