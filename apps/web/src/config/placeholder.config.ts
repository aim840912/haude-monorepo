/**
 * Placeholder 圖片配置
 *
 * 使用 picsum.photos 提供開發階段的佔位圖片
 * 使用 seed 參數確保同一類型的圖片保持一致性
 */

// 基礎 URL 配置
const PICSUM_BASE = 'https://picsum.photos/seed'
const PLACEHOLD_BASE = 'https://placehold.co'

/**
 * 圖片尺寸預設值
 */
export const IMAGE_SIZES = {
  /** 產品圖片 - 正方形 */
  product: { width: 400, height: 400 },
  /** 農場體驗 - 16:9 */
  farmTour: { width: 640, height: 360 },
  /** 地點 - 16:9 */
  location: { width: 640, height: 360 },
  /** 縮圖 */
  thumbnail: { width: 200, height: 200 },
  /** 橫幅 */
  banner: { width: 1200, height: 400 },
} as const

/**
 * Placeholder 圖片 URL 生成器
 *
 * 使用 picsum.photos 的 seed 功能，確保相同 seed 返回相同圖片
 */
export const PLACEHOLDER_IMAGES = {
  /**
   * 產品圖片 placeholder
   * @param seed - 可選的種子值，用於生成一致的圖片
   */
  product: (seed?: string | number) => {
    const s = seed ?? 'product-default'
    return `${PICSUM_BASE}/${s}/${IMAGE_SIZES.product.width}/${IMAGE_SIZES.product.height}`
  },

  /**
   * 農場體驗圖片 placeholder
   * @param seed - 可選的種子值
   */
  farmTour: (seed?: string | number) => {
    const s = seed ?? 'farm-tour-default'
    return `${PICSUM_BASE}/${s}/${IMAGE_SIZES.farmTour.width}/${IMAGE_SIZES.farmTour.height}`
  },

  /**
   * 地點圖片 placeholder
   * @param seed - 可選的種子值
   */
  location: (seed?: string | number) => {
    const s = seed ?? 'location-default'
    return `${PICSUM_BASE}/${s}/${IMAGE_SIZES.location.width}/${IMAGE_SIZES.location.height}`
  },

  /**
   * 通用 placeholder（帶文字）
   * 適合用於明確標示「無圖片」的情況
   */
  generic: (
    width: number = 400,
    height: number = 300,
    text: string = '無圖片'
  ) => {
    const encodedText = encodeURIComponent(text)
    return `${PLACEHOLD_BASE}/${width}x${height}/e2e8f0/64748b?text=${encodedText}`
  },

  /**
   * 帶類別標示的 placeholder
   */
  withLabel: {
    product: `${PLACEHOLD_BASE}/400x400/d4edda/155724?text=產品圖片`,
    farmTour: `${PLACEHOLD_BASE}/640x360/d1ecf1/0c5460?text=體驗活動`,
    location: `${PLACEHOLD_BASE}/640x360/fff3cd/856404?text=門市據點`,
    user: `${PLACEHOLD_BASE}/200x200/e2e3e5/383d41?text=使用者`,
  },
} as const

/**
 * 預設 placeholder URL（靜態版本）
 * 適合用於 fallback 或無法使用動態生成的情況
 */
export const DEFAULT_PLACEHOLDERS = {
  product: PLACEHOLDER_IMAGES.product('tea-product'),
  farmTour: PLACEHOLDER_IMAGES.farmTour('tea-farm'),
  location: PLACEHOLDER_IMAGES.location('tea-shop'),
  thumbnail: `${PICSUM_BASE}/thumb/${IMAGE_SIZES.thumbnail.width}/${IMAGE_SIZES.thumbnail.height}`,
  banner: `${PICSUM_BASE}/banner/${IMAGE_SIZES.banner.width}/${IMAGE_SIZES.banner.height}`,
} as const

/**
 * 取得帶有 ID 的一致性 placeholder
 *
 * @example
 * getPlaceholderByType('product', 'prod-123')
 * // => https://picsum.photos/seed/product-prod-123/400/400
 */
export function getPlaceholderByType(
  type: keyof typeof IMAGE_SIZES,
  id?: string | number
): string {
  const seed = id ? `${type}-${id}` : `${type}-default`

  switch (type) {
    case 'product':
      return PLACEHOLDER_IMAGES.product(seed)
    case 'farmTour':
      return PLACEHOLDER_IMAGES.farmTour(seed)
    case 'location':
      return PLACEHOLDER_IMAGES.location(seed)
    case 'thumbnail':
      return `${PICSUM_BASE}/${seed}/${IMAGE_SIZES.thumbnail.width}/${IMAGE_SIZES.thumbnail.height}`
    case 'banner':
      return `${PICSUM_BASE}/${seed}/${IMAGE_SIZES.banner.width}/${IMAGE_SIZES.banner.height}`
    default:
      return PLACEHOLDER_IMAGES.generic()
  }
}
