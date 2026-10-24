import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { FarmTourDetailClient, type FarmTourData } from './FarmTourDetailClient'
import { EventSchema, BreadcrumbSchema } from '@/components/seo'
import { API_URL } from '@/lib/api-url'
import { fetchDetail } from '@/lib/fetch-detail'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

interface FarmTourDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * 從 API 獲取農場體驗資料
 */
function getFarmTour(id: string): Promise<FarmTourData | null> {
  return fetchDetail<FarmTourData>(`${API_URL}/farm-tours/${id}`, 60)
}

/**
 * 動態生成 Metadata（SEO）
 */
export async function generateMetadata({ params }: FarmTourDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const tour = await getFarmTour(id)

  if (!tour) {
    return {
      title: '活動不存在 | 豪德製茶所',
    }
  }

  const description =
    tour.description.length > 155 ? `${tour.description.slice(0, 155)}...` : tour.description

  const imageUrl = tour.imageUrl || `${SITE_URL}/opengraph-image`

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
 * 不在 build 時預先產生，第一次瀏覽時才產生並快取（原因見 products/[id]/page.tsx）
 */
export async function generateStaticParams() {
  return []
}

/**
 * 農場體驗詳情頁 - Server Component
 */
export default async function FarmTourDetailPage({ params }: FarmTourDetailPageProps) {
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
