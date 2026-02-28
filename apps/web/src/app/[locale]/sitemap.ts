import { MetadataRoute } from 'next'
import { API_URL } from '@/lib/api-url'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

/**
 * 動態 Sitemap 生成
 *
 * Next.js 會自動在 /sitemap.xml 提供此 sitemap
 * 包含所有靜態頁面和動態內容（產品、地點、農場體驗）
 *
 * 三個 API 請求並行發出，避免 waterfall（串行）延遲。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 靜態頁面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/farm-tours`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/locations`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // 並行發出三個請求，任一失敗不影響其他（allSettled vs all）
  const [productsResult, farmToursResult, locationsResult] = await Promise.allSettled([
    fetch(`${API_URL}/products`, { next: { revalidate: 3600 } }),
    fetch(`${API_URL}/farm-tours`, { next: { revalidate: 3600 } }),
    fetch(`${API_URL}/locations`, { next: { revalidate: 3600 } }),
  ])

  // 動態獲取產品列表
  let productPages: MetadataRoute.Sitemap = []
  if (productsResult.status === 'fulfilled' && productsResult.value.ok) {
    try {
      const products = await productsResult.value.json()
      productPages = products
        .filter((product: { isActive?: boolean }) => product.isActive !== false)
        .map((product: { id: string; updatedAt?: string }) => ({
          url: `${BASE_URL}/products/${product.id}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
    } catch {
      // JSON parse failure — continue without product pages
    }
  }

  // 動態獲取農場體驗列表
  let farmTourPages: MetadataRoute.Sitemap = []
  if (farmToursResult.status === 'fulfilled' && farmToursResult.value.ok) {
    try {
      const tours = await farmToursResult.value.json()
      farmTourPages = tours
        .filter((tour: { isActive?: boolean }) => tour.isActive !== false)
        .map((tour: { id: string; updatedAt?: string }) => ({
          url: `${BASE_URL}/farm-tours/${tour.id}`,
          lastModified: tour.updatedAt ? new Date(tour.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
    } catch {
      // JSON parse failure — continue without farm tour pages
    }
  }

  // 動態獲取據點列表
  let locationPages: MetadataRoute.Sitemap = []
  if (locationsResult.status === 'fulfilled' && locationsResult.value.ok) {
    try {
      const locations = await locationsResult.value.json()
      locationPages = locations
        .filter((loc: { isActive?: boolean }) => loc.isActive !== false)
        .map((loc: { id: string; updatedAt?: string }) => ({
          url: `${BASE_URL}/locations/${loc.id}`,
          lastModified: loc.updatedAt ? new Date(loc.updatedAt) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
    } catch {
      // JSON parse failure — continue without location pages
    }
  }

  return [...staticPages, ...productPages, ...farmTourPages, ...locationPages]
}
