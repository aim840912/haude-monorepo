/**
 * Toast 統一匯出
 *
 * @deprecated 此目錄已棄用，請直接從 '@/components/ui/Toast' 匯入
 * 此檔案僅為向後相容保留
 */

// 重新匯出簡化版本
export { ToastProvider, useToast } from '../../Toast'
export type {
  Toast,
  ToastType,
  ToastPosition,
  ToastAction,
  ToastContextType,
} from '../../Toast'
