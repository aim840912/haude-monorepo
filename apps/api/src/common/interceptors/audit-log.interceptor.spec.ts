import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of, defer } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { PrismaService } from '@/prisma/prisma.service';
import type { AuditLogMetadata } from '../decorators/audit-log.decorator';

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe('AuditLogInterceptor', () => {
  let prisma: {
    auditLog: { create: jest.Mock };
    product: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    siteSetting: { findUnique: jest.Mock };
  };
  let metadata: AuditLogMetadata | undefined;
  let interceptor: AuditLogInterceptor;
  let calls: string[];

  function makeRequest(overrides: Record<string, unknown> = {}) {
    return {
      method: 'DELETE',
      url: '/api/v1/products/p1',
      params: { id: 'p1' },
      body: {},
      headers: { 'user-agent': 'jest' },
      ip: '127.0.0.1',
      user: { userId: 'admin-1' },
      ...overrides,
    };
  }

  function run(request: Record<string, unknown>, response: unknown = {}) {
    const context = {
      getHandler: () => () => undefined,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const next: CallHandler = {
      handle: () =>
        defer(() => {
          calls.push('handler');
          return of(response);
        }),
    };
    return lastValueFrom(interceptor.intercept(context, next));
  }

  function writtenData() {
    return prisma.auditLog.create.mock.calls[0][0].data;
  }

  beforeEach(() => {
    calls = [];
    metadata = { action: 'DELETE', resource: 'products' };
    prisma = {
      auditLog: { create: jest.fn().mockResolvedValue({}) },
      product: {
        findUnique: jest.fn().mockImplementation(() => {
          calls.push('snapshot');
          return Promise.resolve({ id: 'p1', name: '龍眼蜜', price: 550 });
        }),
      },
      user: { findUnique: jest.fn() },
      siteSetting: { findUnique: jest.fn() },
    };
    const reflector = { get: () => metadata } as unknown as Reflector;
    interceptor = new AuditLogInterceptor(
      reflector,
      prisma as unknown as PrismaService,
    );
  });

  it('刪除前先存下名稱與原始資料（刪除後就查不到了）', async () => {
    await run(makeRequest());
    await flush();

    expect(calls).toEqual(['snapshot', 'handler']);
    const data = writtenData();
    expect(data.operatorId).toBe('admin-1');
    expect(data.resourceId).toBe('p1');
    expect(data.summary).toContain('龍眼蜜');
    expect(data.metadata.label).toBe('龍眼蜜');
    expect(data.metadata.before).toMatchObject({ name: '龍眼蜜', price: 550 });
  });

  it('沒有 @AuditLog 的端點不查快照也不寫紀錄', async () => {
    metadata = undefined;
    await run(makeRequest());
    await flush();

    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('新增時從回應取得 ID 與名稱，不查快照', async () => {
    metadata = { action: 'CREATE', resource: 'products' };
    await run(makeRequest({ method: 'POST', params: {} }), {
      id: 'p9',
      name: '冬茶',
    });
    await flush();

    expect(prisma.product.findUnique).not.toHaveBeenCalled();
    expect(writtenData().resourceId).toBe('p9');
    expect(writtenData().metadata.label).toBe('冬茶');
  });

  it('快照與送出內容都剔除密碼類欄位', async () => {
    metadata = { action: 'UPDATE', resource: 'products' };
    prisma.product.findUnique.mockResolvedValue({
      name: '茶',
      passwordHash: 'x',
    });
    await run(
      makeRequest({ method: 'PUT', body: { name: '新茶', password: 'y' } }),
    );
    await flush();

    const meta = writtenData().metadata;
    expect(meta.before).toEqual({ name: '茶' });
    expect(meta.body).toEqual({ name: '新茶' });
  });

  it('改名時對象顯示新名稱，舊名稱留在改前資料', async () => {
    metadata = { action: 'UPDATE', resource: 'products' };
    await run(makeRequest({ method: 'PUT', body: { name: '冬茶' } }), {
      id: 'p1',
      name: '冬茶',
    });
    await flush();

    const meta = writtenData().metadata;
    expect(meta.label).toBe('冬茶');
    expect(meta.before.name).toBe('龍眼蜜');
  });

  it('圖片子路由只記產品名稱，不複製整筆產品資料', async () => {
    await run(
      makeRequest({
        url: '/api/v1/admin/products/p1/images/i1',
        route: { path: '/api/v1/admin/products/:id/images/:imageId' },
        params: { id: 'p1', imageId: 'i1' },
      }),
    );
    await flush();

    const meta = writtenData().metadata;
    expect(meta.label).toBe('龍眼蜜');
    expect(meta.before).toBeUndefined();
  });

  it('網站圖片（images/:key）是設定本身，刪除時保留改前資料', async () => {
    metadata = { action: 'DELETE', resource: 'site-settings', idParam: 'key' };
    prisma.siteSetting.findUnique.mockResolvedValue({
      key: 'hero',
      value: 'https://cdn/hero.png',
    });
    await run(
      makeRequest({
        url: '/api/v1/admin/site-settings/images/hero',
        route: { path: '/api/v1/admin/site-settings/images/:key' },
        params: { key: 'hero' },
      }),
    );
    await flush();

    expect(writtenData().metadata.before).toEqual({
      key: 'hero',
      value: 'https://cdn/hero.png',
    });
  });

  it('回應裡無關的名稱欄位不會蓋掉對象名稱', async () => {
    metadata = { action: 'UPDATE', resource: 'products' };
    await run(makeRequest({ method: 'PUT', body: { stock: 5 } }), {
      data: { code: 'OK' },
    });
    await flush();

    expect(writtenData().metadata.label).toBe('龍眼蜜');
  });

  it('IP 用 cf-connecting-ip，不採用可偽造的 x-forwarded-for', async () => {
    await run(
      makeRequest({
        headers: {
          'x-forwarded-for': '6.6.6.6',
          'cf-connecting-ip': '1.2.3.4',
        },
      }),
    );
    await flush();
    expect(writtenData().ipAddress).toBe('1.2.3.4');
  });

  it('快照查詢失敗時請求照常完成，紀錄仍寫入', async () => {
    prisma.product.findUnique.mockRejectedValue(new Error('db down'));
    await expect(run(makeRequest(), { ok: true })).resolves.toEqual({
      ok: true,
    });
    await flush();

    expect(writtenData().metadata.before).toBeUndefined();
  });
});
