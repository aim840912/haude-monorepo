import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import {
  PaymentConfigService,
  CreatePaymentService,
  PaymentCallbackService,
  PaymentQueryService,
  PaymentAdminService,
  PaymentRefundService,
} from './services';
import { PaymentStatus } from '@prisma/client';

/**
 * PaymentsService Facade 測試
 *
 * 由於 PaymentsService 現在是 Facade 模式，只負責委派到專責子服務，
 * 這裡的測試主要驗證委派行為是否正確。
 * 詳細的業務邏輯測試（如 ECPay 加密驗證、付款流程等）應在各子服務的測試檔案中進行。
 */
describe('PaymentsService (Facade)', () => {
  let service: PaymentsService;
  let configService: jest.Mocked<PaymentConfigService>;
  let createPaymentService: jest.Mocked<CreatePaymentService>;
  let callbackService: jest.Mocked<PaymentCallbackService>;
  let queryService: jest.Mocked<PaymentQueryService>;
  let adminService: jest.Mocked<PaymentAdminService>;
  let refundService: jest.Mocked<PaymentRefundService>;

  // Mock PaymentConfigService
  const mockConfigService = {
    getMerchantId: jest.fn(),
    getHashKey: jest.fn(),
    getHashIv: jest.fn(),
    getApiUrl: jest.fn(),
    getNotifyUrl: jest.fn(),
    getReturnUrl: jest.fn(),
  };

  // Mock CreatePaymentService
  const mockCreatePaymentService = {
    createPayment: jest.fn(),
  };

  // Mock PaymentCallbackService
  const mockCallbackService = {
    handleNotify: jest.fn(),
    handlePaymentInfo: jest.fn(),
    handleReturn: jest.fn(),
  };

  // Mock PaymentQueryService
  const mockQueryService = {
    getPaymentStatus: jest.fn(),
  };

  // Mock PaymentAdminService
  const mockAdminService = {
    getAllPayments: jest.fn(),
    getPaymentLogs: jest.fn(),
    getPaymentStats: jest.fn(),
  };

  // Mock PaymentRefundService
  const mockRefundService = {
    processRefund: jest.fn(),
    confirmManualRefund: jest.fn(),
    getRefundsByPayment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PaymentConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CreatePaymentService,
          useValue: mockCreatePaymentService,
        },
        {
          provide: PaymentCallbackService,
          useValue: mockCallbackService,
        },
        {
          provide: PaymentQueryService,
          useValue: mockQueryService,
        },
        {
          provide: PaymentAdminService,
          useValue: mockAdminService,
        },
        {
          provide: PaymentRefundService,
          useValue: mockRefundService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    configService = module.get(PaymentConfigService);
    createPaymentService = module.get(CreatePaymentService);
    callbackService = module.get(PaymentCallbackService);
    queryService = module.get(PaymentQueryService);
    adminService = module.get(PaymentAdminService);
    refundService = module.get(PaymentRefundService);

    jest.clearAllMocks();
  });

  describe('Facade 初始化', () => {
    it('應成功建立 PaymentsService', () => {
      expect(service).toBeDefined();
    });

    it('應注入所有子服務', () => {
      expect(configService).toBeDefined();
      expect(createPaymentService).toBeDefined();
      expect(callbackService).toBeDefined();
      expect(queryService).toBeDefined();
      expect(adminService).toBeDefined();
      expect(refundService).toBeDefined();
    });
  });

  // ========================================
  // 建立付款委派測試
  // ========================================

  describe('createPayment', () => {
    const orderId = 'order-123';
    const userId = 'user-123';
    const mockFormData = {
      url: 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5',
      params: {
        MerchantID: '2000132',
        MerchantTradeNo: 'TEST123',
        MerchantTradeDate: '2024/01/15 10:30:00',
        PaymentType: 'aio',
        TotalAmount: 1000,
        TradeDesc: '豪德製茶所訂單',
        ItemName: '茶葉商品',
        ReturnURL: 'https://example.com/payments/notify',
        ChoosePayment: 'Credit',
        CheckMacValue: 'ABC123',
        EncryptType: 1,
      },
    };

    it('應委派至 CreatePaymentService.createPayment（使用預設付款方式）', async () => {
      mockCreatePaymentService.createPayment.mockResolvedValue(mockFormData);

      const result = await service.createPayment(orderId, userId);

      expect(createPaymentService.createPayment).toHaveBeenCalledWith(
        orderId,
        userId,
        'CREDIT',
      );
      expect(result).toEqual(mockFormData);
    });

    it('應委派至 CreatePaymentService.createPayment（使用指定付款方式）', async () => {
      mockCreatePaymentService.createPayment.mockResolvedValue(mockFormData);

      const result = await service.createPayment(orderId, userId, 'ATM');

      expect(createPaymentService.createPayment).toHaveBeenCalledWith(
        orderId,
        userId,
        'ATM',
      );
      expect(result).toEqual(mockFormData);
    });
  });

  // ========================================
  // 綠界回調處理委派測試
  // ========================================

  describe('handleNotify', () => {
    const mockBody = {
      MerchantTradeNo: 'TEST123',
      RtnCode: '1',
      TradeNo: 'ECPay456',
      CheckMacValue: 'VALID_MAC',
    };

    it('應委派至 CallbackService.handleNotify', async () => {
      mockCallbackService.handleNotify.mockResolvedValue(true);

      const result = await service.handleNotify(mockBody);

      expect(callbackService.handleNotify).toHaveBeenCalledWith(
        mockBody,
        undefined,
      );
      expect(result).toBe(true);
    });

    it('應傳遞 IP 地址至 CallbackService.handleNotify', async () => {
      mockCallbackService.handleNotify.mockResolvedValue(true);
      const ipAddress = '192.168.1.1';

      const result = await service.handleNotify(mockBody, ipAddress);

      expect(callbackService.handleNotify).toHaveBeenCalledWith(
        mockBody,
        ipAddress,
      );
      expect(result).toBe(true);
    });

    it('應回傳 false 當驗證失敗', async () => {
      mockCallbackService.handleNotify.mockResolvedValue(false);

      const result = await service.handleNotify(mockBody);

      expect(result).toBe(false);
    });
  });

  describe('handlePaymentInfo', () => {
    const mockBody = {
      MerchantTradeNo: 'TEST123',
      RtnCode: '2',
      BankCode: '012',
      vAccount: '1234567890123456',
      ExpireDate: '2024/01/18 23:59:59',
    };

    it('應委派至 CallbackService.handlePaymentInfo', async () => {
      mockCallbackService.handlePaymentInfo.mockResolvedValue(true);

      const result = await service.handlePaymentInfo(mockBody);

      expect(callbackService.handlePaymentInfo).toHaveBeenCalledWith(
        mockBody,
        undefined,
      );
      expect(result).toBe(true);
    });

    it('應傳遞 IP 地址至 CallbackService.handlePaymentInfo', async () => {
      mockCallbackService.handlePaymentInfo.mockResolvedValue(true);
      const ipAddress = '192.168.1.1';

      const result = await service.handlePaymentInfo(mockBody, ipAddress);

      expect(callbackService.handlePaymentInfo).toHaveBeenCalledWith(
        mockBody,
        ipAddress,
      );
      expect(result).toBe(true);
    });
  });

  describe('handleReturn', () => {
    const mockBody = {
      MerchantTradeNo: 'TEST123',
      RtnCode: '1',
      CheckMacValue: 'VALID_MAC',
    };

    it('應委派至 CallbackService.handleReturn（成功）', async () => {
      const mockResult = {
        success: true,
        orderId: 'order-123',
      };
      mockCallbackService.handleReturn.mockResolvedValue(mockResult);

      const result = await service.handleReturn(mockBody);

      expect(callbackService.handleReturn).toHaveBeenCalledWith(mockBody);
      expect(result).toEqual(mockResult);
    });

    it('應委派至 CallbackService.handleReturn（失敗）', async () => {
      const mockResult = {
        success: false,
        message: '付款失敗',
      };
      mockCallbackService.handleReturn.mockResolvedValue(mockResult);

      const result = await service.handleReturn(mockBody);

      expect(result).toEqual(mockResult);
    });
  });

  // ========================================
  // 查詢付款狀態委派測試
  // ========================================

  describe('getPaymentStatus', () => {
    const orderId = 'order-123';
    const userId = 'user-123';

    it('應委派至 QueryService.getPaymentStatus', async () => {
      const mockStatus = {
        status: PaymentStatus.paid,
        payTime: new Date('2024-01-15'),
        tradeNo: 'ECPay123',
      };
      mockQueryService.getPaymentStatus.mockResolvedValue(mockStatus);

      const result = await service.getPaymentStatus(orderId, userId);

      expect(queryService.getPaymentStatus).toHaveBeenCalledWith(
        orderId,
        userId,
      );
      expect(result).toEqual(mockStatus);
    });

    it('應正確處理 pending 狀態', async () => {
      const mockStatus = {
        status: PaymentStatus.pending,
      };
      mockQueryService.getPaymentStatus.mockResolvedValue(mockStatus);

      const result = await service.getPaymentStatus(orderId, userId);

      expect(result.status).toBe(PaymentStatus.pending);
      expect(result.payTime).toBeUndefined();
      expect(result.tradeNo).toBeUndefined();
    });
  });

  // ========================================
  // 管理員 API 委派測試
  // ========================================

  describe('getAllPayments', () => {
    const mockResult = {
      items: [
        {
          id: 'payment-1',
          orderId: 'order-1',
          status: PaymentStatus.paid,
          amount: 1000,
        },
      ],
      total: 1,
    };

    it('應委派至 AdminService.getAllPayments', async () => {
      mockAdminService.getAllPayments.mockResolvedValue(mockResult);

      const result = await service.getAllPayments(10, 0);

      expect(adminService.getAllPayments).toHaveBeenCalledWith(10, 0);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPaymentLogs', () => {
    const mockResult = {
      items: [
        {
          id: 'log-1',
          merchantOrderNo: 'TEST123',
          logType: 'notify',
          verified: true,
          createdAt: new Date(),
        },
      ],
      total: 1,
    };

    it('應委派至 AdminService.getPaymentLogs', async () => {
      mockAdminService.getPaymentLogs.mockResolvedValue(mockResult);

      const result = await service.getPaymentLogs(10, 0);

      expect(adminService.getPaymentLogs).toHaveBeenCalledWith(10, 0);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPaymentStats', () => {
    const mockStats = {
      totalPayments: 100,
      totalAmount: 500000,
      successRate: 95.5,
      paymentsByMethod: {
        CREDIT: 70,
        ATM: 20,
        CVS: 10,
      },
    };

    it('應委派至 AdminService.getPaymentStats', async () => {
      mockAdminService.getPaymentStats.mockResolvedValue(mockStats);

      const result = await service.getPaymentStats();

      expect(adminService.getPaymentStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });
});
