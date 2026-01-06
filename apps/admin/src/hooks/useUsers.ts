import { useState, useEffect, useCallback } from 'react'
import { usersApi } from '../services/api'

export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
  orderCount?: number
}

export interface UpdateUserData {
  name?: string
  role?: UserRole
  isActive?: boolean
}

interface UseUsersReturn {
  users: User[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  updateUser: (id: string, data: UpdateUserData) => Promise<boolean>
  toggleUserStatus: (id: string, isActive: boolean) => Promise<boolean>
  isUpdating: boolean
}

export function useUsers(): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await usersApi.getAll()
      setUsers(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入會員失敗'
      setError(message)
      console.error('[useUsers] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUser = useCallback(async (id: string, data: UpdateUserData): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await usersApi.update(id, data)
      await fetchUsers()
      return true
    } catch (err) {
      console.error('[useUsers] 更新失敗:', err)
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchUsers])

  const toggleUserStatus = useCallback(async (id: string, isActive: boolean): Promise<boolean> => {
    return updateUser(id, { isActive })
  }, [updateUser])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    isLoading,
    error,
    refetch: fetchUsers,
    updateUser,
    toggleUserStatus,
    isUpdating,
  }
}

interface UseUserReturn {
  user: User | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useUser(userId: string | undefined): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(!!userId)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)
    try {
      const { data } = await usersApi.getById(userId)
      setUser(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入會員失敗'
      setError(message)
      console.error('[useUser] API 錯誤:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      fetchUser()
    }
  }, [userId, fetchUser])

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
  }
}
