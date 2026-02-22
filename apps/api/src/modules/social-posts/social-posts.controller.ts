import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { SocialPostsService } from './social-posts.service';
import { CreateSocialPostDto, UpdateSocialPostDto } from './dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Cacheable, NoCache } from '@/common/decorators/cacheable.decorator';

// ========================================
// 公開 API
// ========================================

@ApiTags('social-posts')
@Controller('social-posts')
@Cacheable(300)
export class SocialPostsController {
  constructor(private readonly socialPostsService: SocialPostsService) {}

  @Get()
  @ApiOperation({ summary: '取得所有啟用的社群貼文' })
  @ApiResponse({ status: 200, description: '成功取得社群貼文列表' })
  findAll() {
    return this.socialPostsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '取得單一社群貼文' })
  @ApiResponse({ status: 200, description: '成功取得社群貼文' })
  @ApiResponse({ status: 404, description: '社群貼文不存在' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.socialPostsService.findOne(id);
  }
}

// ========================================
// 管理員 API
// ========================================

@ApiTags('admin/social-posts')
@Controller('admin/social-posts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
@NoCache()
export class AdminSocialPostsController {
  constructor(private readonly socialPostsService: SocialPostsService) {}

  @Get()
  @ApiOperation({ summary: '取得所有社群貼文（管理員）' })
  @ApiResponse({ status: 200, description: '成功取得所有社群貼文列表' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  findAll() {
    return this.socialPostsService.findAllAdmin();
  }

  @Post()
  @ApiOperation({ summary: '建立社群貼文（管理員）' })
  @ApiResponse({ status: 201, description: '社群貼文建立成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  create(@Body() dto: CreateSocialPostDto) {
    return this.socialPostsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新社群貼文（管理員）' })
  @ApiResponse({ status: 200, description: '社群貼文更新成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '社群貼文不存在' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSocialPostDto,
  ) {
    return this.socialPostsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '刪除社群貼文（管理員）' })
  @ApiResponse({ status: 200, description: '社群貼文刪除成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  @ApiResponse({ status: 404, description: '社群貼文不存在' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.socialPostsService.remove(id);
  }

  @Put('reorder')
  @ApiOperation({ summary: '重新排序社群貼文（管理員）' })
  @ApiResponse({ status: 200, description: '排序更新成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  @ApiResponse({ status: 403, description: '權限不足' })
  reorder(@Body() body: { ids: string[] }) {
    return this.socialPostsService.reorder(body.ids);
  }
}
