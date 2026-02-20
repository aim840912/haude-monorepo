import type { User } from '@/stores/authStore'

/**
 * Auth 服務介面
 * Mock 和 Real 實作都必須遵循此介面
 */
export interface AuthServiceInterface {
  login(email: string, password: string): Promise<AuthResponse>
  register(email: string, password: string, name: string): Promise<AuthResponse>
  getMe(): Promise<GetMeResponse>
}

export interface AuthResponse {
  user: User
  accessToken: string
  csrfToken?: string
}

export interface GetMeResponse {
  user: User
}
