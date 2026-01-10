import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  PaymentsController,
  AdminPaymentsController,
} from './payments.controller';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
