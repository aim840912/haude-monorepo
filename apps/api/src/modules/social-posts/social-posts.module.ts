import { Module } from '@nestjs/common';
import { SocialPostsService } from './social-posts.service';
import {
  SocialPostsController,
  AdminSocialPostsController,
} from './social-posts.controller';

@Module({
  controllers: [SocialPostsController, AdminSocialPostsController],
  providers: [SocialPostsService],
  exports: [SocialPostsService],
})
export class SocialPostsModule {}
