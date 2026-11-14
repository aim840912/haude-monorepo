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
import { MembersService } from '@/modules/members/members.service';
import { ConflictException } from '@nestjs/common';
import { createMockEmailService } from '../../../../test/utils/test-helpers';

describe('PaymentRefundService', () => {
  let service: PaymentRefundService;

  // createMockPrismaService() 沒有 refund model，此處就地建立所需部分
  const mockPrisma = {
    payment: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    order: { update: jest.fn(), updateMany: jest.fn() },
    refund: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      aggregate: jest.fn(),
    },
    // 互動式 $transaction(cb) 把 mockPrisma 當成 tx 傳入；實作在 beforeEach 設定
    $transaction: jest.fn(),
  };

  const mockMembersService = {
    revokeOrderRewards: jest.fn(),
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
    updatedAt: new Date('2026-11-01T00:00:00Z'),
    refunds: [],
    order: {
      orderNumber: 'ORD-001',
      userId: 'user-1',
      totalAmount: 1000,
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
        { provide: MembersService, useValue: mockMembersService },
      ],
    }).compile();

    service = module.get<PaymentRefundService>(PaymentRefundService);

    jest.clearAllMocks();

    mockPrisma.payment.findUnique.mockResolvedValue(paymentRecord);
    mockPrisma.payment.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.payment.findUniqueOrThrow.mockResolvedValue({ amount: 1000 });
    mockPrisma.order.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.refund.create.mockResolvedValue({
      id: 'refund-1',
      paymentId: 'pay-1',
      orderId: 'order-1',
    });
    mockPrisma.refund.update.mockResolvedValue({ id: 'refund-1' });
    mockPrisma.refund.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 1000 } });
    mockMembersService.revokeOrderRewards.mockResolvedValue({
      points: 10,
      totalSpent: 1000,
    });
    mockPrisma.$transaction.mockImplementation((ops: unknown) =>
      Array.isArray(ops)
        ? Promise.all(ops)
        : (ops as (tx: typeof mockPrisma) => unknown)(mockPrisma),
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

  /** 成功路徑以條件式 refund.updateMany 寫入，失敗路徑以 refund.update 寫入 */
  function capturedEcpayResponse(
    via: 'update' | 'updateMany',
  ): Record<string, string> {
    const call = mockPrisma.refund[via].mock.calls[0] as
      | [{ data: { ecpayResponse: Record<string, string> } }]
      | undefined;

    if (!call) throw new Error(`refund.${via} 未被呼叫`);

    return call[0].data.ecpayResponse;
  }

  // ====================================
  // 遮罩（安全迴歸）
  // ====================================

  describe('ECPay 回應遮罩', () => {
    it('退款成功時寫入的 ecpayResponse 必須已遮罩', async () => {
      stubFetch(mockEcpayResponse('1'));

      await service.processRefund('pay-1', 'admin-1', 'FULL');

      const stored = capturedEcpayResponse('updateMany');

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

      const stored = capturedEcpayResponse('update');

      // 這條是原本漏掉的第二個寫入點
      expect(stored).not.toHaveProperty('CheckMacValue');
      expect(stored.MerchantID).not.toBe('2000132');
    });
  });

  // ====================================
  // 狀態寫入（並行與部分退款）
  // ====================================

  describe('狀態寫入', () => {
    const refundedStatusWrite = expect.objectContaining({
      data: { status: 'refunded' },
    });

    it('同一筆付款的並行退款只放行一個：另一個不建立退款、不呼叫綠界', async () => {
      stubFetch(mockEcpayResponse('1'));
      mockPrisma.payment.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.processRefund('pay-1', 'admin-1', 'FULL'),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'pay-1',
          status: 'paid',
          updatedAt: paymentRecord.updatedAt,
        },
        data: { updatedAt: expect.any(Date) },
      });
      expect(mockPrisma.refund.create).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('全額退完：付款標為已退款，已出貨的訂單轉為已退款並收回點數', async () => {
      stubFetch(mockEcpayResponse('1'));

      await service.processRefund('pay-1', 'admin-1', 'FULL');

      expect(mockPrisma.payment.updateMany).toHaveBeenCalledWith({
        where: { id: 'pay-1', status: 'paid' },
        data: { status: 'refunded' },
      });
      expect(mockPrisma.order.updateMany).toHaveBeenCalledWith({
        where: { id: 'order-1', status: { in: ['shipped', 'delivered'] } },
        data: { status: 'refunded' },
      });
      expect(mockMembersService.revokeOrderRewards).toHaveBeenCalledWith(
        'user-1',
        'order-1',
        1000,
      );
    });

    it('部分退款尚未退完：不動付款與訂單狀態', async () => {
      stubFetch(mockEcpayResponse('1'));
      mockPrisma.refund.aggregate.mockResolvedValue({ _sum: { amount: 300 } });

      await service.processRefund('pay-1', 'admin-1', 'PARTIAL', 300);

      expect(mockPrisma.payment.updateMany).not.toHaveBeenCalledWith(
        refundedStatusWrite,
      );
      expect(mockPrisma.order.update).not.toHaveBeenCalled();
      expect(mockPrisma.order.updateMany).not.toHaveBeenCalled();
      expect(mockMembersService.revokeOrderRewards).not.toHaveBeenCalled();
    });

    it('全額退完但訂單未出貨：只標付款狀態，不違反狀態轉換表、不收回點數', async () => {
      stubFetch(mockEcpayResponse('1'));
      mockPrisma.order.updateMany.mockResolvedValue({ count: 0 });

      await service.processRefund('pay-1', 'admin-1', 'FULL');

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { paymentStatus: 'refunded' },
      });
      expect(mockMembersService.revokeOrderRewards).not.toHaveBeenCalled();
    });

    it('送出退款後讀不到綠界回應：退款維持 processing（不標 failed），避免重試時重複退款', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(
          new Error('socket hang up'),
        ) as unknown as typeof fetch;

      await expect(
        service.processRefund('pay-1', 'admin-1', 'FULL'),
      ).rejects.toThrow();

      expect(mockPrisma.refund.update).not.toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'failed' }),
        }),
      );
      expect(mockPrisma.refund.update).toHaveBeenCalledWith({
        where: { id: 'refund-1' },
        data: { failReason: expect.stringContaining('人工對帳') },
      });
    });

    it('還沒送出請求就出錯（設定缺漏）：標為 failed，可以重試', async () => {
      mockPaymentConfigService.getEnabledContext.mockImplementationOnce(() => {
        throw new Error('支付功能尚未啟用');
      });
      stubFetch(mockEcpayResponse('1'));

      await expect(
        service.processRefund('pay-1', 'admin-1', 'FULL'),
      ).rejects.toThrow();

      expect(global.fetch).not.toHaveBeenCalled();
      expect(mockPrisma.refund.update).toHaveBeenCalledWith({
        where: { id: 'refund-1' },
        data: expect.objectContaining({ status: 'failed' }),
      });
    });

    it('人工退款重複確認：第二次被擋下，不重複寄信', async () => {
      mockPrisma.refund.findUnique.mockResolvedValue({
        id: 'refund-1',
        status: 'pending',
        paymentId: 'pay-1',
        orderId: 'order-1',
        amount: 1000,
        reason: null,
        payment: { paymentType: 'ATM' },
        order: {
          orderNumber: 'ORD-001',
          userId: 'user-1',
          totalAmount: 1000,
          user: { email: 'customer@example.com', name: '測試客戶' },
        },
      });
      mockPrisma.refund.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.confirmManualRefund('refund-1', 'admin-1'),
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.refund.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'refund-1', status: 'pending' },
        }),
      );
      expect(mockMembersService.revokeOrderRewards).not.toHaveBeenCalled();
    });
  });
});
