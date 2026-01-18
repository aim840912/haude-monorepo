/**
 * Members Service (Facade)
 *
 * 會員服務的統一入口，委派至專責服務
 */

import { Injectable } from '@nestjs/common';
import { MemberLevel } from '@prisma/client';

// Types - Re-export for backward compatibility
export type {
  MemberLevelInfo,
  UpgradeProgress,
  PointsHistoryItem,
  PointsHistoryResponse,
  AdminMembersListOptions,
  MemberLevelHistoryItem,
  MemberDetailInfo,
} from './types';

// Specialized Services
import { MemberQueryService } from './services/member-query.service';
import { MemberPointsService } from './services/member-points.service';
import { MemberAdminService } from './services/member-admin.service';

import type {
  MemberLevelInfo,
  UpgradeProgress,
  PointsHistoryResponse,
  AdminMembersListOptions,
  MemberLevelHistoryItem,
  MemberDetailInfo,
} from './types';

@Injectable()
export class MembersService {
  constructor(
    private readonly queryService: MemberQueryService,
    private readonly pointsService: MemberPointsService,
    private readonly adminService: MemberAdminService,
  ) {}

  // ==========================================
  // Query Methods (User-facing)
  // ==========================================

  /**
   * 取得會員等級資訊
   */
  async getLevelInfo(userId: string): Promise<MemberLevelInfo> {
    return this.queryService.getLevelInfo(userId);
  }

  /**
   * 取得升級進度
   */
  async getUpgradeProgress(userId: string): Promise<UpgradeProgress> {
    return this.queryService.getUpgradeProgress(userId);
  }

  /**
   * 取得積分餘額
   */
  async getPointsBalance(userId: string): Promise<{ balance: number }> {
    return this.queryService.getPointsBalance(userId);
  }

  /**
   * 取得積分歷史
   */
  async getPointsHistory(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<PointsHistoryResponse> {
    return this.queryService.getPointsHistory(userId, limit, offset);
  }

  /**
   * 取得等級設定（用於折扣計算）
   */
  async getLevelConfig(level: MemberLevel) {
    return this.queryService.getLevelConfig(level);
  }

  /**
   * 取得所有等級設定
   */
  async getAllLevelConfigs() {
    return this.queryService.getAllLevelConfigs();
  }

  // ==========================================
  // Points Methods
  // ==========================================

  /**
   * 檢查並升級會員等級
   * 應在訂單完成後呼叫
   */
  async checkAndUpgradeLevel(userId: string): Promise<boolean> {
    return this.pointsService.checkAndUpgradeLevel(userId);
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
    return this.pointsService.addPointsForPurchase(
      userId,
      orderAmount,
      orderId,
    );
  }

  /**
   * 更新累積消費並檢查升級
   * 應在訂單完成後呼叫
   */
  async updateTotalSpentAndCheckUpgrade(
    userId: string,
    orderAmount: number,
  ): Promise<{ newTotalSpent: number; upgraded: boolean }> {
    return this.pointsService.updateTotalSpentAndCheckUpgrade(
      userId,
      orderAmount,
    );
  }

  // ==========================================
  // Admin Methods
  // ==========================================

  /**
   * [Admin] 取得會員列表（含等級、積分篩選）
   */
  async getAdminMembersList(options: AdminMembersListOptions) {
    return this.adminService.getMembersList(options);
  }

  /**
   * [Admin] 取得會員等級變更歷史
   */
  async getMemberLevelHistory(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{
    items: MemberLevelHistoryItem[];
    total: number;
    hasMore: boolean;
  }> {
    return this.adminService.getLevelHistory(userId, limit, offset);
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
    return this.adminService.adjustLevel(userId, newLevel, adminId, reason);
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
    return this.adminService.adjustPoints(userId, points, adminId, reason);
  }

  /**
   * [Admin] 取得單一會員詳細資訊
   */
  async getMemberDetail(userId: string): Promise<MemberDetailInfo> {
    return this.adminService.getMemberDetail(userId);
  }
}
