/**
 * Admin 後台 Placeholder 圖片配置
 *
 * 使用 placehold.co 提供分類專屬的佔位圖片
 * 與前端 (web) 保持一致的配色方案
 */

const PLACEHOLD_BASE = 'https://placehold.co'

/**
 * 產品分類配色方案
 *
 * 與前端保持一致，確保前後台視覺統一
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
 * @param size - 圖片尺寸（預設 80x80 適合表格縮圖）
 */
export function getProductPlaceholder(
  category?: string,
  size: { width: number; height: number } = { width: 80, height: 80 }
): string {
  const colors = CATEGORY_COLORS[category || ''] || CATEGORY_COLORS['default']
  const encodedLabel = encodeURIComponent(colors.label)
  return `${PLACEHOLD_BASE}/${size.width}x${size.height}/${colors.bg}/${colors.text}?text=${encodedLabel}`
}

/**
 * 取得產品圖片 URL（優先使用真實圖片，否則使用 placeholder）
 *
 * @param images - 產品圖片陣列
 * @param category - 產品分類（用於 placeholder）
 */
export function getProductImageUrl(
  images?: { storageUrl?: string }[],
  category?: string
): string {
  const primaryImage = images?.[0]
  return primaryImage?.storageUrl || getProductPlaceholder(category)
}
