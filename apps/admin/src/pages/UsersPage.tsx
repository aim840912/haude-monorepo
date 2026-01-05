import { Search, Eye, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'

type UserRole = 'user' | 'admin'
type UserStatus = 'active' | 'inactive' | 'banned'

interface MockUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  createdAt: string
  orderCount: number
}

// Mock data
const mockUsers: MockUser[] = [
  { id: '1', name: '王小明', email: 'wang@example.com', phone: '0912-345-678', role: 'user', status: 'active', createdAt: '2025-12-01', orderCount: 5 },
  { id: '2', name: '李美玲', email: 'lee@example.com', phone: '0923-456-789', role: 'user', status: 'active', createdAt: '2025-11-15', orderCount: 12 },
  { id: '3', name: '張大偉', email: 'zhang@example.com', phone: '0934-567-890', role: 'admin', status: 'active', createdAt: '2025-10-20', orderCount: 0 },
  { id: '4', name: '陳小華', email: 'chen@example.com', phone: '0945-678-901', role: 'user', status: 'inactive', createdAt: '2025-09-10', orderCount: 2 },
]

const roleLabels: Record<UserRole, string> = {
  user: '一般會員',
  admin: '管理員',
}

const statusLabels: Record<UserStatus, string> = {
  active: '啟用中',
  inactive: '未啟用',
  banned: '已停權',
}

const statusColors: Record<UserStatus, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  banned: 'bg-red-100 text-red-800',
}

export function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.includes(searchQuery) ||
      user.email.includes(searchQuery) ||
      user.phone.includes(searchQuery)
  )

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">會員管理</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">啟用會員</p>
              <p className="text-xl font-bold text-gray-900">
                {mockUsers.filter((u) => u.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <UserX className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">未啟用</p>
              <p className="text-xl font-bold text-gray-900">
                {mockUsers.filter((u) => u.status === 'inactive').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">總會員數</p>
              <p className="text-xl font-bold text-gray-900">{mockUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋會員名稱、信箱或電話..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                會員資訊
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                電話
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                訂單數
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {user.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {roleLabels[user.role]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {user.orderCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[user.status]}`}
                  >
                    {statusLabels[user.status]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="p-2 text-gray-600 hover:text-blue-600">
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
