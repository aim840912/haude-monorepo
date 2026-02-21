import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { envValidationSchema } from './config/env.validation';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './common/supabase';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FarmToursModule } from './modules/farm-tours/farm-tours.module';
import { LocationsModule } from './modules/locations/locations.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { CartModule } from './modules/cart/cart.module';
import { EmailModule } from './modules/email/email.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SocialPostsModule } from './modules/social-posts/social-posts.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { MembersModule } from './modules/members/members.module';
import { SystemModule } from './modules/system/system.module';

@Module({
  imports: [
    // Config - 環境變數驗證
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // 顯示所有驗證錯誤，而非只有第一個
        allowUnknown: true, // 允許額外的環境變數（如 Vercel 注入的系統變數）
      },
    }),

    // Scheduling - 排程任務（如訂單超時自動取消）
    ScheduleModule.forRoot(),

    // Rate Limiting - 多層級速率限制
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 秒
        limit: 3, // 每秒最多 3 次請求
      },
      {
        name: 'medium',
        ttl: 10000, // 10 秒
        limit: 20, // 每 10 秒最多 20 次請求
      },
      {
        name: 'long',
        ttl: 60000, // 1 分鐘
        limit: 100, // 每分鐘最多 100 次請求
      },
    ]),

    // Database & Storage
    PrismaModule,
    SupabaseModule,

    // Global modules
    EmailModule,

    // Feature modules
    AuthModule,
    UsersModule,
    HealthModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    FarmToursModule,
    LocationsModule,
    SchedulesModule,
    CartModule,
    DiscountsModule,
    ReviewsModule,
    SocialPostsModule,
    SearchModule,
    NotificationsModule,
    ReportsModule,
    MembersModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全域速率限制 Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
