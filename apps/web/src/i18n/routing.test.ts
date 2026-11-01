import { describe, expect, it } from 'vitest'
import { routing } from './routing'

// /en only translates the nav and the header has no language switcher, so a visitor redirected
// there by their browser language or an old cookie would be stuck on a half-translated site.
// Flip this when /en is really translated and the switcher comes back.
describe('routing', () => {
  it('keeps locale detection off while the header has no language switcher', () => {
    expect(routing.localeDetection).toBe(false)
  })
})
