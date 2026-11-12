import { createServer, request, type Server } from 'http';
import type { AddressInfo } from 'net';
import { Writable } from 'stream';
import pinoHttp from 'pino-http';
import { pinoHttpOptions } from './pino-http.options';

const ACCESS = 'access_token=ACCESS_SECRET';
const REFRESH = 'refresh_token=REFRESH_SECRET';

/** Run one real request through pino-http and return the raw log output */
async function logOneRequest(): Promise<string> {
  let output = '';
  const sink = new Writable({
    write(chunk: Buffer, _enc, done) {
      output += chunk.toString();
      done();
    },
  });
  // transport (pino-pretty in dev) would bypass the in-memory sink
  const logger = pinoHttp({ ...pinoHttpOptions, transport: undefined }, sink);

  const server: Server = createServer((req, res) => {
    logger(req, res);
    res.setHeader('set-cookie', [
      `${ACCESS}; HttpOnly`,
      `${REFRESH}; HttpOnly`,
    ]);
    res.end('ok');
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;

  await new Promise<void>((resolve, reject) => {
    const req = request(
      {
        port,
        path: '/api/v1/auth/me',
        headers: {
          cookie: `${ACCESS}; ${REFRESH}`,
          authorization: 'Bearer BEARER_SECRET',
          'cf-connecting-ip': '203.0.113.7',
        },
      },
      (res) => {
        res.resume();
        res.on('end', resolve);
      },
    );
    req.on('error', reject);
    req.end();
  });
  await new Promise<void>((resolve) => server.close(() => resolve()));
  // pino writes the "request completed" line on res finish; let it flush
  await new Promise((resolve) => setImmediate(resolve));
  return output;
}

describe('pinoHttpOptions', () => {
  let output: string;

  beforeAll(async () => {
    output = await logOneRequest();
  });

  it('logs the request', () => {
    expect(output).toContain('/api/v1/auth/me');
  });

  it('never writes auth tokens to the log', () => {
    // Anyone who can read Render Logs could replay a refresh token for 30 days
    expect(output).not.toContain('ACCESS_SECRET');
    expect(output).not.toContain('REFRESH_SECRET');
    expect(output).not.toContain('BEARER_SECRET');
  });

  it('keeps the other headers (rate-limit IP checks read them from Render Logs)', () => {
    expect(output).toContain('203.0.113.7');
  });
});
