import { useState, useEffect, useRef } from 'react'
import {
  useAuthStore,
  type User,
  setRememberMe,
  clearAllAuthStorage,
} from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { authService } from '@/services/auth'

interface UseAuthReturn {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  error: string | null
}

export function useAuth(): UseAuthReturn {
  const { user, token, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitializedRef = useRef(false)

  // 初始化時檢查 token 是否有效（使用 ref 確保只執行一次）
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    const checkAuth = async () => {
      if (token) {
        try {
          const data = await authService.getMe()
          if (data.user) {
            setAuth(data.user, token)
          }
        } catch {
          storeLogout()
        }
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [token, setAuth, storeLogout])

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setError(null)
    setIsLoading(true)
    try {
      // 1. 設定「記住我」偏好（必須在 setAuth 之前設定）
      setRememberMe(rememberMe)
      // 2. 執行登入
      const data = await authService.login(email, password)
      // 3. 儲存認證狀態（dynamicStorage 會根據 rememberMe 選擇 storage）
      setAuth(data.user, data.accessToken, data.csrfToken)
      // 4. 合併本地購物車到後端（訪客加入的商品會保留）
      await useCartStore.getState().mergeLocalToBackend()
    } catch (err) {
      const message = err instanceof Error ? err.message : '登入失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const data = await authService.register(email, password, name)
      setAuth(data.user, data.accessToken, data.csrfToken)
      // 合併本地購物車到後端（訪客加入的商品會保留）
      await useCartStore.getState().mergeLocalToBackend()
    } catch (err) {
      const message = err instanceof Error ? err.message : '註冊失敗'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    clearAllAuthStorage() // 清除所有 storage
    localStorage.removeItem('cart-storage') // 清除本地購物車
    useCartStore.setState({ items: [] }) // 重置購物車狀態
    storeLogout()
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    error,
  }
}
