import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtTokenService } from './services/jwt-token.service';
import { PasswordAuthService } from './services/password-auth.service';
import { GoogleAuthService } from './services/google-auth.service';
import {
  createMockPrismaService,
  createMockUser,
} from '../../../test/utils/test-helpers';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;

  // Sub-service mocks
  const mockJwtTokenService = {
    generateTokenPair: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }),
    refreshAccessToken: jest.fn().mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    }),
    revokeRefreshToken: jest.fn().mockResolvedValue(undefined),
    revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
    cleanupExpiredTokens: jest.fn().mockResolvedValue(5),
  };

  const mockPasswordAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyResetToken: jest.fn(),
    setPassword: jest.fn(),
  };

  const mockGoogleAuthService = {
    validateGoogleUser: jest.fn(),
    googleLogin: jest.fn(),
  };

  beforeEach(async () => {
    mockPrismaService = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtTokenService, useValue: mockJwtTokenService },
        { provide: PasswordAuthService, useValue: mockPasswordAuthService },
        { provide: GoogleAuthService, useValue: mockGoogleAuthService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ========================================
  // Facade delegation tests
  // ========================================

  describe('register (delegates to PasswordAuthService)', () => {
    const registerDto = {
      email: 'new@example.com',
      password: 'password123',
      name: '新使用者',
    };

    it('應委派給 PasswordAuthService.register', async () => {
      const expected = {
        user: { id: 'user-1', email: registerDto.email },
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      mockPasswordAuthService.register.mockResolvedValue(expected);

      const result = await service.register(registerDto);

      expect(mockPasswordAuthService.register).toHaveBeenCalledWith(
        registerDto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('login (delegates to PasswordAuthService)', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('應委派給 PasswordAuthService.login', async () => {
      const expected = {
        user: { id: 'user-1', email: loginDto.email },
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      mockPasswordAuthService.login.mockResolvedValue(expected);

      const result = await service.login(loginDto);

      expect(mockPasswordAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toBe(expected);
    });
  });

  describe('forgotPassword (delegates to PasswordAuthService)', () => {
    it('應委派給 PasswordAuthService.forgotPassword', async () => {
      const dto = { email: 'test@example.com' };
      const expected = { message: '如果該電子郵件已註冊，您將收到重設密碼的連結' };
      mockPasswordAuthService.forgotPassword.mockResolvedValue(expected);

      const result = await service.forgotPassword(dto);

      expect(mockPasswordAuthService.forgotPassword).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('resetPassword (delegates to PasswordAuthService)', () => {
    it('應委派給 PasswordAuthService.resetPassword', async () => {
      const dto = { token: 'valid-token', newPassword: 'newpassword123' };
      const expected = { message: '密碼已成功重設' };
      mockPasswordAuthService.resetPassword.mockResolvedValue(expected);

      const result = await service.resetPassword(dto);

      expect(mockPasswordAuthService.resetPassword).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('verifyResetToken (delegates to PasswordAuthService)', () => {
    it('應委派給 PasswordAuthService.verifyResetToken', async () => {
      const expected = { valid: true };
      mockPasswordAuthService.verifyResetToken.mockResolvedValue(expected);

      const result = await service.verifyResetToken('valid-token');

      expect(mockPasswordAuthService.verifyResetToken).toHaveBeenCalledWith(
        'valid-token',
      );
      expect(result).toBe(expected);
    });
  });

  describe('setPassword (delegates to PasswordAuthService)', () => {
    it('應委派給 PasswordAuthService.setPassword', async () => {
      const dto = { password: 'newpassword123' };
      const expected = { message: '密碼設定成功' };
      mockPasswordAuthService.setPassword.mockResolvedValue(expected);

      const result = await service.setPassword('user-1', dto);

      expect(mockPasswordAuthService.setPassword).toHaveBeenCalledWith(
        'user-1',
        dto,
      );
      expect(result).toBe(expected);
    });
  });

  describe('validateGoogleUser (delegates to GoogleAuthService)', () => {
    it('應委派給 GoogleAuthService.validateGoogleUser', async () => {
      const profile = {
        googleId: 'google-123',
        email: 'google@example.com',
        name: 'Google User',
        avatar: 'https://example.com/avatar.jpg',
      };
      const expected = createMockUser({ googleId: 'google-123' });
      mockGoogleAuthService.validateGoogleUser.mockResolvedValue(expected);

      const result = await service.validateGoogleUser(profile);

      expect(mockGoogleAuthService.validateGoogleUser).toHaveBeenCalledWith(
        profile,
      );
      expect(result).toBe(expected);
    });
  });

  describe('googleLogin (delegates to GoogleAuthService)', () => {
    it('應委派給 GoogleAuthService.googleLogin', async () => {
      const user = {
        id: 'user-1',
        email: 'google@example.com',
        name: 'Google User',
        role: 'USER',
        isActive: true,
      };
      const expected = {
        user: { id: user.id, email: user.email },
        accessToken: 'token',
        refreshToken: 'refresh',
      };
      mockGoogleAuthService.googleLogin.mockResolvedValue(expected);

      const result = await service.googleLogin(user);

      expect(mockGoogleAuthService.googleLogin).toHaveBeenCalledWith(user);
      expect(result).toBe(expected);
    });
  });

  describe('Token management (delegates to JwtTokenService)', () => {
    it('generateTokenPair 應委派給 JwtTokenService', async () => {
      await service.generateTokenPair('user-1', 'test@example.com');
      expect(mockJwtTokenService.generateTokenPair).toHaveBeenCalledWith(
        'user-1',
        'test@example.com',
      );
    });

    it('refreshAccessToken 應委派給 JwtTokenService', async () => {
      await service.refreshAccessToken('refresh-token');
      expect(mockJwtTokenService.refreshAccessToken).toHaveBeenCalledWith(
        'refresh-token',
      );
    });

    it('revokeRefreshToken 應委派給 JwtTokenService', async () => {
      await service.revokeRefreshToken('refresh-token');
      expect(mockJwtTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'refresh-token',
      );
    });

    it('revokeAllUserTokens 應委派給 JwtTokenService', async () => {
      await service.revokeAllUserTokens('user-1');
      expect(mockJwtTokenService.revokeAllUserTokens).toHaveBeenCalledWith(
        'user-1',
      );
    });

    it('cleanupExpiredTokens 應委派給 JwtTokenService', async () => {
      const result = await service.cleanupExpiredTokens();
      expect(mockJwtTokenService.cleanupExpiredTokens).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  // ========================================
  // Direct methods (not delegated)
  // ========================================

  describe('getMe', () => {
    it('應回傳使用者資訊（不含密碼）', async () => {
      const mockUser = createMockUser();
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe('user-1');

      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.hasPassword).toBe(true);
      expect(result.user.isGoogleUser).toBe(false);
      expect(
        (result.user as unknown as Record<string, unknown>).password,
      ).toBeUndefined();
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

  describe('findFirstAdmin', () => {
    it('應查詢第一個活躍的管理員', async () => {
      const admin = createMockUser({ role: 'ADMIN' });
      mockPrismaService.user.findFirst.mockResolvedValue(admin);

      const result = await service.findFirstAdmin();

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { role: 'ADMIN', isActive: true },
      });
      expect(result).toBe(admin);
    });
  });

  describe('createDevAdmin', () => {
    it('應建立開發用管理員帳號', async () => {
      const admin = createMockUser({ role: 'ADMIN' });
      mockPrismaService.user.create.mockResolvedValue(admin);

      const result = await service.createDevAdmin('admin@test.com', 'Admin');

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'admin@test.com',
          name: 'Admin',
          role: 'ADMIN',
          isActive: true,
        },
      });
      expect(result).toBe(admin);
    });
  });
});
