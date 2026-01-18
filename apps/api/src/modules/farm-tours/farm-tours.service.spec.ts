import { Test, TestingModule } from '@nestjs/testing';
import { FarmToursService } from './farm-tours.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { FarmTourStatus } from '@prisma/client';
import {
  CreateFarmTourDto,
  FarmTourStatus as DtoFarmTourStatus,
  FarmTourType,
} from './dto/create-farm-tour.dto';

// Mock uuid to avoid ESM issues
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('FarmToursService', () => {
  let service: FarmToursService;

  // Mock Prisma
  const mockPrismaService = {
    farmTour: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    farmTourBooking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    farmTourImage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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

  // Mock Supabase
  const mockSupabaseService = {
    createSignedUploadUrl: jest.fn(),
    getPublicUrl: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FarmToursService,
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

    service = module.get<FarmToursService>(FarmToursService);

    jest.clearAllMocks();
  });

  // ========================================
  // 查詢方法測試
  // ========================================

  describe('findAll', () => {
    it('應回傳所有活躍農場體驗', async () => {
      const mockTours = [
        { id: 'tour-1', name: '採茶體驗', isActive: true },
        { id: 'tour-2', name: '製茶體驗', isActive: true },
      ];
      mockPrismaService.farmTour.findMany.mockResolvedValue(mockTours);

      const result = await service.findAll();

      expect(result).toEqual(mockTours);
      expect(mockPrismaService.farmTour.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findUpcoming', () => {
    it('應回傳即將舉行的體驗', async () => {
      const mockTours = [{ id: 'tour-1', status: FarmTourStatus.upcoming }];
      mockPrismaService.farmTour.findMany.mockResolvedValue(mockTours);

      const result = await service.findUpcoming();

      expect(result).toEqual(mockTours);
      expect(mockPrismaService.farmTour.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          status: FarmTourStatus.upcoming,
          date: { gte: expect.any(Date) },
        },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    const tourId = 'tour-123';

    it('應回傳單一農場體驗含預約', async () => {
      const mockTour = {
        id: tourId,
        name: '採茶體驗',
        bookings: [{ id: 'booking-1' }],
      };
      mockPrismaService.farmTour.findUnique.mockResolvedValue(mockTour);

      const result = await service.findOne(tourId);

      expect(result).toEqual(mockTour);
      expect(mockPrismaService.farmTour.findUnique).toHaveBeenCalledWith({
        where: { id: tourId },
        include: { bookings: true },
      });
    });

    it('找不到應拋出 NotFoundException', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue(null);

      await expect(service.findOne(tourId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllAdmin', () => {
    it('應回傳所有體驗含預約資訊', async () => {
      const mockTours = [
        { id: 'tour-1', name: '採茶', bookings: [], isActive: true },
        { id: 'tour-2', name: '製茶', bookings: [], isActive: false },
      ];
      mockPrismaService.farmTour.findMany.mockResolvedValue(mockTours);

      const result = await service.findAllAdmin();

      expect(result).toEqual(mockTours);
      expect(mockPrismaService.farmTour.findMany).toHaveBeenCalledWith({
        include: { bookings: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ========================================
  // 命令方法測試
  // ========================================

  describe('createDraft', () => {
    it('應建立草稿農場體驗', async () => {
      const mockDraft = {
        id: 'draft-1',
        name: '未命名活動',
        isDraft: true,
        images: [],
      };
      mockPrismaService.farmTour.create.mockResolvedValue(mockDraft);

      const result = await service.createDraft();

      expect(result).toEqual(mockDraft);
      expect(mockPrismaService.farmTour.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: '未命名活動',
          isDraft: true,
        }),
        include: { images: true },
      });
    });
  });

  describe('create', () => {
    const createDto: CreateFarmTourDto = {
      name: '採茶體驗',
      description: '親自體驗採茶樂趣',
      date: '2024-03-01',
      startTime: '09:00',
      endTime: '12:00',
      price: 500,
      maxParticipants: 20,
      location: '南投茶園',
      status: DtoFarmTourStatus.upcoming,
      type: FarmTourType.tour,
    };

    it('應成功建立農場體驗', async () => {
      const mockTour = { id: 'tour-new', ...createDto };
      mockPrismaService.farmTour.create.mockResolvedValue(mockTour);

      const result = await service.create(createDto);

      expect(result).toEqual(mockTour);
      expect(mockPrismaService.farmTour.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: createDto.name,
          date: new Date(createDto.date),
          price: createDto.price,
        }),
      });
    });
  });

  describe('update', () => {
    const tourId = 'tour-123';
    const updateDto = { name: '更新名稱' };

    it('應成功更新農場體驗', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue({
        id: tourId,
        bookings: [],
      });
      mockPrismaService.farmTour.update.mockResolvedValue({
        id: tourId,
        ...updateDto,
      });

      const result = await service.update(tourId, updateDto);

      expect(result.name).toBe('更新名稱');
    });

    it('不存在應拋出 NotFoundException', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue(null);

      await expect(service.update(tourId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    const tourId = 'tour-123';

    it('應成功刪除農場體驗', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue({
        id: tourId,
        bookings: [],
      });
      mockPrismaService.farmTour.delete.mockResolvedValue({ id: tourId });

      const result = await service.remove(tourId);

      expect(result).toEqual({ message: '農場體驗已刪除' });
    });
  });

  // ========================================
  // 預約相關測試
  // ========================================

  describe('createBooking', () => {
    const userId = 'user-123';
    const bookingDto = {
      tourId: 'tour-123',
      participants: 2,
      contactName: '王小明',
      contactPhone: '0912345678',
    };

    it('應成功建立預約', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue({
        id: bookingDto.tourId,
        maxParticipants: 20,
        currentParticipants: 5,
        bookings: [],
      });
      mockPrismaService.$transaction.mockResolvedValue([
        { id: 'booking-new', ...bookingDto, userId },
        { id: bookingDto.tourId },
      ]);

      const result = await service.createBooking(userId, bookingDto);

      expect(result).toHaveProperty('id', 'booking-new');
    });

    it('名額不足應拋出 BadRequestException', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue({
        id: bookingDto.tourId,
        maxParticipants: 20,
        currentParticipants: 19, // 只剩 1 個名額
        bookings: [],
      });

      await expect(service.createBooking(userId, bookingDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserBookings', () => {
    const userId = 'user-123';

    it('應回傳使用者的所有預約', async () => {
      const mockBookings = [
        { id: 'booking-1', tour: { id: 'tour-1', name: '採茶' } },
      ];
      mockPrismaService.farmTourBooking.findMany.mockResolvedValue(
        mockBookings,
      );

      const result = await service.getUserBookings(userId);

      expect(result).toEqual(mockBookings);
      expect(mockPrismaService.farmTourBooking.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { tour: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('cancelBooking', () => {
    const userId = 'user-123';
    const bookingId = 'booking-123';

    it('應成功取消預約', async () => {
      mockPrismaService.farmTourBooking.findUnique.mockResolvedValue({
        id: bookingId,
        userId,
        tourId: 'tour-123',
        participants: 2,
      });
      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.cancelBooking(userId, bookingId);

      expect(result).toEqual({ message: '預約已取消' });
    });

    it('預約不存在應拋出 NotFoundException', async () => {
      mockPrismaService.farmTourBooking.findUnique.mockResolvedValue(null);

      await expect(service.cancelBooking(userId, bookingId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('非本人預約應拋出 BadRequestException', async () => {
      mockPrismaService.farmTourBooking.findUnique.mockResolvedValue({
        id: bookingId,
        userId: 'other-user',
        tourId: 'tour-123',
      });

      await expect(service.cancelBooking(userId, bookingId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ========================================
  // 圖片管理測試
  // ========================================

  describe('getUploadUrl', () => {
    const farmTourId = 'tour-123';
    const fileName = 'test.jpg';

    it('應回傳簽名上傳 URL', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue({
        id: farmTourId,
        bookings: [],
      });
      mockSupabaseService.createSignedUploadUrl.mockResolvedValue({
        signedUrl: 'https://upload.example.com',
        path: `${farmTourId}/uuid.jpg`,
      });
      mockSupabaseService.getPublicUrl.mockReturnValue(
        'https://public.example.com/image.jpg',
      );

      const result = await service.getUploadUrl(farmTourId, fileName);

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('publicUrl');
    });
  });

  describe('addImage', () => {
    const farmTourId = 'tour-123';
    const imageDto = {
      storageUrl: 'https://example.com/img.jpg',
      filePath: 'tour-123/img.jpg',
    };

    it('應成功新增圖片', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue({
        id: farmTourId,
        bookings: [],
      });
      mockPrismaService.farmTourImage.aggregate.mockResolvedValue({
        _max: { displayPosition: 1 },
      });
      mockPrismaService.farmTourImage.create.mockResolvedValue({
        id: 'img-new',
        ...imageDto,
      });

      const result = await service.addImage(farmTourId, imageDto);

      expect(result).toHaveProperty('id', 'img-new');
    });
  });

  describe('updateImage', () => {
    const farmTourId = 'tour-123';
    const imageId = 'img-123';

    it('應成功更新圖片', async () => {
      mockPrismaService.farmTourImage.findFirst.mockResolvedValue({
        id: imageId,
        farmTourId,
      });
      mockPrismaService.farmTourImage.update.mockResolvedValue({
        id: imageId,
        altText: '新描述',
      });

      const result = await service.updateImage(farmTourId, imageId, {
        altText: '新描述',
      });

      expect(result.altText).toBe('新描述');
    });

    it('圖片不存在應拋出 NotFoundException', async () => {
      mockPrismaService.farmTourImage.findFirst.mockResolvedValue(null);

      await expect(
        service.updateImage(farmTourId, imageId, {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeImage', () => {
    const farmTourId = 'tour-123';
    const imageId = 'img-123';

    it('應成功刪除圖片', async () => {
      mockPrismaService.farmTourImage.findFirst.mockResolvedValue({
        id: imageId,
        farmTourId,
        filePath: 'tour-123/img.jpg',
      });
      mockSupabaseService.deleteFile.mockResolvedValue(undefined);
      mockPrismaService.farmTourImage.delete.mockResolvedValue({ id: imageId });

      const result = await service.removeImage(farmTourId, imageId);

      expect(result).toEqual({ message: '圖片已刪除' });
    });

    it('Storage 刪除失敗仍應刪除記錄', async () => {
      mockPrismaService.farmTourImage.findFirst.mockResolvedValue({
        id: imageId,
        farmTourId,
        filePath: 'tour-123/img.jpg',
      });
      mockSupabaseService.deleteFile.mockRejectedValue(new Error('error'));
      mockPrismaService.farmTourImage.delete.mockResolvedValue({ id: imageId });

      const result = await service.removeImage(farmTourId, imageId);

      expect(result).toEqual({ message: '圖片已刪除' });
    });
  });

  describe('reorderImages', () => {
    const farmTourId = 'tour-123';

    it('應成功重新排序', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue({
        id: farmTourId,
        bookings: [],
      });
      mockPrismaService.farmTourImage.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.$transaction.mockResolvedValue([{}, {}, {}]);
      mockPrismaService.farmTourImage.findMany.mockResolvedValue([
        { id: 'img-2', displayPosition: 0 },
        { id: 'img-1', displayPosition: 1 },
      ]);

      const result = await service.reorderImages(farmTourId, ['img-2', 'img-1']);

      expect(result).toHaveLength(2);
    });
  });

  describe('getImages', () => {
    const farmTourId = 'tour-123';

    it('應回傳排序後的圖片列表', async () => {
      mockPrismaService.farmTour.findUnique.mockResolvedValue({
        id: farmTourId,
        bookings: [],
      });
      mockPrismaService.farmTourImage.findMany.mockResolvedValue([
        { id: 'img-1', displayPosition: 0 },
      ]);

      const result = await service.getImages(farmTourId);

      expect(result).toHaveLength(1);
    });
  });
});
