import type { Request, Response, NextFunction } from 'express';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * CSRF defence: reject state-changing requests whose Origin header is present
 * but not one of our frontends.
 *
 * Why this is needed: in production the auth cookies are SameSite=None (admin
 * is cross-site), so a form POST from any site carries the user's cookies, and
 * CORS does not stop "simple" requests from being sent — it only hides the
 * response.
 *
 * - Browsers always send Origin on POST/PUT/PATCH/DELETE, so a forged request
 *   cannot omit it. A request without Origin is not from a browser (curl,
 *   server-to-server) and carries no ambient cookies worth protecting → allowed.
 * - `Origin: null` (sandboxed iframes, data: URLs) is present and not in the
 *   list → rejected.
 * - Requests proxied by the web app's Next.js rewrites keep the browser's
 *   Origin (the web app's own URL), so they pass.
 * - `exemptPrefixes` are endpoints that third parties POST to from their own
 *   origin and that authenticate by signature instead of cookies (ECPay).
 */
export function createOriginCheck(
  allowedOrigins: readonly string[],
  exemptPrefixes: readonly string[] = [],
) {
  const allowed = new Set(allowedOrigins);

  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;

    if (
      !UNSAFE_METHODS.has(req.method) ||
      origin === undefined ||
      allowed.has(origin) ||
      exemptPrefixes.some((prefix) => req.path.startsWith(prefix))
    ) {
      next();
      return;
    }

    res.setHeader('Cache-Control', 'no-store');
    res.status(403).json({
      statusCode: 403,
      message: 'Origin not allowed',
      error: 'Forbidden',
    });
  };
}
