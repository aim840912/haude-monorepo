/**
 * Member Module Types
 *
 * 會員服務共用型別定義
 */

import { MemberLevel, PointTransactionType } from '@prisma/client';

/**
 * 會員等級資訊
 */
export interface MemberLevelInfo {
  level: MemberLevel;
  displayName: string;
  totalSpent: number;
  currentPoints: number;
  discountPercent: number;
  freeShipping: boolean;
  pointMultiplier: number;
}

/**
 * 升級進度
 */
export interface UpgradeProgress {
  currentLevel: MemberLevel;
  currentLevelName: string;
  totalSpent: number;
  nextLevel: MemberLevel | null;
  nextLevelName: string | null;
  amountToNextLevel: number | null;
  progressPercent: number;
}

/**
 * 積分歷史項目
 */
export interface PointsHistoryItem {
  id: string;
  type: PointTransactionType;
  points: number;
  balance: number;
  description: string | null;
  createdAt: Date;
}

/**
 * 積分歷史回應
 */
export interface PointsHistoryResponse {
  items: PointsHistoryItem[];
  total: number;
  hasMore: boolean;
}

/**
 * 會員列表選項
 */
export interface AdminMembersListOptions {
  level?: MemberLevel;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * 會員等級歷史項目
 */
export interface MemberLevelHistoryItem {
  id: string;
  fromLevel: MemberLevel;
  toLevel: MemberLevel;
  reason: string;
  triggeredBy: string | null;
  createdAt: Date;
}

/**
 * 會員詳細資訊
 */
export interface MemberDetailInfo {
  id: string;
  email: string;
  name: string | null;
  memberLevel: MemberLevel;
  totalSpent: number;
  currentPoints: number;
  birthday: Date | null;
  levelUpdatedAt: Date | null;
  createdAt: Date;
  levelConfig: {
    displayName: string;
    discountPercent: number;
    freeShipping: boolean;
    pointMultiplier: number;
  } | null;
}
