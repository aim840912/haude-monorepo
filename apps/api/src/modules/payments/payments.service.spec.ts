import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { ECPayCrypto } from './utils/ecpay-crypto';

describe('PaymentsService', () => {
  let service: PaymentsService;

  // 測試用的 ECPay 配置
  const TEST_CONFIG = {
    ECPAY_MERCHANT_ID: '2000132',
    ECPAY_HASH_KEY: '5294y06JbISpM5x9',
    ECPAY_HASH_IV: 'v77hoKGq4kWxNNIS',
    ECPAY_API_URL: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
    ECPAY_NOTIFY_URL: 'https://example.com/payments/notify',
    ECPAY_RETURN_URL: 'https://example.com/payments/return',
  };

  // 用於生成正確的 CheckMacValue
  const testCrypto = new ECPayCrypto(
    TEST_CONFIG.ECPAY_HASH_KEY,
    TEST_CONFIG.ECPAY_HASH_IV,
  );

  // Mock Prisma
  const mockPrismaService = {
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    paymentLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn((key: string) => TEST_CONFIG[key as keyof typeof TEST_CONFIG]),
  };

  // Mock EmailService
  const mockEmailService = {
    sendPaymentSuccessEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);

    // 清除所有 mock
    jest.clearAllMocks();
  });

  describe('handleNotify', () => {
    describe('CheckMacValue 驗證', () => {
      it('驗證失敗應記錄錯誤並回傳 false', async () => {
        const invalidBody = {
          MerchantTradeNo: 'TEST123',
          RtnCode: '1',
          CheckMacValue: 'INVALID_MAC_VALUE',
        };

        const result = await service.handleNotify(invalidBody);

        expect(result).toBe(false);
        expect(mockPrismaService.paymentLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            logType: 'error',
            verified: false,
          }),
        });
      });

      it('驗證失敗應建立 PaymentLog', async () => {
        const invalidBody = {
          MerchantTradeNo: 'TEST123',
          RtnCode: '1',
          CheckMacValue: 'WRONG_MAC',
        };

        await service.handleNotify(invalidBody, '192.168.1.1');

        expect(mockPrismaService.paymentLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            merchantOrderNo: 'TEST123',
            logType: 'error',
            verified: false,
            ipAddress: '192.168.1.1',
          }),
        });
      });
    });

    describe('冪等性處理', () => {
      it('付款狀態已為 paid 應直接回傳 true', async () => {
        const body = {
          MerchantTradeNo: 'TEST123',
          RtnCode: '1',
          TradeNo: 'ECPay123',
        };
        // 加上正確的 CheckMacValue
        const checkMac = testCrypto.generateCheckMacValue(body);
        const bodyWithMac = { ...body, CheckMacValue: checkMac };

        mockPrismaService.payment.findUnique.mockResolvedValue({
          id: 'payment-1',
          orderId: 'order-1',
          status: 'paid', // 已付款
          order: { orderNumber: 'ORD-001' },
        });

        const result = await service.handleNotify(bodyWithMac);

        expect(result).toBe(true);
        // 不應該更新 payment
        expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
      });

      it('重複通知不應重複更新資料', async () => {
        const body = {
          MerchantTradeNo: 'TEST123',
          RtnCode: '1',
        };
        const checkMac = testCrypto.generateCheckMacValue(body);
        const bodyWithMac = { ...body, CheckMacValue: checkMac };

        mockPrismaService.payment.findUnique.mockResolvedValue({
          id: 'payment-1',
          orderId: 'order-1',
          status: 'paid',
          order: { orderNumber: 'ORD-001' },
        });

        // 呼叫兩次
        await service.handleNotify(bodyWithMac);
        await service.handleNotify(bodyWithMac);

        // $transaction 不應該被呼叫
        expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      });
    });

    describe('付款成功處理', () => {
      it('RtnCode = 1 應更新 Payment 為 paid', async () => {
        const body = {
          MerchantTradeNo: 'TEST123',
          RtnCode: '1',
          TradeNo: 'ECPay456',
          PaymentDate: '2024/01/15 10:30:00',
        };
        const checkMac = testCrypto.generateCheckMacValue(body);
        const bodyWithMac = { ...body, CheckMacValue: checkMac };

        mockPrismaService.payment.findUnique.mockResolvedValue({
          id: 'payment-1',
          orderId: 'order-1',
          amount: 1000,
          paymentType: 'CREDIT',
          status: 'pending',
          order: { orderNumber: 'ORD-001' },
        });
        mockPrismaService.order.findUnique.mockResolvedValue({
          id: 'order-1',
          user: { email: 'test@example.com', name: '測試' },
        });

        const result = await service.handleNotify(bodyWithMac);

        expect(result).toBe(true);
        expect(mockPrismaService.$transaction).toHaveBeenCalled();
      });

      it('應同時更新 Order 狀態為 confirmed', async () => {
        const body = {
          MerchantTradeNo: 'TEST123',
          RtnCode: '1',
          TradeNo: 'ECPay456',
        };
        const checkMac = testCrypto.generateCheckMacValue(body);
        const bodyWithMac = { ...body, CheckMacValue: checkMac };

        mockPrismaService.payment.findUnique.mockResolvedValue({
          id: 'payment-1',
          orderId: 'order-1',
          amount: 1000,
          paymentType: 'CREDIT',
          status: 'pending',
          order: { orderNumber: 'ORD-001' },
        });
        mockPrismaService.order.findUnique.mockResolvedValue({
          id: 'order-1',
          user: { email: 'test@example.com' },
        });

        await service.handleNotify(bodyWithMac);

        // 檢查 $transaction 內的 order.update 被呼叫
        expect(mockPrismaService.$transaction).toHaveBeenCalled();
        // 由於 $transaction 是 mock，我們檢查 order.update 被呼叫
        expect(mockPrismaService.order.update).toHaveBeenCalledWith({
          where: { id: 'order-1' },
          data: expect.objectContaining({
            paymentStatus: 'paid',
            status: 'confirmed',
          }),
        });
      });

      it('應記錄 tradeNo 和 payTime', async () => {
        const body = {
          MerchantTradeNo: 'TEST123',
          RtnCode: '1',
          TradeNo: 'ECPay789',
          PaymentDate: '2024/01/15 10:30:00',
        };
        const checkMac = testCrypto.generateCheckMacValue(body);
        const bodyWithMac = { ...body, CheckMacValue: checkMac };

        mockPrismaService.payment.findUnique.mockResolvedValue({
          id: 'payment-1',
          orderId: 'order-1',
          amount: 1000,
          paymentType: 'CREDIT',
          status: 'pending',
          order: { orderNumber: 'ORD-001' },
        });
        mockPrismaService.order.findUnique.mockResolvedValue({
          id: 'order-1',
          user: { email: 'test@example.com' },
        });

        await service.handleNotify(bodyWithMac);

        expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
          where: { id: 'payment-1' },
          data: expect.objectContaining({
            status: 'paid',
            tradeNo: 'ECPay789',
          }),
        });
      });
    });

    describe('付款失敗處理', () => {
      it('RtnCode != 1 應更新 Payment 為 failed', async () => {
        const body = {
          MerchantTradeNo: 'TEST123',
          RtnCode: '0', // 失敗
          RtnMsg: '交易失敗',
        };
        const checkMac = testCrypto.generateCheckMacValue(body);
        const bodyWithMac = { ...body, CheckMacValue: checkMac };

        mockPrismaService.payment.findUnique.mockResolvedValue({
          id: 'payment-1',
          orderId: 'order-1',
          status: 'pending',
          order: { orderNumber: 'ORD-001' },
        });

        const result = await service.handleNotify(bodyWithMac);

        expect(result).toBe(true);
        expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
          where: { id: 'payment-1' },
          data: expect.objectContaining({
            status: 'failed',
          }),
        });
      });

      it('應更新 Order paymentStatus 為 failed', async () => {
        const body = {
          MerchantTradeNo: 'TEST123',
          RtnCode: '0',
          RtnMsg: '餘額不足',
        };
        const checkMac = testCrypto.generateCheckMacValue(body);
        const bodyWithMac = { ...body, CheckMacValue: checkMac };

        mockPrismaService.payment.findUnique.mockResolvedValue({
          id: 'payment-1',
          orderId: 'order-1',
          status: 'pending',
          order: { orderNumber: 'ORD-001' },
        });

        await service.handleNotify(bodyWithMac);

        expect(mockPrismaService.order.update).toHaveBeenCalledWith({
          where: { id: 'order-1' },
          data: { paymentStatus: 'failed' },
        });
      });
    });

    describe('找不到付款記錄', () => {
      it('找不到 Payment 應記錄錯誤並回傳 false', async () => {
        const body = {
          MerchantTradeNo: 'NONEXISTENT',
          RtnCode: '1',
        };
        const checkMac = testCrypto.generateCheckMacValue(body);
        const bodyWithMac = { ...body, CheckMacValue: checkMac };

        mockPrismaService.payment.findUnique.mockResolvedValue(null);

        const result = await service.handleNotify(bodyWithMac);

        expect(result).toBe(false);
      });
    });
  });

  describe('handlePaymentInfo', () => {
    it('ATM 取號成功應儲存銀行代碼和虛擬帳號', async () => {
      const body = {
        MerchantTradeNo: 'TEST123',
        RtnCode: '2', // ATM 取號成功
        TradeNo: 'ECPay123',
        BankCode: '012',
        vAccount: '1234567890123456',
        ExpireDate: '2024/01/18 23:59:59',
      };
      const checkMac = testCrypto.generateCheckMacValue(body);
      const bodyWithMac = { ...body, CheckMacValue: checkMac };

      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        paymentType: 'ATM',
        order: { orderNumber: 'ORD-001' },
      });

      await service.handlePaymentInfo(bodyWithMac);

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          bankCode: '012',
          vaAccount: '1234567890123456',
        }),
      });
    });

    it('CVS 取號成功應儲存繳費代碼', async () => {
      const body = {
        MerchantTradeNo: 'TEST123',
        RtnCode: '10100073', // CVS 取號成功
        TradeNo: 'ECPay123',
        PaymentNo: 'CVS123456789',
        ExpireDate: '2024/01/22 23:59:59',
      };
      const checkMac = testCrypto.generateCheckMacValue(body);
      const bodyWithMac = { ...body, CheckMacValue: checkMac };

      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        paymentType: 'CVS',
        order: { orderNumber: 'ORD-001' },
      });

      await service.handlePaymentInfo(bodyWithMac);

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          paymentCode: 'CVS123456789',
        }),
      });
    });

    it('應正確解析繳費期限', async () => {
      const body = {
        MerchantTradeNo: 'TEST123',
        RtnCode: '2',
        BankCode: '012',
        vAccount: '1234567890123456',
        ExpireDate: '2024/01/18 23:59:59',
      };
      const checkMac = testCrypto.generateCheckMacValue(body);
      const bodyWithMac = { ...body, CheckMacValue: checkMac };

      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        paymentType: 'ATM',
        order: { orderNumber: 'ORD-001' },
      });

      await service.handlePaymentInfo(bodyWithMac);

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          expireDate: expect.any(Date),
        }),
      });
    });
  });

  describe('getPaymentStatus', () => {
    it('訂單不存在應拋出 NotFoundException', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue(null);

      await expect(
        service.getPaymentStatus('non-existent', 'user-123'),
      ).rejects.toThrow();
    });

    it('應回傳正確的付款狀態', async () => {
      mockPrismaService.order.findFirst.mockResolvedValue({
        id: 'order-1',
        paymentStatus: 'paid',
      });
      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        status: 'paid',
        payTime: new Date('2024-01-15'),
        tradeNo: 'ECPay123',
      });

      const result = await service.getPaymentStatus('order-1', 'user-123');

      expect(result.status).toBe('paid');
      expect(result.tradeNo).toBe('ECPay123');
    });
  });
});
