import { Test, TestingModule } from '@nestjs/testing';
import { DiscountsService } from './discounts.service';
import { PrismaService } from '@/prisma/prisma.service';
import { DiscountType } from '@prisma/client';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

describe('DiscountsService', () => {
  let service: DiscountsService;
  let prisma: PrismaService;

  // Mock Prisma
  const mockPrismaService = {
    discountCode: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    discountUsage: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
    prisma = module.get<PrismaService>(PrismaService);

    // 清除所有 mock
    jest.clearAllMocks();
  });

  describe('validateDiscountCode', () => {
    const userId = 'user-123';
    const subtotal = 1000;

    it('折扣碼不存在應回傳 valid: false', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue(null);

      const result = await service.validateDiscountCode(
        'INVALID',
        userId,
        subtotal,
      );

      expect(result.valid).toBe(false);
      expect(result.message).toBe('折扣碼不存在');
    });

    it('折扣碼已停用應回傳 valid: false', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'discount-1',
        code: 'TEST10',
        isActive: false,
        usages: [],
      });

      const result = await service.validateDiscountCode(
        'TEST10',
        userId,
        subtotal,
      );

      expect(result.valid).toBe(false);
      expect(result.message).toBe('此折扣碼已停用');
    });

    it('折扣碼尚未開始應回傳 valid: false', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7); // 7 天後

      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'discount-1',
        code: 'FUTURE',
        isActive: true,
        startDate: futureDate,
        endDate: null,
        usages: [],
      });

      const result = await service.validateDiscountCode(
        'FUTURE',
        userId,
        subtotal,
      );

      expect(result.valid).toBe(false);
      expect(result.message).toBe('此折扣碼尚未開始');
    });

    it('折扣碼已過期應回傳 valid: false', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7); // 7 天前

      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'discount-1',
        code: 'EXPIRED',
        isActive: true,
        startDate: null,
        endDate: pastDate,
        usages: [],
      });

      const result = await service.validateDiscountCode(
        'EXPIRED',
        userId,
        subtotal,
      );

      expect(result.valid).toBe(false);
      expect(result.message).toBe('此折扣碼已過期');
    });

    it('總使用次數達上限應回傳 valid: false', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'discount-1',
        code: 'LIMIT100',
        isActive: true,
        startDate: null,
        endDate: null,
        usageLimit: 100,
        usageCount: 100, // 已達上限
        perUserLimit: 1,
        usages: [],
      });

      const result = await service.validateDiscountCode(
        'LIMIT100',
        userId,
        subtotal,
      );

      expect(result.valid).toBe(false);
      expect(result.message).toBe('此折扣碼已達使用上限');
    });

    it('用戶已達使用次數上限應回傳 valid: false', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'discount-1',
        code: 'ONCE',
        isActive: true,
        startDate: null,
        endDate: null,
        usageLimit: null,
        usageCount: 0,
        perUserLimit: 1,
        usages: [{ id: 'usage-1', userId }], // 用戶已使用過
      });

      const result = await service.validateDiscountCode(
        'ONCE',
        userId,
        subtotal,
      );

      expect(result.valid).toBe(false);
      expect(result.message).toBe('您已達此折扣碼的使用次數上限');
    });

    it('訂單金額未達最低限制應回傳 valid: false', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'discount-1',
        code: 'MIN2000',
        isActive: true,
        startDate: null,
        endDate: null,
        usageLimit: null,
        usageCount: 0,
        perUserLimit: 1,
        minOrderAmount: 2000, // 最低消費 2000
        usages: [],
      });

      const result = await service.validateDiscountCode(
        'MIN2000',
        userId,
        1000,
      ); // 只有 1000

      expect(result.valid).toBe(false);
      expect(result.message).toBe('訂單金額需滿 NT$2000 才能使用此折扣碼');
    });

    it('所有驗證通過應回傳 valid: true 及折扣金額', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'discount-1',
        code: 'TEST10',
        description: '測試折扣',
        isActive: true,
        startDate: null,
        endDate: null,
        usageLimit: null,
        usageCount: 0,
        perUserLimit: 1,
        minOrderAmount: null,
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        maxDiscount: null,
        usages: [],
      });

      const result = await service.validateDiscountCode('TEST10', userId, 1000);

      expect(result.valid).toBe(true);
      expect(result.discountType).toBe(DiscountType.PERCENTAGE);
      expect(result.discountValue).toBe(10);
      expect(result.discountAmount).toBe(100); // 1000 * 10% = 100
      expect(result.code).toBe('TEST10');
    });

    it('折扣碼應正規化為大寫並去除空白', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue(null);

      await service.validateDiscountCode('  test10  ', userId, subtotal);

      expect(mockPrismaService.discountCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'TEST10' },
        include: { usages: { where: { userId } } },
      });
    });
  });

  describe('calculateDiscountAmount（透過 validateDiscountCode 間接測試）', () => {
    const userId = 'user-123';

    describe('百分比折扣', () => {
      it('10% 折扣於 1000 元應折 100 元', async () => {
        mockPrismaService.discountCode.findUnique.mockResolvedValue({
          id: 'discount-1',
          code: 'TEST10',
          isActive: true,
          startDate: null,
          endDate: null,
          usageLimit: null,
          usageCount: 0,
          perUserLimit: 1,
          minOrderAmount: null,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
          maxDiscount: null,
          usages: [],
        });

        const result = await service.validateDiscountCode(
          'TEST10',
          userId,
          1000,
        );

        expect(result.discountAmount).toBe(100);
      });

      it('結果應無條件捨去小數', async () => {
        mockPrismaService.discountCode.findUnique.mockResolvedValue({
          id: 'discount-1',
          code: 'TEST15',
          isActive: true,
          startDate: null,
          endDate: null,
          usageLimit: null,
          usageCount: 0,
          perUserLimit: 1,
          minOrderAmount: null,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 15, // 15%
          maxDiscount: null,
          usages: [],
        });

        // 777 * 15% = 116.55 → 應該是 116
        const result = await service.validateDiscountCode(
          'TEST15',
          userId,
          777,
        );

        expect(result.discountAmount).toBe(116);
      });

      it('有 maxDiscount 時不應超過上限', async () => {
        mockPrismaService.discountCode.findUnique.mockResolvedValue({
          id: 'discount-1',
          code: 'TEST20',
          isActive: true,
          startDate: null,
          endDate: null,
          usageLimit: null,
          usageCount: 0,
          perUserLimit: 1,
          minOrderAmount: null,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 20, // 20%
          maxDiscount: 100, // 最高折 100 元
          usages: [],
        });

        // 1000 * 20% = 200，但最高只能折 100
        const result = await service.validateDiscountCode(
          'TEST20',
          userId,
          1000,
        );

        expect(result.discountAmount).toBe(100);
      });

      it('折扣金額未達 maxDiscount 時應使用實際折扣', async () => {
        mockPrismaService.discountCode.findUnique.mockResolvedValue({
          id: 'discount-1',
          code: 'TEST10',
          isActive: true,
          startDate: null,
          endDate: null,
          usageLimit: null,
          usageCount: 0,
          perUserLimit: 1,
          minOrderAmount: null,
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10, // 10%
          maxDiscount: 200, // 最高折 200 元
          usages: [],
        });

        // 500 * 10% = 50，未超過 maxDiscount
        const result = await service.validateDiscountCode(
          'TEST10',
          userId,
          500,
        );

        expect(result.discountAmount).toBe(50);
      });
    });

    describe('固定金額折扣', () => {
      it('固定折扣 100 元應直接折 100 元', async () => {
        mockPrismaService.discountCode.findUnique.mockResolvedValue({
          id: 'discount-1',
          code: 'FIX100',
          isActive: true,
          startDate: null,
          endDate: null,
          usageLimit: null,
          usageCount: 0,
          perUserLimit: 1,
          minOrderAmount: null,
          discountType: DiscountType.FIXED,
          discountValue: 100,
          maxDiscount: null,
          usages: [],
        });

        const result = await service.validateDiscountCode(
          'FIX100',
          userId,
          1000,
        );

        expect(result.discountAmount).toBe(100);
      });

      it('折扣金額不應超過訂單金額', async () => {
        mockPrismaService.discountCode.findUnique.mockResolvedValue({
          id: 'discount-1',
          code: 'FIX500',
          isActive: true,
          startDate: null,
          endDate: null,
          usageLimit: null,
          usageCount: 0,
          perUserLimit: 1,
          minOrderAmount: null,
          discountType: DiscountType.FIXED,
          discountValue: 500, // 折 500 元
          maxDiscount: null,
          usages: [],
        });

        // 訂單只有 300 元，折扣最多只能折 300
        const result = await service.validateDiscountCode(
          'FIX500',
          userId,
          300,
        );

        expect(result.discountAmount).toBe(300);
      });
    });
  });

  describe('findById', () => {
    it('找不到折扣碼應拋出 NotFoundException', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('找到折扣碼應回傳完整資料', async () => {
      const mockDiscount = {
        id: 'discount-1',
        code: 'TEST10',
        usages: [],
        _count: { usages: 5 },
      };
      mockPrismaService.discountCode.findUnique.mockResolvedValue(mockDiscount);

      const result = await service.findById('discount-1');

      expect(result).toEqual(mockDiscount);
    });
  });

  describe('create', () => {
    it('折扣碼已存在應拋出 ConflictException', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'existing',
      });

      await expect(
        service.create({
          code: 'EXISTING',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 10,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('百分比折扣超過 100% 應拋出 BadRequestException', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          code: 'OVER100',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 150, // 超過 100%
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('應成功建立折扣碼並正規化為大寫', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue(null);
      mockPrismaService.discountCode.create.mockResolvedValue({
        id: 'new-discount',
      });

      await service.create({
        code: '  newcode  ', // 小寫且有空白
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
      });

      expect(mockPrismaService.discountCode.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'NEWCODE', // 應正規化為大寫
        }),
      });
    });
  });

  describe('delete', () => {
    it('找不到折扣碼應拋出 NotFoundException', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue(null);

      await expect(service.delete('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('有使用記錄的折扣碼應停用而非刪除', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'discount-1',
        _count: { usages: 5 }, // 有 5 筆使用記錄
      });
      mockPrismaService.discountCode.update.mockResolvedValue({
        id: 'discount-1',
        isActive: false,
      });

      await service.delete('discount-1');

      expect(mockPrismaService.discountCode.update).toHaveBeenCalledWith({
        where: { id: 'discount-1' },
        data: { isActive: false },
      });
      expect(mockPrismaService.discountCode.delete).not.toHaveBeenCalled();
    });

    it('沒有使用記錄的折扣碼應直接刪除', async () => {
      mockPrismaService.discountCode.findUnique.mockResolvedValue({
        id: 'discount-1',
        _count: { usages: 0 }, // 沒有使用記錄
      });
      mockPrismaService.discountCode.delete.mockResolvedValue({
        id: 'discount-1',
      });

      await service.delete('discount-1');

      expect(mockPrismaService.discountCode.delete).toHaveBeenCalledWith({
        where: { id: 'discount-1' },
      });
    });
  });
});
