/**
 * LocalBusiness Schema (JSON-LD)
 *
 * 用於販售據點頁面，可觸發：
 * - Google Maps 整合
 * - 營業時間顯示
 * - 地點 Rich Snippets
 *
 * @see https://schema.org/LocalBusiness
 */

interface LocalBusinessSchemaProps {
  location: {
    id: string
    name: string
    title?: string
    address: string
    phone?: string
    hours?: string
    lat?: number
    lng?: number
    image?: string
  }
}

export function LocalBusinessSchema({ location }: LocalBusinessSchemaProps) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/locations/${location.id}`,
    name: location.title || location.name,
    description: `豪德製茶所 - ${location.name}`,
    url: `${SITE_URL}/locations/${location.id}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.address,
      addressCountry: 'TW',
    },
    parentOrganization: {
      '@type': 'Organization',
      name: '豪德製茶所',
      url: SITE_URL,
    },
  }

  // 電話
  if (location.phone) {
    schema.telephone = location.phone
  }

  // 營業時間（簡化處理，實際可能需要更精細的格式）
  if (location.hours) {
    schema.openingHours = location.hours
  }

  // 地理座標
  if (location.lat && location.lng) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: location.lat,
      longitude: location.lng,
    }
  }

  // 圖片
  if (location.image) {
    schema.image = location.image
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
