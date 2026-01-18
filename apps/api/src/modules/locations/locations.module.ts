import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import {
  LocationsController,
  AdminLocationsController,
} from './locations.controller';

@Module({
  controllers: [LocationsController, AdminLocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
