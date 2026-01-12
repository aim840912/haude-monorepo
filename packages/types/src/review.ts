/**
 * 評論相關型別 - 前後端共用
 */

/**
 * 評論
 */
export interface Review {
  id: string
  productId: string
  userId: string
  userName: string
  rating: number
  title: string
  content: string
  isVerified: boolean // 是否為已驗證購買
  isApproved: boolean // 是否通過審核
  createdAt: string
}

/**
 * 評分統計
 */
export interface ReviewStats {
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

/**
 * 建立評論請求
 */
export interface CreateReviewRequest {
  rating: number
  title: string
  content: string
}

/**
 * 評論列表回應
 */
export interface ReviewListResponse {
  reviews: Review[]
  total: number
  hasMore: boolean
}
