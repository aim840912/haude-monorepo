import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase';
import { NotFoundException } from '@nestjs/common';

// Mock uuid to avoid ESM issues
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('LocationsService', () => {
  let service: LocationsService;

  // Mock Prisma
  const mockPrismaService = {
    location: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    locationImage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    $transaction: jest.fn((callbacks) => Promise.all(callbacks)),
  };

  // Mock Supabase
  const mockSupabaseService = {
    createSignedUploadUrl: jest.fn(),
    getPublicUrl: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SupabaseService,
          useValue: mockSupabaseService,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);

    // 清除所有 mock
    jest.clearAllMocks();
  });

  // ========================================
  // 查詢方法測試
  // ========================================

  describe('findAll', () => {
    it('應回傳所有活躍據點並包含圖片', async () => {
      const mockLocations = [
        { id: 'loc-1', name: '本店', isMain: true, images: [] },
        { id: 'loc-2', name: '分店', isMain: false, images: [] },
      ];
      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);

      const result = await service.findAll();

      expect(result).toEqual(mockLocations);
      expect(mockPrismaService.location.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
        include: { images: true },
      });
    });
  });

  describe('findMain', () => {
    it('應回傳主要據點', async () => {
      const mockMain = { id: 'loc-1', name: '本店', isMain: true };
      mockPrismaService.location.findFirst.mockResolvedValue(mockMain);

      const result = await service.findMain();

      expect(result).toEqual(mockMain);
      expect(mockPrismaService.location.findFirst).toHaveBeenCalledWith({
        where: { isMain: true, isActive: true },
      });
    });

    it('找不到主要據點應拋出 NotFoundException', async () => {
      mockPrismaService.location.findFirst.mockResolvedValue(null);

      await expect(service.findMain()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    const locationId = 'loc-123';

    it('應回傳單一據點及圖片', async () => {
      const mockLocation = {
        id: locationId,
        name: '測試據點',
        images: [{ id: 'img-1', storageUrl: 'https://example.com/img.jpg' }],
      };
      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);

      const result = await service.findOne(locationId);

      expect(result).toEqual(mockLocation);
      expect(mockPrismaService.location.findUnique).toHaveBeenCalledWith({
        where: { id: locationId },
        include: { images: true },
      });
    });

    it('找不到據點應拋出 NotFoundException', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(service.findOne(locationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAllAdmin', () => {
    it('應回傳所有據點（含非活躍）並按建立時間排序', async () => {
      const mockLocations = [
        { id: 'loc-1', name: '新店', isActive: true },
        { id: 'loc-2', name: '舊店', isActive: false },
      ];
      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);

      const result = await service.findAllAdmin();

      expect(result).toEqual(mockLocations);
      expect(mockPrismaService.location.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ========================================
  // 命令方法測試
  // ========================================

  describe('createDraft', () => {
    it('應建立草稿據點', async () => {
      const mockDraft = {
        id: 'draft-1',
        name: '未命名門市',
        isDraft: true,
        images: [],
      };
      mockPrismaService.location.create.mockResolvedValue(mockDraft);

      const result = await service.createDraft();

      expect(result).toEqual(mockDraft);
      expect(mockPrismaService.location.create).toHaveBeenCalledWith({
        data: {
          name: '未命名門市',
          address: '',
          isMain: false,
          isActive: true,
          isDraft: true,
        },
        include: { images: true },
      });
    });
  });

  describe('create', () => {
    const createDto = {
      name: '新據點',
      address: '台北市信義區',
      isMain: false,
    };

    it('應成功建立據點', async () => {
      const mockLocation = { id: 'loc-new', ...createDto };
      mockPrismaService.location.create.mockResolvedValue(mockLocation);

      const result = await service.create(createDto);

      expect(result).toEqual(mockLocation);
      expect(mockPrismaService.location.create).toHaveBeenCalled();
    });

    it('設為主要據點時應先取消其他主要據點', async () => {
      const dtoWithMain = { ...createDto, isMain: true };
      mockPrismaService.location.create.mockResolvedValue({
        id: 'loc-new',
        ...dtoWithMain,
      });

      await service.create(dtoWithMain);

      expect(mockPrismaService.location.updateMany).toHaveBeenCalledWith({
        where: { isMain: true },
        data: { isMain: false },
      });
    });
  });

  describe('update', () => {
    const locationId = 'loc-123';
    const updateDto = { name: '更新名稱' };

    it('應成功更新據點', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue({
        id: locationId,
        name: '原名稱',
        images: [],
      });
      mockPrismaService.location.update.mockResolvedValue({
        id: locationId,
        ...updateDto,
      });

      const result = await service.update(locationId, updateDto);

      expect(result.name).toBe('更新名稱');
      expect(mockPrismaService.location.update).toHaveBeenCalledWith({
        where: { id: locationId },
        data: { name: '更新名稱' },
      });
    });

    it('據點不存在應拋出 NotFoundException', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(service.update(locationId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('設為主要據點時應先取消其他主要據點', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue({
        id: locationId,
        images: [],
      });
      mockPrismaService.location.update.mockResolvedValue({
        id: locationId,
        isMain: true,
      });

      await service.update(locationId, { isMain: true });

      expect(mockPrismaService.location.updateMany).toHaveBeenCalledWith({
        where: { isMain: true, id: { not: locationId } },
        data: { isMain: false },
      });
    });
  });

  describe('remove', () => {
    const locationId = 'loc-123';

    it('應成功刪除據點', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue({
        id: locationId,
        images: [],
      });
      mockPrismaService.location.delete.mockResolvedValue({ id: locationId });

      const result = await service.remove(locationId);

      expect(result).toEqual({ message: '據點已刪除' });
      expect(mockPrismaService.location.delete).toHaveBeenCalledWith({
        where: { id: locationId },
      });
    });

    it('據點不存在應拋出 NotFoundException', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(service.remove(locationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ========================================
  // 圖片管理方法測試
  // ========================================

  describe('getUploadUrl', () => {
    const locationId = 'loc-123';
    const fileName = 'test-image.jpg';

    it('應回傳簽名上傳 URL', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue({
        id: locationId,
        images: [],
      });
      mockSupabaseService.createSignedUploadUrl.mockResolvedValue({
        signedUrl: 'https://upload.example.com/signed',
        path: `${locationId}/unique-id.jpg`,
      });
      mockSupabaseService.getPublicUrl.mockReturnValue(
        'https://public.example.com/image.jpg',
      );

      const result = await service.getUploadUrl(locationId, fileName);

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('filePath');
      expect(result).toHaveProperty('publicUrl');
    });

    it('據點不存在應拋出 NotFoundException', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(service.getUploadUrl(locationId, fileName)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addImage', () => {
    const locationId = 'loc-123';
    const imageDto = {
      storageUrl: 'https://example.com/image.jpg',
      filePath: 'loc-123/image.jpg',
    };

    it('應成功新增圖片記錄', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue({
        id: locationId,
        images: [],
      });
      mockPrismaService.locationImage.aggregate.mockResolvedValue({
        _max: { displayPosition: 0 },
      });
      mockPrismaService.locationImage.create.mockResolvedValue({
        id: 'img-new',
        ...imageDto,
        displayPosition: 1,
      });

      const result = await service.addImage(locationId, imageDto);

      expect(result).toHaveProperty('id', 'img-new');
      expect(mockPrismaService.locationImage.create).toHaveBeenCalled();
    });

    it('沒有指定 displayPosition 時應自動計算', async () => {
      // 使用獨立的 imageDto 確保沒有 displayPosition
      const imageDtoWithoutPosition = {
        storageUrl: 'https://example.com/image2.jpg',
        filePath: 'loc-123/image2.jpg',
      };

      mockPrismaService.location.findUnique.mockResolvedValue({
        id: locationId,
        images: [],
      });
      mockPrismaService.locationImage.aggregate.mockResolvedValue({
        _max: { displayPosition: 2 },
      });
      mockPrismaService.locationImage.create.mockResolvedValue({
        id: 'img-new',
        displayPosition: 3,
      });

      await service.addImage(locationId, imageDtoWithoutPosition);

      expect(mockPrismaService.locationImage.aggregate).toHaveBeenCalled();
      expect(mockPrismaService.locationImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            displayPosition: 3,
          }),
        }),
      );
    });
  });

  describe('updateImage', () => {
    const locationId = 'loc-123';
    const imageId = 'img-123';
    const updateDto = { altText: '新描述' };

    it('應成功更新圖片', async () => {
      mockPrismaService.locationImage.findFirst.mockResolvedValue({
        id: imageId,
        locationId,
      });
      mockPrismaService.locationImage.update.mockResolvedValue({
        id: imageId,
        ...updateDto,
      });

      const result = await service.updateImage(locationId, imageId, updateDto);

      expect(result.altText).toBe('新描述');
    });

    it('圖片不存在應拋出 NotFoundException', async () => {
      mockPrismaService.locationImage.findFirst.mockResolvedValue(null);

      await expect(
        service.updateImage(locationId, imageId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeImage', () => {
    const locationId = 'loc-123';
    const imageId = 'img-123';

    it('應成功刪除圖片及 Storage 檔案', async () => {
      mockPrismaService.locationImage.findFirst.mockResolvedValue({
        id: imageId,
        locationId,
        filePath: 'loc-123/image.jpg',
      });
      mockSupabaseService.deleteFile.mockResolvedValue(undefined);
      mockPrismaService.locationImage.delete.mockResolvedValue({
        id: imageId,
      });

      const result = await service.removeImage(locationId, imageId);

      expect(result).toEqual({ message: '圖片已刪除' });
      expect(mockSupabaseService.deleteFile).toHaveBeenCalled();
      expect(mockPrismaService.locationImage.delete).toHaveBeenCalled();
    });

    it('圖片不存在應拋出 NotFoundException', async () => {
      mockPrismaService.locationImage.findFirst.mockResolvedValue(null);

      await expect(service.removeImage(locationId, imageId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('Storage 刪除失敗時仍應刪除資料庫記錄', async () => {
      mockPrismaService.locationImage.findFirst.mockResolvedValue({
        id: imageId,
        locationId,
        filePath: 'loc-123/image.jpg',
      });
      mockSupabaseService.deleteFile.mockRejectedValue(
        new Error('Storage error'),
      );
      mockPrismaService.locationImage.delete.mockResolvedValue({
        id: imageId,
      });

      // 應該不會拋出錯誤
      const result = await service.removeImage(locationId, imageId);

      expect(result).toEqual({ message: '圖片已刪除' });
      expect(mockPrismaService.locationImage.delete).toHaveBeenCalled();
    });
  });

  describe('reorderImages', () => {
    const locationId = 'loc-123';
    const imageIds = ['img-3', 'img-1', 'img-2'];

    it('應成功重新排序圖片', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue({
        id: locationId,
        images: [],
      });
      mockPrismaService.locationImage.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.locationImage.findMany.mockResolvedValue([
        { id: 'img-3', displayPosition: 0 },
        { id: 'img-1', displayPosition: 1 },
        { id: 'img-2', displayPosition: 2 },
      ]);

      const result = await service.reorderImages(locationId, imageIds);

      expect(result).toHaveLength(3);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('getImages', () => {
    const locationId = 'loc-123';

    it('應回傳據點的所有圖片並按順序排列', async () => {
      mockPrismaService.location.findUnique.mockResolvedValue({
        id: locationId,
        images: [],
      });
      const mockImages = [
        { id: 'img-1', displayPosition: 0 },
        { id: 'img-2', displayPosition: 1 },
      ];
      mockPrismaService.locationImage.findMany.mockResolvedValue(mockImages);

      const result = await service.getImages(locationId);

      expect(result).toEqual(mockImages);
      expect(mockPrismaService.locationImage.findMany).toHaveBeenCalledWith({
        where: { locationId },
        orderBy: { displayPosition: 'asc' },
      });
    });
  });
});
