import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { paymentsApi } from '../services/api'
import type { Payment } from '../hooks/usePayments'
import logger from '../lib/logger'

interface RefundModalProps {
  payment: Payment
  onClose: () => void
  onSuccess: () => void
}

export function RefundModal({ payment, onClose, onSuccess }: RefundModalProps) {
  const [type, setType] = useState<'FULL' | 'PARTIAL'>('FULL')
  const [amount, setAmount] = useState<string>('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refundAmount = type === 'FULL' ? payment.amount : Number(amount) || 0
  const isValid =
    type === 'FULL' || (refundAmount > 0 && refundAmount <= payment.amount)

  const isManualRefund = payment.paymentType !== 'CREDIT'

  const handleSubmit = async () => {
    if (!isValid) return
    setIsSubmitting(true)
    setError(null)

    try {
      await paymentsApi.processRefund({
        paymentId: payment.id,
        type,
        amount: type === 'PARTIAL' ? refundAmount : undefined,
        reason: reason || undefined,
      })
      onSuccess()
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response
                ?.data?.message || '退款處理失敗'
      setError(message)
      logger.error('[RefundModal] 退款失敗', { error: err })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">退款處理</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* 付款資訊 */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">訂單編號</span>
              <span className="font-mono text-gray-900">
                {payment.orderNumber}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">付款金額</span>
              <span className="font-semibold text-gray-900">
                NT$ {payment.amount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">付款方式</span>
              <span className="text-gray-900">{payment.paymentType}</span>
            </div>
          </div>

          {/* ATM/CVS 提示 */}
          {isManualRefund && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
              <p className="text-yellow-800">
                {payment.paymentType} 退款需人工處理。系統將建立退款記錄，
                請於線下完成匯款後在退款記錄中點擊「確認」。
              </p>
            </div>
          )}

          {/* 退款類型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              退款類型
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="FULL"
                  checked={type === 'FULL'}
                  onChange={() => setType('FULL')}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">全額退款</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="refundType"
                  value="PARTIAL"
                  checked={type === 'PARTIAL'}
                  onChange={() => setType('PARTIAL')}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">部分退款</span>
              </label>
            </div>
          </div>

          {/* 部分退款金額 */}
          {type === 'PARTIAL' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                退款金額
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  NT$
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  max={payment.amount}
                  placeholder="請輸入退款金額"
                  className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              {Number(amount) > payment.amount && (
                <p className="mt-1 text-xs text-red-600">
                  退款金額不可超過原付款金額
                </p>
              )}
            </div>
          )}

          {/* 退款原因 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              退款原因（選填）
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="請輸入退款原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 退款摘要 */}
          <div className="bg-green-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-green-800">退款金額</span>
              <span className="text-lg font-bold text-green-900">
                NT$ {refundAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '處理中...' : '確認退款'}
          </button>
        </div>
      </div>
    </div>
  )
}
