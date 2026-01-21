import { Module } from '@nestjs/common';
import { SystemService } from './system.service';
import { SystemController, AdminSystemController } from './system.controller';

@Module({
  controllers: [SystemController, AdminSystemController],
  providers: [SystemService],
  exports: [SystemService],
})
export class SystemModule {}
