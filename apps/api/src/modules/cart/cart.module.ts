import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService], // 匯出供 Orders 模組使用（結帳時）
})
export class CartModule {}
