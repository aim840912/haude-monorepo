import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { UpdateOrderService } from './update-order.service';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { MembersService } from '../../members/members.service';

/**
 * UpdateOrderService 測試
 *
 * 管理員改訂單狀態是目前唯一的出貨流程（線上金流未啟用），因此：
 * - 只允許 ORDER_STATUS_TRANSITIONS 列出的轉換
 * - 副作用（補庫存、發 / 收回點數）綁在「進入某狀態」，且只會發生一次
 */
describe('UpdateOrderService', () => {
  let service: UpdateOrderService;

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    product: { update: jest.fn() },
    pointTransaction: { findFirst: jest.fn() },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(mockPrisma)),
  };
  const mockEmail = { sendShippingNotificationEmail: jest.fn() };
  const mockMembers = {
    updateTotalSpentAndCheckUpgrade: jest.fn(),
    addPointsForPurchase: jest.fn(),
    revokePurchasePoints: jest.fn(),
  };

  const baseOrder = {
    id: 'order-1',
    orderNumber: 'HD-001',
    userId: 'user-1',
    totalAmount: 1200,
    trackingNumber: null,
    user: { email: 'buyer@test.local', name: 'Buyer' },
    items: [
      { productId: 'p-1', quantity: 2 },
      { productId: 'p-2', quantity: 1 },
    ],
  };

  const givenOrder = (status: string) => {
    mockPrisma.order.findUnique.mockResolvedValue({ ...baseOrder, status });
  };

  // Let fire-and-forget side effects settle before asserting on them
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.pointTransaction.findFirst.mockResolvedValue(null);
    mockMembers.updateTotalSpentAndCheckUpgrade.mockResolvedValue({
      newTotalSpent: 1200,
      upgraded: false,
    });
    mockMembers.addPointsForPurchase.mockResolvedValue(1200);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOrderService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmail },
        { provide: MembersService, useValue: mockMembers },
      ],
    }).compile();

    service = module.get(UpdateOrderService);
  });

  describe('狀態轉換規則', () => {
    it('拒絕把已送達的訂單改回已出貨', async () => {
      givenOrder('delivered');

      await expect(
        service.updateOrderStatus('order-1', { status: 'shipped' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('拒絕把已取消的訂單改成已出貨', async () => {
      givenOrder('cancelled');

      await expect(
        service.updateOrderStatus('order-1', { status: 'shipped' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('拒絕取消處理中的訂單', async () => {
      givenOrder('processing');

      await expect(
        service.updateOrderStatus('order-1', { status: 'cancelled' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('被拒絕的轉換不會寫入資料庫', async () => {
      givenOrder('delivered');

      await service
        .updateOrderStatus('order-1', { status: 'pending' })
        .catch(() => undefined);

      expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('允許往前跳過中間狀態（待處理 → 已出貨）', async () => {
      givenOrder('pending');

      await expect(
        service.updateOrderStatus('order-1', { status: 'shipped' }),
      ).resolves.toBeDefined();
    });

    it('只改追蹤號（狀態不變）不受轉換規則限制', async () => {
      givenOrder('delivered');

      await expect(
        service.updateOrderStatus('order-1', { trackingNumber: 'TW123' }),
      ).resolves.toBeDefined();
    });

    it('狀態已被其他請求改掉時回 409', async () => {
      givenOrder('shipped');
      mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateOrderStatus('order-1', { status: 'delivered' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('取消', () => {
    it('後台取消訂單會補回每個商品的庫存', async () => {
      givenOrder('pending');

      await service.updateOrderStatus('order-1', { status: 'cancelled' });

      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p-1' },
        data: { stock: { increment: 2 } },
      });
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p-2' },
        data: { stock: { increment: 1 } },
      });
    });

    it('非取消的狀態變更不動庫存', async () => {
      givenOrder('pending');

      await service.updateOrderStatus('order-1', { status: 'confirmed' });

      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('送達發點數', () => {
    it('進入已送達時發點數並累積消費', async () => {
      givenOrder('shipped');

      await service.updateOrderStatus('order-1', { status: 'delivered' });
      await flush();

      expect(mockMembers.addPointsForPurchase).toHaveBeenCalledWith(
        'user-1',
        1200,
        'order-1',
      );
      expect(mockMembers.updateTotalSpentAndCheckUpgrade).toHaveBeenCalledWith(
        'user-1',
        1200,
      );
    });

    it('這張訂單已發過點數時不再重複發放', async () => {
      givenOrder('shipped');
      mockPrisma.pointTransaction.findFirst.mockResolvedValue({ id: 'pt-1' });

      await service.updateOrderStatus('order-1', { status: 'delivered' });
      await flush();

      expect(mockMembers.addPointsForPurchase).not.toHaveBeenCalled();
      expect(
        mockMembers.updateTotalSpentAndCheckUpgrade,
      ).not.toHaveBeenCalled();
    });
  });

  describe('退款收回點數', () => {
    it('已送達 → 已退款時收回這張訂單發出的點數，且不補庫存', async () => {
      givenOrder('delivered');

      await service.updateOrderStatus('order-1', { status: 'refunded' });
      await flush();

      expect(mockMembers.revokePurchasePoints).toHaveBeenCalledWith(
        'user-1',
        'order-1',
      );
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('出貨通知', () => {
    it('進入已出貨且有追蹤號時寄通知', async () => {
      givenOrder('processing');

      await service.updateOrderStatus('order-1', {
        status: 'shipped',
        trackingNumber: 'TW123',
      });
      await flush();

      expect(mockEmail.sendShippingNotificationEmail).toHaveBeenCalledWith(
        'buyer@test.local',
        'HD-001',
        'TW123',
        'Buyer',
      );
    });
  });
});
