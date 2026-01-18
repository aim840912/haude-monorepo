import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  OrdersController,
  AdminOrdersController,
  AdminDashboardController,
} from './orders.controller';
import { DiscountsModule } from '../discounts/discounts.module';
import { MembersModule } from '../members/members.module';

// 專責服務
import {
  QueryUserOrdersService,
  QueryAdminOrdersService,
  OrderStatsService,
  DashboardAnalyticsService,
  CreateOrderService,
  CancelOrderService,
  UpdateOrderService,
} from './services';

@Module({
  imports: [DiscountsModule, MembersModule],
  controllers: [
    OrdersController,
    AdminOrdersController,
    AdminDashboardController,
  ],
  providers: [
    // Facade 服務（保持向後兼容）
    OrdersService,
    // 專責服務
    QueryUserOrdersService,
    QueryAdminOrdersService,
    OrderStatsService,
    DashboardAnalyticsService,
    CreateOrderService,
    CancelOrderService,
    UpdateOrderService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
