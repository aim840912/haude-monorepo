import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'

type MetricHandler = (metric: Metric) => void

const reportMetric: MetricHandler = (metric) => {
  // 開發環境輸出到 console
  if (process.env.NODE_ENV === 'development') {
    const rating = metric.rating // 'good' | 'needs-improvement' | 'poor'
    const ratingEmoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌'
    console.log(
      `[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}ms ${ratingEmoji} (${rating})`
    )
    return
  }

  // 生產環境可選擇發送到分析服務
  // 可整合 Google Analytics 或自訂端點
  // 若要啟用生產環境追蹤，取消下方註解並設定 endpoint
  /*
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
  })

  // 使用 sendBeacon 確保頁面卸載時也能發送
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon('/api/v1/metrics', body)
  }
  */
}

/**
 * 初始化 Web Vitals 追蹤
 *
 * Web Vitals 指標說明：
 * - CLS (Cumulative Layout Shift): 累積版面位移，衡量視覺穩定性
 * - FCP (First Contentful Paint): 首次內容繪製，衡量載入速度
 * - INP (Interaction to Next Paint): 互動到下一次繪製，衡量互動回應性（取代 FID）
 * - LCP (Largest Contentful Paint): 最大內容繪製，衡量載入效能
 * - TTFB (Time to First Byte): 首位元組時間，衡量伺服器回應速度
 */
export function reportWebVitals() {
  onCLS(reportMetric)
  onFCP(reportMetric)
  onINP(reportMetric)
  onLCP(reportMetric)
  onTTFB(reportMetric)
}
