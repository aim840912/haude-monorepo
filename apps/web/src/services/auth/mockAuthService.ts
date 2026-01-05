import type { AuthServiceInterface, AuthResponse, GetMeResponse } from './types'
import type { User } from '@/stores/authStore'

/**
 * Mock 用戶資料
 * 用於開發和測試環境
 */
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    email: 'demo@haude.com',
    password: 'demo123',
    name: '測試用戶',
    role: 'USER',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'admin@haude.com',
    password: 'admin123',
    name: '管理員',
    role: 'ADMIN',
    createdAt: '2024-01-01T00:00:00Z',
  },
]

// 儲存當前登入的 token 對應的用戶（模擬 session）
const tokenUserMap = new Map<string, User>()

/**
 * 模擬網路延遲
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 生成 Mock JWT Token
 */
const generateMockToken = (userId: string): string => {
  const payload = { userId, exp: Date.now() + 24 * 60 * 60 * 1000 }
  return `mock-jwt-${btoa(JSON.stringify(payload))}`
}

/**
 * Mock Auth Service
 * 模擬後端認證 API，用於前端獨立開發
 */
export const mockAuthService: AuthServiceInterface = {
  /**
   * 模擬登入
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay(500) // 模擬網路延遲

    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (!user) {
      throw new Error('帳號或密碼錯誤')
    }

    // 移除密碼後回傳
    const { password: _, ...userWithoutPassword } = user
    const token = generateMockToken(user.id)

    // 儲存 token 對應的用戶
    tokenUserMap.set(token, userWithoutPassword)

    console.log('[Mock Auth] 登入成功:', userWithoutPassword.email)

    return {
      user: userWithoutPassword,
      accessToken: token,
    }
  },

  /**
   * 模擬註冊
   */
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    await delay(500) // 模擬網路延遲

    // 檢查 email 是否已存在
    const existingUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      throw new Error('此 Email 已被註冊')
    }

    // 建立新用戶
    const newUser: User = {
      id: String(MOCK_USERS.length + 1),
      email,
      name,
      role: 'USER',
      createdAt: new Date().toISOString(),
    }

    // 加入 Mock 用戶列表（包含密碼）
    MOCK_USERS.push({ ...newUser, password })

    const token = generateMockToken(newUser.id)
    tokenUserMap.set(token, newUser)

    console.log('[Mock Auth] 註冊成功:', newUser.email)

    return {
      user: newUser,
      accessToken: token,
    }
  },

  /**
   * 模擬驗證 Token
   */
  async getMe(): Promise<GetMeResponse> {
    await delay(200) // 模擬網路延遲

    // 從 localStorage 或 sessionStorage 取得 token（根據「記住我」設定）
    const authStorage = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage')
    if (!authStorage) {
      throw new Error('未登入')
    }

    const { state } = JSON.parse(authStorage)
    const token = state?.token

    if (!token) {
      throw new Error('未登入')
    }

    // 檢查 token 是否有效
    const user = tokenUserMap.get(token)
    if (!user) {
      // 嘗試從 token 解析用戶 ID
      try {
        const payload = JSON.parse(atob(token.replace('mock-jwt-', '')))
        const mockUser = MOCK_USERS.find((u) => u.id === payload.userId)
        if (mockUser) {
          const { password: _, ...userWithoutPassword } = mockUser
          tokenUserMap.set(token, userWithoutPassword)
          return { user: userWithoutPassword }
        }
      } catch {
        // 解析失敗
      }
      throw new Error('Token 無效')
    }

    return { user }
  },
}
