/**
 * Event Schema (JSON-LD)
 *
 * 用於農場體驗活動頁面，可觸發：
 * - 活動 Rich Snippets
 * - 日期/時間顯示
 * - 票價資訊
 *
 * @see https://schema.org/Event
 */

interface EventSchemaProps {
  event: {
    id: string
    name: string
    description: string
    date: string // ISO 日期格式
    startTime: string
    endTime: string
    price: number
    maxParticipants: number
    location: string
    imageUrl?: string
  }
  /** 票券有效起始日（可選，預設為活動日期）*/
  validFrom?: string
}

export function EventSchema({ event, validFrom }: EventSchemaProps) {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://haude-tea.com'

  // 組合日期時間
  const startDateTime = `${event.date}T${event.startTime}:00+08:00`
  const endDateTime = `${event.date}T${event.endTime}:00+08:00`

  // 使用傳入的 validFrom 或活動日期作為票券有效起始日
  const offerValidFrom = validFrom || `${event.date}T00:00:00+08:00`

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: startDateTime,
    endDate: endDateTime,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.location,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'TW',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: '豪德製茶所',
      url: SITE_URL,
    },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/farm-tours/${event.id}`,
      price: event.price,
      priceCurrency: 'TWD',
      availability: 'https://schema.org/InStock',
      validFrom: offerValidFrom,
    },
    image: event.imageUrl || `${SITE_URL}/og-default.jpg`,
    maximumAttendeeCapacity: event.maxParticipants,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
