import { useState, useEffect, useCallback } from 'react'
import { socialPostsApi } from '../services/api'
import logger from '../lib/logger'

export interface SocialPost {
  id: string
  platform: 'facebook' | 'instagram'
  url: string
  title?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSocialPostData {
  platform: 'facebook' | 'instagram'
  url: string
  title?: string
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateSocialPostData {
  platform?: 'facebook' | 'instagram'
  url?: string
  title?: string
  sortOrder?: number
  isActive?: boolean
}

interface UseSocialPostsReturn {
  posts: SocialPost[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  createPost: (data: CreateSocialPostData) => Promise<boolean>
  updatePost: (id: string, data: UpdateSocialPostData) => Promise<boolean>
  deletePost: (id: string) => Promise<boolean>
  reorderPosts: (ids: string[]) => Promise<boolean>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}

export function useSocialPosts(): UseSocialPostsReturn {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data } = await socialPostsApi.getAllAdmin()
      setPosts(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入社群貼文失敗'
      setError(message)
      logger.error('[useSocialPosts] API 錯誤', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createPost = useCallback(async (data: CreateSocialPostData): Promise<boolean> => {
    setIsCreating(true)
    try {
      await socialPostsApi.create(data)
      await fetchPosts()
      return true
    } catch (err) {
      logger.error('[useSocialPosts] 建立失敗', { error: err })
      return false
    } finally {
      setIsCreating(false)
    }
  }, [fetchPosts])

  const updatePost = useCallback(async (id: string, data: UpdateSocialPostData): Promise<boolean> => {
    setIsUpdating(true)
    try {
      await socialPostsApi.update(id, data)
      await fetchPosts()
      return true
    } catch (err) {
      logger.error('[useSocialPosts] 更新失敗', { error: err })
      return false
    } finally {
      setIsUpdating(false)
    }
  }, [fetchPosts])

  const deletePost = useCallback(async (id: string): Promise<boolean> => {
    setIsDeleting(true)
    try {
      await socialPostsApi.delete(id)
      await fetchPosts()
      return true
    } catch (err) {
      logger.error('[useSocialPosts] 刪除失敗', { error: err })
      return false
    } finally {
      setIsDeleting(false)
    }
  }, [fetchPosts])

  const reorderPosts = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      await socialPostsApi.reorder(ids)
      await fetchPosts()
      return true
    } catch (err) {
      logger.error('[useSocialPosts] 排序失敗', { error: err })
      return false
    }
  }, [fetchPosts])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  return {
    posts,
    isLoading,
    error,
    refetch: fetchPosts,
    createPost,
    updatePost,
    deletePost,
    reorderPosts,
    isCreating,
    isUpdating,
    isDeleting,
  }
}
