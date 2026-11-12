import { createServer, request, type OutgoingHttpHeaders } from 'http';
import type { AddressInfo } from 'net';
import { Writable } from 'stream';
import pinoHttp from 'pino-http';
import { buildPinoHttpOptions } from './pino-http.options';

interface Exchange {
  path: string;
  status?: number;
  reqHeaders?: OutgoingHttpHeaders;
  // Not OutgoingHttpHeaders: that types Location as a single string, but
  // setHeader accepts an array and the serializer must clean every entry
  resHeaders?: Record<string, string | string[]>;
  /** Client gives up before the server responds (e.g. cron-job.org timeout) */
  abort?: boolean;
}

interface Logged {
  output: string;
  responseRequestId: string | undefined;
}

/** In-memory pino-http with the production options (no pretty transport) */
function createLogger() {
  const sink = { output: '' };
  const stream = new Writable({
    write(chunk: Buffer, _enc, done) {
      sink.output += chunk.toString();
      done();
    },
  });
  const logger = pinoHttp(
    { ...buildPinoHttpOptions(), transport: undefined },
    stream,
  );
  return { logger, sink };
}

/** Run one real request through pino-http and return the raw log output */
async function logExchange({
  path,
  status = 200,
  reqHeaders = {},
  resHeaders = {},
  abort = false,
}: Exchange): Promise<Logged> {
  const { logger, sink } = createLogger();
  const server = createServer((req, res) => {
    logger(req, res);
    if (abort) return; // hang, like a health check stuck on the database
    for (const [name, value] of Object.entries(resHeaders)) {
      if (value !== undefined) res.setHeader(name, value);
    }
    res.statusCode = status;
    res.end('ok');
  });

  try {
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    const responseRequestId = await new Promise<string | undefined>(
      (resolve, reject) => {
        const req = request({ port, path, headers: reqHeaders }, (res) => {
          res.resume();
          res.on('end', () =>
            resolve(res.headers['x-request-id'] as string | undefined),
          );
        });
        if (abort) {
          req.setTimeout(50, () => req.destroy());
          req.on('error', () => resolve(undefined));
        } else {
          req.on('error', reject);
        }
        req.end();
      },
    );
    // pino logs on res finish/close; give the server side a moment to see it
    for (let i = 0; i < 20 && (abort ? !sink.output : i < 1); i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return { output: sink.output, responseRequestId };
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

function lastLine(output: string): Record<string, any> {
  return JSON.parse(output.trim().split('\n').pop()!);
}

describe('buildPinoHttpOptions', () => {
  describe('a request carrying every kind of credential', () => {
    let logged: Logged;

    beforeAll(async () => {
      logged = await logExchange({
        path: '/api/v1/auth/verify-reset-token?token=RESET_SECRET',
        reqHeaders: {
          cookie: 'access_token=ACCESS_SECRET; refresh_token=REFRESH_SECRET',
          authorization: 'Bearer BEARER_SECRET',
          'proxy-authorization': 'Basic PROXY_SECRET',
          referer:
            'https://haude-web.vercel.app/zh/reset-password?token=REFERER_SECRET',
          'x-vercel-proxy-signature': 'Bearer VERCEL_SIGNATURE',
          'x-vercel-proxy-signature-ts': 'VERCEL_SIGNATURE_TS',
          'cf-connecting-ip': '203.0.113.7',
        },
        resHeaders: {
          'set-cookie': ['access_token=SET_COOKIE_SECRET; HttpOnly'],
          location: [
            'https://haude-admin.vercel.app/auth/callback#user=USER_EMAIL_PII',
          ],
        },
      });
    });

    it('logs the request path', () => {
      expect(logged.output).toContain('/api/v1/auth/verify-reset-token');
    });

    // Anyone who can read Render Logs could replay any of these
    it.each([
      ['access token cookie', 'ACCESS_SECRET'],
      ['refresh token cookie', 'REFRESH_SECRET'],
      ['bearer token', 'BEARER_SECRET'],
      ['proxy credentials', 'PROXY_SECRET'],
      ['Set-Cookie on the response', 'SET_COOKIE_SECRET'],
      ['password reset token in the query string', 'RESET_SECRET'],
      ['password reset token in the Referer', 'REFERER_SECRET'],
      ['Vercel proxy signature', 'VERCEL_SIGNATURE'],
      ['user info in the OAuth redirect fragment', 'USER_EMAIL_PII'],
    ])('never writes the %s to the log', (_name, secret) => {
      expect(logged.output).not.toContain(secret);
    });

    it('keeps the other headers (rate-limit IP checks read them from Render Logs)', () => {
      expect(logged.output).toContain('203.0.113.7');
    });

    it('keeps where the Referer came from, minus its query', () => {
      expect(logged.output).toContain(
        'https://haude-web.vercel.app/zh/reset-password',
      );
    });

    it('logs the same request id the client receives', () => {
      // Users report the id from error responses; it must find the log line
      expect(lastLine(logged.output).req.id).toBe(logged.responseRequestId);
    });
  });

  describe('message strings written by application code', () => {
    // Every `this.logger.x()` goes through the same pino instance, so the
    // cleanup must not depend on each call site remembering to do it
    it.each([
      [
        'slow-request warning',
        'Slow Request: GET /api/v1/auth/verify-reset-token?token=SLOW_SECRET - 812ms',
        'SLOW_SECRET',
      ],
      [
        "Nest's 404 message (built from originalUrl)",
        '[NOT_FOUND] Cannot GET /api/v2/auth/google/callback?code=CODE_SECRET&state=web',
        'CODE_SECRET',
      ],
      [
        'absolute URL with a fragment',
        'redirect to https://haude-admin.vercel.app/auth/callback#user=FRAGMENT_PII',
        'FRAGMENT_PII',
      ],
    ])('strips URL secrets from a %s', (_name, message, secret) => {
      const { logger, sink } = createLogger();
      logger.logger.child({ context: 'Test' }).warn(message);
      expect(sink.output).not.toContain(secret);
    });

    it('keeps the path itself', () => {
      const { logger, sink } = createLogger();
      logger.logger.warn('Cannot GET /api/v2/products?q=tea');
      expect(lastLine(sink.output).msg).toBe('Cannot GET /api/v2/products');
    });
  });

  describe('request id', () => {
    it('reuses a well-formed id sent by the client', async () => {
      const { responseRequestId } = await logExchange({
        path: '/api/v1/products',
        reqHeaders: { 'x-request-id': 'trace-abc_123' },
      });
      expect(responseRequestId).toBe('trace-abc_123');
    });

    it('replaces a malformed client id instead of echoing it', async () => {
      const { responseRequestId } = await logExchange({
        path: '/api/v1/products',
        reqHeaders: { 'x-request-id': 'x'.repeat(500) },
      });
      expect(responseRequestId).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe('log levels', () => {
    it('skips successful health checks (cron-job.org hits /health/ready every 5 minutes)', async () => {
      const { output } = await logExchange({ path: '/health/ready' });
      expect(output).toBe('');
    });

    it('logs a failing health check as an error', async () => {
      const { output } = await logExchange({
        path: '/health/ready',
        status: 503,
      });
      expect(lastLine(output).level).toBe(50);
    });

    it('logs a health check the client gave up on', async () => {
      // An unfinished response still reports the default 200
      const { output } = await logExchange({
        path: '/health/ready',
        abort: true,
      });
      expect(output).toContain('/health/ready');
    });

    it('logs server errors as errors so level filters and alerts see them', async () => {
      const { output } = await logExchange({
        path: '/api/v1/orders',
        status: 500,
      });
      expect(lastLine(output).level).toBe(50);
    });
  });
});
