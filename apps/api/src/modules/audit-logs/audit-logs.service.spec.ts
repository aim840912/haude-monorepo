import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AuditLogsService', () => {
  let prisma: {
    auditLog: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
    user: { findMany: jest.Mock };
    product: { findMany: jest.Mock };
  };
  let service: AuditLogsService;

  beforeEach(() => {
    prisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
      product: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new AuditLogsService(prisma as unknown as PrismaService);
  });

  it('日期以台灣時間解讀，結束日包含當天整天', () => {
    const where = service.buildWhere({ from: '2026-11-01', to: '2026-11-12' });
    expect(where.createdAt).toEqual({
      gte: new Date('2026-10-31T16:00:00.000Z'),
      lt: new Date('2026-11-12T16:00:00.000Z'),
    });
  });

  it('只帶入有給的篩選條件', () => {
    expect(service.buildWhere({ resource: 'products' })).toEqual({
      resource: 'products',
    });
  });

  it('依時間新到舊分頁查詢，並帶出操作者', async () => {
    prisma.auditLog.count.mockResolvedValue(120);
    const result = await service.findAll({ limit: 50, offset: 50 });

    expect(result.total).toBe(120);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 50,
        include: { operator: expect.any(Object) },
      }),
    );
  });

  describe('沒有記下名稱的紀錄，查詢時補上目前名稱', () => {
    const log = (
      id: string,
      resource: string,
      resourceId: string | null,
      label?: string,
    ) => ({
      id,
      resource,
      resourceId,
      metadata: label ? { label } : { method: 'PATCH' },
    });

    it('一次查出同類型的名稱，已記下名稱的不重查', async () => {
      prisma.auditLog.findMany.mockResolvedValue([
        log('a1', 'products', 'p1'),
        log('a2', 'stock-alerts', 'p2'),
        log('a3', 'products', 'p3', '冬茶'),
      ]);
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', name: '龍眼蜜' },
        { id: 'p2', name: '烏龍茶' },
      ]);

      const { data } = await service.findAll({});

      expect(data.map((d) => d.currentLabel)).toEqual([
        '龍眼蜜',
        '烏龍茶',
        undefined,
      ]);
      const queriedIds = prisma.product.findMany.mock.calls.flatMap(
        (c) => c[0].where.id.in,
      );
      expect(queriedIds).not.toContain('p3');
    });

    it('對象已不存在時標示為找不到，而不是留空', async () => {
      prisma.auditLog.findMany.mockResolvedValue([
        log('a1', 'products', 'gone'),
      ]);
      const { data } = await service.findAll({});
      expect(data[0].targetMissing).toBe(true);
      expect(data[0].currentLabel).toBeUndefined();
    });

    it('名稱查詢失敗時不標示為找不到（資料庫出錯 ≠ 已刪除）', async () => {
      prisma.auditLog.findMany.mockResolvedValue([log('a1', 'products', 'p1')]);
      prisma.product.findMany.mockRejectedValue(new Error('db down'));
      const { data } = await service.findAll({});
      expect(data[0].targetMissing).toBeUndefined();
    });

    it('空字串的名稱視同沒有名稱，會補查目前名稱', async () => {
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'a1',
          resource: 'products',
          resourceId: 'p1',
          metadata: { label: ' ' },
        },
      ]);
      prisma.product.findMany.mockResolvedValue([{ id: 'p1', name: '龍眼蜜' }]);
      const { data } = await service.findAll({});
      expect(data[0].currentLabel).toBe('龍眼蜜');
    });

    it('沒有查詢方式的類型不標示為找不到', async () => {
      prisma.auditLog.findMany.mockResolvedValue([log('a1', 'banners', 'b1')]);
      const { data } = await service.findAll({});
      expect(data[0].targetMissing).toBeUndefined();
    });
  });

  it('操作者清單只列出有紀錄的人，一次查詢完成', async () => {
    await service.findOperators();
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { auditLogs: { some: {} } } }),
    );
  });
});
