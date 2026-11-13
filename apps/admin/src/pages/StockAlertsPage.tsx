import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { productsApi, stockAlertsApi } from '../services/api'
import { useToast } from '../components/ui/Toast'
import logger from '../lib/logger'

/** API 建立設定時的預設門檻（notifications.service upsertStockAlertSetting） */
const DEFAULT_THRESHOLD = 10

interface ProductStock {
  id: string
  name: string
  stock: number
}

interface Row {
  product: ProductStock
  /** 還沒設定過的商品不會被檢查 */
  configured: boolean
  isEnabled: boolean
  threshold: number
}

/**
 * 預警設定只存「設定過的商品」，沒設定的完全不檢查。
 * 所以這裡列出全部商品，再把已有的設定合併進來。
 */
function mergeRows(
  products: ProductStock[],
  settings: { productId: string; threshold: number; isEnabled: boolean }[],
): Row[] {
  const byProduct = new Map(settings.map((s) => [s.productId, s]))
  return products.map((product) => {
    const setting = byProduct.get(product.id)
    return {
      product,
      configured: !!setting,
      isEnabled: setting?.isEnabled ?? false,
      threshold: setting?.threshold ?? DEFAULT_THRESHOLD,
    }
  })
}

export function StockAlertsPage() {
  const { success, error: showError } = useToast()
  const [rows, setRows] = useState<Row[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const fetchRows = useCallback(async () => {
    try {
      setIsLoading(true)
      setLoadError(null)
      const [productsRes, settingsRes] = await Promise.all([
        productsApi.getAllAdmin(),
        stockAlertsApi.getAll(),
      ])
      setRows(mergeRows(productsRes.data as ProductStock[], settingsRes.data))
      setDrafts({})
    } catch (err) {
      logger.error('取得庫存預警設定失敗', { error: err })
      setLoadError('無法載入庫存預警設定')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const save = async (row: Row, changes: { threshold?: number; isEnabled?: boolean }) => {
    setSavingId(row.product.id)
    try {
      await stockAlertsApi.update(row.product.id, changes)
      setRows((prev) =>
        prev.map((r) =>
          r.product.id === row.product.id ? { ...r, ...changes, configured: true } : r,
        ),
      )
      setDrafts((prev) => {
        const next = { ...prev }
        delete next[row.product.id]
        return next
      })
      success('已儲存', row.product.name)
    } catch (err) {
      logger.error('更新庫存預警失敗', { error: err })
      showError('儲存失敗', '請稍後再試')
    } finally {
      setSavingId(null)
    }
  }

  const saveThreshold = (row: Row) => {
    const value = Number(drafts[row.product.id])
    if (!Number.isInteger(value) || value < 0) {
      showError('門檻要是 0 以上的整數')
      return
    }
    // 第一次設定時一起啟用：設了門檻卻沒啟用，等於沒設
    save(row, row.configured ? { threshold: value } : { threshold: value, isEnabled: true })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 mb-4">{loadError}</p>
        <button
          type="button"
          onClick={fetchRows}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <RefreshCw className="w-4 h-4" />
          重試
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">庫存預警</h1>
          <p className="mt-1 text-sm text-gray-500">
            啟用後，庫存因下單或手動修改而低於門檻時，右上角的通知會提醒（同一商品 24 小時內只提醒一次）。
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRows}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded-lg"
          aria-label="重新整理"
          title="重新整理"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        {rows.length === 0 ? (
          <div className="text-center py-12 text-gray-500">尚無商品</div>
        ) : (
          <table className="w-full min-w-[560px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['商品', '目前庫存', '預警門檻', '啟用'].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row) => {
                const id = row.product.id
                const low = row.isEnabled && row.product.stock < row.threshold
                const draft = drafts[id]
                const saving = savingId === id
                return (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-900">{row.product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={low ? 'text-red-600 font-medium' : 'text-gray-900'}>
                        {row.product.stock}
                      </span>
                      {low && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                          低於門檻
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`threshold-${id}`}>
                          {row.product.name} 的預警門檻
                        </label>
                        <input
                          id={`threshold-${id}`}
                          name={`threshold-${id}`}
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={draft ?? String(row.threshold)}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [id]: e.target.value }))}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        {draft !== undefined && draft !== String(row.threshold) && (
                          <button
                            type="button"
                            onClick={() => saveThreshold(row)}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                          >
                            儲存
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={row.isEnabled}
                        aria-label={`${row.product.name} 的庫存預警`}
                        onClick={() => save(row, { isEnabled: !row.isEnabled, threshold: row.threshold })}
                        disabled={saving}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-50 ${
                          row.isEnabled ? 'bg-green-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                            row.isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
