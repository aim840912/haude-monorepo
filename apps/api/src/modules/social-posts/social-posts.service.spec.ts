import { Test, TestingModule } from '@nestjs/testing';
import { SocialPostsService } from './social-posts.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import {
  CreateSocialPostDto,
  SocialPlatform,
} from './dto/create-social-post.dto';

describe('SocialPostsService', () => {
  let service: SocialPostsService;

  // Mock Prisma
  const mockPrismaService = {
    socialPost: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn((callbacks) => {
      if (Array.isArray(callbacks)) {
        return Promise.all(callbacks);
      }
      return callbacks;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialPostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SocialPostsService>(SocialPostsService);

    jest.clearAllMocks();
  });

  // ========================================
  // 查詢方法測試
  // ========================================

  describe('findAll', () => {
    it('應回傳所有啟用的社群貼文', async () => {
      const mockPosts = [
        { id: 'post-1', platform: 'instagram', isActive: true, sortOrder: 0 },
        { id: 'post-2', platform: 'facebook', isActive: true, sortOrder: 1 },
      ];
      mockPrismaService.socialPost.findMany.mockResolvedValue(mockPosts);

      const result = await service.findAll();

      expect(result).toEqual(mockPosts);
      expect(mockPrismaService.socialPost.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findAllAdmin', () => {
    it('應回傳所有社群貼文（含停用）', async () => {
      const mockPosts = [
        { id: 'post-1', platform: 'instagram', isActive: true, sortOrder: 0 },
        { id: 'post-2', platform: 'facebook', isActive: false, sortOrder: 1 },
      ];
      mockPrismaService.socialPost.findMany.mockResolvedValue(mockPosts);

      const result = await service.findAllAdmin();

      expect(result).toEqual(mockPosts);
      expect(mockPrismaService.socialPost.findMany).toHaveBeenCalledWith({
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    it('應回傳單一社群貼文', async () => {
      const mockPost = { id: 'post-1', platform: 'instagram', url: 'https://...' };
      mockPrismaService.socialPost.findUnique.mockResolvedValue(mockPost);

      const result = await service.findOne('post-1');

      expect(result).toEqual(mockPost);
      expect(mockPrismaService.socialPost.findUnique).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });

    it('找不到應拋出 NotFoundException', async () => {
      mockPrismaService.socialPost.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ========================================
  // 命令方法測試
  // ========================================

  describe('create', () => {
    const createDto: CreateSocialPostDto = {
      platform: SocialPlatform.instagram,
      url: 'https://instagram.com/p/123',
      title: 'IG 貼文',
    };

    it('應成功建立社群貼文', async () => {
      mockPrismaService.socialPost.aggregate.mockResolvedValue({
        _max: { sortOrder: 2 },
      });
      mockPrismaService.socialPost.create.mockResolvedValue({
        id: 'post-new',
        ...createDto,
        sortOrder: 3,
        isActive: true,
      });

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id', 'post-new');
      expect(mockPrismaService.socialPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          platform: createDto.platform,
          url: createDto.url,
          title: createDto.title,
          sortOrder: 3,
          isActive: true,
        }),
      });
    });

    it('應使用指定的 sortOrder', async () => {
      const dtoWithOrder = { ...createDto, sortOrder: 5 };
      mockPrismaService.socialPost.create.mockResolvedValue({
        id: 'post-new',
        ...dtoWithOrder,
      });

      await service.create(dtoWithOrder);

      expect(mockPrismaService.socialPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sortOrder: 5,
        }),
      });
    });

    it('無指定 sortOrder 時應自動計算', async () => {
      // 不含 sortOrder 的 DTO
      const dtoWithoutOrder: CreateSocialPostDto = {
        platform: SocialPlatform.instagram,
        url: 'https://instagram.com/p/123',
        title: 'IG 貼文',
        // sortOrder: undefined
      };
      mockPrismaService.socialPost.aggregate.mockResolvedValue({
        _max: { sortOrder: null },
      });
      mockPrismaService.socialPost.create.mockResolvedValue({
        id: 'post-new',
        ...dtoWithoutOrder,
        sortOrder: 0,
      });

      await service.create(dtoWithoutOrder);

      expect(mockPrismaService.socialPost.aggregate).toHaveBeenCalled();
      expect(mockPrismaService.socialPost.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sortOrder: 0, // -1 + 1 = 0
        }),
      });
    });
  });

  describe('update', () => {
    const postId = 'post-123';
    const updateDto = { title: '更新標題' };

    it('應成功更新社群貼文', async () => {
      mockPrismaService.socialPost.findUnique.mockResolvedValue({
        id: postId,
        title: '舊標題',
      });
      mockPrismaService.socialPost.update.mockResolvedValue({
        id: postId,
        ...updateDto,
      });

      const result = await service.update(postId, updateDto);

      expect(result.title).toBe('更新標題');
      expect(mockPrismaService.socialPost.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: updateDto,
      });
    });

    it('貼文不存在應拋出 NotFoundException', async () => {
      mockPrismaService.socialPost.findUnique.mockResolvedValue(null);

      await expect(service.update(postId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const postId = 'post-123';

    it('應成功刪除社群貼文', async () => {
      mockPrismaService.socialPost.findUnique.mockResolvedValue({ id: postId });
      mockPrismaService.socialPost.delete.mockResolvedValue({ id: postId });

      const result = await service.remove(postId);

      expect(result).toEqual({ message: '社群貼文已刪除' });
      expect(mockPrismaService.socialPost.delete).toHaveBeenCalledWith({
        where: { id: postId },
      });
    });

    it('貼文不存在應拋出 NotFoundException', async () => {
      mockPrismaService.socialPost.findUnique.mockResolvedValue(null);

      await expect(service.remove(postId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorder', () => {
    it('應成功批次更新排序', async () => {
      const ids = ['post-2', 'post-1', 'post-3'];
      const reorderedPosts = [
        { id: 'post-2', sortOrder: 0 },
        { id: 'post-1', sortOrder: 1 },
        { id: 'post-3', sortOrder: 2 },
      ];

      mockPrismaService.$transaction.mockResolvedValue([{}, {}, {}]);
      mockPrismaService.socialPost.findMany.mockResolvedValue(reorderedPosts);

      const result = await service.reorder(ids);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(result).toEqual(reorderedPosts);
    });

    it('應按 ID 順序設定 sortOrder', async () => {
      const ids = ['post-a', 'post-b'];

      // 模擬 $transaction 接收更新陣列
      mockPrismaService.$transaction.mockImplementation((updates) => {
        // 驗證更新操作的格式
        expect(updates).toHaveLength(2);
        return Promise.all(updates);
      });
      mockPrismaService.socialPost.update.mockResolvedValue({});
      mockPrismaService.socialPost.findMany.mockResolvedValue([]);

      await service.reorder(ids);

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });
});
