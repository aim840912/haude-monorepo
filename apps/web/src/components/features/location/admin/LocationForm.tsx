import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useLocationForm } from './useLocationForm'
import {
  BasicInfoSection,
  ContactInfoSection,
  BusinessInfoSection,
  TransportInfoSection,
  FeaturesSection,
  MediaSection,
  StatusSection,
} from './LocationFormFields'
import type { LocationFormProps } from './LocationForm.types'

/**
 * 販售據點表單元件
 *
 * 支援新增和編輯兩種模式：
 * - create: 建立新據點
 * - edit: 編輯現有據點
 *
 * 架構說明：
 * - useLocationForm: 管理表單狀態和邏輯
 * - LocationFormFields: 各區塊的 UI 元件
 */
export function LocationForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: LocationFormProps) {
  const {
    values,
    setValue,
    setFieldTouched,
    getFieldError,
    hasErrors,
    handleSubmit,
  } = useLocationForm({ mode, initialData, onSubmit })

  // 共用 props
  const fieldProps = { values, setValue, setFieldTouched, getFieldError }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 基本資訊 */}
      <BasicInfoSection {...fieldProps} />

      {/* 聯絡資訊 */}
      <ContactInfoSection {...fieldProps} />

      {/* 營業資訊 */}
      <BusinessInfoSection {...fieldProps} />

      {/* 交通資訊 */}
      <TransportInfoSection values={values} setValue={setValue} />

      {/* 特色與特產 */}
      <FeaturesSection values={values} setValue={setValue} />

      {/* 座標與圖片 */}
      <MediaSection
        values={values}
        setValue={setValue}
        initialImage={initialData?.image}
      />

      {/* 狀態設定 */}
      <StatusSection values={values} setValue={setValue} />

      {/* 操作按鈕 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-secondary order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting || hasErrors}
          className="btn btn-primary order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {mode === 'create' ? '建立中...' : '儲存中...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? '建立據點' : '儲存變更'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
