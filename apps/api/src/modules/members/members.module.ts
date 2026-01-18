import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import {
  MembersController,
  AdminMembersController,
} from './members.controller';

// Specialized Services
import {
  MemberQueryService,
  MemberPointsService,
  MemberAdminService,
} from './services';

@Module({
  controllers: [MembersController, AdminMembersController],
  providers: [
    MemberQueryService,
    MemberPointsService,
    MemberAdminService,
    MembersService,
  ],
  exports: [MembersService],
})
export class MembersModule {}
