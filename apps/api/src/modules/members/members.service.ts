import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MemberLevel, PointTransactionType } from '@prisma/client';

export interface MemberLevelInfo {
  level: MemberLevel;
  displayName: string;
  totalSpent: number;
  currentPoints: number;
  discountPercent: number;
  freeShipping: boolean;
  pointMultiplier: number;
}

export interface UpgradeProgress {
  currentLevel: MemberLevel;
  currentLevelName: string;
  totalSpent: number;
  nextLevel: MemberLevel | null;
  nextLevelName: string | null;
  amountToNextLevel: number | null;
  progressPercent: number;
}

export interface PointsHistoryItem {
  id: string;
  type: PointTransactionType;
  points: number;
  balance: number;
  description: string | null;
  createdAt: Date;
}

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 取得會員等級資訊
   */
  async getLevelInfo(userId: string): Promise<MemberLevelInfo> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        memberLevel: true,
        totalSpent: true,
        currentPoints: true,
      },
    });

    if (!user) {
      throw new NotFoundException('使用者不存在');
    }

    const config = await this.prisma.memberLevelConfig.findUnique({
      where: { level: user.memberLevel },
    });

    if (!config) {
      throw new NotFoundException('會員等級設定不存在');
    }

    return {
      level: user.memberLevel,
      displayName: config.displayName,
      totalSpent: user.totalSpent,
      currentPoints: user.currentPoints,
      discountPercent: config.discountPercent,
      freeShipping: config.freeShipping,
      pointMultiplier: config.pointMultiplier,
    };
  }

  /**
   * 取得升級進度
   */
  async getUpgradeProgress(userId: string): Promise<UpgradeProgress> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        memberLevel: true,
        totalSpent: true,
      },
    });

    if (!user) {
      throw new NotFoundException('使用者不存在');
    }

    // 取得所有等級設定
    const configs = await this.prisma.memberLevelConfig.findMany({
      orderBy: { minSpent: 'asc' },
    });

    const currentConfig = configs.find((c) => c.level === user.memberLevel);
    const currentIndex = configs.findIndex((c) => c.level === user.memberLevel);
    const nextConfig = configs[currentIndex + 1] || null;

    let progressPercent = 100;
    let amountToNextLevel: number | null = null;

    if (nextConfig) {
      amountToNextLevel = nextConfig.minSpent - user.totalSpent;
      const currentThreshold = currentConfig?.minSpent || 0;
      const range = nextConfig.minSpent - currentThreshold;
      const progress = user.totalSpent - currentThreshold;
      progressPercent = Math.min(100, Math.round((progress / range) * 100));
    }

    return {
      currentLevel: user.memberLevel,
      currentLevelName: currentConfig?.displayName || '普通會員',
      totalSpent: user.totalSpent,
      nextLevel: nextConfig?.level || null,
      nextLevelName: nextConfig?.displayName || null,
      amountToNextLevel:
        amountToNextLevel && amountToNextLevel > 0 ? amountToNextLevel : null,
      progressPercent,
    };
  }

  /**
   * 取得積分餘額
   */
  async getPointsBalance(userId: string): Promise<{ balance: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentPoints: true },
    });

    if (!user) {
      throw new NotFoundException('使用者不存在');
    }

    return { balance: user.currentPoints };
  }

  /**
   * 取得積分歷史
   */
  async getPointsHistory(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: PointsHistoryItem[]; total: number; hasMore: boolean }> {
    const [items, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        where: { userId },
        select: {
          id: true,
          type: true,
          points: true,
          balance: true,
          description: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.pointTransaction.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

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

  /**
   * 取得等級設定（用於折扣計算）
   */
  async getLevelConfig(level: MemberLevel) {
    return this.prisma.memberLevelConfig.findUnique({
      where: { level },
    });
  }

  /**
   * 取得所有等級設定
   */
  async getAllLevelConfigs() {
    return this.prisma.memberLevelConfig.findMany({
      orderBy: { minSpent: 'asc' },
    });
  }

  // ==========================================
  // Admin 方法
  // ==========================================

  /**
   * [Admin] 取得會員列表（含等級、積分篩選）
   */
  async getAdminMembersList(options: {
    level?: MemberLevel;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    const { level, search, limit = 20, offset = 0 } = options;

    const where: {
      memberLevel?: MemberLevel;
      OR?: Array<{
        email?: { contains: string; mode: 'insensitive' };
        name?: { contains: string; mode: 'insensitive' };
      }>;
    } = {};

    if (level) {
      where.memberLevel = level;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          memberLevel: true,
          totalSpent: true,
          currentPoints: true,
          levelUpdatedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * [Admin] 取得會員等級變更歷史
   */
  async getMemberLevelHistory(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{
    items: Array<{
      id: string;
      fromLevel: MemberLevel;
      toLevel: MemberLevel;
      reason: string;
      triggeredBy: string | null;
      createdAt: Date;
    }>;
    total: number;
    hasMore: boolean;
  }> {
    // 檢查使用者是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('使用者不存在');
    }

    const [items, total] = await Promise.all([
      this.prisma.memberLevelHistory.findMany({
        where: { userId },
        select: {
          id: true,
          fromLevel: true,
          toLevel: true,
          reason: true,
          triggeredBy: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.memberLevelHistory.count({ where: { userId } }),
    ]);

    return {
      items,
      total,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * [Admin] 手動調整會員等級
   */
  async adjustMemberLevel(
    userId: string,
    newLevel: MemberLevel,
    adminId: string,
    reason?: string,
  ): Promise<{
    success: boolean;
    user: { id: string; memberLevel: MemberLevel };
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { memberLevel: true },
    });

    if (!user) {
      throw new NotFoundException('使用者不存在');
    }

    if (user.memberLevel === newLevel) {
      return {
        success: true,
        user: { id: userId, memberLevel: newLevel },
      };
    }

    // 更新等級並記錄歷史
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          memberLevel: newLevel,
          levelUpdatedAt: new Date(),
        },
        select: { id: true, memberLevel: true },
      });

      await tx.memberLevelHistory.create({
        data: {
          userId,
          fromLevel: user.memberLevel,
          toLevel: newLevel,
          reason: reason || '管理員手動調整',
          triggeredBy: adminId,
        },
      });

      return updated;
    });

    return {
      success: true,
      user: updatedUser,
    };
  }

  /**
   * [Admin] 手動調整會員積分
   */
  async adjustMemberPoints(
    userId: string,
    points: number,
    adminId: string,
    reason?: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentPoints: true },
    });

    if (!user) {
      throw new NotFoundException('使用者不存在');
    }

    const newBalance = user.currentPoints + points;

    // 檢查積分是否會變成負數
    if (newBalance < 0) {
      throw new NotFoundException(
        `積分不足，當前積分: ${user.currentPoints}，嘗試扣除: ${Math.abs(points)}`,
      );
    }

    // 更新積分並記錄交易
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { currentPoints: newBalance },
      }),
      this.prisma.pointTransaction.create({
        data: {
          userId,
          type: 'ADJUSTMENT',
          points,
          balance: newBalance,
          description: reason || `管理員調整 (${adminId})`,
        },
      }),
    ]);

    return {
      success: true,
      newBalance,
    };
  }

  /**
   * [Admin] 取得單一會員詳細資訊
   */
  async getMemberDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        memberLevel: true,
        totalSpent: true,
        currentPoints: true,
        birthday: true,
        levelUpdatedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('使用者不存在');
    }

    // 取得等級設定
    const levelConfig = await this.prisma.memberLevelConfig.findUnique({
      where: { level: user.memberLevel },
    });

    return {
      ...user,
      levelConfig: levelConfig
        ? {
            displayName: levelConfig.displayName,
            discountPercent: levelConfig.discountPercent,
            freeShipping: levelConfig.freeShipping,
            pointMultiplier: levelConfig.pointMultiplier,
          }
        : null,
    };
  }
}
