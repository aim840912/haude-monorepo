import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Response } from 'express';

/**
 * AuthController 測試
 *
 * 測試認證相關的 API 端點：
 * - 使用者註冊和登入
 * - 當前使用者資訊
 * - 登出
 * - 密碼重設流程
 * - Google OAuth 設定密碼
 */
describe('AuthController', () => {
  let controller: AuthController;

  // Mock Response
  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  } as unknown as Response;

  // Mock AuthService
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    getMe: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    verifyResetToken: jest.fn(),
    setPassword: jest.fn(),
    googleLogin: jest.fn(),
    revokeAllUserTokens: jest.fn().mockResolvedValue(undefined),
    refreshAccessToken: jest.fn(),
  };

  // Mock UsersService
  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  describe('初始化', () => {
    it('應成功建立 AuthController', () => {
      expect(controller).toBeDefined();
    });
  });

  // ========================================
  // register 測試
  // ========================================

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: '測試用戶',
    };

    it('應成功註冊並回傳 user', async () => {
      const authResult = {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1', email: 'test@example.com', name: '測試用戶' },
      };
      mockAuthService.register.mockResolvedValue(authResult);

      const result = await controller.register(registerDto, mockResponse);

      expect(result).toEqual({ user: authResult.user });
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  // ========================================
  // login 測試
  // ========================================

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('應成功登入並回傳 user', async () => {
      const authResult = {
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
        user: { id: 'user-1', email: 'test@example.com' },
      };
      mockAuthService.login.mockResolvedValue(authResult);

      const result = await controller.login(loginDto, mockResponse);

      expect(result).toEqual({ user: authResult.user });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  // ========================================
  // getMe 測試
  // ========================================

  describe('getMe', () => {
    it('應回傳當前使用者資訊', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: '測試用戶',
        role: 'USER',
      };
      mockAuthService.getMe.mockResolvedValue(mockUser);

      const result = await controller.getMe({ user: { userId: 'user-1' } });

      expect(result).toEqual(mockUser);
      expect(mockAuthService.getMe).toHaveBeenCalledWith('user-1');
    });
  });

  // ========================================
  // logout 測試
  // ========================================

  describe('logout', () => {
    it('應撤銷 refresh tokens、清除所有 auth cookies 並回傳成功訊息', async () => {
      const mockReq = { user: { userId: 'user-1' } };
      const result = await controller.logout(mockReq, mockResponse);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthService.revokeAllUserTokens).toHaveBeenCalledWith(
        'user-1',
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token', {
        path: '/',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
        path: '/api/v1/auth/refresh',
      });
    });
  });

  // ========================================
  // forgotPassword 測試
  // ========================================

  describe('forgotPassword', () => {
    const forgotPasswordDto = {
      email: 'test@example.com',
    };

    it('應呼叫 AuthService.forgotPassword', async () => {
      const expectedResult = { message: '已發送重設密碼郵件' };
      mockAuthService.forgotPassword.mockResolvedValue(expectedResult);

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto,
      );
    });
  });

  // ========================================
  // resetPassword 測試
  // ========================================

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'reset-token-123',
      newPassword: 'newPassword123',
    };

    it('應呼叫 AuthService.resetPassword', async () => {
      const expectedResult = { message: '密碼重設成功' };
      mockAuthService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto,
      );
    });
  });

  // ========================================
  // verifyResetToken 測試
  // ========================================

  describe('verifyResetToken', () => {
    it('應驗證 Token 有效性', async () => {
      const expectedResult = { valid: true, message: 'Token 有效' };
      mockAuthService.verifyResetToken.mockResolvedValue(expectedResult);

      const result = await controller.verifyResetToken('reset-token-123');

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.verifyResetToken).toHaveBeenCalledWith(
        'reset-token-123',
      );
    });
  });

  // ========================================
  // setPassword 測試
  // ========================================

  describe('setPassword', () => {
    const setPasswordDto = {
      password: 'newPassword123',
    };

    it('應為 Google 帳號設定密碼', async () => {
      const expectedResult = { message: '密碼設定成功' };
      mockAuthService.setPassword.mockResolvedValue(expectedResult);

      const result = await controller.setPassword(
        { user: { userId: 'user-1' } },
        setPasswordDto,
      );

      expect(result).toEqual(expectedResult);
      expect(mockAuthService.setPassword).toHaveBeenCalledWith(
        'user-1',
        setPasswordDto,
      );
    });
  });

  // ========================================
  // googleAuth 測試
  // ========================================

  describe('googleAuth', () => {
    it('應存在（Guard 會處理重導向）', () => {
      // Google Auth 端點由 Guard 處理，方法本身不執行任何操作
      expect(controller.googleAuth).toBeDefined();
    });
  });

  // ========================================
  // googleAuthCallback 測試
  // ========================================

  describe('googleAuthCallback', () => {
    const mockUser = {
      id: 'google-user-1',
      email: 'google@example.com',
      name: 'Google User',
      role: 'USER',
      isActive: true,
    };

    it('應處理 Web 登入回調（預設）', async () => {
      mockAuthService.googleLogin.mockResolvedValue({
        user: mockUser,
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      });
      mockConfigService.get.mockReturnValue('http://localhost:5173');

      const req = {
        user: { ...mockUser, oauthState: undefined },
      } as any;

      await controller.googleAuthCallback(req, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5173/auth/callback'),
      );
    });

    it('應處理 Admin 登入回調（ADMIN 角色）', async () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      mockAuthService.googleLogin.mockResolvedValue({
        user: adminUser,
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      });
      mockConfigService.get.mockReturnValue('http://localhost:5174');

      const req = {
        user: { ...adminUser, oauthState: 'admin' },
      } as any;

      await controller.googleAuthCallback(req, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5174/auth/callback'),
      );
    });

    it('非 ADMIN 嘗試 Admin 登入應重導向到錯誤頁', async () => {
      mockAuthService.googleLogin.mockResolvedValue({
        user: mockUser, // role: USER
        accessToken: 'jwt-token',
        refreshToken: 'refresh-token',
      });
      mockConfigService.get.mockReturnValue('http://localhost:5174');

      const req = {
        user: { ...mockUser, oauthState: 'admin' },
      } as any;

      await controller.googleAuthCallback(req, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token', {
        path: '/',
      });
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error='),
      );
    });
  });
});
