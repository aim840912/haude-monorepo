/**
 * 關於我們頁面 (Server Component + ISR)
 *
 * 提供品牌故事、核心價值等靜態內容
 * ISR 每小時重新驗證一次
 */

import type { Metadata } from 'next'
import { AboutPageClient } from './AboutPageClient'

export const revalidate = 3600

export const metadata: Metadata = {
  title: '關於我們 | 豪德製茶所',
  description:
    '座落嘉義梅山海拔一千公尺，豪德製茶所以三代人的堅持守護最純粹的茶味。了解我們的自然農法、品質認證與永續經營理念。',
}

export default function AboutPage() {
  return <AboutPageClient />
}
