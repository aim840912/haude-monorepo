/**
 * Axios Mock 工廠
 *
 * 提供型別安全的 AxiosResponse mock 建立函數
 */

import type { AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios'

/**
 * 建立完整的 AxiosResponse mock
 * @param data - 回應資料
 * @param options - 可選的額外設定
 */
export function createMockAxiosResponse<T>(
  data: T,
  options: {
    status?: number
    statusText?: string
    headers?: Record<string, string>
  } = {}
): AxiosResponse<T> {
  const { status = 200, statusText = 'OK', headers = {} } = options

  return {
    data,
    status,
    statusText,
    headers: headers as unknown as AxiosHeaders,
    config: {
      headers: {} as AxiosHeaders,
    } as InternalAxiosRequestConfig,
  }
}

/**
 * 建立錯誤回應 mock
 */
export function createMockAxiosErrorResponse<T>(
  data: T,
  status: number,
  statusText: string
): AxiosResponse<T> {
  return createMockAxiosResponse(data, { status, statusText })
}

/**
 * 建立分頁回應 mock
 */
export function createMockPaginatedResponse<T>(
  items: T[],
  options: {
    total?: number
    hasMore?: boolean
    page?: number
    limit?: number
  } = {}
): AxiosResponse<{ items: T[]; total: number; hasMore: boolean }> {
  const { total = items.length, hasMore = false } = options

  return createMockAxiosResponse({
    items,
    total,
    hasMore,
  })
}
