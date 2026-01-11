import { cn } from '@/lib/utils'
import { usePayment } from '@/hooks/usePayment'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'

interface PaymentButtonProps {
  /** 訂單 ID */
  orderId: string
  /** 付款方式（可選，預設為信用卡） */
  paymentMethod?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 自定義類名 */
  className?: string
  /** 付款完成後的回調（可選，通常頁面會被導向） */
  onSuccess?: () => void
  /** 付款失敗的回調 */
  onError?: (error: string) => void
}

/**
 * 付款按鈕元件
 *
 * 點擊後會：
 * 1. 呼叫後端 API 取得加密參數
 * 2. 自動提交表單到藍新付款頁面
 * 3. 用戶在藍新完成付款後會被導回
 *
 * @example
 * ```tsx
 * <PaymentButton
 *   orderId={order.id}
 *   disabled={order.paymentStatus === 'paid'}
 *   onError={(msg) => toast.error(msg)}
 * />
 * ```
 */
export function PaymentButton({
  orderId,
  paymentMethod,
  disabled = false,
  className,
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const { initiatePayment, isProcessing, error, clearError } = usePayment()

  const handleClick = async () => {
    clearError()
    const success = await initiatePayment(orderId, paymentMethod)
    if (success) {
      onSuccess?.()
    } else if (error) {
      onError?.(error)
    }
  }

  // 顯示錯誤時也觸發 callback
  if (error && onError) {
    onError(error)
  }

  const isDisabled = disabled || isProcessing

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        // 基礎樣式
        'w-full min-h-[48px] rounded-lg px-6 py-3',
        'flex items-center justify-center gap-2',
        'font-medium text-white',
        'transition-all duration-200',
        // 正常狀態 - 綠色背景
        'bg-[#4caf50] hover:bg-[#43a047]',
        // 禁用狀態
        isDisabled && 'opacity-60 cursor-not-allowed hover:bg-[#4caf50]',
        className
      )}
      aria-label={isProcessing ? '處理中' : '前往付款'}
    >
      {isProcessing ? (
        <>
          <LoadingSpinner size="sm" color="white" />
          <span>處理中...</span>
        </>
      ) : (
        <>
          <CreditCardIcon className="w-5 h-5" />
          <span>前往付款</span>
        </>
      )}
    </button>
  )
}

/**
 * 信用卡圖示
 */
function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}

/**
 * 付款狀態標籤
 */
export function PaymentStatusBadge({
  status,
  className,
}: {
  status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded'
  className?: string
}) {
  const statusConfig = {
    pending: { label: '待付款', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    paid: { label: '已付款', bgColor: 'bg-green-100', textColor: 'text-green-800' },
    failed: { label: '付款失敗', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    expired: { label: '已過期', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
    refunded: { label: '已退款', bgColor: 'bg-purple-100', textColor: 'text-purple-800' },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.bgColor,
        config.textColor,
        className
      )}
    >
      {config.label}
    </span>
  )
}
