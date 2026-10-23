/**
 * Fetch a single resource for a detail page (product / farm tour / location).
 *
 * Only an explicit 404 from the API means "this item does not exist" -> null -> notFound().
 * Every other failure (5xx, network error, timeout) MUST throw:
 * - at runtime, ISR keeps serving the last good page instead of caching a 404
 * - at build time, the build fails and Vercel keeps the previous deployment live
 *
 * Do not "simplify" this back to `if (!res.ok) return null` / `catch { return null }`.
 * That version cached 404 pages for up to `revalidate` seconds whenever the API was
 * restarting during a web deploy (2026-10-23, see root CLAUDE.md "Git 與部署").
 */
export async function fetchDetail<T>(url: string, revalidate: number): Promise<T | null> {
  const res = await fetch(url, { next: { revalidate } })

  if (res.status === 404) {
    return null
  }

  if (!res.ok) {
    throw new Error(`Detail fetch failed: ${res.status} ${url}`)
  }

  return res.json() as Promise<T>
}
