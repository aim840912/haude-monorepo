import { useState } from 'react'
import { Save, Store, Bell, Shield, Palette } from 'lucide-react'

interface StoreSettings {
  storeName: string
  storeDescription: string
  contactEmail: string
  contactPhone: string
  address: string
}

interface NotificationSettings {
  emailNotifications: boolean
  orderAlerts: boolean
  lowStockAlerts: boolean
  marketingEmails: boolean
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'store' | 'notifications' | 'security' | 'appearance'>('store')

  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: '豪德製茶所',
    storeDescription: '專營台灣高山茶，以自然農法呈現四季最美的茶香滋味',
    contactEmail: 'contact@haude-tea.com',
    contactPhone: '05-123-4567',
    address: '嘉義縣梅山鄉太平村',
  })

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    orderAlerts: true,
    lowStockAlerts: true,
    marketingEmails: false,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // 模擬儲存
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    alert('設定已儲存')
  }

  const tabs = [
    { id: 'store' as const, label: '商店資訊', icon: Store },
    { id: 'notifications' as const, label: '通知設定', icon: Bell },
    { id: 'security' as const, label: '安全設定', icon: Shield },
    { id: 'appearance' as const, label: '外觀設定', icon: Palette },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">系統設定</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'store' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商店名稱
                </label>
                <input
                  type="text"
                  value={storeSettings.storeName}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  商店描述
                </label>
                <textarea
                  value={storeSettings.storeDescription}
                  onChange={(e) => setStoreSettings({ ...storeSettings, storeDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    聯絡信箱
                  </label>
                  <input
                    type="email"
                    value={storeSettings.contactEmail}
                    onChange={(e) => setStoreSettings({ ...storeSettings, contactEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    聯絡電話
                  </label>
                  <input
                    type="tel"
                    value={storeSettings.contactPhone}
                    onChange={(e) => setStoreSettings({ ...storeSettings, contactPhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  地址
                </label>
                <input
                  type="text"
                  value={storeSettings.address}
                  onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 max-w-2xl">
              {[
                { key: 'emailNotifications' as const, label: '電子郵件通知', description: '接收系統相關的電子郵件通知' },
                { key: 'orderAlerts' as const, label: '訂單提醒', description: '有新訂單時發送通知' },
                { key: 'lowStockAlerts' as const, label: '庫存警告', description: '商品庫存不足時發送警告' },
                { key: 'marketingEmails' as const, label: '行銷郵件', description: '接收促銷和行銷相關郵件' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings[item.key]}
                      onChange={(e) =>
                        setNotificationSettings({ ...notificationSettings, [item.key]: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  安全設定功能開發中，敬請期待。
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  變更密碼
                </label>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  變更密碼
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  兩步驟驗證
                </label>
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  設定兩步驟驗證
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6 max-w-2xl">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  外觀設定功能開發中，敬請期待。
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  主題色彩
                </label>
                <div className="flex gap-3">
                  {['green', 'blue', 'purple', 'orange'].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full bg-${color}-500 ring-2 ring-offset-2 ${
                        color === 'green' ? 'ring-green-500' : 'ring-transparent'
                      }`}
                      style={{
                        backgroundColor:
                          color === 'green'
                            ? '#22c55e'
                            : color === 'blue'
                            ? '#3b82f6'
                            : color === 'purple'
                            ? '#a855f7'
                            : '#f97316',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '儲存中...' : '儲存設定'}
          </button>
        </div>
      </div>
    </div>
  )
}
