import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { PrismaService } from '@/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ScheduleStatus } from './dto/create-schedule.dto';

describe('SchedulesService', () => {
  let service: SchedulesService;

  // Mock Prisma
  const mockPrismaService = {
    schedule: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);

    // 清除所有 mock
    jest.clearAllMocks();
  });

  // ========================================
  // 查詢方法測試
  // ========================================

  describe('findAll', () => {
    it('應回傳所有活躍日程並按日期排序', async () => {
      const mockSchedules = [
        {
          id: 'sch-1',
          title: '市集 A',
          isActive: true,
          date: new Date('2024-01-15'),
        },
        {
          id: 'sch-2',
          title: '市集 B',
          isActive: true,
          date: new Date('2024-01-20'),
        },
      ];
      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.findAll();

      expect(result).toEqual(mockSchedules);
      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findUpcoming', () => {
    it('應回傳今天及之後的日程', async () => {
      const mockSchedules = [
        { id: 'sch-1', title: '明日市集', date: new Date() },
      ];
      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.findUpcoming();

      expect(result).toEqual(mockSchedules);
      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          date: { gte: expect.any(Date) },
        },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findOne', () => {
    const scheduleId = 'sch-123';

    it('應回傳單一日程', async () => {
      const mockSchedule = {
        id: scheduleId,
        title: '測試市集',
        date: new Date('2024-01-15'),
      };
      mockPrismaService.schedule.findUnique.mockResolvedValue(mockSchedule);

      const result = await service.findOne(scheduleId);

      expect(result).toEqual(mockSchedule);
      expect(mockPrismaService.schedule.findUnique).toHaveBeenCalledWith({
        where: { id: scheduleId },
      });
    });

    it('找不到日程應拋出 NotFoundException', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.findOne(scheduleId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByMonth', () => {
    it('應回傳指定月份的日程', async () => {
      const mockSchedules = [
        { id: 'sch-1', title: '一月市集', date: new Date('2024-01-15') },
        { id: 'sch-2', title: '一月市集 2', date: new Date('2024-01-20') },
      ];
      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.findByMonth(2024, 1);

      expect(result).toEqual(mockSchedules);
      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          date: {
            gte: new Date(2024, 0, 1), // 一月一日
            lte: new Date(2024, 1, 0), // 一月最後一天
          },
        },
        orderBy: { date: 'asc' },
      });
    });

    it('應正確處理十二月', async () => {
      mockPrismaService.schedule.findMany.mockResolvedValue([]);

      await service.findByMonth(2024, 12);

      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          date: {
            gte: new Date(2024, 11, 1), // 十二月一日
            lte: new Date(2025, 0, 0), // 十二月最後一天
          },
        },
        orderBy: { date: 'asc' },
      });
    });
  });

  describe('findAllAdmin', () => {
    it('應回傳所有日程（含非活躍）並按建立時間排序', async () => {
      const mockSchedules = [
        { id: 'sch-1', title: '新市集', isActive: true },
        { id: 'sch-2', title: '舊市集', isActive: false },
      ];
      mockPrismaService.schedule.findMany.mockResolvedValue(mockSchedules);

      const result = await service.findAllAdmin();

      expect(result).toEqual(mockSchedules);
      expect(mockPrismaService.schedule.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // ========================================
  // 命令方法測試
  // ========================================

  describe('create', () => {
    const createDto = {
      title: '新市集',
      location: '台北信義區',
      date: '2024-01-20',
      time: '10:00-18:00',
    };

    it('應成功建立日程', async () => {
      const mockSchedule = {
        id: 'sch-new',
        title: createDto.title,
        location: createDto.location,
        date: new Date(createDto.date),
        time: createDto.time,
        status: ScheduleStatus.upcoming,
      };
      mockPrismaService.schedule.create.mockResolvedValue(mockSchedule);

      const result = await service.create(createDto);

      expect(result).toEqual(mockSchedule);
      expect(mockPrismaService.schedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createDto.title,
          location: createDto.location,
          date: new Date(createDto.date),
          time: createDto.time,
          status: ScheduleStatus.upcoming,
          isActive: true,
        }),
      });
    });

    it('應使用指定的 status', async () => {
      const dtoWithStatus = {
        ...createDto,
        status: ScheduleStatus.cancelled as ScheduleStatus,
      };
      mockPrismaService.schedule.create.mockResolvedValue({
        id: 'sch-new',
        status: ScheduleStatus.cancelled,
      });

      await service.create(dtoWithStatus);

      expect(mockPrismaService.schedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: ScheduleStatus.cancelled,
        }),
      });
    });

    it('應處理可選欄位', async () => {
      const dtoWithOptional = {
        ...createDto,
        description: '這是一個測試市集',
        contact: '0912-345-678',
        specialOffer: '滿千送百',
        weatherNote: '雨天取消',
        products: ['茶葉', '茶具'],
      };
      mockPrismaService.schedule.create.mockResolvedValue({
        id: 'sch-new',
        ...dtoWithOptional,
      });

      await service.create(dtoWithOptional);

      expect(mockPrismaService.schedule.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: '這是一個測試市集',
          contact: '0912-345-678',
          specialOffer: '滿千送百',
          weatherNote: '雨天取消',
          products: ['茶葉', '茶具'],
        }),
      });
    });
  });

  describe('update', () => {
    const scheduleId = 'sch-123';
    const updateDto = { title: '更新標題' };

    it('應成功更新日程', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue({
        id: scheduleId,
        title: '原標題',
      });
      mockPrismaService.schedule.update.mockResolvedValue({
        id: scheduleId,
        title: '更新標題',
      });

      const result = await service.update(scheduleId, updateDto);

      expect(result.title).toBe('更新標題');
      expect(mockPrismaService.schedule.update).toHaveBeenCalledWith({
        where: { id: scheduleId },
        data: { title: '更新標題' },
      });
    });

    it('日程不存在應拋出 NotFoundException', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.update(scheduleId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('應可以更新 status', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue({
        id: scheduleId,
        status: ScheduleStatus.upcoming,
      });
      mockPrismaService.schedule.update.mockResolvedValue({
        id: scheduleId,
        status: ScheduleStatus.completed,
      });

      await service.update(scheduleId, {
        status: ScheduleStatus.completed as ScheduleStatus,
      });

      expect(mockPrismaService.schedule.update).toHaveBeenCalledWith({
        where: { id: scheduleId },
        data: { status: ScheduleStatus.completed },
      });
    });

    it('應可以更新日期', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue({
        id: scheduleId,
      });
      mockPrismaService.schedule.update.mockResolvedValue({
        id: scheduleId,
        date: new Date('2024-02-15'),
      });

      await service.update(scheduleId, { date: '2024-02-15' });

      expect(mockPrismaService.schedule.update).toHaveBeenCalledWith({
        where: { id: scheduleId },
        data: { date: new Date('2024-02-15') },
      });
    });

    it('undefined 欄位不應被更新', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue({
        id: scheduleId,
      });
      mockPrismaService.schedule.update.mockResolvedValue({
        id: scheduleId,
      });

      await service.update(scheduleId, { title: '新標題' });

      // 確認 data 物件只包含 title，不包含其他 undefined 欄位
      expect(mockPrismaService.schedule.update).toHaveBeenCalledWith({
        where: { id: scheduleId },
        data: { title: '新標題' },
      });
    });
  });

  describe('remove', () => {
    const scheduleId = 'sch-123';

    it('應成功刪除日程', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue({
        id: scheduleId,
        title: '測試市集',
      });
      mockPrismaService.schedule.delete.mockResolvedValue({ id: scheduleId });

      const result = await service.remove(scheduleId);

      expect(result).toEqual({ message: '日程已刪除' });
      expect(mockPrismaService.schedule.delete).toHaveBeenCalledWith({
        where: { id: scheduleId },
      });
    });

    it('日程不存在應拋出 NotFoundException', async () => {
      mockPrismaService.schedule.findUnique.mockResolvedValue(null);

      await expect(service.remove(scheduleId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
