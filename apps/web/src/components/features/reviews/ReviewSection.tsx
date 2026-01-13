'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MessageSquare, Loader2, ChevronDown, ShoppingBag, Package } from 'lucide-react'
import { reviewsApi } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/feedback/toast'
import { ReviewStats } from './ReviewStats'
import { ReviewCard } from './ReviewCard'
import { ReviewForm } from './ReviewForm'
import { cn } from '@/lib/utils'
import logger from '@/lib/logger'

interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  content: string
  isVerified: boolean
  createdAt: string
}

interface ReviewStatsData {
  averageRating: number
  totalReviews: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

interface ReviewSectionProps {
  productId: string
  productName?: string
  className?: string
}

interface EligibilityStatus {
  canReview: boolean
  purchaseStatus: 'delivered' | 'ordered' | 'not_purchased'
  hasReviewed: boolean
  message: string
}

/**
 * 評論區容器元件
 */
export function ReviewSection({ productId, productName, className }: ReviewSectionProps) {
  const pathname = usePathname()
  const { isAuthenticated, user } = useAuthStore()
  const { success, error: showError } = useToast()

  const [stats, setStats] = useState<ReviewStatsData | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [eligibility, setEligibility] = useState<EligibilityStatus | null>(null)

  const LIMIT = 5

  // 載入評分統計和評論
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)

      const [statsRes, reviewsRes] = await Promise.all([
        reviewsApi.getReviewStats(productId),
        reviewsApi.getProductReviews(productId, LIMIT, 0),
      ])

      setStats(statsRes.data)
      setReviews(reviewsRes.data.reviews)
      setHasMore(reviewsRes.data.hasMore)
      setOffset(LIMIT)

      // 已登入用戶：檢查評論資格
      if (isAuthenticated) {
        try {
          const eligibilityRes = await reviewsApi.checkEligibility(productId)
          setEligibility(eligibilityRes.data)
        } catch (err) {
          // 檢查資格失敗不影響其他功能，靜默處理
          logger.error('檢查評論資格失敗', { error: err })
          setEligibility(null)
        }
      } else {
        setEligibility(null)
      }
    } catch (err) {
      logger.error('載入評論失敗', { error: err })
    } finally {
      setIsLoading(false)
    }
  }, [productId, isAuthenticated])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 載入更多評論
  const loadMore = async () => {
    try {
      setIsLoadingMore(true)
      const { data } = await reviewsApi.getProductReviews(productId, LIMIT, offset)
      setReviews((prev) => [...prev, ...data.reviews])
      setHasMore(data.hasMore)
      setOffset((prev) => prev + LIMIT)
    } catch (err) {
      logger.error('載入更多評論失敗', { error: err })
    } finally {
      setIsLoadingMore(false)
    }
  }

  // 提交評論
  const handleSubmit = async (data: { rating: number; title: string; content: string }) => {
    setIsSubmitting(true)
    try {
      await reviewsApi.create(productId, data)
      success('評論發表成功', '感謝您的分享！')
      setShowForm(false)
      fetchData() // 重新載入評論
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorMessage = (err as any)?.response?.data?.message || '評論發表失敗，請稍後再試'
      showError('發表失敗', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 刪除評論
  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除這則評論嗎？')) return

    try {
      await reviewsApi.delete(id)
      success('評論已刪除')
      fetchData() // 重新載入會更新 eligibility 狀態
    } catch {
      showError('刪除失敗', '請稍後再試')
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className={cn('', className)}>
      {/* 標題 */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900">
          顧客評價
          {stats && stats.totalReviews > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({stats.totalReviews})
            </span>
          )}
        </h2>
      </div>

      {/* 評分統計 */}
      {stats && stats.totalReviews > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <ReviewStats
            averageRating={stats.averageRating}
            totalReviews={stats.totalReviews}
            ratingDistribution={stats.ratingDistribution}
          />
        </div>
      )}

      {/* 未登入提示 */}
      {!isAuthenticated && (
        <div className="mb-6 bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-gray-600">
            <Link
              href={`/login?from=${encodeURIComponent(pathname + '#reviews')}`}
              className="text-green-600 hover:underline font-medium"
            >
              登入
            </Link>
            {' '}後即可發表評論
          </p>
        </div>
      )}

      {/* 已登入：根據資格顯示不同 UI */}
      {isAuthenticated && eligibility && (
        <>
          {/* 可以評論：顯示表單或按鈕 */}
          {eligibility.canReview && (
            <div className="mb-6">
              {showForm ? (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">
                    發表評論 {productName && `- ${productName}`}
                  </h3>
                  <ReviewForm
                    isSubmitting={isSubmitting}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  分享您的使用心得
                </button>
              )}
            </div>
          )}

          {/* 尚未購買 */}
          {eligibility.purchaseStatus === 'not_purchased' && (
            <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-amber-700 text-sm">
                  {eligibility.message}
                </p>
              </div>
            </div>
          )}

          {/* 已購買但未收貨 */}
          {eligibility.purchaseStatus === 'ordered' && (
            <div className="mb-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-blue-700 text-sm">
                  {eligibility.message}
                </p>
              </div>
            </div>
          )}

          {/* 已發表過評論 */}
          {eligibility.hasReviewed && (
            <div className="mb-6 bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-green-700 text-sm">{eligibility.message}</p>
            </div>
          )}
        </>
      )}

      {/* 評論列表 */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>尚無評論</p>
            {eligibility?.canReview && (
              <p className="text-sm mt-1">成為第一位發表評論的人！</p>
            )}
          </div>
        ) : (
          <>
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                id={review.id}
                userName={review.userName}
                rating={review.rating}
                title={review.title}
                content={review.content}
                isVerified={review.isVerified}
                createdAt={review.createdAt}
                isOwnReview={user?.id === review.userId}
                onDelete={() => handleDelete(review.id)}
              />
            ))}

            {/* 載入更多 */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  載入更多評論
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
