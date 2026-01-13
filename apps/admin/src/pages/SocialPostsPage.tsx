import { useState } from 'react'
import { Plus, RefreshCw, Edit, Trash2, ExternalLink, Facebook, Instagram, ToggleLeft, ToggleRight } from 'lucide-react'
import { useSocialPosts, SocialPost, CreateSocialPostData, UpdateSocialPostData } from '../hooks/useSocialPosts'
import { ConfirmDialog } from '../components/ConfirmDialog'

// 平台圖示
const platformIcons: Record<SocialPost['platform'], typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
}

// 平台名稱
const platformLabels: Record<SocialPost['platform'], string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
}

// 平台顏色
const platformColors: Record<SocialPost['platform'], string> = {
  facebook: 'text-blue-600 bg-blue-50',
  instagram: 'text-pink-600 bg-pink-50',
}

export function SocialPostsPage() {
  const [editingPost, setEditingPost] = useState<SocialPost | null>(null)
  const [deletingPost, setDeletingPost] = useState<SocialPost | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { posts, isLoading, error, refetch, createPost, updatePost, deletePost, isCreating, isUpdating, isDeleting } = useSocialPosts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" />
          重試
        </button>
      </div>
    )
  }

  const handleToggleActive = async (post: SocialPost) => {
    await updatePost(post.id, { isActive: !post.isActive })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">社群貼文管理</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
            title="重新整理"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            新增貼文
          </button>
        </div>
      </div>

      {/* 說明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800">
          在這裡管理要嵌入到網站「社群動態」頁面的 Facebook 和 Instagram 貼文。
          只需要貼上貼文 URL，網站會自動顯示貼文內容。
        </p>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            尚無社群貼文，點擊「新增貼文」開始
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  排序
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  平台
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  標題/說明
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  貼文網址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  狀態
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {posts.map((post) => {
                const PlatformIcon = platformIcons[post.platform]
                return (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-500 font-mono">{post.sortOrder + 1}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${platformColors[post.platform]}`}>
                        <PlatformIcon className="w-4 h-4" />
                        {platformLabels[post.platform]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {post.title || <span className="text-gray-400 italic">無標題</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline max-w-xs truncate"
                      >
                        <span className="truncate">{post.url}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(post)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-colors ${
                          post.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {post.isActive ? (
                          <>
                            <ToggleRight className="w-4 h-4" />
                            啟用
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4" />
                            停用
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setEditingPost(post)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="編輯貼文"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingPost(post)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="刪除貼文"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 貼文數量統計 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {posts.length} 個貼文，{posts.filter(p => p.isActive).length} 個啟用中
      </div>

      {/* 新增貼文 Modal */}
      {isCreateModalOpen && (
        <SocialPostModal
          isOpen={isCreateModalOpen}
          isLoading={isCreating}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={async (data) => {
            // Modal 表單總是提供 platform 和 url，因此可以安全轉型為 CreateSocialPostData
            const success = await createPost(data as CreateSocialPostData)
            if (success) {
              setIsCreateModalOpen(false)
            }
            return success
          }}
        />
      )}

      {/* 編輯貼文 Modal */}
      {editingPost && (
        <SocialPostModal
          post={editingPost}
          isOpen={!!editingPost}
          isLoading={isUpdating}
          onClose={() => setEditingPost(null)}
          onSave={async (data) => {
            const success = await updatePost(editingPost.id, data)
            if (success) {
              setEditingPost(null)
            }
            return success
          }}
        />
      )}

      {/* 刪除確認 Dialog */}
      {deletingPost && (
        <ConfirmDialog
          isOpen={!!deletingPost}
          isLoading={isDeleting}
          title="確認刪除"
          message={`確定要刪除此社群貼文嗎？此操作無法復原。`}
          confirmText="確認刪除"
          cancelText="取消"
          variant="danger"
          onConfirm={async () => {
            const success = await deletePost(deletingPost.id)
            if (success) {
              setDeletingPost(null)
            }
          }}
          onCancel={() => setDeletingPost(null)}
        />
      )}
    </div>
  )
}

// 新增/編輯 Modal 元件
interface SocialPostModalProps {
  post?: SocialPost
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onSave: (data: CreateSocialPostData | UpdateSocialPostData) => Promise<boolean>
}

function SocialPostModal({ post, isOpen, isLoading, onClose, onSave }: SocialPostModalProps) {
  const [platform, setPlatform] = useState<'facebook' | 'instagram'>(post?.platform || 'instagram')
  const [url, setUrl] = useState(post?.url || '')
  const [title, setTitle] = useState(post?.title || '')

  const isEdit = !!post

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      platform,
      url,
      title: title || undefined,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? '編輯社群貼文' : '新增社群貼文'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 平台選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              平台 *
            </label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                platform === 'instagram'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="platform"
                  value="instagram"
                  checked={platform === 'instagram'}
                  onChange={(e) => setPlatform(e.target.value as 'instagram')}
                  className="sr-only"
                />
                <Instagram className="w-5 h-5" />
                Instagram
              </label>
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                platform === 'facebook'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="platform"
                  value="facebook"
                  checked={platform === 'facebook'}
                  onChange={(e) => setPlatform(e.target.value as 'facebook')}
                  className="sr-only"
                />
                <Facebook className="w-5 h-5" />
                Facebook
              </label>
            </div>
          </div>

          {/* 貼文網址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              貼文網址 *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={platform === 'instagram'
                ? 'https://www.instagram.com/p/...'
                : 'https://www.facebook.com/...'
              }
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              複製 {platform === 'instagram' ? 'Instagram' : 'Facebook'} 貼文的網址
            </p>
          </div>

          {/* 標題（選填） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              標題/說明（選填）
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="輸入標題或說明，方便管理"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* 按鈕 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isLoading || !url}
              className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isLoading ? '儲存中...' : isEdit ? '更新' : '新增'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
