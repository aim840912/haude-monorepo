import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * 付款管理員服務
 *
 * 負責：
 * - 查詢所有付款記錄
 * - 查詢付款日誌
 * - 取得付款統計
 */
@Injectable()
export class PaymentAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 取得所有付款記錄（管理員）
   */
  async getAllPayments(limit: number, offset: number) {
    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count(),
    ]);

    return {
      data: payments.map((p) => ({
        id: p.id,
        merchantOrderNo: p.merchantOrderNo,
        tradeNo: p.tradeNo,
        status: p.status,
        amount: p.amount,
        paymentType: p.paymentType,
        payTime: p.payTime,
        createdAt: p.createdAt,
        orderNumber: p.order?.orderNumber,
        userName: p.order?.user?.name,
        userEmail: p.order?.user?.email,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * 取得付款日誌（管理員）
   */
  async getPaymentLogs(limit: number, offset: number) {
    const [logs, total] = await Promise.all([
      this.prisma.paymentLog.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          payment: {
            select: {
              merchantOrderNo: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.paymentLog.count(),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        merchantOrderNo: log.merchantOrderNo,
        logType: log.logType,
        verified: log.verified,
        processed: log.processed,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt,
        paymentStatus: log.payment?.status,
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * 取得付款統計（管理員）
   */
  async getPaymentStats() {
    const [
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalAmount,
      totalRefunded,
      verificationFailures,
    ] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.count({ where: { status: 'paid' } }),
      this.prisma.payment.count({ where: { status: 'pending' } }),
      this.prisma.payment.count({ where: { status: 'failed' } }),
      this.prisma.payment.count({ where: { status: 'refunded' } }),
      this.prisma.payment.aggregate({
        where: { status: 'paid' },
        _sum: { amount: true },
      }),
      this.prisma.refund.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      }),
      this.prisma.paymentLog.count({ where: { verified: false } }),
    ]);

    return {
      totalPayments,
      paidPayments,
      pendingPayments,
      failedPayments,
      refundedPayments,
      totalAmount: totalAmount._sum.amount || 0,
      totalRefunded: totalRefunded._sum.amount || 0,
      verificationFailures,
    };
  }
}
