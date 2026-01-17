import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  createMockPrismaService,
  createMockEmailService,
  createMockJwtService,
  createMockUser,
} from '../../../test/utils/test-helpers';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashed_password'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;
  let mockEmailService: ReturnType<typeof createMockEmailService>;
  let mockJwtService: ReturnType<typeof createMockJwtService>;

  beforeEach(async () => {
    mockPrismaService = createMockPrismaService();
    mockEmailService = createMockEmailService();
    mockJwtService = createMockJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      name: '新使用者',
    };

    it('應成功註冊新使用者', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(
        createMockUser({
          id: 'new-user-id',
          email: registerDto.email,
          name: registerDto.name,
        }),
      );

      const result = await service.register(registerDto);

      expect(result.user.email).toBe(registerDto.email);
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('Email 已存在時應拋出 ConflictException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(createMockUser());

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('應正確加密密碼', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(createMockUser());

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: '$2b$10$hashed_password',
          }),
        }),
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('應成功登入並回傳 token', async () => {
      const mockUser = createMockUser();
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result.user.email).toBe(mockUser.email);
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('使用者不存在時應拋出 UnauthorizedException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('密碼錯誤時應拋出 UnauthorizedException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(createMockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Google 登入使用者嘗試密碼登入時應拋出 UnauthorizedException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ password: null, googleId: 'google-123' }),
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('帳號被停用時應拋出 UnauthorizedException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ isActive: false }),
      );
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getMe', () => {
    it('應回傳使用者資訊（不含密碼）', async () => {
      const mockUser = createMockUser();
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe('user-1');

      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.hasPassword).toBe(true);
      expect(result.user.isGoogleUser).toBe(false);
      expect((result.user as unknown as Record<string, unknown>).password).toBeUndefined();
    });

    it('使用者不存在時應拋出 UnauthorizedException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('non-existent')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('Google 使用者應正確標記 isGoogleUser', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ googleId: 'google-123', password: null }),
      );

      const result = await service.getMe('user-1');

      expect(result.user.isGoogleUser).toBe(true);
      expect(result.user.hasPassword).toBe(false);
    });
  });

  describe('validateGoogleUser', () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'google@example.com',
      name: 'Google User',
      avatar: 'https://example.com/avatar.jpg',
    };

    it('已存在的 Google 用戶應更新頭像', async () => {
      const existingUser = createMockUser({ googleId: 'google-123' });
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(existingUser) // 透過 googleId 查找
        .mockResolvedValueOnce(existingUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...existingUser,
        avatar: googleProfile.avatar,
      });

      const result = await service.validateGoogleUser(googleProfile);

      expect(result.avatar).toBe(googleProfile.avatar);
    });

    it('新 Google 用戶應建立帳戶', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // 透過 googleId 查找
        .mockResolvedValueOnce(null); // 透過 email 查找
      mockPrismaService.user.create.mockResolvedValue(
        createMockUser({
          googleId: googleProfile.googleId,
          email: googleProfile.email,
        }),
      );

      const result = await service.validateGoogleUser(googleProfile);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: googleProfile.email,
            googleId: googleProfile.googleId,
          }),
        }),
      );
      expect(result.googleId).toBe(googleProfile.googleId);
    });

    it('已有帳號的使用者透過 Google 登入應連結帳號', async () => {
      const existingUser = createMockUser({ googleId: null });
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null) // 透過 googleId 查找（不存在）
        .mockResolvedValueOnce(existingUser); // 透過 email 查找
      mockPrismaService.user.update.mockResolvedValue({
        ...existingUser,
        googleId: googleProfile.googleId,
      });

      const result = await service.validateGoogleUser(googleProfile);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            googleId: googleProfile.googleId,
          }),
        }),
      );
      expect(result.googleId).toBe(googleProfile.googleId);
    });
  });

  describe('googleLogin', () => {
    it('應成功登入並回傳 token', async () => {
      const user = {
        id: 'user-1',
        email: 'google@example.com',
        name: 'Google User',
        role: 'USER',
        isActive: true,
      };

      const result = await service.googleLogin(user);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user.email).toBe(user.email);
    });

    it('帳號被停用時應拋出 UnauthorizedException', async () => {
      const user = {
        id: 'user-1',
        email: 'google@example.com',
        name: 'Google User',
        role: 'USER',
        isActive: false,
      };

      await expect(service.googleLogin(user)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('應發送重設密碼郵件', async () => {
      const mockUser = createMockUser();
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.passwordResetToken.deleteMany.mockResolvedValue({
        count: 0,
      });
      mockPrismaService.passwordResetToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'reset-token',
      });

      const result = await service.forgotPassword({ email: mockUser.email });

      expect(result.message).toContain('如果該電子郵件已註冊');
      expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('使用者不存在時應回傳相同訊息（安全考量）', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'nonexistent@example.com',
      });

      expect(result.message).toContain('如果該電子郵件已註冊');
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('Google 用戶（無密碼）應回傳相同訊息', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ password: null, googleId: 'google-123' }),
      );

      const result = await service.forgotPassword({
        email: 'google@example.com',
      });

      expect(result.message).toContain('如果該電子郵件已註冊');
      expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const resetDto = {
      token: 'valid-token',
      newPassword: 'newpassword123',
    };

    it('應成功重設密碼', async () => {
      const mockToken = {
        id: 'token-1',
        token: 'valid-token',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 3600000), // 1小時後過期
        usedAt: null,
        user: createMockUser(),
      };
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(
        mockToken,
      );
      mockPrismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.resetPassword(resetDto);

      expect(result.message).toContain('密碼已成功重設');
    });

    it('Token 不存在時應拋出 BadRequestException', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Token 已過期時應拋出 BadRequestException', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        expiresAt: new Date(Date.now() - 3600000), // 1小時前過期
        usedAt: null,
        user: createMockUser(),
      });

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Token 已使用時應拋出 BadRequestException', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(), // 已使用
        user: createMockUser(),
      });

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyResetToken', () => {
    it('有效 Token 應回傳 valid: true', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'token-1',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: null,
      });

      const result = await service.verifyResetToken('valid-token');

      expect(result.valid).toBe(true);
    });

    it('無效 Token 應拋出 BadRequestException', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyResetToken('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('setPassword', () => {
    it('Google 用戶應成功設定密碼', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ password: null, googleId: 'google-123' }),
      );
      mockPrismaService.user.update.mockResolvedValue(createMockUser());

      const result = await service.setPassword('user-1', {
        password: 'newpassword123',
      });

      expect(result.message).toContain('密碼設定成功');
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('非 Google 用戶應拋出 BadRequestException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ googleId: null }),
      );

      await expect(
        service.setPassword('user-1', { password: 'newpassword123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('已有密碼的用戶應拋出 BadRequestException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ googleId: 'google-123', password: 'existing-hash' }),
      );

      await expect(
        service.setPassword('user-1', { password: 'newpassword123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
