/**
 * Member Points Service
 *
 * 會員積分與等級升級相關操作
 */

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class MemberPointsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 檢查並升級會員等級
   * 應在訂單完成後呼叫
   */
  async checkAndUpgradeLevel(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
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
    const configs = await this.prisma.memberLevelConfig.findMany({
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
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          memberLevel: eligibleConfig.level,
          levelUpdatedAt: new Date(),
        },
      }),
      this.prisma.memberLevelHistory.create({
        data: {
          userId,
          fromLevel: user.memberLevel,
          toLevel: eligibleConfig.level,
          reason: `累積消費達到 NT$${user.totalSpent.toLocaleString()}`,
          triggeredBy: 'system',
        },
      }),
    ]);

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
   * 更新累積消費並檢查升級
   * 應在訂單完成後呼叫
   */
  async updateTotalSpentAndCheckUpgrade(
    userId: string,
    orderAmount: number,
  ): Promise<{ newTotalSpent: number; upgraded: boolean }> {
    // 更新累積消費
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalSpent: { increment: orderAmount },
      },
      select: { totalSpent: true },
    });

    // 檢查升級
    const upgraded = await this.checkAndUpgradeLevel(userId);

    return {
      newTotalSpent: user.totalSpent,
      upgraded,
    };
  }
}
