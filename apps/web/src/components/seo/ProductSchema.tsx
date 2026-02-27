/**
 * Product Schema (JSON-LD)
 *
 * 用於產品頁面，可觸發 Google Rich Snippets：
 * - 價格顯示
 * - 庫存狀態
 * - 評分星級
 *
 * @see https://schema.org/Product
 */

interface ProductSchemaProps {
  product: {
    id: string
    name: string
    description: string
    price: number
    originalPrice?: number
    stock: number
    category: string
    images: Array<{ storageUrl?: string }>
  }
  reviewStats?: {
    averageRating: number
    totalReviews: number
  }
  /** 價格有效期（ISO 日期字串，如 '2025-12-31'）*/
  priceValidUntil?: string
}

export function ProductSchema({
  product,
  reviewStats,
  priceValidUntil = '2026-12-31', // 預設值
}: ProductSchemaProps) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

  const imageUrl =
    product.images[0]?.storageUrl || `${SITE_URL}/opengraph-image`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: imageUrl,
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: '豪德製茶所',
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: 'TWD',
      price: product.price,
      priceValidUntil, // 從 props 傳入，避免 render 中呼叫不純函數
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: '豪德製茶所',
      },
    },
  }

  // 如果有評論統計，加入 aggregateRating
  if (reviewStats && reviewStats.totalReviews > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.averageRating.toFixed(1),
      reviewCount: reviewStats.totalReviews,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
