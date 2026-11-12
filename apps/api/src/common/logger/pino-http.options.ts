import type { Options } from 'pino-http';
import { stripUrlSecrets, stripUrlSecretsInText } from './url-secrets';

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
const REQUEST_ID_FORMAT = /^[\w-]{1,128}$/;

/**
 * Request logging options for nestjs-pino (JSON in production, pretty in dev).
 *
 * A function, not a constant: NODE_ENV is read when AppModule calls it, after
 * ConfigModule.forRoot() has loaded .env — the same moment the options were
 * evaluated when they were inline.
 */
export const buildPinoHttpOptions = (): Options => ({
  // The only source of the request id: written back to the request (read by
  // AllExceptionsFilter for error bodies) and the X-Request-Id response
  // header, so a user-reported id always finds its log lines. A client id is
  // reused only when well formed; anything else could be oversized or reuse
  // another request's id to muddy log searches.
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id']?.toString();
    const id =
      incoming && REQUEST_ID_FORMAT.test(incoming)
        ? incoming
        : crypto.randomUUID();
    req.headers['x-request-id'] = id;
    res.setHeader('x-request-id', id);
    return id;
  },
  // Every application log (this.logger.x in any file) goes through this
  // pino instance, so URL secrets in message strings are cut here once —
  // e.g. the slow-request warning and Nest's "Cannot GET <originalUrl>".
  hooks: {
    logMethod(args, method) {
      const cleaned = args.map((arg: unknown) =>
        typeof arg === 'string' ? stripUrlSecretsInText(arg) : arg,
      ) as typeof args;
      method.apply(this, cleaned);
    },
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
      'req.headers["proxy-authorization"]',
      'req.headers["x-vercel-proxy-signature"]',
      'req.headers["x-vercel-proxy-signature-ts"]',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  customLogLevel: (req, res, err) => {
    // Error level so Render Logs level filters and alerts catch failures
    if (err || res.statusCode >= 500) return 'error';
    // Successful health checks are noise (cron-job.org hits /health/ready
    // every 5 minutes). writableEnded: a request the client gave up on (e.g.
    // stuck on the database) still reports the default 200 and must be logged.
    if (
      res.writableEnded &&
      res.statusCode < 400 &&
      HEALTH_PATHS.has(stripUrlSecrets(req.url ?? ''))
    ) {
      return 'silent';
    }
    return 'info';
  },
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, singleLine: true },
        }
      : undefined,
  level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
});
