import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentsController,
  AdminPaymentsController,
} from './payments.controller';
import { PaymentsService } from './payments.service';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';

/**
 * PaymentsController 測試
 *
 * 測試付款相關的 API 端點：
 * - 建立付款請求
 * - 查詢付款狀態
 * - 綠界 Webhook 回調處理
 * - 綠界返回頁面處理
 */
describe('PaymentsController', () => {
  let controller: PaymentsController;

  // Mock Response
  const mockResponse = {
    redirect: jest.fn(),
  } as unknown as Response;

  // Mock PaymentsService
  const mockPaymentsService = {
    createPayment: jest.fn(),
    getPaymentStatus: jest.fn(),
    handleNotify: jest.fn(),
    handlePaymentInfo: jest.fn(),
    handleReturn: jest.fn(),
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn(() => 'http://localhost:5173'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 PaymentsController', () => {
      expect(controller).toBeDefined();
    });
  });

  // ========================================
  // createPayment 測試
  // ========================================

  describe('createPayment', () => {
    const createPaymentDto = {
      orderId: 'order-123',
      paymentMethod: 'CREDIT' as const,
    };
    const mockRequest = {
      user: { userId: 'user-1', email: 'test@example.com' },
    } as any;

    it('應成功建立付款並回傳表單資料', async () => {
      const paymentResult = {
        paymentUrl: 'https://payment.ecpay.com.tw/...',
        formData: { MerchantID: 'XXXX' },
      };
      mockPaymentsService.createPayment.mockResolvedValue(paymentResult);

      const result = await controller.createPayment(
        createPaymentDto,
        mockRequest,
      );

      expect(result).toEqual({
        success: true,
        data: paymentResult,
      });
      expect(mockPaymentsService.createPayment).toHaveBeenCalledWith(
        'order-123',
        'user-1',
        'CREDIT',
      );
    });
  });

  // ========================================
  // getPaymentStatus 測試
  // ========================================

  describe('getPaymentStatus', () => {
    const mockRequest = {
      user: { userId: 'user-1', email: 'test@example.com' },
    } as any;

    it('應回傳付款狀態', async () => {
      const statusResult = {
        status: 'paid',
        paymentMethod: 'Credit',
        amount: 1000,
      };
      mockPaymentsService.getPaymentStatus.mockResolvedValue(statusResult);

      const result = await controller.getPaymentStatus(
        'order-123',
        mockRequest,
      );

      expect(result).toEqual({
        success: true,
        data: statusResult,
      });
      expect(mockPaymentsService.getPaymentStatus).toHaveBeenCalledWith(
        'order-123',
        'user-1',
      );
    });
  });

  // ========================================
  // handleNotify 測試（綠界 Webhook）
  // ========================================

  describe('handleNotify', () => {
    const notifyBody = {
      MerchantTradeNo: 'TEST123456',
      RtnCode: '1',
      TradeNo: 'EC123456',
    };

    it('處理成功應回傳 1|OK', async () => {
      mockPaymentsService.handleNotify.mockResolvedValue(true);
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const result = await controller.handleNotify(notifyBody, mockReq);

      expect(result).toBe('1|OK');
      expect(mockPaymentsService.handleNotify).toHaveBeenCalledWith(
        notifyBody,
        '127.0.0.1',
      );
    });

    it('處理失敗應回傳 0|FAIL', async () => {
      mockPaymentsService.handleNotify.mockResolvedValue(false);
      const mockReq = {
        headers: {},
        socket: { remoteAddress: '192.168.1.1' },
      } as unknown as Request;

      const result = await controller.handleNotify(notifyBody, mockReq);

      expect(result).toBe('0|FAIL');
    });

    it('應從 x-forwarded-for 取得 IP', async () => {
      mockPaymentsService.handleNotify.mockResolvedValue(true);
      const mockReq = {
        headers: { 'x-forwarded-for': '10.0.0.1, 192.168.1.1' },
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      await controller.handleNotify(notifyBody, mockReq);

      expect(mockPaymentsService.handleNotify).toHaveBeenCalledWith(
        notifyBody,
        '10.0.0.1', // 取第一個 IP
      );
    });
  });

  // ========================================
  // handlePaymentInfo 測試（ATM/CVS 取號）
  // ========================================

  describe('handlePaymentInfo', () => {
    const infoBody = {
      MerchantTradeNo: 'ATM123456',
      RtnCode: '2',
      BankCode: '822',
      vAccount: '1234567890123456',
    };

    it('處理成功應回傳 1|OK', async () => {
      mockPaymentsService.handlePaymentInfo.mockResolvedValue(true);
      const mockReq = {
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const result = await controller.handlePaymentInfo(infoBody, mockReq);

      expect(result).toBe('1|OK');
    });

    it('處理失敗應回傳 0|FAIL', async () => {
      mockPaymentsService.handlePaymentInfo.mockResolvedValue(false);
      const mockReq = {
        headers: {},
        socket: { remoteAddress: '127.0.0.1' },
      } as unknown as Request;

      const result = await controller.handlePaymentInfo(infoBody, mockReq);

      expect(result).toBe('0|FAIL');
    });
  });

  // ========================================
  // handleReturn 測試（付款返回頁）
  // ========================================

  describe('handleReturn', () => {
    const returnBody = {
      MerchantTradeNo: 'RETURN123456',
      RtnCode: '1',
    };

    it('付款成功應重導向到訂單頁', async () => {
      mockPaymentsService.handleReturn.mockResolvedValue({
        success: true,
        orderId: 'order-123',
      });

      await controller.handleReturn(returnBody, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        'http://localhost:5173/orders/order-123?payment=success',
      );
    });

    it('付款失敗應重導向到失敗頁', async () => {
      mockPaymentsService.handleReturn.mockResolvedValue({
        success: false,
        message: '交易失敗',
      });

      await controller.handleReturn(returnBody, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/payment-result?status=fail'),
      );
    });

    it('失敗訊息應被 URL 編碼', async () => {
      mockPaymentsService.handleReturn.mockResolvedValue({
        success: false,
        message: '信用卡授權失敗',
      });

      await controller.handleReturn(returnBody, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('信用卡授權失敗')),
      );
    });
  });
});

/**
 * AdminPaymentsController 測試
 *
 * 測試管理員付款 API 端點：
 * - 取得所有付款記錄
 * - 取得付款日誌
 * - 取得付款統計
 */
describe('AdminPaymentsController', () => {
  let controller: AdminPaymentsController;

  const mockPaymentsService = {
    getAllPayments: jest.fn(),
    getPaymentLogs: jest.fn(),
    getPaymentStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminPaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<AdminPaymentsController>(AdminPaymentsController);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 AdminPaymentsController', () => {
      expect(controller).toBeDefined();
    });
  });

  // ========================================
  // getAllPayments 測試
  // ========================================

  describe('getAllPayments', () => {
    it('應回傳付款記錄列表', async () => {
      const mockPayments = {
        items: [
          { id: 'payment-1', status: 'paid', amount: 1000 },
          { id: 'payment-2', status: 'pending', amount: 2000 },
        ],
        total: 2,
      };
      mockPaymentsService.getAllPayments.mockResolvedValue(mockPayments);

      const result = await controller.getAllPayments(20, 0);

      expect(result).toEqual(mockPayments);
      expect(mockPaymentsService.getAllPayments).toHaveBeenCalledWith(20, 0);
    });

    it('應支援自訂分頁參數', async () => {
      mockPaymentsService.getAllPayments.mockResolvedValue({
        items: [],
        total: 0,
      });

      await controller.getAllPayments(10, 5);

      expect(mockPaymentsService.getAllPayments).toHaveBeenCalledWith(10, 5);
    });
  });

  // ========================================
  // getPaymentLogs 測試
  // ========================================

  describe('getPaymentLogs', () => {
    it('應回傳付款日誌列表', async () => {
      const mockLogs = {
        items: [
          { id: 'log-1', logType: 'notify', merchantOrderNo: 'TEST123' },
          { id: 'log-2', logType: 'return', merchantOrderNo: 'TEST456' },
        ],
        total: 2,
      };
      mockPaymentsService.getPaymentLogs.mockResolvedValue(mockLogs);

      const result = await controller.getPaymentLogs(50, 0);

      expect(result).toEqual(mockLogs);
      expect(mockPaymentsService.getPaymentLogs).toHaveBeenCalledWith(50, 0);
    });
  });

  // ========================================
  // getPaymentStats 測試
  // ========================================

  describe('getPaymentStats', () => {
    it('應回傳付款統計', async () => {
      const mockStats = {
        totalAmount: 100000,
        totalCount: 50,
        successRate: 0.95,
        byMethod: {
          Credit: 30,
          ATM: 15,
          CVS: 5,
        },
      };
      mockPaymentsService.getPaymentStats.mockResolvedValue(mockStats);

      const result = await controller.getPaymentStats();

      expect(result).toEqual(mockStats);
      expect(mockPaymentsService.getPaymentStats).toHaveBeenCalled();
    });
  });
});
