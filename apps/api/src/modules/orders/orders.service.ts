import { Injectable } from '@nestjs/common';
import { CreateOrderDto, UpdateOrderStatusDto, CancelOrderDto } from './dto';

// 專責服務
import {
  QueryUserOrdersService,
  QueryAdminOrdersService,
  OrderStatsService,
  DashboardAnalyticsService,
  CreateOrderService,
  CancelOrderService,
  UpdateOrderService,
  OrderExpiryService,
} from './services';

/**
 * 訂單服務 Facade
 *
 * 這是一個 Facade（外觀）服務，將訂單相關操作委派給各專責服務。
 * 保持向後兼容，控制器不需要修改。
 *
 * 專責服務分布：
 * - QueryUserOrdersService: 使用者訂單查詢
 * - QueryAdminOrdersService: 管理員訂單查詢
 * - OrderStatsService: 訂單統計
 * - DashboardAnalyticsService: 儀表板分析
 * - CreateOrderService: 訂單建立
 * - CancelOrderService: 訂單取消
 * - UpdateOrderService: 訂單更新
 * - OrderExpiryService: 訂單過期自動取消
 */
@Injectable()
export class OrdersService {
  constructor(
    private queryUserOrdersService: QueryUserOrdersService,
    private queryAdminOrdersService: QueryAdminOrdersService,
    private orderStatsService: OrderStatsService,
    private dashboardAnalyticsService: DashboardAnalyticsService,
    private createOrderService: CreateOrderService,
    private cancelOrderService: CancelOrderService,
    private updateOrderService: UpdateOrderService,
    private orderExpiryService: OrderExpiryService,
  ) {}

  // ========================================
  // 使用者查詢方法（委派給 QueryUserOrdersService）
  // ========================================

  /**
   * 取得使用者的訂單列表
   */
  getUserOrders(userId: string, limit = 20, offset = 0) {
    return this.queryUserOrdersService.getUserOrders(userId, limit, offset);
  }

  /**
   * 取得單一訂單（驗證權限）
   */
  getOrderById(orderId: string, userId: string) {
    return this.queryUserOrdersService.getOrderById(orderId, userId);
  }

  // ========================================
  // 管理員查詢方法（委派給 QueryAdminOrdersService）
  // ========================================

  /**
   * 取得單一訂單詳情（管理員，不驗證 userId）
   */
  getOrderByIdForAdmin(orderId: string) {
    return this.queryAdminOrdersService.getOrderByIdForAdmin(orderId);
  }

  /**
   * 取得所有訂單（管理員）
   */
  getAllOrders(limit = 20, offset = 0) {
    return this.queryAdminOrdersService.getAllOrders(limit, offset);
  }

  // ========================================
  // 訂單統計（委派給 OrderStatsService）
  // ========================================

  /**
   * 取得訂單統計
   */
  getOrderStats() {
    return this.orderStatsService.getOrderStats();
  }

  // ========================================
  // 儀表板統計方法（委派給 DashboardAnalyticsService）
  // ========================================

  /**
   * 取得營收趨勢數據
   */
  getRevenueTrend(period: 'day' | 'week' | 'month' = 'day') {
    return this.dashboardAnalyticsService.getRevenueTrend(period);
  }

  /**
   * 取得訂單狀態分布（用於圓餅圖）
   */
  getOrderStatusDistribution() {
    return this.dashboardAnalyticsService.getOrderStatusDistribution();
  }

  /**
   * 取得熱銷產品排行
   */
  getTopProducts(limit = 10) {
    return this.dashboardAnalyticsService.getTopProducts(limit);
  }

  // ========================================
  // 建立訂單（委派給 CreateOrderService）
  // ========================================

  /**
   * 建立訂單
   */
  createOrder(userId: string, dto: CreateOrderDto) {
    return this.createOrderService.createOrder(userId, dto);
  }

  // ========================================
  // 取消訂單（委派給 CancelOrderService）
  // ========================================

  /**
   * 取消訂單（使用者）
   */
  cancelOrder(orderId: string, userId: string, dto: CancelOrderDto) {
    return this.cancelOrderService.cancelOrder(orderId, userId, dto);
  }

  // ========================================
  // 管理員更新訂單（委派給 UpdateOrderService）
  // ========================================

  /**
   * 更新訂單狀態（管理員）
   */
  updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    return this.updateOrderService.updateOrderStatus(orderId, dto);
  }

  // ========================================
  // 訂單過期（委派給 OrderExpiryService）
  // ========================================

  /**
   * 手動觸發過期訂單掃描
   */
  handleExpiredOrders() {
    return this.orderExpiryService.handleExpiredOrders();
  }
}
