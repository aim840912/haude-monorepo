import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FormSectionProps } from './ProductForm.types'

interface ProductPromotionSectionProps extends FormSectionProps {
  showPromotion: boolean
  setShowPromotion: (show: boolean) => void
}

/**
 * 產品促銷設定區塊
 *
 * 包含：促銷開關、原價、促銷結束日期
 */
export function ProductPromotionSection({
  values,
  setValue,
  setFieldTouched,
  getFieldError,
  showPromotion,
  setShowPromotion,
}: ProductPromotionSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm">
      <button
        type="button"
        onClick={() => setShowPromotion(!showPromotion)}
        className="w-full p-6 flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-gray-900">促銷設定</h2>
        {showPromotion ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {showPromotion && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
          {/* 促銷開關 */}
          <div className="flex items-center gap-3">
            <input
              id="isOnSale"
              type="checkbox"
              checked={values.isOnSale}
              onChange={e => setValue('isOnSale', e.target.checked)}
              className="w-4 h-4 text-primary-green border-gray-300 rounded focus:ring-primary-green"
            />
            <label htmlFor="isOnSale" className="text-sm font-medium text-gray-700">
              啟用促銷活動
            </label>
          </div>

          {values.isOnSale && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-7">
              {/* 原價 */}
              <div>
                <label htmlFor="originalPrice" className="label">
                  原價 (NT$) <span className="text-red-500">*</span>
                </label>
                <input
                  id="originalPrice"
                  type="number"
                  value={values.originalPrice}
                  onChange={e => setValue('originalPrice', e.target.value === '' ? '' : Number(e.target.value))}
                  onBlur={() => setFieldTouched('originalPrice')}
                  className={cn('input', getFieldError('originalPrice') && 'border-red-500')}
                  placeholder="0"
                  min="0"
                  step="1"
                />
                {getFieldError('originalPrice') && (
                  <p className="mt-1 text-sm text-red-500">{getFieldError('originalPrice')}</p>
                )}
              </div>

              {/* 促銷結束日期 */}
              <div>
                <label htmlFor="saleEndDate" className="label">
                  促銷結束日期 <span className="text-red-500">*</span>
                </label>
                <input
                  id="saleEndDate"
                  type="date"
                  value={values.saleEndDate}
                  onChange={e => setValue('saleEndDate', e.target.value)}
                  onBlur={() => setFieldTouched('saleEndDate')}
                  className={cn('input', getFieldError('saleEndDate') && 'border-red-500')}
                  min={new Date().toISOString().split('T')[0]}
                />
                {getFieldError('saleEndDate') && (
                  <p className="mt-1 text-sm text-red-500">{getFieldError('saleEndDate')}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
