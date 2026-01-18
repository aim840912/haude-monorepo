/**
 * Member Admin Service
 *
 * 會員管理後台相關操作
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MemberLevel } from '@prisma/client';
import type {
  AdminMembersListOptions,
  MemberLevelHistoryItem,
  MemberDetailInfo,
} from '../types';

@Injectable()
export class MemberAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * [Admin] 取得會員列表（含等級、積分篩選）
   */
  async getMembersList(options: AdminMembersListOptions) {
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
  async getLevelHistory(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{
    items: MemberLevelHistoryItem[];
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
  async adjustLevel(
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
  async adjustPoints(
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
  async getMemberDetail(userId: string): Promise<MemberDetailInfo> {
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
