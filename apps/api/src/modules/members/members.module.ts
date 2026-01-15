import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController, AdminMembersController } from './members.controller';

@Module({
  controllers: [MembersController, AdminMembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
