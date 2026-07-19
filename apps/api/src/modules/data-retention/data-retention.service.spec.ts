import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DataRetentionService } from './data-retention.service';
import { PrismaService } from '@/prisma/prisma.service';

describe('DataRetentionService', () => {
  let service: DataRetentionService;
  let prisma: {
    paymentLog: { deleteMany: jest.Mock };
    auditLog: { deleteMany: jest.Mock };
    refreshToken: { deleteMany: jest.Mock };
  };
  let configValues: Record<string, string>;

  beforeEach(async () => {
    configValues = {};
    prisma = {
      paymentLog: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
      auditLog: { deleteMany: jest.fn().mockResolvedValue({ count: 5 }) },
      refreshToken: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataRetentionService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: { get: (k: string) => configValues[k] },
        },
      ],
    }).compile();

    service = module.get<DataRetentionService>(DataRetentionService);
  });

  function cutoffOf(mock: jest.Mock): Date {
    return mock.mock.calls[0][0].where.createdAt.lt as Date;
  }

  it('回傳各表刪除筆數', async () => {
    const result = await service.runCleanup();
    expect(result).toEqual({ paymentLogs: 3, auditLogs: 5, refreshTokens: 2 });
  });

  it('預設 paymentLog 保留 180 天、auditLog 保留 365 天', async () => {
    const before = Date.now();
    await service.runCleanup();

    const payDays =
      (before - cutoffOf(prisma.paymentLog.deleteMany).getTime()) / 86400000;
    const auditDays =
      (before - cutoffOf(prisma.auditLog.deleteMany).getTime()) / 86400000;

    expect(Math.round(payDays)).toBe(180);
    expect(Math.round(auditDays)).toBe(365);
  });

  it('可用環境變數覆寫保留天數', async () => {
    configValues.PAYMENT_LOG_RETENTION_DAYS = '30';
    const before = Date.now();
    await service.runCleanup();

    const payDays =
      (before - cutoffOf(prisma.paymentLog.deleteMany).getTime()) / 86400000;
    expect(Math.round(payDays)).toBe(30);
  });

  it('無效的環境變數值回退到預設（不可因設定錯誤而刪光資料）', async () => {
    configValues.PAYMENT_LOG_RETENTION_DAYS = 'abc';
    const before = Date.now();
    await service.runCleanup();

    const payDays =
      (before - cutoffOf(prisma.paymentLog.deleteMany).getTime()) / 86400000;
    expect(Math.round(payDays)).toBe(180);
  });

  it('保留天數為 0 或負數時回退到預設', async () => {
    configValues.AUDIT_LOG_RETENTION_DAYS = '0';
    const before = Date.now();
    await service.runCleanup();

    const auditDays =
      (before - cutoffOf(prisma.auditLog.deleteMany).getTime()) / 86400000;
    expect(Math.round(auditDays)).toBe(365);
  });

  it('排程失敗不拋出例外（不影響服務運作）', async () => {
    prisma.paymentLog.deleteMany.mockRejectedValueOnce(new Error('db down'));
    await expect(service.handleCron()).resolves.toBeUndefined();
  });
});
