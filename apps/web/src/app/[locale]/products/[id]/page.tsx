import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProductDetailClient, type ProductData } from './ProductDetailClient'
import { ProductSchema, BreadcrumbSchema } from '@/components/seo'
import { API_URL } from '@/lib/api-url'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

interface ProductDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * 從 API 獲取產品資料
 */
async function getProduct(id: string): Promise<ProductData | null> {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      next: { revalidate: 60 }, // 60 秒快取
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
 * 獲取產品評論統計（用於 Schema）
 */
async function getReviewStats(
  productId: string
): Promise<{ averageRating: number; totalReviews: number } | null> {
  try {
    const res = await fetch(`${API_URL}/products/${productId}/reviews/stats`, {
      next: { revalidate: 300 }, // 5 分鐘快取
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
 *
 * 為每個產品頁面生成獨立的 title, description, og:image 等
 */
export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)

  if (!product) {
    return {
      title: '產品不存在 | 豪德製茶所',
    }
  }

  const imageUrl = product.images[0]?.storageUrl || `${SITE_URL}/og-default.jpg`
  const description =
    product.description.length > 155
      ? `${product.description.slice(0, 155)}...`
      : product.description

  return {
    title: `${product.name} | 豪德製茶所`,
    description: description,
    keywords: [product.category, '台灣茶', '豪德製茶所', product.name],
    openGraph: {
      title: `${product.name} | 豪德製茶所`,
      description: description,
      url: `${SITE_URL}/products/${id}`,
      siteName: '豪德製茶所',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: 'zh_TW',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | 豪德製茶所`,
      description: description,
      images: [imageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/products/${id}`,
    },
  }
}

/**
 * 靜態路由生成
 *
 * 在建置時預先生成所有產品頁面，提升 SEO 和載入速度
 */
export async function generateStaticParams() {
  try {
    const res = await fetch(`${API_URL}/products`)
    if (!res.ok) return []

    const products = await res.json()
    return products
      .filter((product: { isActive?: boolean }) => product.isActive !== false)
      .map((product: { id: string }) => ({
        id: product.id,
      }))
  } catch {
    return []
  }
}

/**
 * 產品詳情頁 - Server Component
 *
 * 負責：
 * 1. 資料獲取（Server Side）
 * 2. SEO Metadata 生成
 * 3. JSON-LD Schema 結構化資料
 * 4. 傳遞資料給 Client Component
 */
export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params
  const [product, reviewStats] = await Promise.all([
    getProduct(id),
    getReviewStats(id),
  ])

  if (!product) {
    notFound()
  }

  // 麵包屑資料
  const breadcrumbs = [
    { name: '首頁', url: '/' },
    { name: '產品', url: '/products' },
    { name: product.name, url: `/products/${id}` },
  ]

  return (
    <>
      {/* JSON-LD 結構化資料 */}
      <ProductSchema product={product} reviewStats={reviewStats ?? undefined} />
      <BreadcrumbSchema items={breadcrumbs} />

      {/* 頁面內容 */}
      <ProductDetailClient product={product} />
    </>
  )
}
