import { useState, useEffect, useRef } from 'react'
import {
  useAuthStore,
  type User,
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
  const { user, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasInitializedRef = useRef(false)

  // Validate session on mount (httpOnly cookie sent automatically)
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    const checkAuth = async () => {
      if (isAuthenticated) {
        try {
          const data = await authService.getMe()
          if (data.user) {
            setAuth(data.user)
          }
        } catch {
          storeLogout()
        }
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [isAuthenticated, setAuth, storeLogout])

  const login = async (email: string, password: string, _rememberMe: boolean = false) => {
    setError(null)
    setIsLoading(true)
    try {
      // Login — tokens are in httpOnly cookies, response has { user, csrfToken }
      const data = await authService.login(email, password)
      setAuth(data.user, data.csrfToken)
      // Merge local cart to backend (guest items are preserved)
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
      setAuth(data.user, data.csrfToken)
      // Merge local cart to backend (guest items are preserved)
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
    clearAllAuthStorage() // Clear all storage
    localStorage.removeItem('cart-storage') // Clear local cart
    useCartStore.setState({ items: [] }) // Reset cart state
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
