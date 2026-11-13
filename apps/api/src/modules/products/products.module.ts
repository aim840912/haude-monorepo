import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  ProductsController,
  AdminProductsController,
} from './products.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // 匯出供 Orders 模組使用
})
export class ProductsModule {}
