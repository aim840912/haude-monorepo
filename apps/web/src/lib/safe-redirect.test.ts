import { describe, expect, it } from 'vitest'
import { safeRedirectPath } from './safe-redirect'

describe('safeRedirectPath', () => {
  it('keeps a same-site path with query and hash', () => {
    expect(safeRedirectPath('/orders?tab=1#top')).toBe('/orders?tab=1#top')
  })

  it.each([
    ['empty', ''],
    ['null', null],
    ['absolute URL', 'https://evil.com'],
    ['protocol-relative', '//evil.com'],
    ['tab after slash', '/\t/evil.com'],
    ['newline after slash', '/\n/evil.com'],
    ['backslash', '/\\evil.com'],
    ['dot segment normalizing to //', '/.//evil.com'],
    ['parent segments normalizing to //', '/a/../..//evil.com'],
    ['javascript scheme', 'javascript:alert(1)'],
  ])('falls back for %s', (_label, raw) => {
    expect(safeRedirectPath(raw)).toBe('/')
  })

  it('uses the provided fallback', () => {
    expect(safeRedirectPath('//evil.com', '/account')).toBe('/account')
  })
})
