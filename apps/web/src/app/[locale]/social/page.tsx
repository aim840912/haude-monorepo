'use client'

import { useState, useEffect } from 'react'
import { FacebookEmbed, InstagramEmbed } from 'react-social-media-embed'
import { Facebook, Instagram, RefreshCw } from 'lucide-react'
import { Breadcrumb } from '@/components/ui/navigation'
import { socialPostsApi } from '@/services/api'

interface SocialPost {
  id: string
  platform: 'facebook' | 'instagram'
  url: string
  title?: string
  sortOrder: number
}

/**
 * 社群媒體頁面
 *
 * 功能：
 * - 展示 Facebook 和 Instagram 嵌入貼文
 * - 按平台篩選貼文
 */
export default function SocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'facebook' | 'instagram'>('all')

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await socialPostsApi.getAll()
      setPosts(response.data)
    } catch (err) {
      console.error('Failed to fetch social posts:', err)
      setError('無法載入社群貼文')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true
    return post.platform === filter
  })

  const facebookCount = posts.filter(p => p.platform === 'facebook').length
  const instagramCount = posts.filter(p => p.platform === 'instagram').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: '社群動態' }]} className="mb-6" />

        {/* 標題區塊 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">社群動態</h1>
          <p className="text-gray-600">追蹤我們的最新消息與分享</p>
        </div>

        {/* 篩選按鈕 */}
        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            全部 ({posts.length})
          </button>
          <button
            onClick={() => setFilter('facebook')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              filter === 'facebook'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Facebook className="w-4 h-4" />
            Facebook ({facebookCount})
          </button>
          <button
            onClick={() => setFilter('instagram')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              filter === 'instagram'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <Instagram className="w-4 h-4" />
            Instagram ({instagramCount})
          </button>
        </div>

        {/* 內容區塊 */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin mb-4" />
            <p className="text-gray-600">載入中...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchPosts}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              重試
            </button>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600">目前沒有社群貼文</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map(post => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden"
              >
                {/* 標題區（如有） */}
                {post.title && (
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      {post.platform === 'facebook' ? (
                        <Facebook className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Instagram className="w-4 h-4 text-pink-600" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {post.title}
                      </span>
                    </div>
                  </div>
                )}

                {/* 嵌入貼文 */}
                <div className="flex justify-center">
                  {post.platform === 'facebook' ? (
                    <FacebookEmbed url={post.url} width="100%" />
                  ) : (
                    <InstagramEmbed url={post.url} width="100%" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
