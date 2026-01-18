/**
 * Axios Mock 工廠
 *
 * 提供型別安全的 AxiosResponse mock 建立函數
 */

import type { AxiosResponse, InternalAxiosRequestConfig, AxiosHeaders } from 'axios'

/**
 * 建立型別安全的 AxiosResponse mock
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
    config: { headers: {} as AxiosHeaders } as InternalAxiosRequestConfig,
  }
}

/**
 * 建立錯誤回應 mock
 */
export function createMockAxiosErrorResponse<T>(
  data: T,
  status: number = 400,
  statusText: string = 'Bad Request'
): AxiosResponse<T> {
  return createMockAxiosResponse(data, { status, statusText })
}

/**
 * 建立分頁回應 mock
 */
export function createMockPaginatedResponse<T>(
  items: T[],
  pagination: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  } = {}
): AxiosResponse<{
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}> {
  const { total = items.length, page = 1, limit = 10, hasMore = false } = pagination

  return createMockAxiosResponse({
    items,
    total,
    page,
    limit,
    hasMore,
  })
}
