/**
 * 前端圖片常數管理
 *
 * 集中管理所有預設圖片 URL
 * 當 API 未提供圖片或載入失敗時使用
 *
 * 來源：Unsplash (https://unsplash.com)
 */

// ========================================
// Unsplash Photo IDs
// ========================================

const PHOTO_IDS = {
  // 茶葉相關
  teaCup: 'photo-1564890369478-c89ca6d9cde9',
  teaSet: 'photo-1544787219-7f47ccb76574',
  teaPlantation: 'photo-1556881286-fc6915169721',
  teaLandscape: 'photo-1563822249548-9a72b6353cd1',
  teaLeaves: 'photo-1518568814500-bf0f8d125f46',

  // 其他
  forest: 'photo-1473448912268-2022ce9509d8',
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
  /** 首頁輪播圖片 */
  home: [
    unsplash(PHOTO_IDS.teaPlantation, 1920, 1080), // 茶園梯田
    unsplash(PHOTO_IDS.teaLandscape, 1920, 1080), // 茶園景觀
    unsplash(PHOTO_IDS.teaSet, 1920, 1080), // 茶具品茗
  ] as string[],

  /** 觀光果園 Hero 背景 */
  farmTours: unsplash(PHOTO_IDS.teaCup, 1920, 1080),
}

// ========================================
// 特色卡片圖片
// ========================================

export const DEFAULT_FEATURE_CARD_IMAGES: string[] = [
  unsplash(PHOTO_IDS.teaLeaves, 400, 300), // 自然農法 - 茶葉
  unsplash(PHOTO_IDS.teaSet, 400, 300), // 品質認證 - 茶具
  unsplash(PHOTO_IDS.teaPlantation, 400, 300), // 農場體驗 - 茶園
  unsplash(PHOTO_IDS.forest, 400, 300), // 永續經營 - 森林
]

// ========================================
// 品牌故事圖片
// ========================================

export const DEFAULT_BRAND_STORY_IMAGE = unsplash(PHOTO_IDS.teaPlantation, 800, 1067)

// ========================================
// 關於我們頁面圖片
// ========================================

export const DEFAULT_ABOUT_HERO_IMAGE = unsplash(PHOTO_IDS.teaPlantation, 1920, 800)

export const DEFAULT_ABOUT_STORY_IMAGES: string[] = [
  unsplash(PHOTO_IDS.teaLandscape, 800, 600), // 三代傳承故事圖
  unsplash(PHOTO_IDS.teaLeaves, 800, 600), // 自然農法故事圖
]

// ========================================
// 最新消息頁面圖片
// ========================================

export const DEFAULT_NEWS_HERO_IMAGE =
  'https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=1920&h=800&fit=crop'

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
