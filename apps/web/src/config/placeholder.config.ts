/**
 * Placeholder 圖片配置
 *
 * 使用 placehold.co 提供分類專屬的佔位圖片
 * 每個產品分類有專屬的顏色和標籤，提高辨識度
 */

// 基礎 URL 配置
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
 * 產品分類配色方案
 *
 * 設計原則：
 * - 背景色使用淺色調，確保舒適閱讀
 * - 文字色使用深色調，確保對比度
 * - 每個分類有獨特的顏色識別
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  // 茶葉 - 綠色系（品牌主色）
  '茶葉': { bg: 'd4edda', text: '155724', label: '茶葉' },
  // 蜂蜜 - 琥珀色系
  '蜂蜜': { bg: 'fff3cd', text: '856404', label: '蜂蜜' },
  // 農產品 - 土地棕色系
  '農產品': { bg: 'e8d5b7', text: '5d4e37', label: '農產品' },
  // 手工藝品 - 紫藤色系
  '手工藝品': { bg: 'e2d5f0', text: '5a4878', label: '手工藝品' },
  // 乾貨 - 暖褐色系
  '乾貨': { bg: 'f5e6d3', text: '8b6914', label: '乾貨' },
  // 禮盒 - 喜氣紅色系
  '禮盒': { bg: 'f8d7da', text: '721c24', label: '禮盒' },
  // 預設 - 中性灰色系
  'default': { bg: 'e9ecef', text: '495057', label: '商品' },
}

/**
 * 根據分類取得 placeholder 圖片 URL
 *
 * @param category - 產品分類名稱
 * @param size - 圖片尺寸（預設 400x400）
 * @returns placeholder 圖片 URL
 *
 * @example
 * getProductPlaceholder('茶葉')
 * // => https://placehold.co/400x400/d4edda/155724?text=茶葉
 */
export function getProductPlaceholder(
  category?: string,
  size: { width: number; height: number } = IMAGE_SIZES.product
): string {
  const colors = CATEGORY_COLORS[category || ''] || CATEGORY_COLORS['default']
  const encodedLabel = encodeURIComponent(colors.label)
  return `${PLACEHOLD_BASE}/${size.width}x${size.height}/${colors.bg}/${colors.text}?text=${encodedLabel}`
}

/**
 * Placeholder 圖片 URL 生成器
 */
export const PLACEHOLDER_IMAGES = {
  /**
   * 產品圖片 placeholder（分類感知）
   * @param category - 產品分類，用於選擇對應的顏色主題
   */
  product: (category?: string) => getProductPlaceholder(category),

  /**
   * 農場體驗圖片 placeholder
   * @param _seed - 已棄用，保留以相容舊程式碼
   */
  farmTour: (_seed?: string | number) => {
    const encodedText = encodeURIComponent('農場體驗')
    return `${PLACEHOLD_BASE}/${IMAGE_SIZES.farmTour.width}x${IMAGE_SIZES.farmTour.height}/d1ecf1/0c5460?text=${encodedText}`
  },

  /**
   * 地點圖片 placeholder
   * @param _seed - 已棄用，保留以相容舊程式碼
   */
  location: (_seed?: string | number) => {
    const encodedText = encodeURIComponent('門市據點')
    return `${PLACEHOLD_BASE}/${IMAGE_SIZES.location.width}x${IMAGE_SIZES.location.height}/fff3cd/856404?text=${encodedText}`
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
   * 帶類別標示的 placeholder（靜態版本）
   */
  withLabel: {
    product: `${PLACEHOLD_BASE}/400x400/d4edda/155724?text=${encodeURIComponent('商品')}`,
    farmTour: `${PLACEHOLD_BASE}/640x360/d1ecf1/0c5460?text=${encodeURIComponent('體驗活動')}`,
    location: `${PLACEHOLD_BASE}/640x360/fff3cd/856404?text=${encodeURIComponent('門市據點')}`,
    user: `${PLACEHOLD_BASE}/200x200/e2e3e5/383d41?text=${encodeURIComponent('使用者')}`,
  },
} as const

/**
 * 預設 placeholder URL（靜態版本）
 * 適合用於 fallback 或無法使用動態生成的情況
 */
export const DEFAULT_PLACEHOLDERS = {
  product: PLACEHOLDER_IMAGES.product(),
  farmTour: PLACEHOLDER_IMAGES.farmTour(),
  location: PLACEHOLDER_IMAGES.location(),
  thumbnail: PLACEHOLDER_IMAGES.generic(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, '縮圖'),
  banner: PLACEHOLDER_IMAGES.generic(IMAGE_SIZES.banner.width, IMAGE_SIZES.banner.height, '橫幅'),
} as const

/**
 * 取得指定類型的 placeholder
 *
 * @param type - 圖片類型
 * @param category - 產品分類（僅 product 類型使用）
 *
 * @example
 * getPlaceholderByType('product', '茶葉')
 * // => https://placehold.co/400x400/d4edda/155724?text=茶葉
 */
export function getPlaceholderByType(
  type: keyof typeof IMAGE_SIZES,
  category?: string
): string {
  switch (type) {
    case 'product':
      return PLACEHOLDER_IMAGES.product(category)
    case 'farmTour':
      return PLACEHOLDER_IMAGES.farmTour()
    case 'location':
      return PLACEHOLDER_IMAGES.location()
    case 'thumbnail':
      return PLACEHOLDER_IMAGES.generic(IMAGE_SIZES.thumbnail.width, IMAGE_SIZES.thumbnail.height, '縮圖')
    case 'banner':
      return PLACEHOLDER_IMAGES.generic(IMAGE_SIZES.banner.width, IMAGE_SIZES.banner.height, '橫幅')
    default:
      return PLACEHOLDER_IMAGES.generic()
  }
}
