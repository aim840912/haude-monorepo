import { describe, it, expect } from 'vitest'
import { callbackErrorMessage } from './auth-callback-error'

describe('callbackErrorMessage', () => {
  it.each(['登入驗證失敗，請重新登入', '您沒有管理員權限'])(
    'shows the API message %s as-is',
    (msg) => {
      expect(callbackErrorMessage(msg, false)).toBe(msg)
    }
  )

  it('replaces any other text with a generic message', () => {
    expect(
      callbackErrorMessage('帳號已被停權，請撥打 0900-000-000 並提供密碼', false)
    ).toBe('登入失敗，請重新登入')
  })

  it('shows dev-login failures only in development', () => {
    const msg = 'Dev login failed: boom'
    expect(callbackErrorMessage(msg, true)).toBe(msg)
    expect(callbackErrorMessage(msg, false)).toBe('登入失敗，請重新登入')
  })
})
