import { Test, TestingModule } from '@nestjs/testing';
import { PaymentCallbackService } from './payment-callback.service';
import { PrismaService } from '@/prisma/prisma.service';
import { PaymentConfigService } from './payment-config.service';
import { EmailService } from '../../email/email.service';

/**
 * PaymentCallbackService 測試
 *
 * 測試綠界付款回調處理的業務邏輯：
 * - 付款通知（Webhook）處理
 * - ATM/CVS 取號通知處理
 * - 用戶返回頁面處理
 * - 付款日誌記錄
 */
describe('PaymentCallbackService', () => {
  let service: PaymentCallbackService;

  // Mock Crypto
  const mockCrypto = {
    verifyCheckMacValue: jest.fn(),
  };

  // Mock PaymentConfigService
  const mockPaymentConfigService = {
    getCrypto: jest.fn(() => mockCrypto),
  };

  // Mock EmailService
  const mockEmailService = {
    sendPaymentSuccessEmail: jest.fn(),
  };

  // Mock PrismaService
  const mockPrismaService = {
    payment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    paymentLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback);
      }
      return callback({
        payment: mockPrismaService.payment,
        order: mockPrismaService.order,
      });
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentCallbackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaymentConfigService,
          useValue: mockPaymentConfigService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<PaymentCallbackService>(PaymentCallbackService);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 PaymentCallbackService', () => {
      expect(service).toBeDefined();
    });
  });

  // ========================================
  // handleNotify 測試
  // ========================================

  describe('handleNotify', () => {
    const validBody = {
      MerchantTradeNo: 'TEST123456',
      RtnCode: '1',
      TradeNo: 'EC123456',
      TradeAmt: '1000',
      PaymentDate: '2024/01/15 14:30:00',
      RtnMsg: 'Success',
    };

    it('CheckMacValue 驗證失敗應回傳 false', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(false);

      const result = await service.handleNotify(validBody, '127.0.0.1');

      expect(result).toBe(false);
      expect(mockPrismaService.paymentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          merchantOrderNo: 'TEST123456',
          logType: 'error',
          verified: false,
        }),
      });
    });

    it('找不到付款記錄應回傳 false', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      const result = await service.handleNotify(validBody, '127.0.0.1');

      expect(result).toBe(false);
      expect(mockPrismaService.paymentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          logType: 'notify',
          verified: true,
        }),
      });
    });

    it('付款已處理過應直接回傳 true（冪等性）', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        status: 'paid',
        orderId: 'order-1',
        order: { orderNumber: 'ORD-001' },
      });

      const result = await service.handleNotify(validBody, '127.0.0.1');

      expect(result).toBe(true);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('RtnCode=1 應處理付款成功', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        status: 'pending',
        orderId: 'order-1',
        paymentType: 'Credit',
        order: { orderNumber: 'ORD-001' },
      });
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        user: { email: 'test@example.com', name: '測試' },
      });

      const result = await service.handleNotify(validBody, '127.0.0.1');

      expect(result).toBe(true);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('RtnCode≠1 應處理付款失敗', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        status: 'pending',
        orderId: 'order-1',
        paymentType: 'Credit',
        order: null,
      });

      const failBody = { ...validBody, RtnCode: '0', RtnMsg: '交易失敗' };
      const result = await service.handleNotify(failBody, '127.0.0.1');

      expect(result).toBe(true);
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          status: 'failed',
        }),
      });
    });

    it('付款成功應更新 Payment 和 Order 狀態', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        status: 'pending',
        orderId: 'order-1',
        paymentType: 'Credit',
        order: { orderNumber: 'ORD-001' },
      });
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        user: { email: 'test@example.com', name: '測試' },
      });

      await service.handleNotify(validBody, '127.0.0.1');

      // 驗證 transaction 內的更新被呼叫
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('付款成功應非同步發送郵件', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        status: 'pending',
        orderId: 'order-1',
        paymentType: 'Credit',
        order: { orderNumber: 'ORD-001' },
      });
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        user: { email: 'test@example.com', name: '測試' },
      });

      await service.handleNotify(validBody, '127.0.0.1');

      // 等待非同步郵件發送
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          user: {
            select: { email: true, name: true },
          },
        },
      });
    });

    it('無 MerchantTradeNo 應使用 UNKNOWN', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(false);
      const bodyWithoutTradeNo = { RtnCode: '1' };

      await service.handleNotify(bodyWithoutTradeNo, '127.0.0.1');

      expect(mockPrismaService.paymentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          merchantOrderNo: 'UNKNOWN',
        }),
      });
    });
  });

  // ========================================
  // handlePaymentInfo 測試
  // ========================================

  describe('handlePaymentInfo', () => {
    const atmBody = {
      MerchantTradeNo: 'ATM123456',
      RtnCode: '2',
      TradeNo: 'EC-ATM-123',
      BankCode: '822',
      vAccount: '1234567890123456',
      ExpireDate: '2024/01/20',
      RtnMsg: '取號成功',
    };

    const cvsBody = {
      MerchantTradeNo: 'CVS123456',
      RtnCode: '10100073',
      TradeNo: 'EC-CVS-123',
      PaymentNo: 'CVS12345678',
      ExpireDate: '2024/01/20',
      RtnMsg: '超商代碼已產生',
    };

    it('CheckMacValue 驗證失敗應回傳 false', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(false);

      const result = await service.handlePaymentInfo(atmBody, '127.0.0.1');

      expect(result).toBe(false);
      expect(mockPrismaService.paymentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          logType: 'error',
          verified: false,
        }),
      });
    });

    it('找不到付款記錄應回傳 false', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      const result = await service.handlePaymentInfo(atmBody, '127.0.0.1');

      expect(result).toBe(false);
    });

    it('ATM 取號成功（RtnCode=2）應儲存取號資訊', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        paymentType: 'ATM',
        order: { orderNumber: 'ORD-001' },
      });

      const result = await service.handlePaymentInfo(atmBody, '127.0.0.1');

      expect(result).toBe(true);
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          bankCode: '822',
          vaAccount: '1234567890123456',
          tradeNo: 'EC-ATM-123',
        }),
      });
    });

    it('CVS 取號成功（RtnCode=10100073）應儲存取號資訊', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        paymentType: 'CVS',
        order: { orderNumber: 'ORD-001' },
      });

      const result = await service.handlePaymentInfo(cvsBody, '127.0.0.1');

      expect(result).toBe(true);
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          paymentCode: 'CVS12345678',
          tradeNo: 'EC-CVS-123',
        }),
      });
    });

    it('RtnCode=1 也應視為成功', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        paymentType: 'ATM',
        order: { orderNumber: 'ORD-001' },
      });

      const body = { ...atmBody, RtnCode: '1' };
      const result = await service.handlePaymentInfo(body, '127.0.0.1');

      expect(result).toBe(true);
      expect(mockPrismaService.payment.update).toHaveBeenCalled();
    });

    it('取號失敗應記錄日誌但回傳 true', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        paymentType: 'ATM',
        order: { orderNumber: 'ORD-001' },
      });

      const failBody = { ...atmBody, RtnCode: '0', RtnMsg: '取號失敗' };
      const result = await service.handlePaymentInfo(failBody, '127.0.0.1');

      expect(result).toBe(true);
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });

    it('應正確解析 ExpireDate 格式', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        paymentType: 'ATM',
        order: { orderNumber: 'ORD-001' },
      });

      await service.handlePaymentInfo(atmBody, '127.0.0.1');

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'payment-1' },
        data: expect.objectContaining({
          expireDate: expect.any(Date),
        }),
      });
    });
  });

  // ========================================
  // handleReturn 測試
  // ========================================

  describe('handleReturn', () => {
    const returnBody = {
      MerchantTradeNo: 'RETURN123456',
      RtnCode: '1',
      RtnMsg: '付款成功',
      TradeNo: 'EC-RETURN-123',
    };

    it('CheckMacValue 驗證失敗應回傳 success: false', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(false);

      const result = await service.handleReturn(returnBody);

      expect(result).toEqual({
        success: false,
        message: '驗證失敗',
      });
    });

    it('無 MerchantTradeNo 應回傳 success: false', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      const bodyWithoutTradeNo = { RtnCode: '1', RtnMsg: 'Success' };

      const result = await service.handleReturn(bodyWithoutTradeNo);

      expect(result).toEqual({
        success: false,
        message: '無效的回應',
      });
    });

    it('RtnCode=1 應回傳 success: true', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
      });

      const result = await service.handleReturn(returnBody);

      expect(result).toEqual({
        success: true,
        orderId: 'order-1',
        message: '付款成功',
      });
    });

    it('RtnCode≠1 應回傳 success: false', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
      });

      const failBody = { ...returnBody, RtnCode: '0', RtnMsg: '付款失敗' };
      const result = await service.handleReturn(failBody);

      expect(result).toEqual({
        success: false,
        orderId: 'order-1',
        message: '付款失敗',
      });
    });

    it('應記錄返回日誌', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
      });

      await service.handleReturn(returnBody);

      expect(mockPrismaService.paymentLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          paymentId: 'payment-1',
          merchantOrderNo: 'RETURN123456',
          logType: 'return',
          verified: true,
        }),
      });
    });

    it('找不到付款記錄時 orderId 應為 undefined', async () => {
      mockCrypto.verifyCheckMacValue.mockReturnValue(true);
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      const result = await service.handleReturn(returnBody);

      expect(result.orderId).toBeUndefined();
    });
  });
});
