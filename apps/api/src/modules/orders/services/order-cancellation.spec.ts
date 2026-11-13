import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CancelOrderService } from './cancel-order.service';
import { OrderExpiryService } from './order-expiry.service';
import { QueryUserOrdersService } from './query-user-orders.service';
import { restoreOrderStock } from './order-stock';
import { NotificationsService } from '../../notifications/notifications.service';

/**
 * 取消訂單的三條路徑（顧客取消、付款逾期、後台改狀態）都會補庫存。
 * 每條都必須「狀態仍符合預期才寫入、寫入成功才補庫存」，
 * 否則兩條路徑同時取消同一張訂單會補兩次庫存。
 */
describe('訂單取消與補庫存', () => {
  const items = [
    { productId: 'p-2', quantity: 1 },
    { productId: 'p-1', quantity: 2 },
  ];

  const mockPrisma = {
    order: { updateMany: jest.fn() },
    product: { update: jest.fn() },
    payment: { update: jest.fn() },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(mockPrisma)),
  };
  const mockQueryUserOrders = { getOrderById: jest.fn() };
  const mockNotifications = { createOrderCancelledNotification: jest.fn() };

  /** fire-and-forget notifications settle on later microtasks */
  const flush = () => new Promise((resolve) => setImmediate(resolve));

  let cancelService: CancelOrderService;
  let expiryService: OrderExpiryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
    mockNotifications.createOrderCancelledNotification.mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CancelOrderService,
        OrderExpiryService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: QueryUserOrdersService, useValue: mockQueryUserOrders },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    cancelService = module.get(CancelOrderService);
    expiryService = module.get(OrderExpiryService);
  });

  describe('restoreOrderStock', () => {
    it('依商品 id 排序逐一補回庫存', async () => {
      await restoreOrderStock(mockPrisma as never, items);

      expect(mockPrisma.product.update.mock.calls).toEqual([
        [{ where: { id: 'p-1' }, data: { stock: { increment: 2 } } }],
        [{ where: { id: 'p-2' }, data: { stock: { increment: 1 } } }],
      ]);
    });
  });

  describe('顧客取消', () => {
    beforeEach(() => {
      mockQueryUserOrders.getOrderById.mockResolvedValue({
        id: 'order-1',
        orderNumber: 'ORD-1',
        status: 'pending',
        notes: null,
        items,
      });
    });

    it('只在訂單仍可取消時寫入，並補回庫存', async () => {
      await cancelService.cancelOrder('order-1', 'user-1', {});

      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-1', status: { in: ['pending', 'confirmed'] } },
        }),
      );
      expect(mockPrisma.product.update).toHaveBeenCalledTimes(2);
    });

    it('取消成功後通知後台，附上顧客填的原因', async () => {
      await cancelService.cancelOrder('order-1', 'user-1', {
        reason: '買錯了',
      });

      expect(
        mockNotifications.createOrderCancelledNotification,
      ).toHaveBeenCalledWith({
        id: 'order-1',
        orderNumber: 'ORD-1',
        reason: '顧客自行取消（買錯了）',
      });
    });

    it('通知失敗不影響取消結果', async () => {
      mockNotifications.createOrderCancelledNotification.mockRejectedValue(
        new Error('notify down'),
      );

      await expect(
        cancelService.cancelOrder('order-1', 'user-1', {}),
      ).resolves.toEqual({ message: '訂單已取消' });
    });

    it('讀取後已被其他路徑取消時回 400，且不補庫存', async () => {
      mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        cancelService.cancelOrder('order-1', 'user-1', {}),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('付款逾期取消', () => {
    const expiredAt = new Date('2020-01-01T00:00:00.000Z');

    it('逾期時取消並補回庫存', async () => {
      const result = await expiryService.checkAndExpireOrder(
        'order-1',
        'ORD-1',
        expiredAt,
        'pending',
        'pending',
        items,
        null,
      );

      expect(result).toBe(true);
      expect(mockPrisma.product.update).toHaveBeenCalledTimes(2);
    });

    it('逾期取消後通知後台', async () => {
      await expiryService.checkAndExpireOrder(
        'order-1',
        'ORD-1',
        expiredAt,
        'pending',
        'pending',
        items,
        null,
      );
      await flush();

      expect(
        mockNotifications.createOrderCancelledNotification,
      ).toHaveBeenCalledWith({
        id: 'order-1',
        orderNumber: 'ORD-1',
        reason: '付款逾期，系統自動取消',
      });
    });

    it('讀取後已被其他路徑改掉時不補庫存', async () => {
      mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });

      const result = await expiryService.checkAndExpireOrder(
        'order-1',
        'ORD-1',
        expiredAt,
        'pending',
        'pending',
        items,
        null,
      );

      expect(result).toBe(false);
      expect(mockPrisma.product.update).not.toHaveBeenCalled();
      expect(mockPrisma.payment.update).not.toHaveBeenCalled();
      await flush();
      expect(
        mockNotifications.createOrderCancelledNotification,
      ).not.toHaveBeenCalled();
    });
  });
});
