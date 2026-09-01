import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
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
    findOrCreateDevUser: jest.fn(),
    generateTokenPair: jest.fn(),
  };

  // Mock UsersService
  const mockUsersService = {
    findByEmail: jest.fn(),
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn(),
  };

  // Mock JwtService（logout 手動驗證 access_token cookie 時使用）
  const mockJwtService = {
    verifyAsync: jest.fn(),
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
        {
          provide: JwtService,
          useValue: mockJwtService,
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

  // ====================================
  // devLogin（開發後門）
  // ====================================

  describe('devLogin — 開發後門防護', () => {
    /**
     * 必須為每個案例重建 controller。
     *
     * AuthController 在 constructor 就把 NODE_ENV 讀進 this.isProd，
     * 之後再改 ConfigService mock 的回傳值不會有任何效果。
     */
    async function createControllerWithEnv(
      env: Record<string, string | undefined>,
    ): Promise<AuthController> {
      const configService = {
        get: jest.fn((key: string) => env[key]),
      };

      const module: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: mockAuthService },
          { provide: UsersService, useValue: mockUsersService },
          { provide: ConfigService, useValue: configService },
          { provide: JwtService, useValue: mockJwtService },
        ],
      }).compile();

      return module.get<AuthController>(AuthController);
    }

    beforeEach(() => {
      mockAuthService.findOrCreateDevUser.mockResolvedValue({
        id: 'dev-user-1',
        email: 'dev-admin@test.local',
        name: 'Dev Admin',
        role: 'ADMIN',
      });
      mockAuthService.generateTokenPair.mockResolvedValue({
        accessToken: 'dev-access-token',
        refreshToken: 'dev-refresh-token',
      });
    });

    it('ENABLE_DEV_LOGIN 未設定時應回 404（fail closed）', async () => {
      const c = await createControllerWithEnv({ NODE_ENV: 'development' });

      // 漏設環境變數的後果必須是「功能不可用」，而不是「後門大開」
      await expect(c.devLogin('ADMIN', 'admin', mockResponse)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAuthService.findOrCreateDevUser).not.toHaveBeenCalled();
    });

    it('ENABLE_DEV_LOGIN=false 時應回 404', async () => {
      const c = await createControllerWithEnv({
        NODE_ENV: 'development',
        ENABLE_DEV_LOGIN: 'false',
      });

      await expect(c.devLogin('ADMIN', 'admin', mockResponse)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('production 環境即使 ENABLE_DEV_LOGIN=true 也應回 404', async () => {
      const c = await createControllerWithEnv({
        NODE_ENV: 'production',
        ENABLE_DEV_LOGIN: 'true',
      });

      // 兩道防線互相獨立：任一不成立就擋
      await expect(c.devLogin('ADMIN', 'admin', mockResponse)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockAuthService.findOrCreateDevUser).not.toHaveBeenCalled();
    });

    it('非 production 且 ENABLE_DEV_LOGIN=true 時應正常發出 session', async () => {
      const c = await createControllerWithEnv({
        NODE_ENV: 'development',
        ENABLE_DEV_LOGIN: 'true',
        FRONTEND_URL: 'http://localhost:5173',
        ADMIN_URL: 'http://localhost:5174',
      });

      await c.devLogin('ADMIN', 'admin', mockResponse);

      expect(mockAuthService.findOrCreateDevUser).toHaveBeenCalledWith('ADMIN');
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5174/auth/callback'),
      );
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
    // 清除 cookie 時必須帶齊與設定時相同的屬性，否則跨站瀏覽器會拒絕該 Set-Cookie
    const expectedAccessCookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    };
    const expectedRefreshCookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/api/v1/auth/refresh',
    };

    it('access_token 有效時應撤銷 refresh tokens、清除 cookies 並回傳成功訊息', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      const mockReq = { cookies: { access_token: 'valid-token' } } as any;

      const result = await controller.logout(mockReq, mockResponse);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthService.revokeAllUserTokens).toHaveBeenCalledWith(
        'user-1',
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expectedAccessCookieOptions,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expectedRefreshCookieOptions,
      );
    });

    it('access_token 已過期時仍應清除 cookies（使用者才登得出去）', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      const mockReq = { cookies: { access_token: 'expired-token' } } as any;

      const result = await controller.logout(mockReq, mockResponse);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthService.revokeAllUserTokens).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expectedAccessCookieOptions,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expectedRefreshCookieOptions,
      );
    });

    it('完全沒有 access_token cookie 時應直接清除 cookies 而不驗證', async () => {
      const mockReq = { cookies: {} } as any;

      const result = await controller.logout(mockReq, mockResponse);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
      expect(mockAuthService.revokeAllUserTokens).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expectedAccessCookieOptions,
      );
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
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error='),
      );
    });
  });
});
