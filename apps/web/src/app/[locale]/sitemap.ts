import { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * 動態 Sitemap 生成
 *
 * Next.js 會自動在 /sitemap.xml 提供此 sitemap
 * 包含所有靜態頁面和動態內容（產品、地點、農場體驗）
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

  // 動態獲取產品列表
  let productPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/products`, {
      next: { revalidate: 3600 }, // 1 小時快取
    })
    if (res.ok) {
      const products = await res.json()
      productPages = products
        .filter((product: { isActive?: boolean }) => product.isActive !== false)
        .map((product: { id: string; updatedAt?: string }) => ({
          url: `${BASE_URL}/products/${product.id}`,
          lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        }))
    }
  } catch {
    // API 失敗時繼續，不阻擋 sitemap 生成
  }

  // 動態獲取農場體驗列表
  let farmTourPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/farm-tours`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const tours = await res.json()
      farmTourPages = tours
        .filter((tour: { isActive?: boolean }) => tour.isActive !== false)
        .map((tour: { id: string; updatedAt?: string }) => ({
          url: `${BASE_URL}/farm-tours/${tour.id}`,
          lastModified: tour.updatedAt ? new Date(tour.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
    }
  } catch {
    // API 失敗時繼續
  }

  // 動態獲取據點列表
  let locationPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/locations`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const locations = await res.json()
      locationPages = locations
        .filter((loc: { isActive?: boolean }) => loc.isActive !== false)
        .map((loc: { id: string; updatedAt?: string }) => ({
          url: `${BASE_URL}/locations/${loc.id}`,
          lastModified: loc.updatedAt ? new Date(loc.updatedAt) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        }))
    }
  } catch {
    // API 失敗時繼續
  }

  return [...staticPages, ...productPages, ...farmTourPages, ...locationPages]
}
