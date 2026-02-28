import type { ProductFormValues } from './ProductForm.types'

interface ProductStatusSectionProps {
  isActive: boolean
  setValue: <K extends keyof ProductFormValues>(field: K, value: ProductFormValues[K]) => void
}

/**
 * 產品上架狀態區塊
 */
export function ProductStatusSection({ isActive, setValue }: ProductStatusSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">上架狀態</h2>
          <p className="text-sm text-gray-500">
            {isActive ? '產品已上架，顧客可以看到此產品' : '產品已下架，顧客無法看到此產品'}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setValue('isActive', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-[transform] peer-checked:bg-green-500"></div>
        </label>
      </div>
    </section>
  )
}
