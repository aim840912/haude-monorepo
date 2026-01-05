import React, { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductQuantitySelectorProps {
  /** 當前數量 */
  quantity: number
  /** 數量變更回調 */
  onQuantityChange: (quantity: number) => void
  /** 最大數量限制 */
  max?: number
}

/**
 * 產品數量選擇器元件
 *
 * 提供增減按鈕和數量輸入框，支援鍵盤操作和動畫效果
 */
export const ProductQuantitySelector = React.memo<ProductQuantitySelectorProps>(
  ({ quantity, onQuantityChange, max = 99 }) => {
    const [isChanging, setIsChanging] = useState(false)

    const handleQuantityChange = (newQuantity: number) => {
      const clampedQuantity = Math.min(Math.max(1, newQuantity), max)
      setIsChanging(true)
      onQuantityChange(clampedQuantity)
      setTimeout(() => setIsChanging(false), 200)
    }

    const incrementQuantity = () => {
      if (quantity < max) {
        handleQuantityChange(quantity + 1)
      }
    }

    const decrementQuantity = () => {
      if (quantity > 1) {
        handleQuantityChange(quantity - 1)
      }
    }

    return (
      <div className="flex items-center justify-between mb-6">
        <span className="text-gray-800 font-medium text-sm md:text-base">選擇數量</span>
        <div className="flex items-center bg-white rounded-xl shadow-lg border border-gray-200">
          <button
            type="button"
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-l-xl transition-all duration-200',
              'hover:bg-gray-50 active:scale-95',
              quantity <= 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-blue-600'
            )}
            aria-label="減少數量"
          >
            <Minus className="w-4 h-4" />
          </button>
          <input
            type="number"
            min="1"
            max={max}
            value={quantity}
            onChange={e => {
              const newValue = Math.max(1, parseInt(e.target.value) || 1)
              handleQuantityChange(newValue)
            }}
            onKeyDown={e => {
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                incrementQuantity()
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                decrementQuantity()
              }
            }}
            className={cn(
              'w-16 h-10 text-center border-x border-gray-200 bg-transparent',
              'font-bold text-lg transition-all duration-200 outline-none',
              'focus:bg-blue-50 focus:text-blue-600',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              isChanging ? 'scale-110 text-blue-600' : 'text-gray-900'
            )}
            aria-label="產品數量"
          />
          <button
            type="button"
            onClick={incrementQuantity}
            disabled={quantity >= max}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-r-xl transition-all duration-200',
              'hover:bg-gray-50 active:scale-95',
              quantity >= max
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-blue-600'
            )}
            aria-label="增加數量"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }
)

ProductQuantitySelector.displayName = 'ProductQuantitySelector'
