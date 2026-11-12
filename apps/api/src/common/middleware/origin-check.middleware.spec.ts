import type { Request, Response, NextFunction } from 'express';
import { createOriginCheck } from './origin-check.middleware';

/**
 * Origin 檢查（CSRF 防護）
 *
 * 正式環境 cookie 是 SameSite=None，惡意網站的表單 POST 會帶著使用者的 cookie
 * 送到 API；CORS 擋不住表單送出的簡單請求。前端送的 X-CSRF-Token 從來沒有被
 * 發出或驗證過，等於沒有防護。
 */
describe('createOriginCheck', () => {
  const allowed = [
    'https://haude-web.vercel.app',
    'https://haude-admin.vercel.app',
  ];
  const check = createOriginCheck(allowed, ['/api/v1/payments/ecpay/']);

  function run(method: string, path: string, origin?: string) {
    const req = {
      method,
      path,
      headers: origin === undefined ? {} : { origin },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;
    check(req, res, next);
    return { res, next };
  }

  it('Origin 為外部網站的 POST 回 403', () => {
    const { res, next } = run('POST', '/api/v1/orders', 'https://evil.example');

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it.each(['PUT', 'PATCH', 'DELETE'])(
    'Origin 為外部網站的 %s 回 403',
    (method) => {
      const { res } = run(method, '/api/v1/orders/1', 'https://evil.example');

      expect(res.status).toHaveBeenCalledWith(403);
    },
  );

  it('Origin: null（沙箱 iframe）的 POST 回 403', () => {
    const { res } = run('POST', '/api/v1/orders', 'null');

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('沒有 Origin 的請求放行（伺服器對伺服器、curl）', () => {
    const { res, next } = run('POST', '/api/v1/orders');

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it.each(allowed)('白名單內的來源放行：%s', (origin) => {
    const { next } = run('POST', '/api/v1/orders', origin);

    expect(next).toHaveBeenCalled();
  });

  it('GET 不檢查', () => {
    const { next } = run('GET', '/api/v1/orders', 'https://evil.example');

    expect(next).toHaveBeenCalled();
  });

  it('綠界回呼路徑不檢查（靠 CheckMacValue 驗證，Origin 是綠界網域）', () => {
    const { next } = run(
      'POST',
      '/api/v1/payments/ecpay/return',
      'https://payment-stage.ecpay.com.tw',
    );

    expect(next).toHaveBeenCalled();
  });

  it('環境變數多了結尾斜線也能比對（瀏覽器的 Origin 永遠沒有斜線）', () => {
    const lenient = createOriginCheck(['https://haude-web.vercel.app/']);
    const req = {
      method: 'POST',
      path: '/api/v1/orders',
      headers: { origin: 'https://haude-web.vercel.app' },
    } as unknown as Request;
    const res = {
      status: jest.fn(),
      setHeader: jest.fn(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    lenient(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('403 回應不可被快取', () => {
    const { res } = run('POST', '/api/v1/orders', 'https://evil.example');

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });
});
