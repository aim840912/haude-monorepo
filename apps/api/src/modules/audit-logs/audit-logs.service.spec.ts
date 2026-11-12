import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('AuditLogsService', () => {
  let prisma: {
    auditLog: {
      findMany: jest.Mock;
      count: jest.Mock;
      groupBy: jest.Mock;
    };
    user: { findMany: jest.Mock };
  };
  let service: AuditLogsService;

  beforeEach(() => {
    prisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      user: { findMany: jest.fn().mockResolvedValue([]) },
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

  it('沒有任何紀錄時不查使用者表', async () => {
    await expect(service.findOperators()).resolves.toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
