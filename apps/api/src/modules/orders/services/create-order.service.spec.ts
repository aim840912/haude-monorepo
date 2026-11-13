import { CreateOrderService } from './create-order.service';
import { CreateOrderDto } from '../dto';
import { PrismaService } from '@/prisma/prisma.service';
import { DiscountsService } from '../../discounts/discounts.service';
import { EmailService } from '../../email/email.service';
import { MembersService } from '../../members/members.service';
import { NotificationsService } from '../../notifications/notifications.service';

describe('CreateOrderService — admin notifications after an order', () => {
  const tx = {
    order: {
      create: jest.fn(),
    },
    product: {
      updateMany: jest.fn(),
    },
  };

  const prisma = {
    product: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    order: { count: jest.fn() },
    $transaction: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  };

  const discounts = {
    validateDiscountCode: jest.fn(),
    applyDiscount: jest.fn(),
  };
  const notifications = {
    checkAndCreateStockAlert: jest.fn(),
    createNewOrderNotification: jest.fn(),
  };
  const email = { sendOrderConfirmationEmail: jest.fn() };
  const members = { getLevelConfig: jest.fn() };

  const service = new CreateOrderService(
    prisma as unknown as PrismaService,
    discounts as unknown as DiscountsService,
    email as unknown as EmailService,
    members as unknown as MembersService,
    notifications as unknown as NotificationsService,
  );

  const dto = (discountCode?: string) =>
    ({
      items: [
        { productId: 'p1', quantity: 1 },
        { productId: 'p2', quantity: 2 },
        { productId: 'p1', quantity: 1 },
      ],
      shippingAddress: {
        name: '王小明',
        phone: '0912345678',
        city: '台北市',
        postalCode: '100',
        street: '中正路 1 號',
      },
      paymentMethod: 'STORE_CONTACT',
      discountCode,
    }) as unknown as CreateOrderDto;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.product.findUnique.mockImplementation(
      ({ where }: { where: { id: string } }) =>
        Promise.resolve({
          id: where.id,
          name: `商品 ${where.id}`,
          price: 100,
          priceUnit: '包',
          stock: 10,
          reservedStock: 0,
          images: [],
        }),
    );
    prisma.user.findUnique.mockResolvedValue({
      memberLevel: null,
      name: '王小明',
    });
    prisma.order.count.mockResolvedValue(0);
    tx.order.create.mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-1',
      items: [],
    });
    tx.product.updateMany.mockResolvedValue({ count: 1 });
    discounts.validateDiscountCode.mockResolvedValue({
      valid: true,
      discountAmount: 50,
      code: 'SAVE50',
    });
    notifications.checkAndCreateStockAlert.mockResolvedValue(null);
    notifications.createNewOrderNotification.mockResolvedValue({});
  });

  it('notifies admins of the new order', async () => {
    await service.createOrder('user-1', dto());

    expect(notifications.createNewOrderNotification).toHaveBeenCalledWith({
      id: 'order-1',
      orderNumber: 'ORD-1',
      totalAmount: tx.order.create.mock.calls[0][0].data.totalAmount,
      userName: '王小明',
    });
  });

  it('a failing new-order notification does not fail the order', async () => {
    notifications.createNewOrderNotification.mockRejectedValue(
      new Error('notify down'),
    );

    await expect(service.createOrder('user-1', dto())).resolves.toMatchObject({
      id: 'order-1',
    });
  });

  it('checks each ordered product once', async () => {
    await service.createOrder('user-1', dto());

    expect(notifications.checkAndCreateStockAlert).toHaveBeenCalledTimes(2);
    expect(notifications.checkAndCreateStockAlert).toHaveBeenCalledWith('p1');
    expect(notifications.checkAndCreateStockAlert).toHaveBeenCalledWith('p2');
  });

  it('still checks stock when recording the discount fails after commit', async () => {
    discounts.applyDiscount.mockRejectedValue(new Error('db hiccup'));

    await expect(service.createOrder('user-1', dto('SAVE50'))).rejects.toThrow(
      'db hiccup',
    );

    expect(notifications.checkAndCreateStockAlert).toHaveBeenCalledTimes(2);
  });

  it('a failing alert check does not fail the order', async () => {
    notifications.checkAndCreateStockAlert.mockRejectedValue(
      new Error('notify down'),
    );

    await expect(service.createOrder('user-1', dto())).resolves.toMatchObject({
      id: 'order-1',
    });
  });
});
