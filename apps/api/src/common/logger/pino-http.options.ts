import type { Options } from 'pino-http';

/**
 * Request logging options for nestjs-pino (JSON in production, pretty in dev).
 */
export const pinoHttpOptions: Options = {
  // Auto-assign request ID
  genReqId: (req) =>
    req.headers['x-request-id']?.toString() || crypto.randomUUID(),
  customProps: () => ({
    context: 'HTTP',
  }),
  // pino-http logs every request/response header by default, which puts the
  // access/refresh cookies into Render Logs. Mask only the credentials; keep
  // the rest (cf-connecting-ip etc. are read from the logs when re-measuring
  // the rate-limit client IP, see root CLAUDE.md).
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
  // Reduce noise: skip health check logs
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: { colorize: true, singleLine: true },
        }
      : undefined,
  level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
};
