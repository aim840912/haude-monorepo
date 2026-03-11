import type { AuthServiceInterface, AuthResponse, GetMeResponse } from '@/services/auth/types'
import type { User } from '@/stores/authStore'

/**
 * Mock user data for development and testing
 */
const MOCK_USERS: (User & { password: string })[] = [
  {
    id: '1',
    email: 'user@test.local',
    password: 'mock-password',
    name: '測試用戶',
    role: 'USER',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'admin@test.local',
    password: 'mock-password',
    name: '管理員',
    role: 'ADMIN',
    createdAt: '2024-01-01T00:00:00Z',
  },
]

// Track logged-in users (simulates session)
const loggedInUsers = new Set<string>()

/**
 * Simulate network delay
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Mock Auth Service
 * Simulates backend auth API for standalone frontend development
 * Note: In real app, tokens are in httpOnly cookies. Mock simulates the response format.
 */
export const mockAuthService: AuthServiceInterface = {
  /**
   * Mock login — response matches real API (no accessToken in body)
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay(500)

    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )

    if (!user) {
      throw new Error('帳號或密碼錯誤')
    }

    const { password: _, ...userWithoutPassword } = user
    loggedInUsers.add(user.id)

    console.log('[Mock Auth] 登入成功:', userWithoutPassword.email)

    return {
      user: userWithoutPassword,
      csrfToken: `mock-csrf-${Date.now()}`,
    }
  },

  /**
   * Mock register — response matches real API (no accessToken in body)
   */
  async register(email: string, _password: string, name: string): Promise<AuthResponse> {
    await delay(500)

    const existingUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      throw new Error('此 Email 已被註冊')
    }

    const newUser: User = {
      id: String(MOCK_USERS.length + 1),
      email,
      name,
      role: 'USER',
      createdAt: new Date().toISOString(),
    }

    MOCK_USERS.push({ ...newUser, password: _password })
    loggedInUsers.add(newUser.id)

    console.log('[Mock Auth] 註冊成功:', newUser.email)

    return {
      user: newUser,
      csrfToken: `mock-csrf-${Date.now()}`,
    }
  },

  /**
   * Mock session check — in real app, httpOnly cookie is sent automatically
   */
  async getMe(): Promise<GetMeResponse> {
    await delay(200)

    // In mock mode, check if user exists in auth store
    const authStorage = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage')
    if (!authStorage) {
      throw new Error('未登入')
    }

    const { state } = JSON.parse(authStorage)
    const user = state?.user

    if (!user) {
      throw new Error('未登入')
    }

    // Return the stored user (simulates /auth/me endpoint)
    return { user }
  },
}
