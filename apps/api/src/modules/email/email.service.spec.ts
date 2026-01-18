import { Test, TestingModule } from '@nestjs/testing';
import { EmailService, OrderEmailData } from './email.service';

// Mock Resend 模組
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn(),
      },
    })),
  };
});

// 引入 mock 後的 Resend
import { Resend } from 'resend';

describe('EmailService', () => {
  let service: EmailService;
  let mockResendInstance: { emails: { send: jest.Mock } };

  // 保存原始環境變數
  const originalEnv = process.env;

  beforeEach(async () => {
    // 重置環境變數
    jest.resetModules();
    process.env = { ...originalEnv };

    // 設定預設環境變數
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.RESEND_FROM_EMAIL = 'test@haude.com';

    // 重新建立 mock instance
    mockResendInstance = {
      emails: {
        send: jest.fn(),
      },
    };
    (Resend as jest.MockedClass<typeof Resend>).mockImplementation(
      () => mockResendInstance as unknown as Resend,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ========================================
  // 服務初始化測試
  // ========================================

  describe('服務初始化', () => {
    it('有 API Key 時應啟用服務', () => {
      expect(service['isEnabled']).toBe(true);
      expect(service['resend']).not.toBeNull();
    });

    it('無 API Key 時應禁用服務', async () => {
      // 清除環境變數並重新建立服務
      delete process.env.RESEND_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const disabledService = module.get<EmailService>(EmailService);

      expect(disabledService['isEnabled']).toBe(false);
    });
  });

  // ========================================
  // sendPasswordResetEmail 測試
  // ========================================

  describe('sendPasswordResetEmail', () => {
    const to = 'user@example.com';
    const resetUrl = 'https://haude.com/reset?token=abc123';
    const userName = '測試用戶';

    it('發送成功應回傳 true', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: {}, error: null });

      const result = await service.sendPasswordResetEmail(to, resetUrl, userName);

      expect(result).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [to],
          subject: '重設您的密碼 - 豪德製茶所',
        }),
      );
    });

    it('Resend 回傳錯誤應回傳 false', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'API error' },
      });

      const result = await service.sendPasswordResetEmail(to, resetUrl);

      expect(result).toBe(false);
    });

    it('發生例外應回傳 false', async () => {
      mockResendInstance.emails.send.mockRejectedValue(new Error('Network error'));

      const result = await service.sendPasswordResetEmail(to, resetUrl);

      expect(result).toBe(false);
    });

    it('服務禁用時應回傳 false', async () => {
      delete process.env.RESEND_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const disabledService = module.get<EmailService>(EmailService);
      const result = await disabledService.sendPasswordResetEmail(to, resetUrl);

      expect(result).toBe(false);
    });
  });

  // ========================================
  // sendOrderConfirmationEmail 測試
  // ========================================

  describe('sendOrderConfirmationEmail', () => {
    const to = 'user@example.com';
    const orderData: OrderEmailData = {
      orderNumber: 'ORD-20260118-001',
      items: [
        { name: '阿里山烏龍茶', quantity: 2, unitPrice: 500, subtotal: 1000 },
        { name: '東方美人茶', quantity: 1, unitPrice: 800, subtotal: 800 },
      ],
      subtotal: 1800,
      shippingFee: 100,
      discountAmount: 200,
      totalAmount: 1700,
      shippingAddress: {
        name: '王小明',
        phone: '0912-345-678',
        address: '台北市中正區中山南路 1 號',
      },
      paymentMethod: 'credit_card',
    };
    const userName = '王小明';

    it('發送成功應回傳 true', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: {}, error: null });

      const result = await service.sendOrderConfirmationEmail(
        to,
        orderData,
        userName,
      );

      expect(result).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [to],
          subject: `訂單確認 #${orderData.orderNumber} - 豪德製茶所`,
        }),
      );
    });

    it('Resend 回傳錯誤應回傳 false', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' },
      });

      const result = await service.sendOrderConfirmationEmail(to, orderData);

      expect(result).toBe(false);
    });

    it('發生例外應回傳 false', async () => {
      mockResendInstance.emails.send.mockRejectedValue(new Error('Timeout'));

      const result = await service.sendOrderConfirmationEmail(to, orderData);

      expect(result).toBe(false);
    });

    it('服務禁用時應回傳 false', async () => {
      delete process.env.RESEND_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const disabledService = module.get<EmailService>(EmailService);
      const result = await disabledService.sendOrderConfirmationEmail(
        to,
        orderData,
      );

      expect(result).toBe(false);
    });
  });

  // ========================================
  // sendPaymentSuccessEmail 測試
  // ========================================

  describe('sendPaymentSuccessEmail', () => {
    const to = 'user@example.com';
    const orderNumber = 'ORD-20260118-002';
    const totalAmount = 2500;
    const userName = '李小華';

    it('發送成功應回傳 true', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: {}, error: null });

      const result = await service.sendPaymentSuccessEmail(
        to,
        orderNumber,
        totalAmount,
        userName,
      );

      expect(result).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [to],
          subject: `付款成功 #${orderNumber} - 豪德製茶所`,
        }),
      );
    });

    it('Resend 回傳錯誤應回傳 false', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API key' },
      });

      const result = await service.sendPaymentSuccessEmail(
        to,
        orderNumber,
        totalAmount,
      );

      expect(result).toBe(false);
    });

    it('發生例外應回傳 false', async () => {
      mockResendInstance.emails.send.mockRejectedValue(
        new Error('Connection refused'),
      );

      const result = await service.sendPaymentSuccessEmail(
        to,
        orderNumber,
        totalAmount,
      );

      expect(result).toBe(false);
    });

    it('服務禁用時應回傳 false', async () => {
      delete process.env.RESEND_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const disabledService = module.get<EmailService>(EmailService);
      const result = await disabledService.sendPaymentSuccessEmail(
        to,
        orderNumber,
        totalAmount,
      );

      expect(result).toBe(false);
    });
  });

  // ========================================
  // sendShippingNotificationEmail 測試
  // ========================================

  describe('sendShippingNotificationEmail', () => {
    const to = 'user@example.com';
    const orderNumber = 'ORD-20260118-003';
    const trackingNumber = '123456789012';
    const userName = '張三';

    it('發送成功應回傳 true', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: {}, error: null });

      const result = await service.sendShippingNotificationEmail(
        to,
        orderNumber,
        trackingNumber,
        userName,
      );

      expect(result).toBe(true);
      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [to],
          subject: `您的訂單已出貨 #${orderNumber} - 豪德製茶所`,
        }),
      );
    });

    it('Resend 回傳錯誤應回傳 false', async () => {
      mockResendInstance.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Server error' },
      });

      const result = await service.sendShippingNotificationEmail(
        to,
        orderNumber,
        trackingNumber,
      );

      expect(result).toBe(false);
    });

    it('發生例外應回傳 false', async () => {
      mockResendInstance.emails.send.mockRejectedValue(new Error('DNS failure'));

      const result = await service.sendShippingNotificationEmail(
        to,
        orderNumber,
        trackingNumber,
      );

      expect(result).toBe(false);
    });

    it('服務禁用時應回傳 false', async () => {
      delete process.env.RESEND_API_KEY;

      const module: TestingModule = await Test.createTestingModule({
        providers: [EmailService],
      }).compile();

      const disabledService = module.get<EmailService>(EmailService);
      const result = await disabledService.sendShippingNotificationEmail(
        to,
        orderNumber,
        trackingNumber,
      );

      expect(result).toBe(false);
    });
  });

  // ========================================
  // 私有方法整合測試（透過公開方法驗證）
  // ========================================

  describe('getPaymentMethodText (透過 sendOrderConfirmationEmail 驗證)', () => {
    const to = 'user@example.com';

    it('credit_card 應顯示信用卡', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: {}, error: null });

      await service.sendOrderConfirmationEmail(to, {
        orderNumber: 'ORD-001',
        items: [],
        subtotal: 0,
        shippingFee: 0,
        totalAmount: 0,
        shippingAddress: { name: '', phone: '', address: '' },
        paymentMethod: 'credit_card',
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('信用卡'),
        }),
      );
    });

    it('atm 應顯示 ATM 轉帳', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: {}, error: null });

      await service.sendOrderConfirmationEmail(to, {
        orderNumber: 'ORD-001',
        items: [],
        subtotal: 0,
        shippingFee: 0,
        totalAmount: 0,
        shippingAddress: { name: '', phone: '', address: '' },
        paymentMethod: 'atm',
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('ATM 轉帳'),
        }),
      );
    });

    it('cvs 應顯示超商付款', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: {}, error: null });

      await service.sendOrderConfirmationEmail(to, {
        orderNumber: 'ORD-001',
        items: [],
        subtotal: 0,
        shippingFee: 0,
        totalAmount: 0,
        shippingAddress: { name: '', phone: '', address: '' },
        paymentMethod: 'cvs',
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('超商付款'),
        }),
      );
    });

    it('未知方式應顯示線上付款', async () => {
      mockResendInstance.emails.send.mockResolvedValue({ data: {}, error: null });

      await service.sendOrderConfirmationEmail(to, {
        orderNumber: 'ORD-001',
        items: [],
        subtotal: 0,
        shippingFee: 0,
        totalAmount: 0,
        shippingAddress: { name: '', phone: '', address: '' },
        paymentMethod: undefined,
      });

      expect(mockResendInstance.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('線上付款'),
        }),
      );
    });
  });
});
