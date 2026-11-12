import { createServer, request, type OutgoingHttpHeaders } from 'http';
import type { AddressInfo } from 'net';
import { Writable } from 'stream';
import pinoHttp from 'pino-http';
import { buildPinoHttpOptions } from './pino-http.options';

interface Exchange {
  path: string;
  status?: number;
  reqHeaders?: OutgoingHttpHeaders;
  resHeaders?: OutgoingHttpHeaders;
}

interface Logged {
  output: string;
  responseRequestId: string | undefined;
}

/** Run one real request through pino-http and return the raw log output */
async function logExchange({
  path,
  status = 200,
  reqHeaders = {},
  resHeaders = {},
}: Exchange): Promise<Logged> {
  let output = '';
  const sink = new Writable({
    write(chunk: Buffer, _enc, done) {
      output += chunk.toString();
      done();
    },
  });
  // transport (pino-pretty in dev) would bypass the in-memory sink
  const logger = pinoHttp(
    { ...buildPinoHttpOptions(), transport: undefined },
    sink,
  );
  const server = createServer((req, res) => {
    logger(req, res);
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
        req.on('error', reject);
        req.end();
      },
    );
    // pino writes the "request completed" line on res finish; let it flush
    await new Promise((resolve) => setImmediate(resolve));
    return { output, responseRequestId };
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
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
          referer:
            'https://haude-web.vercel.app/zh/reset-password?token=REFERER_SECRET',
          'x-vercel-proxy-signature': 'Bearer VERCEL_SIGNATURE',
          'x-vercel-proxy-signature-ts': 'VERCEL_SIGNATURE_TS',
          'cf-connecting-ip': '203.0.113.7',
        },
        resHeaders: {
          'set-cookie': ['access_token=SET_COOKIE_SECRET; HttpOnly'],
          location:
            'https://haude-admin.vercel.app/auth/callback#user=USER_EMAIL_PII',
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
      const line = JSON.parse(logged.output.trim().split('\n').pop()!) as {
        req: { id: string };
      };
      expect(line.req.id).toBe(logged.responseRequestId);
    });
  });

  it('skips successful health checks (cron-job.org hits /health/ready every 5 minutes)', async () => {
    const { output } = await logExchange({ path: '/health/ready' });
    expect(output).toBe('');
  });

  it('still logs a failing health check', async () => {
    const { output } = await logExchange({
      path: '/health/ready',
      status: 503,
    });
    expect(output).toContain('/health/ready');
  });
});
