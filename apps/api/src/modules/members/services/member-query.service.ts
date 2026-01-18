/**
 * Member Query Service
 *
 * 會員查詢相關操作
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MemberLevel } from '@prisma/client';
import type {
  MemberLevelInfo,
  UpgradeProgress,
  PointsHistoryResponse,
} from '../types';

@Injectable()
export class MemberQueryService {
  constructor(private readonly prisma: PrismaService) {}

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
  ): Promise<PointsHistoryResponse> {
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
}
