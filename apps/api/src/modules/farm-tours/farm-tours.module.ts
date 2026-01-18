import { Module } from '@nestjs/common';
import { FarmToursService } from './farm-tours.service';
import {
  FarmToursController,
  AdminFarmToursController,
} from './farm-tours.controller';

@Module({
  controllers: [FarmToursController, AdminFarmToursController],
  providers: [FarmToursService],
  exports: [FarmToursService],
})
export class FarmToursModule {}
