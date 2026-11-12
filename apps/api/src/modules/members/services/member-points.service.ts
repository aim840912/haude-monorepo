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
    return this.prisma.$transaction((tx) =>
      this.applyPurchasePoints(tx, userId, orderAmount, orderId),
    );
  }

  /**
   * 訂單送達時的全部回饋：累積消費 → 檢查升級 → 依（可能已升級的）等級發點數
   *
   * 全部在同一個交易裡：舊版分兩個交易，點數寫入失敗時累積消費已經加了、
   * 點數卻沒發，而且沒有任何重試。現在失敗就整筆不算，「沒有 PURCHASE 紀錄」
   * 本身就是可查、可安全重跑的狀態。
   *
   * 已發過（有帶 orderId 的 PURCHASE 紀錄）→ 什麼都不做，回傳 null。
   */
  async awardOrderRewards(
    userId: string,
    orderId: string,
    orderAmount: number,
  ): Promise<{ earnedPoints: number; upgraded: boolean } | null> {
    return this.prisma.$transaction(async (tx) => {
      const alreadyAwarded = await tx.pointTransaction.findFirst({
        where: { orderId, type: 'PURCHASE' },
        select: { id: true },
      });
      if (alreadyAwarded) return null;

      const { upgraded } = await this.applyTotalSpent(tx, userId, orderAmount);
      const earnedPoints = await this.applyPurchasePoints(
        tx,
        userId,
        orderAmount,
        orderId,
      );
      return { earnedPoints, upgraded };
    });
  }

  private async applyPurchasePoints(
    db: TransactionClient,
    userId: string,
    orderAmount: number,
    orderId: string,
  ): Promise<number> {
    const user = await db.user.findUnique({
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

    const config = await db.memberLevelConfig.findUnique({
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

    // 更新積分（呼叫端負責交易）
    await db.user.update({
      where: { id: userId },
      data: { currentPoints: newBalance },
    });
    await db.pointTransaction.create({
      data: {
        userId,
        type: 'PURCHASE',
        points: earnedPoints,
        balance: newBalance,
        description: `消費獲得積分 (${config.pointMultiplier}x)`,
        orderId,
        expiresAt,
      },
    });

    return earnedPoints;
  }

  /**
   * 收回某張訂單給的回饋（訂單退款時呼叫）：消費積分 + 累積消費
   *
   * - 只有這張訂單發過 PURCHASE 積分（= 曾經送達）時才收回；從已出貨直接退款的
   *   訂單沒發過，什麼都不扣。
   * - 兩者都以目前值為上限，不讓餘額或累積消費變成負數。
   * - 不自動降級：等級只影響之後是否再升級，降級規則另議。
   * - 一定會寫一筆帶 orderId 的 ADJUSTMENT 紀錄（即使扣 0 點），它同時是
   *   「已經收回過」的記號。管理員手動調整積分不帶 orderId，不會誤判。
   */
  async revokeOrderRewards(
    userId: string,
    orderId: string,
    orderAmount: number,
  ): Promise<{ points: number; totalSpent: number }> {
    const none = { points: 0, totalSpent: 0 };

    return this.prisma.$transaction(async (tx) => {
      const awarded = await tx.pointTransaction.aggregate({
        where: { orderId, type: 'PURCHASE' },
        _sum: { points: true },
        _count: { _all: true },
      });
      if (awarded._count._all === 0) return none;
      const earned = awarded._sum.points ?? 0;

      const alreadyRevoked = await tx.pointTransaction.findFirst({
        where: { orderId, type: 'ADJUSTMENT' },
        select: { id: true },
      });
      if (alreadyRevoked) return none;

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { currentPoints: true, totalSpent: true },
      });
      if (!user) return none;

      const points = Math.min(earned, user.currentPoints);
      const totalSpent = Math.min(orderAmount, user.totalSpent);
      const newBalance = user.currentPoints - points;

      await tx.user.update({
        where: { id: userId },
        data: {
          currentPoints: newBalance,
          totalSpent: user.totalSpent - totalSpent,
        },
      });
      await tx.pointTransaction.create({
        data: {
          userId,
          type: 'ADJUSTMENT',
          points: -points,
          balance: newBalance,
          description: `訂單退款，收回消費積分 ${points} 點、累積消費 ${totalSpent} 元`,
          orderId,
        },
      });

      return { points, totalSpent };
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
    return this.prisma.$transaction((tx) =>
      this.applyTotalSpent(tx, userId, orderAmount),
    );
  }

  private async applyTotalSpent(
    db: TransactionClient,
    userId: string,
    orderAmount: number,
  ): Promise<{ newTotalSpent: number; upgraded: boolean }> {
    const user = await db.user.update({
      where: { id: userId },
      data: {
        totalSpent: { increment: orderAmount },
      },
      select: { totalSpent: true },
    });

    // 檢查升級（同一 transaction 內）
    const upgraded = await this.checkAndUpgradeLevel(userId, db);

    return {
      newTotalSpent: user.totalSpent,
      upgraded,
    };
  }
}
