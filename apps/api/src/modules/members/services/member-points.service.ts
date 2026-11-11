/**
 * Member Points Service
 *
 * 會員積分與等級升級相關操作
 */

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class MemberPointsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 檢查並升級會員等級
   * 應在訂單完成後呼叫
   */
  async checkAndUpgradeLevel(
    userId: string,
    tx?: TransactionClient,
  ): Promise<boolean> {
    const db = tx ?? this.prisma;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        memberLevel: true,
        totalSpent: true,
      },
    });

    if (!user) {
      return false;
    }

    // 取得所有等級設定，按門檻降序排列
    const configs = await db.memberLevelConfig.findMany({
      orderBy: { minSpent: 'desc' },
    });

    // 找到符合資格的最高等級
    const eligibleConfig = configs.find(
      (config) => user.totalSpent >= config.minSpent,
    );

    if (!eligibleConfig || eligibleConfig.level === user.memberLevel) {
      return false; // 沒有升級
    }

    // 更新等級
    await db.user.update({
      where: { id: userId },
      data: {
        memberLevel: eligibleConfig.level,
        levelUpdatedAt: new Date(),
      },
    });

    await db.memberLevelHistory.create({
      data: {
        userId,
        fromLevel: user.memberLevel,
        toLevel: eligibleConfig.level,
        reason: `累積消費達到 NT$${user.totalSpent.toLocaleString()}`,
        triggeredBy: 'system',
      },
    });

    return true;
  }

  /**
   * 消費後獲得積分
   * 應在訂單完成後呼叫
   */
  async addPointsForPurchase(
    userId: string,
    orderAmount: number,
    orderId: string,
  ): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        memberLevel: true,
        currentPoints: true,
        birthday: true,
      },
    });

    if (!user) {
      return 0;
    }

    const config = await this.prisma.memberLevelConfig.findUnique({
      where: { level: user.memberLevel },
    });

    if (!config) {
      return 0;
    }

    // 基礎積分：消費 1 元 = 1 點
    const basePoints = Math.floor(orderAmount);

    // 套用等級倍率
    let earnedPoints = Math.floor(basePoints * config.pointMultiplier);

    // 檢查是否為生日月（雙倍積分）
    const today = new Date();
    if (user.birthday) {
      const birthdayMonth = user.birthday.getMonth();
      if (today.getMonth() === birthdayMonth) {
        earnedPoints *= 2;
      }
    }

    // 計算過期時間（1 年後）
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const newBalance = user.currentPoints + earnedPoints;

    // 更新積分
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { currentPoints: newBalance },
      }),
      this.prisma.pointTransaction.create({
        data: {
          userId,
          type: 'PURCHASE',
          points: earnedPoints,
          balance: newBalance,
          description: `消費獲得積分 (${config.pointMultiplier}x)`,
          orderId,
          expiresAt,
        },
      }),
    ]);

    return earnedPoints;
  }

  /**
   * 收回某張訂單發出的消費積分（訂單退款時呼叫）
   *
   * 扣除量以目前餘額為上限：使用者若已把積分兌換掉，不讓餘額變成負數。
   * 回傳實際扣除的點數；這張訂單沒發過積分、或已經收回過時回傳 0。
   */
  async revokePurchasePoints(userId: string, orderId: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const awarded = await tx.pointTransaction.aggregate({
        where: { orderId, type: 'PURCHASE' },
        _sum: { points: true },
      });
      const earned = awarded._sum.points ?? 0;
      if (earned <= 0) return 0;

      const alreadyRevoked = await tx.pointTransaction.findFirst({
        where: { orderId, type: 'ADJUSTMENT', points: { lt: 0 } },
        select: { id: true },
      });
      if (alreadyRevoked) return 0;

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { currentPoints: true },
      });
      if (!user) return 0;

      const deduct = Math.min(earned, user.currentPoints);
      // Nothing left to take back: a 0-point row would only add noise
      if (deduct <= 0) return 0;
      const newBalance = user.currentPoints - deduct;

      await tx.user.update({
        where: { id: userId },
        data: { currentPoints: newBalance },
      });
      await tx.pointTransaction.create({
        data: {
          userId,
          type: 'ADJUSTMENT',
          points: -deduct,
          balance: newBalance,
          description: '訂單退款，收回消費積分',
          orderId,
        },
      });

      return deduct;
    });
  }

  /**
   * 更新累積消費並檢查升級
   * 應在訂單完成後呼叫
   */
  async updateTotalSpentAndCheckUpgrade(
    userId: string,
    orderAmount: number,
  ): Promise<{ newTotalSpent: number; upgraded: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      // 更新累積消費
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          totalSpent: { increment: orderAmount },
        },
        select: { totalSpent: true },
      });

      // 檢查升級（同一 transaction 內）
      const upgraded = await this.checkAndUpgradeLevel(userId, tx);

      return {
        newTotalSpent: user.totalSpent,
        upgraded,
      };
    });
  }
}
