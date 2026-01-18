import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  PaymentsController,
  AdminPaymentsController,
} from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { EmailModule } from '../email/email.module';

// 專責服務
import {
  PaymentConfigService,
  CreatePaymentService,
  PaymentCallbackService,
  PaymentQueryService,
  PaymentAdminService,
} from './services';

@Module({
  imports: [PrismaModule, ConfigModule, EmailModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [
    // 專責服務
    PaymentConfigService,
    CreatePaymentService,
    PaymentCallbackService,
    PaymentQueryService,
    PaymentAdminService,
    // Facade 服務
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
