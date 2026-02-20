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

// Request interceptor - attach CSRF token (JWT is in httpOnly cookie)
api.interceptors.request.use((config) => {
  // CSRF Token (only for non-safe methods)
  const csrfToken = getCsrfToken()
  const method = config.method?.toUpperCase()
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (csrfToken && method && !safeMethods.includes(method)) {
    config.headers['X-CSRF-Token'] = csrfToken
  }

  return config
})

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
      const { data } = await axios.post(
        `${API_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )

      // Update CSRF token
      if (data.csrfToken) {
        setCsrfToken(data.csrfToken)
      }

      retryQueue()
      return api(originalRequest)
    } catch {
      processQueue(error)

      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true
        useAuthStore.getState().logout()
        clearCsrfToken()
        window.location.href = '/login'
      }

      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  }
)

// ==================== CSRF Token Storage ====================

/**
 * Set CSRF Token
 */
export function setCsrfToken(token: string): void {
  localStorage.setItem('admin-csrf-token', token)
}

/**
 * Get CSRF Token
 */
export function getCsrfToken(): string | null {
  return localStorage.getItem('admin-csrf-token')
}

/**
 * Clear CSRF Token
 */
export function clearCsrfToken(): void {
  localStorage.removeItem('admin-csrf-token')
}
