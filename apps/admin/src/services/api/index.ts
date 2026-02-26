// ==================== Admin API - 模組化匯總導出 ====================
// 本檔案統一導出所有 API 模組，方便使用者透過單一入口引用

// Client & 認證工具
export { api, setCsrfToken, getCsrfToken, clearCsrfToken } from './client'

// 產品管理
export { productsApi, productImagesApi } from './products.api'
export type { ProductImage, UploadUrlResponse } from './products.api'

// 訂單與儀表板
export { ordersApi, dashboardApi } from './orders.api'
export type { RevenueTrendData, OrderStatusData, TopProductData } from './orders.api'

// 用戶管理
export { usersApi } from './users.api'

// 農場體驗
export { farmToursApi, farmTourImagesApi } from './farm-tours.api'
export type { FarmTourImage } from './farm-tours.api'

// 擺攤行程
export { schedulesApi } from './schedules.api'

// 付款監控
export { paymentsApi } from './payments.api'

// 折扣碼管理
export { discountsApi } from './discounts.api'
export type { DiscountCode } from './discounts.api'

// 會員等級管理
export { membersApi } from './members.api'
export type {
  MemberLevel,
  AdminMember,
  MemberListResponse,
  MemberDetail,
  LevelHistoryItem,
  LevelHistoryResponse,
  PointHistoryItem,
  PointHistoryResponse,
} from './members.api'

// 門市據點
export { locationsApi, locationImagesApi } from './locations.api'
export type { LocationImage } from './locations.api'

// 社群貼文
export { socialPostsApi } from './social-posts.api'
export type { SocialPost } from './social-posts.api'

// 通知系統
export { notificationsApi, stockAlertsApi } from './notifications.api'
export type {
  NotificationType,
  Notification,
  NotificationListResponse,
  StockAlertSetting,
} from './notifications.api'

// 網站圖片設定
export { siteSettingsApi } from './site-settings.api'
export type { SiteSetting, SiteImageUploadUrlResponse } from './site-settings.api'

// 銷售報表
export { reportsApi } from './reports.api'
export type {
  PeriodStats,
  SalesSummaryResponse,
  SalesTrendItem,
  SalesDetailItem,
  SalesDetailResponse,
  CompareMode,
  GroupBy,
} from './reports.api'
