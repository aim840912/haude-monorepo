import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import type { PaymentMethodType } from './dto/create-payment.dto';
import {
  PaymentConfigService,
  CreatePaymentService,
  PaymentCallbackService,
  PaymentQueryService,
  PaymentAdminService,
  PaymentFormData,
} from './services';

/**
 * 付款服務 Facade
 *
 * 此服務作為付款模組的統一入口，委派具體工作給專責服務。
 * 這種設計保持了向後相容性，同時將複雜邏輯分散到各個專責服務中。
 *
 * 專責服務：
 * - PaymentConfigService: ECPay 配置管理
 * - CreatePaymentService: 建立付款
 * - PaymentCallbackService: 處理綠界回調
 * - PaymentQueryService: 查詢付款狀態
 * - PaymentAdminService: 管理員 API
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly configService: PaymentConfigService,
    private readonly createPaymentService: CreatePaymentService,
    private readonly callbackService: PaymentCallbackService,
    private readonly queryService: PaymentQueryService,
    private readonly adminService: PaymentAdminService,
  ) {}

  // ========================================
  // 建立付款
  // ========================================

  /**
   * 建立付款請求
   */
  async createPayment(
    orderId: string,
    userId: string,
    paymentMethod: PaymentMethodType = 'CREDIT',
  ): Promise<PaymentFormData> {
    return this.createPaymentService.createPayment(
      orderId,
      userId,
      paymentMethod,
    );
  }

  // ========================================
  // 處理綠界回調
  // ========================================

  /**
   * 處理綠界付款通知（Webhook）
   */
  async handleNotify(
    body: Record<string, string>,
    ipAddress?: string,
  ): Promise<boolean> {
    return this.callbackService.handleNotify(body, ipAddress);
  }

  /**
   * 處理綠界取號結果通知（ATM/CVS）
   */
  async handlePaymentInfo(
    body: Record<string, string>,
    ipAddress?: string,
  ): Promise<boolean> {
    return this.callbackService.handlePaymentInfo(body, ipAddress);
  }

  /**
   * 處理綠界返回頁面
   */
  async handleReturn(body: Record<string, string>): Promise<{
    success: boolean;
    orderId?: string;
    message?: string;
  }> {
    return this.callbackService.handleReturn(body);
  }

  // ========================================
  // 查詢付款狀態
  // ========================================

  /**
   * 查詢訂單的付款狀態
   */
  async getPaymentStatus(
    orderId: string,
    userId: string,
  ): Promise<{
    status: PaymentStatus;
    payTime?: Date;
    tradeNo?: string;
  }> {
    return this.queryService.getPaymentStatus(orderId, userId);
  }

  // ========================================
  // 管理員 API
  // ========================================

  /**
   * 取得所有付款記錄（管理員）
   */
  async getAllPayments(limit: number, offset: number) {
    return this.adminService.getAllPayments(limit, offset);
  }

  /**
   * 取得付款日誌（管理員）
   */
  async getPaymentLogs(limit: number, offset: number) {
    return this.adminService.getPaymentLogs(limit, offset);
  }

  /**
   * 取得付款統計（管理員）
   */
  async getPaymentStats() {
    return this.adminService.getPaymentStats();
  }
}

// Re-export for backward compatibility
export type { PaymentFormData };
