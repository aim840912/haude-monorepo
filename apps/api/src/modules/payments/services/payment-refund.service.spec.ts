/**
 * PaymentRefundService 單元測試
 *
 * 測試範圍：
 * - 信用卡退款寫入 Refund.ecpayResponse 前必須經過 maskPaymentPayload()
 *
 * 為什麼需要這支測試：
 * 專案規範（apps/api/CLAUDE.md）要求「任何寫入原始 payload 的程式碼都必須
 * 套用 maskPaymentPayload()」，但金流模組 4 個寫入點仍漏了退款這一條。
 * 規範寫在文件裡擋不住遺漏，這支測試才擋得住。
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRefundService } from './payment-refund.service';
import { PaymentConfigService } from './payment-config.service';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '@/modules/email/email.service';
import { createMockEmailService } from '../../../../test/utils/test-helpers';

describe('PaymentRefundService', () => {
  let service: PaymentRefundService;

  // createMockPrismaService() 沒有 refund model，此處就地建立所需部分
  const mockPrisma = {
    payment: { findUnique: jest.fn(), update: jest.fn() },
    order: { update: jest.fn() },
    refund: { create: jest.fn(), update: jest.fn(), findMany: jest.fn() },
    // 成功路徑用的是陣列型 $transaction([...])
    $transaction: jest.fn((ops: unknown) =>
      Array.isArray(ops) ? Promise.all(ops) : Promise.resolve(),
    ),
  };

  const mockPaymentConfigService = {
    getEnabledContext: jest.fn(() => ({
      config: {
        merchantId: '2000132',
        apiUrl: 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5',
      },
      crypto: { generateCheckMacValue: jest.fn(() => 'MOCK_MAC') },
    })),
  };

  /** ECPay DoAction 回應（含應被遮罩的敏感欄位） */
  function mockEcpayResponse(rtnCode: '1' | '0'): string {
    return [
      `RtnCode=${rtnCode}`,
      'RtnMsg=' + (rtnCode === '1' ? 'Success' : 'Refund failed'),
      'MerchantID=2000132',
      'MerchantTradeNo=HD20260720001',
      'card4no=4321',
      'CheckMacValue=ABCDEF1234567890',
    ].join('&');
  }

  const paymentRecord = {
    id: 'pay-1',
    merchantOrderNo: 'HD20260720001',
    tradeNo: 'EC123456789',
    amount: 1000,
    orderId: 'order-1',
    paymentType: 'CREDIT',
    status: 'paid',
    refunds: [],
    order: {
      orderNumber: 'ORD-001',
      user: { email: 'customer@example.com', name: '測試客戶' },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentRefundService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PaymentConfigService, useValue: mockPaymentConfigService },
        {
          provide: EmailService,
          // 共用工廠沒有 sendRefundNotificationEmail，缺了會在測試輸出留下
          // 誤導性的錯誤日誌（服務內有 catch，不影響結果但會干擾判讀）
          useValue: {
            ...createMockEmailService(),
            sendRefundNotificationEmail: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<PaymentRefundService>(PaymentRefundService);

    jest.clearAllMocks();

    mockPrisma.payment.findUnique.mockResolvedValue(paymentRecord);
    mockPrisma.refund.create.mockResolvedValue({ id: 'refund-1' });
    mockPrisma.refund.update.mockResolvedValue({ id: 'refund-1' });
    mockPrisma.$transaction.mockImplementation((ops: unknown) =>
      Array.isArray(ops) ? Promise.all(ops) : Promise.resolve(),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** 取出寫入 refund.update 的 ecpayResponse（此 repo 無 fetch mock 先例，自建） */
  function stubFetch(body: string): void {
    global.fetch = jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue(body),
    }) as unknown as typeof fetch;
  }

  function capturedEcpayResponse(): Record<string, string> {
    const call = mockPrisma.refund.update.mock.calls[0] as
      | [{ data: { ecpayResponse: Record<string, string> } }]
      | undefined;

    if (!call) throw new Error('refund.update 未被呼叫');

    return call[0].data.ecpayResponse;
  }

  // ====================================
  // 遮罩（安全迴歸）
  // ====================================

  describe('ECPay 回應遮罩', () => {
    it('退款成功時寫入的 ecpayResponse 必須已遮罩', async () => {
      stubFetch(mockEcpayResponse('1'));

      await service.processRefund('pay-1', 'admin-1', 'FULL');

      const stored = capturedEcpayResponse();

      // CheckMacValue 應被整個移除
      expect(stored).not.toHaveProperty('CheckMacValue');
      // 商店代號應被遮蔽，不可留下原值
      expect(stored.MerchantID).not.toBe('2000132');
      // 卡號末四碼應被部分遮罩
      expect(stored.card4no).not.toBe('4321');
      // 對帳仍需要的欄位應保留
      expect(stored.MerchantTradeNo).toBe('HD20260720001');
    });

    it('退款失敗時寫入的 ecpayResponse 也必須已遮罩', async () => {
      stubFetch(mockEcpayResponse('0'));

      // 失敗路徑會拋 BadRequestException，但寫入仍會先發生
      await expect(
        service.processRefund('pay-1', 'admin-1', 'FULL'),
      ).rejects.toThrow();

      const stored = capturedEcpayResponse();

      // 這條是原本漏掉的第二個寫入點
      expect(stored).not.toHaveProperty('CheckMacValue');
      expect(stored.MerchantID).not.toBe('2000132');
    });
  });
});
