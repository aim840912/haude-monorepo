import { Settings, Wrench } from 'lucide-react'

export function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">系統設定</h1>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <Wrench className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">功能開發中</h2>
          <p className="text-gray-500 text-center max-w-md mb-6">
            系統設定功能正在開發中，未來將提供商店資訊、通知設定、安全設定等功能。
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Settings className="w-4 h-4" />
            <span>敬請期待</span>
          </div>
        </div>
      </div>
    </div>
  )
}
