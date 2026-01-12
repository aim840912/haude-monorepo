import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
