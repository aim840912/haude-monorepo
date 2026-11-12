import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../../stores/authStore'
import { API_URL } from './api-url'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send httpOnly cookies automatically
})

// JWT is in httpOnly cookies (sent automatically). CSRF is enforced by the API's
// Origin check, so no token header is needed.

// ==================== Token Refresh Queue ====================

let isRefreshing = false
let isRedirectingToLogin = false
let failedQueue: Array<{
  resolve: (config: InternalAxiosRequestConfig) => void
  reject: (error: unknown) => void
  config: InternalAxiosRequestConfig
}> = []

function processQueue(error: unknown) {
  failedQueue.forEach(({ reject }) => reject(error))
  failedQueue = []
}

/** How long to wait for another tab's refresh cookies before retrying */
const CONCURRENT_REFRESH_WAIT_MS = 1500

function statusOf(err: unknown): number | undefined {
  return axios.isAxiosError(err) ? err.response?.status : undefined
}

function isSessionDead(refreshError: unknown): boolean {
  const status = statusOf(refreshError)
  return status === 401 || status === 403
}

function retryQueue() {
  failedQueue.forEach(({ resolve, config }) => resolve(config))
  failedQueue = []
}

// Response interceptor - refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const requestUrl = originalRequest?.url || ''
    const isAuthEndpoint = requestUrl.startsWith('/auth/')

    if (error.response?.status !== 401 || isAuthEndpoint || originalRequest?._retry) {
      return Promise.reject(error)
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest })
      }).then((config) => api(config as InternalAxiosRequestConfig))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })

      retryQueue()
      return api(originalRequest)
    } catch (refreshError) {
      // 409 = another tab rotated the refresh token a moment ago (API grace
      // window). Its Set-Cookie may still be in flight, so wait briefly, then
      // retry the original request with the cookies it set.
      // shortcut: one fixed wait; if the other tab's refresh response takes
      // longer than this the user is logged out. Upgrade path: retry the refresh
      // itself (or BroadcastChannel between tabs) instead of a timed wait.
      let sessionDead = isSessionDead(refreshError)
      if (statusOf(refreshError) === 409) {
        await new Promise((resolve) => setTimeout(resolve, CONCURRENT_REFRESH_WAIT_MS))
        try {
          const response = await api(originalRequest)
          retryQueue()
          return response
        } catch (retryError) {
          if (statusOf(retryError) !== 401) {
            // Auth got past (or the failure is unrelated): the session is alive
            retryQueue()
            return Promise.reject(retryError)
          }
          // Still 401 after the other tab had time to refresh: session is gone
          sessionDead = true
        }
      }

      processQueue(error)

      // Only a 401/403 from /auth/refresh (or still 401 after the 409 wait) means the session is dead. 429 (the
      // refresh endpoint is rate-limited per IP), 5xx, network errors and Render
      // cold-start timeouts are transient: fail this request, keep the user in.
      if (sessionDead && !isRedirectingToLogin) {
        isRedirectingToLogin = true
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }

      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)
