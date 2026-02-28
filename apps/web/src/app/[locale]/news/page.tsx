/**
 * Latest News page (Server Component + ISR)
 *
 * Displays tea house news, events, and announcements
 * ISR revalidates every hour
 */

import type { Metadata } from 'next'
import { NewsPageClient } from './NewsPageClient'

export const metadata: Metadata = {
  title: '最新動態 | 豪德製茶所',
  description:
    '豪德製茶所最新消息 — 採茶季節、新品上市、農場活動、市集行程等，掌握梅山茶莊的第一手動態。',
}

export default function NewsPage() {
  return <NewsPageClient />
}
