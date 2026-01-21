/**
 * k6 負載測試腳本 - API 端點
 *
 * 用於測試 API 在高負載下的表現
 *
 * 安裝 k6：
 * - macOS: brew install k6
 * - Windows: choco install k6
 * - Linux: https://k6.io/docs/getting-started/installation
 *
 * 執行方式：
 * k6 run load-tests/api-load.js
 *
 * 帶環境變數執行：
 * k6 run -e API_URL=https://api.example.com load-tests/api-load.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Counter, Trend } from 'k6/metrics'

// 自訂指標
const errorRate = new Rate('errors')
const requestsCounter = new Counter('total_requests')
const productListDuration = new Trend('product_list_duration')
const productDetailDuration = new Trend('product_detail_duration')

// 測試配置
export const options = {
  // 階段式負載測試
  stages: [
    { duration: '30s', target: 10 },  // 預熱：30 秒內增加到 10 用戶
    { duration: '1m', target: 20 },   // 加載：維持 20 用戶 1 分鐘
    { duration: '30s', target: 50 },  // 峰值：30 秒內增加到 50 用戶
    { duration: '1m', target: 50 },   // 維持峰值 1 分鐘
    { duration: '30s', target: 0 },   // 冷卻：30 秒內降到 0
  ],

  // 效能閾值（開發環境設定較寬鬆）
  thresholds: {
    // 95% 的請求應該在 500ms 內完成
    http_req_duration: ['p(95)<500'],
    // 錯誤率應該低於 10%（開發環境）
    errors: ['rate<0.10'],
    // 特定端點的閾值
    product_list_duration: ['p(95)<400'],
    product_detail_duration: ['p(95)<300'],
  },
}

// 從環境變數獲取 API URL，預設使用本地開發環境
const API_URL = __ENV.API_URL || 'http://localhost:3001/api/v1'

/**
 * 設置階段 - 在測試開始前執行一次
 */
export function setup() {
  console.log(`Testing API at: ${API_URL}`)

  // 驗證 API 是否可用
  const healthCheck = http.get(`${API_URL.replace('/api/v1', '')}/health`)
  if (healthCheck.status !== 200) {
    console.warn('API health check failed, tests may fail')
  }

  return { apiUrl: API_URL }
}

// 從產品列表獲取的真實產品 ID（測試開始時更新）
let productIds = []

/**
 * 主要測試函數 - 每個虛擬用戶會重複執行
 */
export default function (data) {
  const apiUrl = data.apiUrl

  group('產品列表 API', () => {
    const startTime = Date.now()
    const res = http.get(`${apiUrl}/products`)

    productListDuration.add(Date.now() - startTime)
    requestsCounter.add(1)

    const success = check(res, {
      '狀態碼為 200': (r) => r.status === 200,
      '回應時間 < 500ms': (r) => r.timings.duration < 500,
      '回應包含產品陣列': (r) => {
        try {
          const body = JSON.parse(r.body)
          // 儲存產品 ID 供後續測試使用
          if (Array.isArray(body) && body.length > 0) {
            productIds = body.map(p => p.id)
            return true
          }
          return Array.isArray(body.data) || Array.isArray(body.products)
        } catch {
          return false
        }
      },
    })

    errorRate.add(!success)
  })

  sleep(1) // 模擬用戶思考時間

  group('單一產品詳情 API', () => {
    // 使用真實的產品 ID，如果沒有則跳過
    const productId = productIds.length > 0
      ? productIds[Math.floor(Math.random() * productIds.length)]
      : null

    if (!productId) {
      return
    }

    const startTime = Date.now()
    const res = http.get(`${apiUrl}/products/${productId}`)

    productDetailDuration.add(Date.now() - startTime)
    requestsCounter.add(1)

    const success = check(res, {
      '狀態碼為 200': (r) => r.status === 200,
      '回應時間 < 300ms': (r) => r.timings.duration < 300,
    })

    errorRate.add(!success)
  })

  sleep(1)

  group('健康檢查 API', () => {
    const res = http.get(`${apiUrl.replace('/api/v1', '')}/health`)
    requestsCounter.add(1)

    const success = check(res, {
      '狀態碼為 200': (r) => r.status === 200,
      '回應時間 < 100ms': (r) => r.timings.duration < 100,
    })

    errorRate.add(!success)
  })

  sleep(1)
}

/**
 * 拆解階段 - 在測試結束後執行一次
 */
export function teardown(data) {
  console.log('Load test completed')
  console.log(`Total requests made: Check the metrics summary above`)
}
