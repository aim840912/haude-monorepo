import type { Product } from '@/types/product'

/**
 * Mock 產品資料
 * 用於開發模式下後端不可用時的 fallback
 *
 * 涵蓋測試情境：
 * - 有折扣商品（originalPrice > price）
 * - 缺貨商品（inventory = 0）
 * - 不同價格範圍
 * - 4 種類別
 */
export const mockProducts: Product[] = [
  // === 蜂蜜類 ===
  {
    id: 'mock-prod-1',
    name: '有機蜂蜜',
    description: '來自阿里山的純天然有機蜂蜜，無添加、無加工。蜜香濃郁，口感滑順，是送禮自用的最佳選擇。',
    category: '蜂蜜',
    price: 580,
    originalPrice: 680,
    priceUnit: '罐',
    unitQuantity: 500,
    isOnSale: true,
    inventory: 50,
    isActive: true,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
    productImages: [
      {
        id: 'mock-img-1',
        entity_id: 'mock-prod-1',
        storage_url: 'https://placehold.co/400x400/fbbf24/ffffff?text=Honey',
        file_path: '/products/honey-organic.jpg',
        display_position: 0,
        size: 'large',
        module: 'products',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
    ],
  },
  {
    id: 'mock-prod-2',
    name: '龍眼蜜',
    description: '台南東山區龍眼花期採收的純龍眼蜜，色澤金黃透亮，風味獨特。',
    category: '蜂蜜',
    price: 450,
    priceUnit: '罐',
    unitQuantity: 350,
    inventory: 30,
    isActive: true,
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-11-15T00:00:00Z',
    productImages: [
      {
        id: 'mock-img-2',
        entity_id: 'mock-prod-2',
        storage_url: 'https://placehold.co/400x400/f59e0b/ffffff?text=Longan+Honey',
        file_path: '/products/honey-longan.jpg',
        display_position: 0,
        size: 'large',
        module: 'products',
        created_at: '2024-02-20T00:00:00Z',
        updated_at: '2024-02-20T00:00:00Z',
      },
    ],
  },

  // === 茶葉類 ===
  {
    id: 'mock-prod-3',
    name: '高山烏龍茶',
    description: '來自海拔 1500 公尺以上的阿里山茶區，茶湯清澈，入口回甘，是台灣茶的代表作。',
    category: '茶葉',
    price: 1200,
    originalPrice: 1500,
    priceUnit: '包',
    unitQuantity: 150,
    isOnSale: true,
    inventory: 25,
    isActive: true,
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-12-10T00:00:00Z',
    productImages: [
      {
        id: 'mock-img-3',
        entity_id: 'mock-prod-3',
        storage_url: 'https://placehold.co/400x400/2e7d32/ffffff?text=Oolong+Tea',
        file_path: '/products/tea-oolong.jpg',
        display_position: 0,
        size: 'large',
        module: 'products',
        created_at: '2024-03-10T00:00:00Z',
        updated_at: '2024-03-10T00:00:00Z',
      },
    ],
  },
  {
    id: 'mock-prod-4',
    name: '日月潭紅茶',
    description: '南投日月潭特有的紅玉紅茶（台茶18號），帶有天然肉桂與薄荷香氣。',
    category: '茶葉',
    price: 800,
    priceUnit: '包',
    unitQuantity: 100,
    inventory: 0, // 缺貨測試
    isActive: true,
    createdAt: '2024-04-05T00:00:00Z',
    updatedAt: '2024-10-20T00:00:00Z',
    productImages: [
      {
        id: 'mock-img-4',
        entity_id: 'mock-prod-4',
        storage_url: 'https://placehold.co/400x400/7c2d12/ffffff?text=Black+Tea',
        file_path: '/products/tea-black.jpg',
        display_position: 0,
        size: 'large',
        module: 'products',
        created_at: '2024-04-05T00:00:00Z',
        updated_at: '2024-04-05T00:00:00Z',
      },
    ],
  },

  // === 農產品類 ===
  {
    id: 'mock-prod-5',
    name: '有機蔬菜箱',
    description: '每週配送新鮮有機蔬菜，內含 8-10 種當季蔬菜，產地直送，新鮮無農藥。',
    category: '農產品',
    price: 650,
    priceUnit: '箱',
    inventory: 100,
    isActive: true,
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-12-14T00:00:00Z',
    productImages: [
      {
        id: 'mock-img-5',
        entity_id: 'mock-prod-5',
        storage_url: 'https://placehold.co/400x400/16a34a/ffffff?text=Veggie+Box',
        file_path: '/products/veggie-box.jpg',
        display_position: 0,
        size: 'large',
        module: 'products',
        created_at: '2024-05-01T00:00:00Z',
        updated_at: '2024-05-01T00:00:00Z',
      },
    ],
  },
  {
    id: 'mock-prod-6',
    name: '愛文芒果',
    description: '屏東枋山愛文芒果，果肉細緻多汁，甜度高達 15 度以上，夏季限定。',
    category: '農產品',
    price: 1800,
    originalPrice: 2200,
    priceUnit: '箱',
    unitQuantity: 10,
    isOnSale: true,
    inventory: 15,
    isActive: true,
    createdAt: '2024-06-15T00:00:00Z',
    updatedAt: '2024-07-01T00:00:00Z',
    productImages: [
      {
        id: 'mock-img-6',
        entity_id: 'mock-prod-6',
        storage_url: 'https://placehold.co/400x400/ea580c/ffffff?text=Mango',
        file_path: '/products/mango.jpg',
        display_position: 0,
        size: 'large',
        module: 'products',
        created_at: '2024-06-15T00:00:00Z',
        updated_at: '2024-06-15T00:00:00Z',
      },
    ],
  },

  // === 手工藝品類 ===
  {
    id: 'mock-prod-7',
    name: '手工竹編籃',
    description: '南投竹山師傅手工編織，採用台灣桂竹，透氣耐用，可作為收納或裝飾使用。',
    category: '手工藝品',
    price: 1500,
    priceUnit: '個',
    inventory: 8,
    isActive: true,
    createdAt: '2024-07-20T00:00:00Z',
    updatedAt: '2024-11-01T00:00:00Z',
    productImages: [
      {
        id: 'mock-img-7',
        entity_id: 'mock-prod-7',
        storage_url: 'https://placehold.co/400x400/78350f/ffffff?text=Bamboo+Basket',
        file_path: '/products/bamboo-basket.jpg',
        display_position: 0,
        size: 'large',
        module: 'products',
        created_at: '2024-07-20T00:00:00Z',
        updated_at: '2024-07-20T00:00:00Z',
      },
    ],
  },
  {
    id: 'mock-prod-8',
    name: '鶯歌陶瓷茶具組',
    description: '新北鶯歌在地陶藝師作品，包含茶壺一只、茶杯四只，釉色溫潤，適合品茶雅士。',
    category: '手工藝品',
    price: 2800,
    originalPrice: 3200,
    priceUnit: '組',
    isOnSale: true,
    inventory: 5,
    isActive: true,
    createdAt: '2024-08-10T00:00:00Z',
    updatedAt: '2024-12-05T00:00:00Z',
    productImages: [
      {
        id: 'mock-img-8',
        entity_id: 'mock-prod-8',
        storage_url: 'https://placehold.co/400x400/64748b/ffffff?text=Tea+Set',
        file_path: '/products/tea-set.jpg',
        display_position: 0,
        size: 'large',
        module: 'products',
        created_at: '2024-08-10T00:00:00Z',
        updated_at: '2024-08-10T00:00:00Z',
      },
    ],
  },
]

/**
 * Mock 類別清單
 */
export const mockCategories: string[] = ['蜂蜜', '茶葉', '農產品', '手工藝品']

/**
 * 根據 ID 取得單一 Mock 產品
 */
export function getMockProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id)
}
