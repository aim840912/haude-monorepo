/**
 * Validate a user-supplied redirect target (e.g. `?from=`) and return a
 * same-origin path, or `fallback` if it could leave the site.
 *
 * String checks such as `startsWith('/') && !startsWith('//')` are not enough:
 * the browser's URL parser strips tabs/newlines and treats `\` as `/`, so
 * `/<TAB>/evil.com` and `/\evil.com` both become `//evil.com`. We parse with the
 * same WHATWG URL rules the browser uses, then check the result.
 */
const PLACEHOLDER_ORIGIN = 'https://placeholder.invalid'

export function safeRedirectPath(raw: string | null | undefined, fallback = '/'): string {
  if (!raw || !raw.startsWith('/')) return fallback

  let url: URL
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN)
  } catch {
    return fallback
  }

  if (url.origin !== PLACEHOLDER_ORIGIN) return fallback

  const path = url.pathname + url.search + url.hash
  // Dot segments can normalize to a protocol-relative path: `/.//evil.com` -> `//evil.com`.
  if (path.startsWith('//')) return fallback

  return path
}
