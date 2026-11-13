import { useState, useEffect, useCallback } from 'react'
import { isAxiosError } from 'axios'
import { ChevronLeft, ChevronRight, Eye, EyeOff, RefreshCw, Star, Trash2 } from 'lucide-react'
import { reviewsApi, type AdminReview } from '../services/api'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useToast } from '../components/ui/Toast'
import logger from '../lib/logger'

const PAGE_SIZE = 20

type Filter = 'all' | 'visible' | 'hidden'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'visible', label: '公開中' },
  { value: 'hidden', label: '已隱藏' },
]

const FILTER_PARAM: Record<Filter, boolean | undefined> = {
  all: undefined,
  visible: true,
  hidden: false,
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex" aria-label={`${rating} 顆星`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden="true"
          className={`w-4 h-4 ${n <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </span>
  )
}

export function ReviewsPage() {
  const { success, error: showError } = useToast()
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<Filter>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<AdminReview | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const { data } = await reviewsApi.getAll({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        isApproved: FILTER_PARAM[filter],
      })
      setReviews(data.reviews)
      setTotal(data.total)
    } catch (err) {
      logger.error('取得評論失敗', { error: err })
      setLoadError('無法載入評論資料')
    } finally {
      setIsLoading(false)
    }
  }, [page, filter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const changeFilter = (next: Filter) => {
    setFilter(next)
    setPage(0)
  }

  const toggleVisible = async (review: AdminReview) => {
    setBusyId(review.id)
    try {
      await reviewsApi.setApproved(review.id, !review.isApproved)
      success(review.isApproved ? '已從前台隱藏' : '已重新公開')
      fetchReviews()
    } catch (err) {
      logger.error('更新評論狀態失敗', { error: err })
      showError('更新失敗', '請稍後再試')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      await reviewsApi.delete(deleting.id)
      success('評論已刪除')
      setDeleting(null)
      fetchReviews()
    } catch (err) {
      logger.error('刪除評論失敗', { error: err })
      const forbidden = isAxiosError(err) && err.response?.status === 403
      showError('刪除失敗', forbidden ? '只有管理員可以刪除評論，可以改用隱藏' : '請稍後再試')
    } finally {
      setIsDeleting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">評論管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            顧客送出的評論會直接公開；不適當的內容可以隱藏（保留資料、可再公開）或刪除。
          </p>
        </div>
        <button
          type="button"
          onClick={fetchReviews}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
          aria-label="重新整理"
          title="重新整理"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex gap-2" role="group" aria-label="篩選評論">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => changeFilter(f.value)}
            aria-pressed={filter === f.value}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === f.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
          </div>
        ) : loadError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-4">{loadError}</p>
            <button
              type="button"
              onClick={fetchReviews}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <RefreshCw className="w-4 h-4" />
              重試
            </button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">目前沒有評論</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <li key={review.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Stars rating={review.rating} />
                    <span className="font-medium text-gray-900">{review.title}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        review.isApproved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {review.isApproved ? '公開中' : '已隱藏'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-line break-words">{review.content}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {review.product?.name ?? '（產品已刪除）'} · {review.user?.name ?? '（帳號已刪除）'} ·{' '}
                    {new Date(review.createdAt).toLocaleString('zh-TW')}
                  </p>
                </div>
                <div className="flex sm:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleVisible(review)}
                    disabled={busyId === review.id}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {review.isApproved ? (
                      <>
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                        隱藏
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" aria-hidden="true" />
                        公開
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(review)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    刪除
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
          <span>
            共 {total} 筆 · 第 {page + 1} / {totalPages} 頁
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              aria-label="上一頁"
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page + 1 >= totalPages}
              aria-label="下一頁"
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleting !== null}
        isLoading={isDeleting}
        title="刪除評論"
        message={`確定要刪除「${deleting?.title ?? ''}」嗎？刪除後無法復原；只想讓前台看不到的話，可以改用「隱藏」。`}
        confirmText="刪除"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
