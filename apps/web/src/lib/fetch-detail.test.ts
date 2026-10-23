/**
 * Regression guard: detail pages must only become notFound() on an explicit 404.
 * Treating API errors as "not found" let ISR cache 404 pages during deploys.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchDetail } from './fetch-detail'

function mockFetch(impl: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchDetail', () => {
  it('returns the parsed body on 200', async () => {
    mockFetch(async () => new Response(JSON.stringify({ id: 'a' }), { status: 200 }))
    await expect(fetchDetail('https://api.test/x/a', 60)).resolves.toEqual({ id: 'a' })
  })

  it('returns null on 404 so the page can call notFound()', async () => {
    mockFetch(async () => new Response('', { status: 404 }))
    await expect(fetchDetail('https://api.test/x/a', 60)).resolves.toBeNull()
  })

  it('throws on 5xx instead of reporting "not found"', async () => {
    mockFetch(async () => new Response('', { status: 503 }))
    await expect(fetchDetail('https://api.test/x/a', 60)).rejects.toThrow('503')
  })

  it('lets network errors propagate instead of reporting "not found"', async () => {
    mockFetch(async () => {
      throw new TypeError('fetch failed')
    })
    await expect(fetchDetail('https://api.test/x/a', 60)).rejects.toThrow('fetch failed')
  })
})
