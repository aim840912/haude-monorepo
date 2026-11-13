/**
 * CSP frame-src regression test
 *
 * Without an explicit frame-src, iframes fall back to default-src 'self', so the
 * cross-origin AI support widget gets blocked ("this content is blocked").
 */

import { afterEach, describe, it, expect, vi } from 'vitest'
import { buildCsp } from '../../next.config'

function frameSrc(csp: string): string | undefined {
  return csp.split('; ').find((d) => d.startsWith('frame-src'))
}

describe('buildCsp frame-src', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows the AI support widget origin when configured', () => {
    vi.stubEnv('NEXT_PUBLIC_AI_SUPPORT_URL', 'https://ai-support.example.com/some/path')
    expect(frameSrc(buildCsp())).toBe("frame-src 'self' https://ai-support.example.com")
  })

  it('stays same-origin only when the widget is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_AI_SUPPORT_URL', '')
    expect(frameSrc(buildCsp())).toBe("frame-src 'self'")
  })

  it('ignores an invalid widget URL instead of widening the policy', () => {
    vi.stubEnv('NEXT_PUBLIC_AI_SUPPORT_URL', 'not a url')
    expect(frameSrc(buildCsp())).toBe("frame-src 'self'")
  })
})
