import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;

  // Mock Prisma
  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  // ========================================
  // findAll 測試
  // ========================================

  describe('findAll', () => {
    it('應回傳所有用戶列表', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'test1@example.com',
          name: '測試用戶1',
          role: 'USER',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'test2@example.com',
          name: '測試用戶2',
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date(),
        },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    });

    it('沒有用戶時應回傳空陣列', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ========================================
  // findOne 測試
  // ========================================

  describe('findOne', () => {
    const userId = 'user-123';

    it('應回傳指定用戶', async () => {
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: '測試用戶',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      });
    });

    it('用戶不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(userId)).rejects.toThrow('User not found');
    });
  });

  // ========================================
  // findByEmail 測試
  // ========================================

  describe('findByEmail', () => {
    const email = 'test@example.com';

    it('應回傳指定 email 的用戶', async () => {
      const mockUser = {
        id: 'user-123',
        email,
        name: '測試用戶',
        password: 'hashed-password',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('email 不存在應回傳 null', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  // ========================================
  // update 測試
  // ========================================

  describe('update', () => {
    const userId = 'user-123';
    const adminUser = {
      id: userId,
      email: 'admin@example.com',
      name: '管理員',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date(),
    };

    it('應成功更新用戶資訊', async () => {
      const updateDto: UpdateUserDto = { name: '新名稱' };
      const mockUser = { ...adminUser, name: '新名稱' };

      mockPrismaService.user.findUnique.mockResolvedValue(adminUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);

      const result = await service.update(userId, updateDto);

      expect(result.name).toBe('新名稱');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateDto,
        select: expect.any(Object),
      });
    });

    it('用戶不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(userId, { name: '新名稱' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('管理員不能降低自己的權限 (ADMIN → USER)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(adminUser);

      await expect(
        service.update(userId, { role: 'USER' }, userId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update(userId, { role: 'USER' }, userId),
      ).rejects.toThrow('不能降低自己的權限');
    });

    it('管理員不能降低自己的權限 (ADMIN → STAFF)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(adminUser);

      await expect(
        service.update(userId, { role: 'STAFF' }, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('管理員不能降低自己的權限 (ADMIN → VIP)', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(adminUser);

      await expect(
        service.update(userId, { role: 'VIP' }, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('管理員不能停用自己的帳號', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(adminUser);

      await expect(
        service.update(userId, { isActive: false }, userId),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update(userId, { isActive: false }, userId),
      ).rejects.toThrow('不能停用自己的帳號');
    });

    it('管理員可以更新其他用戶的權限', async () => {
      const otherUserId = 'other-user-456';
      const otherUser = {
        id: otherUserId,
        email: 'other@example.com',
        name: '其他用戶',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      };
      const updatedUser = { ...otherUser, role: 'VIP' };

      mockPrismaService.user.findUnique.mockResolvedValue(otherUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(
        otherUserId,
        { role: 'VIP' },
        userId, // 使用管理員 ID 作為 currentUserId
      );

      expect(result.role).toBe('VIP');
    });

    it('不提供 currentUserId 時應允許任何更新', async () => {
      const mockUser = { ...adminUser };
      const updatedUser = { ...adminUser, role: 'USER' };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, { role: 'USER' });

      expect(result.role).toBe('USER');
    });

    it('不更新 role 時應允許更新其他欄位（即使是自己）', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(adminUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...adminUser,
        name: '新管理員名稱',
      });

      const result = await service.update(
        userId,
        { name: '新管理員名稱' },
        userId,
      );

      expect(result.name).toBe('新管理員名稱');
    });
  });

  // ========================================
  // remove 測試
  // ========================================

  describe('remove', () => {
    const userId = 'user-123';

    it('應成功刪除用戶', async () => {
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: '測試用戶',
        role: 'USER',
        isActive: true,
        createdAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(userId);

      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it('用戶不存在應拋出 NotFoundException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
