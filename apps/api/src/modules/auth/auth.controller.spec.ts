import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { CsrfService } from '@/common/csrf/csrf.service';
import { Response } from 'express';

/**
 * AuthController 測試
 *
 * 測試認證相關的 API 端點：
 * - 使用者註冊和登入
 * - 當前使用者資訊
 * - 登出和 CSRF Token
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
  };

  // Mock ConfigService
  const mockConfigService = {
    get: jest.fn(),
  };

  // Mock CsrfService
  const mockCsrfService = {
    generateToken: jest.fn(() => 'mock-csrf-token'),
    getCookieOptions: jest.fn(() => ({
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      path: '/',
    })),
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
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: CsrfService,
          useValue: mockCsrfService,
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

    it('應成功註冊並回傳 token 和 csrfToken', async () => {
      const authResult = {
        accessToken: 'jwt-token',
        user: { id: 'user-1', email: 'test@example.com', name: '測試用戶' },
      };
      mockAuthService.register.mockResolvedValue(authResult);

      const result = await controller.register(registerDto, mockResponse);

      expect(result).toEqual({
        ...authResult,
        csrfToken: 'mock-csrf-token',
      });
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf-token',
        'mock-csrf-token',
        expect.any(Object),
      );
    });

    it('應呼叫 CsrfService 產生 Token', async () => {
      mockAuthService.register.mockResolvedValue({});

      await controller.register(registerDto, mockResponse);

      expect(mockCsrfService.generateToken).toHaveBeenCalled();
      expect(mockCsrfService.getCookieOptions).toHaveBeenCalled();
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

    it('應成功登入並回傳 token 和 csrfToken', async () => {
      const authResult = {
        accessToken: 'jwt-token',
        user: { id: 'user-1', email: 'test@example.com' },
      };
      mockAuthService.login.mockResolvedValue(authResult);

      const result = await controller.login(loginDto, mockResponse);

      expect(result).toEqual({
        ...authResult,
        csrfToken: 'mock-csrf-token',
      });
      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
    });

    it('應設定 CSRF Cookie', async () => {
      mockAuthService.login.mockResolvedValue({});

      await controller.login(loginDto, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf-token',
        'mock-csrf-token',
        expect.objectContaining({
          httpOnly: true,
        }),
      );
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
    it('應清除 CSRF Cookie 並回傳成功訊息', () => {
      const result = controller.logout(mockResponse);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('csrf-token', {
        path: '/',
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
      password: 'newPassword123',
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
  // getCsrfToken 測試
  // ========================================

  describe('getCsrfToken', () => {
    it('應產生新的 CSRF Token 並設定 Cookie', () => {
      const result = controller.getCsrfToken(mockResponse);

      expect(result).toEqual({ csrfToken: 'mock-csrf-token' });
      expect(mockCsrfService.generateToken).toHaveBeenCalled();
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf-token',
        'mock-csrf-token',
        expect.any(Object),
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

    it('應處理 Web 登入回調（預設）', () => {
      mockAuthService.googleLogin.mockReturnValue({
        user: mockUser,
        accessToken: 'jwt-token',
      });
      mockConfigService.get.mockReturnValue('http://localhost:5173');

      const req = {
        user: { ...mockUser, oauthState: undefined },
      } as any;

      controller.googleAuthCallback(req, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5173/auth/callback'),
      );
    });

    it('應處理 Admin 登入回調（ADMIN 角色）', () => {
      const adminUser = { ...mockUser, role: 'ADMIN' };
      mockAuthService.googleLogin.mockReturnValue({
        user: adminUser,
        accessToken: 'jwt-token',
      });
      mockConfigService.get.mockReturnValue('http://localhost:5174');

      const req = {
        user: { ...adminUser, oauthState: 'admin' },
      } as any;

      controller.googleAuthCallback(req, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5174/auth/callback'),
      );
    });

    it('非 ADMIN 嘗試 Admin 登入應重導向到錯誤頁', () => {
      mockAuthService.googleLogin.mockReturnValue({
        user: mockUser, // role: USER
        accessToken: 'jwt-token',
      });
      mockConfigService.get.mockReturnValue('http://localhost:5174');

      const req = {
        user: { ...mockUser, oauthState: 'admin' },
      } as any;

      controller.googleAuthCallback(req, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('csrf-token', {
        path: '/',
      });
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error='),
      );
    });

    it('應在回調中設定 CSRF Cookie', () => {
      mockAuthService.googleLogin.mockReturnValue({
        user: mockUser,
        accessToken: 'jwt-token',
      });
      mockConfigService.get.mockReturnValue('http://localhost:5173');

      const req = {
        user: { ...mockUser, oauthState: undefined },
      } as any;

      controller.googleAuthCallback(req, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf-token',
        'mock-csrf-token',
        expect.any(Object),
      );
    });
  });
});
