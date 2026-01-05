/**
 * Seed 資料圖片集中管理
 *
 * 本檔案集中管理所有 seed 資料使用的圖片 URL
 * 方便維護和更新圖片資源
 *
 * 命名規則：{類別}_{用途}
 * 來源：Unsplash (https://unsplash.com)
 *
 * URL 格式說明：
 * - w: 寬度 (pixels)
 * - h: 高度 (pixels)
 * - fit=crop: 裁切模式，確保填滿指定尺寸
 */

// ========================================
// 圖片尺寸常數
// ========================================

/** 卡片圖片尺寸 */
const CARD_SIZE = 'w=640&h=360&fit=crop'

/** 縮圖尺寸 */
const THUMBNAIL_SIZE = 'w=400&h=400&fit=crop'

// ========================================
// Unsplash Photo IDs
// ========================================

/**
 * 集中管理 Unsplash Photo IDs
 * 更換圖片時只需修改這裡的 ID
 */
const PHOTO_IDS = {
  // 茶葉相關 - 品茗與茶具（已驗證的 Unsplash ID）
  teaCup: 'photo-1564890369478-c89ca6d9cde9', // 茶杯品茗
  teaSet: 'photo-1544787219-7f47ccb76574', // 茶具組
  teaPot: 'photo-1558160074-4d7d8bdf4256', // 茶壺泡茶
  teaCeremony: 'photo-1530968033775-2c92736b131e', // 茶道
  chineseTea: 'photo-1576092768241-dec231879fc3', // 中式茶
  greenTea: 'photo-1556881286-fc6915169721', // 綠茶

  // 茶葉相關 - 茶園與茶葉
  teaPlantation: 'photo-1556881286-fc6915169721', // 茶園梯田
  teaLandscape: 'photo-1563822249548-9a72b6353cd1', // 茶園景觀
  teaLeaves: 'photo-1518568814500-bf0f8d125f46', // 茶葉特寫
  driedTeaLeaves: 'photo-1564890369478-c89ca6d9cde9', // 乾茶葉

  // 茶葉產品圖 - 使用穩定的茶相關圖片
  teaProduct1: 'photo-1564890369478-c89ca6d9cde9', // 阿里山高山烏龍茶 - 茶杯
  teaProduct2: 'photo-1544787219-7f47ccb76574', // 梅山金萱茶 - 茶具組
  teaProduct3: 'photo-1558160074-4d7d8bdf4256', // 日月潭紅玉紅茶 - 茶壺
  teaProduct4: 'photo-1530968033775-2c92736b131e', // 凍頂烏龍茶 - 茶道
  teaProduct5: 'photo-1576092768241-dec231879fc3', // 東方美人茶 - 中式茶
  teaProduct6: 'photo-1556881286-fc6915169721', // 四季春茶 - 綠茶

  // 農業相關 - 使用茶園圖片
  farmField: 'photo-1556881286-fc6915169721', // 茶園
  sunsetField: 'photo-1563822249548-9a72b6353cd1', // 茶園景觀
  forest: 'photo-1556881286-fc6915169721', // 茶園

  // 水果相關 - 使用茶相關
  plums: 'photo-1544787219-7f47ccb76574', // 茶具

  // 料理/工作坊
  cooking: 'photo-1558160074-4d7d8bdf4256', // 茶壺
  jamMaking: 'photo-1530968033775-2c92736b131e', // 茶道

  // 蜂蜜 - 使用茶相關
  honey: 'photo-1564890369478-c89ca6d9cde9', // 茶杯
  honeyJar: 'photo-1544787219-7f47ccb76574', // 茶具

  // 商店/市集
  store: 'photo-1555396273-367ea4eb4db5', // 商店內部
  retailStore: 'photo-1441986300917-64674bd600d8', // 零售商店
  farmersMarket: 'photo-1556881286-fc6915169721', // 茶園
  outdoorMarket: 'photo-1563822249548-9a72b6353cd1', // 茶園景觀
  teaGarden: 'photo-1556881286-fc6915169721', // 茶園
} as const

// ========================================
// 輔助函數
// ========================================

/** 生成 Unsplash 圖片 URL（使用 Photo ID） */
const unsplash = (photoId: string, size: string = CARD_SIZE): string =>
  `https://images.unsplash.com/${photoId}?${size}`

/** 使用關鍵字搜尋獲取 Unsplash 圖片（更穩定） */
const unsplashSearch = (keywords: string, seed: number = 1): string =>
  `https://source.unsplash.com/400x400/?${keywords}&sig=${seed}`

// ========================================
// 農場體驗圖片
// ========================================

export const FARM_TOUR_IMAGES = {
  /** 春季採茶體驗 - 茶杯品茗場景 */
  teaPicking: unsplash(PHOTO_IDS.teaCup),

  /** 手作茶葉蛋工作坊 - 料理場景 */
  teaEggWorkshop: unsplash(PHOTO_IDS.cooking),

  /** 有機農場生態導覽 - 農場田野 */
  farmTour: unsplash(PHOTO_IDS.farmField),

  /** 高山茶品茗會 - 茶具組 */
  teaTasting: unsplash(PHOTO_IDS.teaSet),

  /** 紅肉李採果體驗 - 李子 */
  plumPicking: unsplash(PHOTO_IDS.plums),

  /** 手工果醬製作課程 - 果醬製作 */
  jamWorkshop: unsplash(PHOTO_IDS.jamMaking),

  /** 蜂場參觀與蜂蜜品嚐 - 蜂蜜 */
  honeyTour: unsplash(PHOTO_IDS.honey),

  /** 茶園夕陽攝影之旅 - 夕陽田野 */
  sunsetTour: unsplash(PHOTO_IDS.sunsetField),
} as const

// ========================================
// 地點圖片
// ========================================

export const LOCATION_IMAGES = {
  /** 豪德製茶所總部 - 商店內部 */
  headquarters: unsplash(PHOTO_IDS.store),

  /** 阿里山茶莊 - 茶園 */
  alishanStore: unsplash(PHOTO_IDS.teaGarden),

  /** 嘉義市農產直銷站 - 零售商店 */
  chiayiStore: unsplash(PHOTO_IDS.retailStore),

  /** 梅山假日農夫市集 - 農夫市集 */
  meishanMarket: unsplash(PHOTO_IDS.farmersMarket),

  /** 台北希望廣場攤位 - 戶外市集 */
  taipeiMarket: unsplash(PHOTO_IDS.outdoorMarket),
} as const

// ========================================
// 產品圖片
// ========================================

export const PRODUCT_IMAGES = {
  // === 茶葉類產品（6 種不同圖片） ===
  /** 阿里山高山烏龍茶 - 茶杯品茗 */
  alishanOolong: unsplash(PHOTO_IDS.teaCup, THUMBNAIL_SIZE),
  /** 梅山金萱茶 - 茶具組 */
  jinxuan: unsplash(PHOTO_IDS.teaSet, THUMBNAIL_SIZE),
  /** 日月潭紅玉紅茶 - 茶壺 */
  sunMoonLake: unsplash(PHOTO_IDS.teaPot, THUMBNAIL_SIZE),
  /** 凍頂烏龍茶 - 茶道 */
  dongding: unsplash(PHOTO_IDS.teaCeremony, THUMBNAIL_SIZE),
  /** 東方美人茶 - 中式茶 */
  orientalBeauty: unsplash(PHOTO_IDS.chineseTea, THUMBNAIL_SIZE),
  /** 四季春茶 - 綠茶 */
  sijichun: unsplash(PHOTO_IDS.greenTea, THUMBNAIL_SIZE),

  // === 蜂蜜類產品（使用茶相關圖片） ===
  /** 蜂蜜產品 - 茶杯 */
  honey: unsplash(PHOTO_IDS.teaCup, THUMBNAIL_SIZE),
  /** 野生蜂蜜 - 茶具組 */
  wildHoney: unsplash(PHOTO_IDS.teaSet, THUMBNAIL_SIZE),

  // === 農產品類（使用茶園圖片） ===
  /** 蔬菜類 - 茶園 */
  vegetables: unsplash(PHOTO_IDS.teaPlantation, THUMBNAIL_SIZE),
  /** 水果類 - 茶園景觀 */
  fruits: unsplash(PHOTO_IDS.teaLandscape, THUMBNAIL_SIZE),
  /** 醬料類 - 茶葉特寫 */
  sauces: unsplash(PHOTO_IDS.teaLeaves, THUMBNAIL_SIZE),
  /** 乾貨類 - 茶杯 */
  driedGoods: unsplash(PHOTO_IDS.teaCup, THUMBNAIL_SIZE),

  // === 手工藝品類 ===
  /** 茶盤 - 茶具組 */
  teaTray: unsplash(PHOTO_IDS.teaSet, THUMBNAIL_SIZE),
  /** 茶具組 - 茶壺 */
  teaSetProduct: unsplash(PHOTO_IDS.teaPot, THUMBNAIL_SIZE),

  // === 通用 ===
  /** 茶葉產品通用圖 */
  tea: unsplash(PHOTO_IDS.teaCup, THUMBNAIL_SIZE),
  /** 農產品通用圖 */
  produce: unsplash(PHOTO_IDS.teaPlantation, THUMBNAIL_SIZE),
  /** 手工藝品通用圖 */
  crafts: unsplash(PHOTO_IDS.teaSet, THUMBNAIL_SIZE),
} as const

// ========================================
// Hero 背景圖片（高解析度）
// ========================================

const HERO_SIZE = 'w=1920&h=1080&fit=crop'

export const HERO_IMAGES = {
  /** 首頁輪播圖片 */
  home: [
    unsplash(PHOTO_IDS.teaPlantation, HERO_SIZE), // 茶園梯田
    unsplash(PHOTO_IDS.teaLandscape, HERO_SIZE), // 茶園景觀
    unsplash(PHOTO_IDS.teaSet, HERO_SIZE), // 茶具品茗
  ],

  /** 觀光果園 Hero 背景 */
  farmTours: unsplash(PHOTO_IDS.teaCup, HERO_SIZE),
} as const

// ========================================
// 特色卡片圖片
// ========================================

const FEATURE_SIZE = 'w=400&h=300&fit=crop'

export const FEATURE_CARD_IMAGES = {
  /** 自然農法 - 茶葉 */
  naturalFarming: unsplash(PHOTO_IDS.teaLeaves, FEATURE_SIZE),

  /** 品質認證 - 茶具 */
  qualityCertified: unsplash(PHOTO_IDS.teaSet, FEATURE_SIZE),

  /** 農場體驗 - 茶園 */
  farmExperience: unsplash(PHOTO_IDS.teaPlantation, FEATURE_SIZE),

  /** 永續經營 - 森林 */
  sustainability: unsplash(PHOTO_IDS.forest, FEATURE_SIZE),
} as const

// ========================================
// 匯出所有圖片常數（方便一次 import）
// ========================================

export const SEED_IMAGES = {
  farmTours: FARM_TOUR_IMAGES,
  locations: LOCATION_IMAGES,
  products: PRODUCT_IMAGES,
  hero: HERO_IMAGES,
  featureCards: FEATURE_CARD_IMAGES,
} as const
