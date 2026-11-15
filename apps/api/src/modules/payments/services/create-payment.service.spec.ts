import { CreatePaymentService } from './create-payment.service';
import { PaymentConfigService } from './payment-config.service';
import { PrismaService } from '@/prisma/prisma.service';
import { createMockPrismaService } from '../../../../test/utils/test-helpers';

describe('CreatePaymentService.createPayment', () => {
  let prisma: ReturnType<typeof createMockPrismaService> & {
    $queryRaw: jest.Mock;
  };
  let service: CreatePaymentService;

  const order = {
    id: 'order-1',
    userId: 'user-1',
    orderNumber: 'ORD-001',
    status: 'pending',
    paymentStatus: 'pending',
    totalAmount: 500,
    items: [{ productName: '茶', quantity: 1 }],
  };

  beforeEach(() => {
    prisma = Object.assign(createMockPrismaService(), {
      $queryRaw: jest.fn().mockResolvedValue([{ id: 'order-1' }]),
    });
    const paymentConfig = {
      getEnabledContext: () => ({
        config: {
          merchantId: 'M',
          notifyUrl: 'https://n',
          returnUrl: 'https://r',
          apiUrl: 'https://ecpay',
        },
        crypto: { createPaymentData: (p: object) => p },
      }),
    };
    service = new CreatePaymentService(
      prisma as unknown as PrismaService,
      paymentConfig as unknown as PaymentConfigService,
    );
    prisma.order.findFirst.mockResolvedValue(order);
    // Re-read inside the transaction, after the row lock.
    prisma.order.findUnique.mockResolvedValue({
      status: 'pending',
      paymentStatus: 'pending',
    });
  });

  it('locks the order row before checking for a pending payment', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.payment.create.mockResolvedValue({ id: 'pay-1' });

    await service.createPayment('order-1', 'user-1', 'CREDIT');

    expect(prisma.$transaction).toHaveBeenCalled();
    const lockSql = (prisma.$queryRaw.mock.calls[0][0] as string[]).join('?');
    expect(lockSql).toMatch(/FOR UPDATE/);
    const lockAt = prisma.$queryRaw.mock.invocationCallOrder[0];
    // The last findFirst is the re-check inside the transaction (the first
    // one is the cheap pre-check before any work).
    const calls = prisma.payment.findFirst.mock.invocationCallOrder;
    expect(lockAt).toBeLessThan(calls[calls.length - 1]);
    expect(lockAt).toBeLessThan(
      prisma.payment.create.mock.invocationCallOrder[0],
    );
  });

  it('reuses a pending payment found before the lock without opening a transaction', async () => {
    prisma.payment.findFirst.mockResolvedValue({ id: 'pay-existing' });
    const regen = jest.spyOn(service, 'regenerateFormData').mockResolvedValue({
      paymentId: 'pay-existing',
      formData: { action: 'a', method: 'POST', fields: {} },
    });

    await service.createPayment('order-1', 'user-1', 'CREDIT');

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(regen).toHaveBeenCalledWith('pay-existing', 'CREDIT');
  });

  it('refuses when the order was cancelled between the first check and the lock', async () => {
    prisma.payment.findFirst.mockResolvedValue(null);
    prisma.order.findUnique.mockResolvedValue({
      status: 'cancelled',
      paymentStatus: 'pending',
    });

    await expect(
      service.createPayment('order-1', 'user-1', 'CREDIT'),
    ).rejects.toThrow('此訂單狀態無法付款');
    expect(prisma.payment.create).not.toHaveBeenCalled();
  });

  it('reuses a pending payment that only appears after the lock (race)', async () => {
    prisma.payment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'pay-existing' });
    const regen = jest.spyOn(service, 'regenerateFormData').mockResolvedValue({
      paymentId: 'pay-existing',
      formData: { action: 'a', method: 'POST', fields: {} },
    });

    const result = await service.createPayment('order-1', 'user-1', 'CREDIT');

    expect(prisma.payment.create).not.toHaveBeenCalled();
    expect(regen).toHaveBeenCalledWith('pay-existing', 'CREDIT');
    expect(result.paymentId).toBe('pay-existing');
  });
});
