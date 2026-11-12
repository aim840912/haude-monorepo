import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../../stores/authStore'

// API version centrally managed: only change here when upgrading
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
const API_VERSION = 'v1'
const API_URL = `${API_BASE}/api/${API_VERSION}`

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

function isSessionDead(refreshError: unknown): boolean {
  const status = axios.isAxiosError(refreshError) ? refreshError.response?.status : undefined
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
      processQueue(error)

      // Only a 401/403 from /auth/refresh means the session is dead. 429 (the
      // refresh endpoint is rate-limited per IP), 5xx, network errors and Render
      // cold-start timeouts are transient: fail this request, keep the user in.
      if (isSessionDead(refreshError) && !isRedirectingToLogin) {
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
