import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 攜帶 Cookie（CSRF 防護所需）
})

// Request interceptor - 加入 JWT token 和 CSRF token
api.interceptors.request.use((config) => {
  // JWT Token
  const token = localStorage.getItem('admin-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  // CSRF Token（僅非安全方法需要）
  const csrfToken = localStorage.getItem('admin-csrf-token')
  const method = config.method?.toUpperCase()
  const safeMethods = ['GET', 'HEAD', 'OPTIONS']
  if (csrfToken && method && !safeMethods.includes(method)) {
    config.headers['X-CSRF-Token'] = csrfToken
  }

  return config
})

// Response interceptor - 處理錯誤
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin-token')
      localStorage.removeItem('admin-csrf-token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ==================== CSRF Token 存取 ====================

/**
 * 設定 CSRF Token
 */
export function setCsrfToken(token: string): void {
  localStorage.setItem('admin-csrf-token', token)
}

/**
 * 取得 CSRF Token
 */
export function getCsrfToken(): string | null {
  return localStorage.getItem('admin-csrf-token')
}

/**
 * 清除 CSRF Token
 */
export function clearCsrfToken(): void {
  localStorage.removeItem('admin-csrf-token')
}
