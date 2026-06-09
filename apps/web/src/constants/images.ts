/**
 * 前端圖片常數管理 — 方向 A（已換成驗證過的茶主題圖片）
 *
 * 變更：原本的預設圖其實不是茶（teaPlantation 是薄荷飲、teaSet 是咖啡餅乾、
 * teaLeaves 是燈串愛心）。這裡全部換成實際載入確認過的茶主題 Unsplash 圖：
 *   - 白瓷茶壺、清亮茶杯、抹茶、乾燥茶葉、森林
 * 首頁 Hero 輪播改為 [茶壺 → 茶杯 → 抹茶]，與設計範例一致。
 *
 * 直接覆蓋 src/constants/images.ts
 * 來源：Unsplash (https://unsplash.com)
 */

// ========================================
// Unsplash Photo IDs（皆已驗證可載入且為茶主題）
// ========================================

const PHOTO_IDS = {
  teaPot: 'photo-1564890369478-c89ca6d9cde9', // 白瓷茶壺 · 暖木
  teaCup: 'photo-1597318181409-cf64d0b5d8a2', // 清亮茶杯 · 留白
  matcha: 'photo-1582793988951-9aed5509eb97', // 抹茶 · 深木
  teaLeaves: 'photo-1563822249548-9a72b6353cd1', // 乾燥茶葉 · 茶湯
  forest: 'photo-1473448912268-2022ce9509d8', // 森林 · 永續
} as const

// ========================================
// 輔助函數
// ========================================

/** 生成 Unsplash 圖片 URL */
const unsplash = (photoId: string, width: number, height: number): string =>
  `https://images.unsplash.com/${photoId}?w=${width}&h=${height}&fit=crop`

// ========================================
// Hero 背景圖片（高解析度）
// ========================================

export const DEFAULT_HERO_IMAGES = {
  /** 首頁輪播圖片 — 茶壺 → 茶杯 → 抹茶 */
  home: [
    unsplash(PHOTO_IDS.teaPot, 1920, 1080),
    unsplash(PHOTO_IDS.teaCup, 1920, 1080),
    unsplash(PHOTO_IDS.matcha, 1920, 1080),
  ] as string[],

  /** 觀光果園 Hero 背景 */
  farmTours: unsplash(PHOTO_IDS.teaPot, 1920, 1080),
}

// ========================================
// 特色卡片圖片
// ========================================

export const DEFAULT_FEATURE_CARD_IMAGES: string[] = [
  unsplash(PHOTO_IDS.teaLeaves, 400, 300), // 自然農法 - 茶葉
  unsplash(PHOTO_IDS.teaCup, 400, 300), // 品質把關 - 茶杯
  unsplash(PHOTO_IDS.matcha, 400, 300), // 高山茶園 - 抹茶
  unsplash(PHOTO_IDS.forest, 400, 300), // 永續共生 - 森林
]

// ========================================
// 品牌故事圖片
// ========================================

export const DEFAULT_BRAND_STORY_IMAGE = unsplash(PHOTO_IDS.teaPot, 800, 1067)

// ========================================
// 關於我們頁面圖片
// ========================================

export const DEFAULT_ABOUT_HERO_IMAGE = unsplash(PHOTO_IDS.matcha, 1920, 800)

export const DEFAULT_ABOUT_STORY_IMAGES: string[] = [
  unsplash(PHOTO_IDS.teaLeaves, 800, 600), // 三代傳承故事圖
  unsplash(PHOTO_IDS.teaCup, 800, 600), // 自然農法故事圖
]

// ========================================
// 最新消息頁面圖片
// ========================================

export const DEFAULT_NEWS_HERO_IMAGE = unsplash(PHOTO_IDS.teaLeaves, 1920, 800)

// ========================================
// 匯出所有圖片常數
// ========================================

export const DEFAULT_IMAGES = {
  hero: DEFAULT_HERO_IMAGES,
  featureCards: DEFAULT_FEATURE_CARD_IMAGES,
  brandStory: DEFAULT_BRAND_STORY_IMAGE,
  about: {
    hero: DEFAULT_ABOUT_HERO_IMAGE,
    storyImages: DEFAULT_ABOUT_STORY_IMAGES,
  },
  news: {
    hero: DEFAULT_NEWS_HERO_IMAGE,
  },
}
