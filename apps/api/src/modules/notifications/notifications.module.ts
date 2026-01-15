import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import {
  NotificationsController,
  StockAlertsController,
} from './notifications.controller';

@Module({
  controllers: [NotificationsController, StockAlertsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
