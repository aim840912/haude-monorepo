/**
 * E2E 測試共用設置
 *
 * 提供統一的測試應用建立方式，覆蓋外部依賴為 Mock
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createMockPrismaService,
  createMockEmailService,
  createMockJwtService,
  createMockConfigService,
  createMockSupabaseService,
  createMockDiscountsService,
  createMockMembersService,
  createMockCsrfService,
} from './utils/test-helpers';
import { EmailService } from '../src/modules/email/email.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard } from '@nestjs/throttler';
import { SupabaseService } from '../src/common/supabase/supabase.service';
import { DiscountsService } from '../src/modules/discounts/discounts.service';
import { MembersService } from '../src/modules/members/members.service';
import { CsrfGuard } from '../src/common/guards/csrf.guard';
import { CsrfService } from '../src/common/csrf/csrf.service';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';

/**
 * Mock JwtAuthGuard
 * 在測試環境中，只要提供任何 Bearer token 就視為已認證
 * 會從 mockPrisma.user.findUnique 取得用戶資料設定到 req.user
 */
class MockJwtAuthGuard implements CanActivate {
  constructor(
    private mockPrisma: ReturnType<typeof createMockPrismaService>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // 拋出 UnauthorizedException 以返回 401 而非默認的 403
      throw new UnauthorizedException('Unauthorized');
    }

    // 從 mock prisma 取得預設的用戶資料
    // 測試應該在使用前設定 mockPrisma.user.findUnique
    const user = await this.mockPrisma.user.findUnique();

    if (user) {
      request.user = {
        id: user.id, // farm-tours controller 使用 req.user.id
        userId: user.id, // 其他 controllers 使用 req.user.userId
        email: user.email,
        role: user.role,
      };
      return true;
    }

    // 如果沒有設定 mock user，使用預設值
    request.user = {
      id: 'user-1', // farm-tours controller 使用 req.user.id
      userId: 'user-1', // 其他 controllers 使用 req.user.userId
      email: 'test@example.com',
      role: 'USER',
    };
    return true;
  }
}

/**
 * 建立測試應用程式的選項
 */
export interface CreateTestAppOptions {
  /** 自訂 Mock Prisma Service */
  mockPrisma?: ReturnType<typeof createMockPrismaService>;
  /** 自訂 Mock Email Service */
  mockEmail?: ReturnType<typeof createMockEmailService>;
  /** 自訂 Mock JWT Service */
  mockJwt?: ReturnType<typeof createMockJwtService>;
  /** 自訂 Mock Config */
  mockConfig?: ReturnType<typeof createMockConfigService>;
  /** 自訂 Mock Discounts Service */
  mockDiscounts?: ReturnType<typeof createMockDiscountsService>;
  /** 自訂 Mock Members Service */
  mockMembers?: ReturnType<typeof createMockMembersService>;
}

/**
 * 建立 E2E 測試用的 NestJS 應用程式
 *
 * 覆蓋外部依賴為 Mock，避免真實資料庫和外部服務連線
 */
export async function createTestApp(
  options: CreateTestAppOptions = {},
): Promise<{
  app: INestApplication;
  mockPrisma: ReturnType<typeof createMockPrismaService>;
  mockEmail: ReturnType<typeof createMockEmailService>;
  mockJwt: ReturnType<typeof createMockJwtService>;
  mockConfig: ReturnType<typeof createMockConfigService>;
  mockDiscounts: ReturnType<typeof createMockDiscountsService>;
  mockMembers: ReturnType<typeof createMockMembersService>;
}> {
  const mockPrisma = options.mockPrisma ?? createMockPrismaService();
  const mockEmail = options.mockEmail ?? createMockEmailService();
  const mockJwt = options.mockJwt ?? createMockJwtService();
  const mockConfig = options.mockConfig ?? createMockConfigService();
  const mockSupabase = createMockSupabaseService();
  const mockDiscounts = options.mockDiscounts ?? createMockDiscountsService();
  const mockMembers = options.mockMembers ?? createMockMembersService();
  const mockCsrf = createMockCsrfService();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    // 覆蓋外部依賴
    .overrideProvider(PrismaService)
    .useValue(mockPrisma)
    .overrideProvider(EmailService)
    .useValue(mockEmail)
    .overrideProvider(JwtService)
    .useValue(mockJwt)
    .overrideProvider(ConfigService)
    .useValue(mockConfig)
    .overrideProvider(SupabaseService)
    .useValue(mockSupabase)
    .overrideProvider(DiscountsService)
    .useValue(mockDiscounts)
    .overrideProvider(MembersService)
    .useValue(mockMembers)
    // 覆蓋 CSRF Service - 讓所有 CSRF 驗證通過
    // 注意：CsrfGuard 是通過 APP_GUARD 註冊的，無法用 overrideGuard 覆蓋
    // 但可以覆蓋它依賴的 CsrfService
    .overrideProvider(CsrfService)
    .useValue(mockCsrf)
    // 停用 Throttle Guard（避免測試受限流影響）
    .overrideGuard(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    // 保留 CSRF Guard 覆蓋（作為備用，主要靠 CsrfService mock）
    .overrideGuard(CsrfGuard)
    .useValue({ canActivate: () => true })
    // 使用 Mock JWT Guard（簡化 token 驗證邏輯）
    .overrideGuard(JwtAuthGuard)
    .useValue(new MockJwtAuthGuard(mockPrisma))
    .compile();

  const app = moduleFixture.createNestApplication();

  // API 版本控制 - 全域前綴 /api/v1（與 main.ts 保持一致）
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'], // 健康檢查保持根路徑
  });

  // 設定全域管道（與 main.ts 保持一致）
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  return {
    app,
    mockPrisma,
    mockEmail,
    mockJwt,
    mockConfig,
    mockDiscounts,
    mockMembers,
  };
}

/**
 * 生成測試用的 JWT Token
 */
export function generateTestToken(
  userId: string = 'test-user-id',
  email: string = 'test@example.com',
  role: string = 'USER',
): string {
  // 在測試中我們 mock 了 JwtService.verify()
  // 所以這個 token 只需要是一個有效的字串即可
  return `mock-jwt-token-${userId}`;
}

/**
 * 建立 Authorization Header
 */
export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
