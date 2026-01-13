import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSocialPostDto, UpdateSocialPostDto } from './dto';

@Injectable()
export class SocialPostsService {
  constructor(private prisma: PrismaService) {}

  // ========================================
  // 查詢方法（Query Operations）
  // ========================================

  /**
   * 取得所有啟用的社群貼文（公開 API）
   */
  async findAll() {
    return this.prisma.socialPost.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * 取得所有社群貼文（管理員用）
   */
  async findAllAdmin() {
    return this.prisma.socialPost.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * 取得單一社群貼文
   */
  async findOne(id: string) {
    const post = await this.prisma.socialPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException(`社群貼文不存在: ${id}`);
    }

    return post;
  }

  // ========================================
  // 命令方法（Command Operations）
  // ========================================

  /**
   * 建立社群貼文
   */
  async create(dto: CreateSocialPostDto) {
    // 如果沒有指定 sortOrder，放到最後
    if (dto.sortOrder === undefined) {
      const maxOrder = await this.prisma.socialPost.aggregate({
        _max: { sortOrder: true },
      });
      dto.sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    }

    return this.prisma.socialPost.create({
      data: {
        platform: dto.platform,
        url: dto.url,
        title: dto.title,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * 更新社群貼文
   */
  async update(id: string, dto: UpdateSocialPostDto) {
    // 確認貼文存在
    await this.findOne(id);

    return this.prisma.socialPost.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * 刪除社群貼文
   */
  async remove(id: string) {
    // 確認貼文存在
    await this.findOne(id);

    await this.prisma.socialPost.delete({ where: { id } });

    return { message: '社群貼文已刪除' };
  }

  /**
   * 批次更新排序
   */
  async reorder(ids: string[]) {
    const updates = ids.map((id, index) =>
      this.prisma.socialPost.update({
        where: { id },
        data: { sortOrder: index },
      }),
    );

    await this.prisma.$transaction(updates);

    return this.findAllAdmin();
  }
}
