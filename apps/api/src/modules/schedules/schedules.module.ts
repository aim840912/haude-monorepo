import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import {
  SchedulesController,
  AdminSchedulesController,
} from './schedules.controller';

@Module({
  controllers: [SchedulesController, AdminSchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
