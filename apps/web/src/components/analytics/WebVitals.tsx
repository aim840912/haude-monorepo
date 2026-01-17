'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/web-vitals'

/**
 * Web Vitals 追蹤元件
 *
 * 在根 Layout 中使用此元件來啟用 Web Vitals 追蹤。
 * 開發環境下會在 console 輸出指標，生產環境可配置發送到分析服務。
 */
export function WebVitals() {
  useEffect(() => {
    reportWebVitals()
  }, [])

  return null
}
