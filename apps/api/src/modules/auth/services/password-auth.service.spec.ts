/**
 * PasswordAuthService 單元測試
 *
 * 測試範圍：
 * - login() 的帳號枚舉防護（核心安全迴歸測試）
 * - 帳號鎖定行為
 *
 * 為什麼需要這支測試：
 * 登入失敗訊息若因「帳號是否存在」而不同，攻擊者可藉此篩出真實客戶的
 * email 清單，用於釣魚或憑證填充。此檔守護的是「訊息必須一致」這件事，
 * 未來若有人為了 UX 想加回「還剩 N 次」提示，這裡必須變紅。
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordAuthService } from './password-auth.service';
import { JwtTokenService } from './jwt-token.service';
import { PrismaService } from '@/prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import {
  createMockPrismaService,
  createMockUser,
  createMockEmailService,
} from '../../../../test/utils/test-helpers';

// bcrypt 是原生模組，其屬性不可重新定義，jest.spyOn 會拋
// 「Cannot redefine property: compare」，必須改用 module mock。
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('$2b$10$hashed_password'),
}));

const mockedCompare = bcrypt.compare as unknown as jest.Mock;

describe('PasswordAuthService', () => {
  let service: PasswordAuthService;
  let mockPrismaService: ReturnType<typeof createMockPrismaService>;
  let mockEmailService: ReturnType<typeof createMockEmailService>;

  const mockJwtTokenService = {
    generateTokenPair: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }),
    revokeAllUserTokens: jest.fn(),
  };

  const loginDto = { email: 'test@example.com', password: 'wrong-password' };

  /** 取得 login() 拋出的例外（測試訊息內容用） */
  async function captureLoginError(): Promise<Error> {
    try {
      await service.login(loginDto);
    } catch (error) {
      return error as Error;
    }
    throw new Error('預期 login() 應拋出例外，但它成功回傳了');
  }

  beforeEach(async () => {
    mockPrismaService = createMockPrismaService();
    mockEmailService = createMockEmailService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordAuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtTokenService, useValue: mockJwtTokenService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<PasswordAuthService>(PasswordAuthService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ====================================
  // login — 帳號枚舉防護
  // ====================================

  describe('login — 帳號枚舉防護', () => {
    it('帳號不存在時應拋出 UnauthorizedException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('密碼錯誤時應拋出 UnauthorizedException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(createMockUser());
      mockPrismaService.user.update.mockResolvedValue({
        failedLoginAttempts: 1,
      });
      mockedCompare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it.each([
      ['第 1 次失敗', 0],
      ['第 3 次失敗', 2],
      ['第 4 次失敗', 3],
    ])(
      '「帳號不存在」與「密碼錯誤（%s）」的訊息必須逐字相同',
      async (_label, failedLoginAttempts) => {
        // 帳號不存在
        mockPrismaService.user.findUnique.mockResolvedValue(null);
        const notFoundError = await captureLoginError();

        // 帳號存在但密碼錯誤
        // 必須涵蓋「接近鎖定」的次數：舊版只在剩餘 ≤2 次時才洩漏，
        // 只測第 1 次失敗的話，這個斷言在有漏洞的程式碼下也會通過。
        mockPrismaService.user.findUnique.mockResolvedValue(
          createMockUser({ failedLoginAttempts }),
        );
        mockPrismaService.user.update.mockResolvedValue({
          failedLoginAttempts: failedLoginAttempts + 1,
        });
        mockedCompare.mockResolvedValue(false);
        const wrongPasswordError = await captureLoginError();

        // 任何差異都會洩漏「此 email 是否為註冊使用者」
        expect(notFoundError.message).toBe(wrongPasswordError.message);
      },
    );

    it.each([
      ['第 1 次失敗', 0],
      ['第 3 次失敗', 2],
      ['第 4 次失敗', 3],
    ])('%s 時訊息不應洩漏剩餘次數', async (_label, failedLoginAttempts) => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ failedLoginAttempts }),
      );
      mockPrismaService.user.update.mockResolvedValue({
        failedLoginAttempts: failedLoginAttempts + 1,
      });
      mockedCompare.mockResolvedValue(false);

      const error = await captureLoginError();

      // 舊版在剩餘 2 次以內會回「密碼錯誤，還剩 N 次嘗試機會」，
      // 該訊息本身即證實帳號存在
      expect(error.message).toBe('Invalid credentials');
      expect(error.message).not.toMatch(/還剩|剩餘|次/);
    });
  });

  // ====================================
  // login — 帳號鎖定
  // ====================================

  describe('login — 帳號鎖定', () => {
    it('達到上限（第 5 次失敗）時應改為鎖定訊息', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ failedLoginAttempts: 4 }),
      );
      mockPrismaService.user.update.mockResolvedValue({
        failedLoginAttempts: 5,
      });
      mockedCompare.mockResolvedValue(false);

      const error = await captureLoginError();

      // 這是「預期中的訊息差異」：要走到這裡，攻擊者得先連續失敗 5 次，
      // 而帳號存在與否在此之前的 4 次已經無法區分。以可用性換取的合理取捨。
      expect(error.message).toContain('鎖定');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ lockedUntil: expect.any(Date) }),
        }),
      );
    });

    it('帳號鎖定期間內應拒絕登入', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ lockedUntil: new Date(Date.now() + 10 * 60 * 1000) }),
      );

      const error = await captureLoginError();

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect(error.message).toContain('鎖定');
    });

    it('失敗次數以原子遞增寫入（並行失敗不會互相覆蓋而少算）', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ failedLoginAttempts: 1 }),
      );
      mockPrismaService.user.update.mockResolvedValue({
        failedLoginAttempts: 2,
      });
      mockedCompare.mockResolvedValue(false);

      await captureLoginError();

      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { failedLoginAttempts: { increment: 1 } },
        }),
      );
    });

    it('重設密碼成功後立即解鎖（被別人故意鎖住時，帳號主人可用 email 自行解除）', async () => {
      mockPrismaService.passwordResetToken.findUnique.mockResolvedValue({
        id: 'prt-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        user: { email: 'test@example.com' },
      });

      await service.resetPassword({ token: 't', newPassword: 'NewPass123!' });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password: '$2b$10$hashed_password',
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    });
  });

  describe('login — 其他列舉管道', () => {
    it('「只用 Google 登入的帳號」與「帳號不存在」的訊息必須逐字相同', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const notFoundError = await captureLoginError();

      mockPrismaService.user.findUnique.mockResolvedValue(
        createMockUser({ password: null }),
      );
      const googleOnlyError = await captureLoginError();

      expect(googleOnlyError.message).toBe(notFoundError.message);
    });

    it('帳號不存在時仍執行一次 bcrypt 比對，讓回應時間與密碼錯誤一致', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockedCompare.mockResolvedValue(false);

      await captureLoginError();

      expect(mockedCompare).toHaveBeenCalledTimes(1);
    });
  });
});
