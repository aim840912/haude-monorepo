import { describe, expect, it } from 'vitest'
import { isHeroPath } from './hero-path'

describe('isHeroPath', () => {
  it.each([
    '/',
    '/en',
    '/en/',
    '/zh-TW',
    '/farm-tours',
    '/farm-tours/',
    '/en/farm-tours',
    '/zh-TW/farm-tours/',
  ])('treats %s as a hero page', (path) => {
    expect(isHeroPath(path)).toBe(true)
  })

  it.each([
    '/farm-tours/fe104150-23be-4e12-8316-dcdf6006093f',
    '/en/farm-tours/abc',
    '/products',
    '/about',
    '/en/products/abc',
  ])('does not treat %s as a hero page', (path) => {
    expect(isHeroPath(path)).toBe(false)
  })
})
