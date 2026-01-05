import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  ProductsController,
  AdminProductsController,
} from './products.controller';

@Module({
  controllers: [ProductsController, AdminProductsController],
  providers: [ProductsService],
  exports: [ProductsService], // 匯出供 Orders 模組使用
})
export class ProductsModule {}
