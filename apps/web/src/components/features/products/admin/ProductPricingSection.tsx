import { cn } from '@/lib/utils'
import { type FormSectionProps, PRICE_UNITS } from './ProductForm.types'

/**
 * 產品價格與庫存區塊
 *
 * 包含：售價、庫存、價格單位、單位數量
 */
export function ProductPricingSection({
  values,
  setValue,
  setFieldTouched,
  getFieldError,
}: FormSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">價格與庫存</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 售價 */}
        <div>
          <label htmlFor="price" className="label">
            售價 (NT$) <span className="text-red-500">*</span>
          </label>
          <input
            id="price"
            type="number"
            value={values.price}
            onChange={e => setValue('price', e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={() => setFieldTouched('price')}
            className={cn('input', getFieldError('price') && 'border-red-500')}
            placeholder="0"
            min="0"
            step="1"
          />
          {getFieldError('price') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('price')}</p>
          )}
        </div>

        {/* 庫存 */}
        <div>
          <label htmlFor="inventory" className="label">
            庫存數量 <span className="text-red-500">*</span>
          </label>
          <input
            id="inventory"
            type="number"
            value={values.inventory}
            onChange={e => setValue('inventory', e.target.value === '' ? '' : Number(e.target.value))}
            onBlur={() => setFieldTouched('inventory')}
            className={cn('input', getFieldError('inventory') && 'border-red-500')}
            placeholder="0"
            min="0"
            step="1"
          />
          {getFieldError('inventory') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('inventory')}</p>
          )}
        </div>

        {/* 價格單位 */}
        <div>
          <label htmlFor="priceUnit" className="label">
            價格單位
          </label>
          <select
            id="priceUnit"
            value={values.priceUnit}
            onChange={e => setValue('priceUnit', e.target.value)}
            className="input"
          >
            {PRICE_UNITS.map(unit => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        {/* 單位數量 */}
        <div>
          <label htmlFor="unitQuantity" className="label">
            單位數量
          </label>
          <input
            id="unitQuantity"
            type="number"
            value={values.unitQuantity}
            onChange={e => setValue('unitQuantity', e.target.value === '' ? '' : Number(e.target.value))}
            className="input"
            placeholder="如: 600 (克)"
            min="0"
          />
        </div>
      </div>
    </section>
  )
}
