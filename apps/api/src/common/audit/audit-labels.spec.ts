import { resolveAuditLabels } from './audit-labels';
import { PrismaService } from '@/prisma/prisma.service';

describe('resolveAuditLabels', () => {
  function makePrisma() {
    return {
      product: {
        findMany: jest.fn().mockResolvedValue([{ id: 'p1', name: '龍眼蜜' }]),
      },
      refund: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'r1', order: { orderNumber: 'HD20261113001' } },
          ]),
      },
      siteSetting: {
        findMany: jest.fn().mockResolvedValue([{ key: 'hero_image' }]),
      },
    };
  }

  it('庫存預警的對象是產品 ID，查出產品名稱', async () => {
    const prisma = makePrisma();
    const labels = await resolveAuditLabels(
      prisma as unknown as PrismaService,
      'stock-alerts',
      ['p1'],
    );
    expect(labels?.get('p1')).toBe('龍眼蜜');
  });

  it('退款以訂單編號當名稱', async () => {
    const prisma = makePrisma();
    const labels = await resolveAuditLabels(
      prisma as unknown as PrismaService,
      'refunds',
      ['r1'],
    );
    expect(labels?.get('r1')).toBe('HD20261113001');
  });

  it('網站設定的 key 就是名稱，不查資料庫，刪除後也照樣顯示', async () => {
    const prisma = makePrisma();
    const labels = await resolveAuditLabels(
      prisma as unknown as PrismaService,
      'site-settings',
      ['hero_image'],
    );
    expect(labels?.get('hero_image')).toBe('hero_image');
    expect(prisma.siteSetting.findMany).not.toHaveBeenCalled();
  });

  it('同一批 ID 只查一次並去重', async () => {
    const prisma = makePrisma();
    await resolveAuditLabels(prisma as unknown as PrismaService, 'products', [
      'p1',
      'p1',
      'p2',
    ]);
    expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.product.findMany.mock.calls[0][0].where).toEqual({
      id: { in: ['p1', 'p2'] },
    });
  });

  it('沒有查詢方式的類型回傳 null（未知），不是「找不到」', async () => {
    const prisma = makePrisma();
    const labels = await resolveAuditLabels(
      prisma as unknown as PrismaService,
      'banners',
      ['b1'],
    );
    expect(labels).toBeNull();
  });

  it('查詢失敗時回傳 null（未知），不拋錯也不當成已刪除', async () => {
    const prisma = makePrisma();
    prisma.product.findMany.mockRejectedValue(new Error('db down'));
    const labels = await resolveAuditLabels(
      prisma as unknown as PrismaService,
      'products',
      ['p1'],
    );
    expect(labels).toBeNull();
  });

  it('名稱空白的資料仍算存在，值為 null', async () => {
    const prisma = makePrisma();
    prisma.product.findMany.mockResolvedValue([{ id: 'p1', name: '  ' }]);
    const labels = await resolveAuditLabels(
      prisma as unknown as PrismaService,
      'products',
      ['p1', 'gone'],
    );
    expect(labels?.has('p1')).toBe(true);
    expect(labels?.get('p1')).toBeNull();
    expect(labels?.has('gone')).toBe(false);
  });
});
