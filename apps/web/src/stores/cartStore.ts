import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/services/api'
import { isAuthenticated } from '@/stores/authStore'
import type { Product } from '@/types/product'

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image?: string
  maxQuantity: number
}

interface CartState {
  items: CartItem[]
  isLoaded: boolean
  isLoading: boolean

  // Actions
  addItem: (product: Product, quantity?: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  getItemQuantity: (productId: string) => number

  // 後端同步
  syncWithBackend: () => Promise<void>
  mergeLocalToBackend: () => Promise<void>

  // Computed values
  totalItems: number
  totalPrice: number
}

// 轉換 API 回傳的購物車資料
// 注意：isAuthenticated 已從 authStore 統一導入，確保認證檢查邏輯一致
const mapApiCartToItems = (apiCart: {
  items: Array<{
    id: string
    productId: string
    quantity: number
    product: {
      id: string
      name: string
      price: number
      stock: number
      image: string | null
    }
  }>
}): CartItem[] => {
  return apiCart.items.map(item => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    image: item.product.image || undefined,
    maxQuantity: item.product.stock,
  }))
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoaded: false,
      isLoading: false,

      /**
       * 新增商品到購物車
       */
      addItem: async (product, quantity = 1) => {
        // 取得圖片 URL（處理前後端欄位命名不一致）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const images = (product as any).images || product.productImages || []
        const imageUrl = images[0]?.storageUrl || images[0]?.storage_url

        // 取得庫存（處理前後端欄位命名不一致）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stock = (product as any).stock ?? product.inventory ?? 99

        if (isAuthenticated()) {
          // 已登入：呼叫後端 API
          try {
            set({ isLoading: true })
            const { data } = await api.post('/cart/items', {
              productId: product.id,
              quantity,
            })
            set({ items: mapApiCartToItems(data), isLoading: false })
          } catch (error) {
            console.error('加入購物車失敗:', error)
            set({ isLoading: false })
            throw error
          }
        } else {
          // 未登入：本地儲存
          const { items } = get()
          const existingIndex = items.findIndex(item => item.productId === product.id)

          const cartItem: CartItem = {
            id: product.id, // 本地模式使用 productId 作為 id
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity,
            image: imageUrl,
            maxQuantity: stock,
          }

          if (existingIndex >= 0) {
            const updatedItems = [...items]
            const newQuantity = Math.min(
              updatedItems[existingIndex].quantity + quantity,
              cartItem.maxQuantity
            )
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: newQuantity,
            }
            set({ items: updatedItems })
          } else {
            set({ items: [...items, cartItem] })
          }
        }
      },

      /**
       * 從購物車移除商品
       */
      removeItem: async (productId) => {
        if (isAuthenticated()) {
          try {
            set({ isLoading: true })
            const { data } = await api.delete(`/cart/items/${productId}`)
            set({ items: mapApiCartToItems(data), isLoading: false })
          } catch (error) {
            console.error('移除商品失敗:', error)
            set({ isLoading: false })
            throw error
          }
        } else {
          set(state => ({
            items: state.items.filter(item => item.productId !== productId),
          }))
        }
      },

      /**
       * 更新購物車商品數量
       */
      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          return get().removeItem(productId)
        }

        if (isAuthenticated()) {
          try {
            set({ isLoading: true })
            const { data } = await api.put(`/cart/items/${productId}`, { quantity })
            set({ items: mapApiCartToItems(data), isLoading: false })
          } catch (error) {
            console.error('更新數量失敗:', error)
            set({ isLoading: false })
            throw error
          }
        } else {
          set(state => ({
            items: state.items.map(item =>
              item.productId === productId
                ? { ...item, quantity: Math.min(quantity, item.maxQuantity) }
                : item
            ),
          }))
        }
      },

      /**
       * 清空購物車
       */
      clearCart: async () => {
        if (isAuthenticated()) {
          try {
            set({ isLoading: true })
            await api.delete('/cart')
            set({ items: [], isLoading: false })
          } catch (error) {
            console.error('清空購物車失敗:', error)
            set({ isLoading: false })
            throw error
          }
        } else {
          set({ items: [] })
        }
      },

      /**
       * 取得指定商品在購物車中的數量
       */
      getItemQuantity: (productId) => {
        const item = get().items.find(i => i.productId === productId)
        return item?.quantity ?? 0
      },

      /**
       * 從後端同步購物車資料
       */
      syncWithBackend: async () => {
        if (!isAuthenticated()) return

        try {
          set({ isLoading: true })
          const { data } = await api.get('/cart')
          set({ items: mapApiCartToItems(data), isLoading: false, isLoaded: true })
        } catch (error) {
          console.error('同步購物車失敗:', error)
          set({ isLoading: false, isLoaded: true })
        }
      },

      /**
       * 登入後：將本地購物車合併到後端
       */
      mergeLocalToBackend: async () => {
        if (!isAuthenticated()) return

        const { items } = get()
        if (items.length === 0) {
          // 沒有本地購物車，直接從後端同步
          return get().syncWithBackend()
        }

        try {
          set({ isLoading: true })

          // 將每個本地商品加到後端購物車
          for (const item of items) {
            try {
              await api.post('/cart/items', {
                productId: item.productId,
                quantity: item.quantity,
              })
            } catch {
              // 單一商品失敗不中斷整體流程
              console.warn(`合併商品 ${item.name} 失敗`)
            }
          }

          // 同步最新資料
          await get().syncWithBackend()
        } catch (error) {
          console.error('合併購物車失敗:', error)
          set({ isLoading: false })
        }
      },

      // 注意：totalItems 和 totalPrice 改用 selector hooks (useTotalItems, useTotalPrice)
      // 不在 store 中使用 getter，因為會與 persist middleware 的 merge 功能衝突
      totalItems: 0,
      totalPrice: 0,
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
      }),
      merge: (persisted, current) => {
        const persistedState = persisted as { items?: CartItem[] } | undefined
        return {
          ...current,
          items: persistedState?.items ?? [],
        }
      },
    }
  )
)

// Selector hooks for computed values
export const useTotalItems = () => useCartStore(state =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)
)

export const useTotalPrice = () => useCartStore(state =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
)
