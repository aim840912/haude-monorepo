import { cn } from '@/lib/utils'
import { type FormSectionProps, PRODUCT_CATEGORIES } from './ProductForm.types'

/**
 * 產品基本資訊區塊
 *
 * 包含：產品名稱、類別、描述
 */
export function ProductBasicInfoSection({
  values,
  setValue,
  setFieldTouched,
  getFieldError,
}: FormSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">基本資訊</h2>
      <div className="space-y-4">
        {/* 產品名稱 */}
        <div>
          <label htmlFor="name" className="label">
            產品名稱 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={values.name}
            onChange={e => setValue('name', e.target.value)}
            onBlur={() => setFieldTouched('name')}
            className={cn('input', getFieldError('name') && 'border-red-500')}
            placeholder="請輸入產品名稱"
          />
          {getFieldError('name') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('name')}</p>
          )}
        </div>

        {/* 類別選擇 */}
        <div>
          <label htmlFor="category" className="label">
            產品類別 <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            value={values.category}
            onChange={e => setValue('category', e.target.value)}
            onBlur={() => setFieldTouched('category')}
            className={cn('input', getFieldError('category') && 'border-red-500')}
          >
            <option value="">請選擇類別</option>
            {PRODUCT_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {getFieldError('category') && (
            <p className="mt-1 text-sm text-red-500">{getFieldError('category')}</p>
          )}
        </div>

        {/* 產品描述 */}
        <div>
          <label htmlFor="description" className="label">
            產品描述
          </label>
          <textarea
            id="description"
            value={values.description}
            onChange={e => setValue('description', e.target.value)}
            className="input min-h-[100px]"
            placeholder="請輸入產品描述（選填）"
            rows={4}
          />
        </div>
      </div>
    </section>
  )
}
