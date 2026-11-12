import type { Options } from 'pino-http';
import { stripUrlSecrets } from './url-secrets';

/** Shape of pino's default request serializer output */
interface LoggedRequest {
  id?: unknown;
  method?: string;
  url?: string;
  headers?: Record<string, unknown>;
  remoteAddress?: string;
  remotePort?: number;
}

/** Shape of pino's default response serializer output */
interface LoggedResponse {
  statusCode?: number;
  headers?: Record<string, unknown>;
}

const HEALTH_PATHS = new Set(['/health', '/health/ready']);

/**
 * Request logging options for nestjs-pino (JSON in production, pretty in dev).
 *
 * A function, not a constant: NODE_ENV is read when AppModule calls it, after
 * ConfigModule.forRoot() has loaded .env — the same moment the options were
 * evaluated when they were inline.
 */
export const buildPinoHttpOptions = (): Options => ({
  // One id per request, whichever of this and RequestIdMiddleware runs first:
  // both reuse x-request-id when present and write it back, so the log line,
  // the X-Request-Id response header and error bodies all carry the same id.
  genReqId: (req, res) => {
    const id = req.headers['x-request-id']?.toString() || crypto.randomUUID();
    req.headers['x-request-id'] = id;
    res.setHeader('x-request-id', id);
    return id;
  },
  customProps: () => ({
    context: 'HTTP',
  }),
  // pino-http logs every request/response header and the full URL by default.
  // Credentials travel in headers (cookies, bearer, Vercel proxy signature)
  // and in URLs (reset ?token=, OAuth #user=), so both are cleaned before the
  // line reaches Render Logs. Other headers stay: re-measuring the rate-limit
  // client IP reads cf-connecting-ip from the logs (see root CLAUDE.md).
  serializers: {
    // Copy headers: the serialized object shares them with the live request
    req: (req: LoggedRequest) => ({
      id: req.id,
      method: req.method,
      url: stripUrlSecrets(req.url),
      headers: {
        ...req.headers,
        referer: stripUrlSecrets(req.headers?.referer),
      },
      remoteAddress: req.remoteAddress,
      remotePort: req.remotePort,
    }),
    res: (res: LoggedResponse) => ({
      statusCode: res.statusCode,
      headers: {
        ...res.headers,
        location: stripUrlSecrets(res.headers?.location),
      },
    }),
  },
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.headers["x-vercel-proxy-signature"]',
      'req.headers["x-vercel-proxy-signature-ts"]',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  // Successful health checks are noise (cron-job.org hits /health/ready every
  // 5 minutes); failures still log. pino-http's default level is 'info'.
  customLogLevel: (req, res, err) =>
    !err &&
    res.statusCode < 400 &&
    HEALTH_PATHS.has(stripUrlSecrets(req.url ?? ''))
      ? 'silent'
      : 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, singleLine: true },
        }
      : undefined,
  level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
});
