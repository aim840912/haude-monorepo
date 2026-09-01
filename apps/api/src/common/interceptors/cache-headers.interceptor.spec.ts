import { Reflector } from '@nestjs/core';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { CacheHeadersInterceptor } from './cache-headers.interceptor';

/**
 * 快取標頭防護測試
 *
 * 核心不變式：**個人化回應絕不進共享快取**。GET 預設 no-store（fail-closed），
 * 要快取必須明確 @Cacheable(n)，而一旦公開快取就必須帶 Vary，否則某個依登入
 * 狀態而異的端點會把 A 的回應發給 B。
 */
describe('CacheHeadersInterceptor', () => {
  let interceptor: CacheHeadersInterceptor;
  let reflector: Reflector;
  let setHeader: jest.Mock;

  const createContext = (
    method: string,
    headersSent = false,
  ): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method }),
        getResponse: () => ({ setHeader, headersSent }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => class {},
    }) as unknown as ExecutionContext;

  const next: CallHandler = { handle: () => of({ ok: true }) };

  const headerValue = (key: string): string | undefined =>
    setHeader.mock.calls.find(
      ([k]: [string]) => k.toLowerCase() === key.toLowerCase(),
    )?.[1] as string | undefined;

  beforeEach(() => {
    reflector = new Reflector();
    interceptor = new CacheHeadersInterceptor(reflector);
    setHeader = jest.fn();
  });

  describe('預設行為（fail-closed）', () => {
    it('GET 未標註 @Cacheable 時為 no-store', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      await lastValueFrom(interceptor.intercept(createContext('GET'), next));

      expect(headerValue('Cache-Control')).toBe('no-store');
    });

    it('@Cacheable(0) / @NoCache() 為 no-store', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(0);

      await lastValueFrom(interceptor.intercept(createContext('GET'), next));

      expect(headerValue('Cache-Control')).toBe('no-store');
    });

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
      '%s 為 no-store',
      async (method) => {
        await lastValueFrom(interceptor.intercept(createContext(method), next));

        expect(headerValue('Cache-Control')).toBe('no-store');
      },
    );
  });

  describe('公開快取端點', () => {
    beforeEach(() => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(300);
    });

    it('@Cacheable(n) 產生 public 快取指令', async () => {
      await lastValueFrom(interceptor.intercept(createContext('GET'), next));

      const cc = headerValue('Cache-Control');
      expect(cc).toContain('public');
      expect(cc).toContain('max-age=300');
      expect(cc).toContain('s-maxage=600');
    });

    it('公開快取必須同時帶 Vary，否則憑證不同的回應會互相污染', async () => {
      await lastValueFrom(interceptor.intercept(createContext('GET'), next));

      const vary = headerValue('Vary');
      expect(vary).toContain('Cookie');
      expect(vary).toContain('Authorization');
    });
  });

  describe('已送出標頭的回應（redirect）', () => {
    it('不覆寫已送出的標頭', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      await lastValueFrom(
        interceptor.intercept(createContext('GET', true), next),
      );

      // 攔截器短路 —— 這正是 OAuth redirect 必須自行設定 no-store 的原因
      expect(setHeader).not.toHaveBeenCalled();
    });
  });
});
