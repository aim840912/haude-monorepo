import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  OrdersController,
  AdminOrdersController,
  AdminDashboardController,
} from './orders.controller';
import { DiscountsModule } from '../discounts/discounts.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [DiscountsModule, MembersModule],
  controllers: [OrdersController, AdminOrdersController, AdminDashboardController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
