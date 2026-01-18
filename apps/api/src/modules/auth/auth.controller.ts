import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiExcludeEndpoint,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  AuthResponseDto,
  UserResponseDto,
  MessageResponseDto,
  ErrorResponseDto,
} from '@/common/dto/response.dto';
import type { Response, Request as ExpressRequest } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { CsrfService } from '@/common/csrf/csrf.service';
import { SkipCsrf } from '@/common/decorators/skip-csrf.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly csrfService: CsrfService,
  ) {}

  @Post('register')
  @SkipCsrf() // 註冊時尚無 CSRF Token
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 每分鐘最多 5 次註冊嘗試
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many registration attempts.',
    type: ErrorResponseDto,
  })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(registerDto);
    const csrfToken = this.csrfService.generateToken();
    res.cookie('csrf-token', csrfToken, this.csrfService.getCookieOptions());
    return { ...result, csrfToken };
  }

  @Post('login')
  @SkipCsrf() // 登入時尚無 CSRF Token
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 每分鐘最多 5 次登入嘗試
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful.',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts.',
    type: ErrorResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    const csrfToken = this.csrfService.generateToken();
    res.cookie('csrf-token', csrfToken, this.csrfService.getCookieOptions());
    return { ...result, csrfToken };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({
    status: 200,
    description: 'Return current user.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  getMe(@Request() req: { user: { userId: string } }) {
    return this.authService.getMe(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful.',
    type: MessageResponseDto,
  })
  logout(@Res({ passthrough: true }) res: Response) {
    // 清除 CSRF Cookie
    res.clearCookie('csrf-token', { path: '/' });
    return { message: 'Logged out successfully' };
  }

  // ========================================
  // 密碼重設端點
  // ========================================

  @Post('forgot-password')
  @SkipCsrf() // 公開端點，無需 CSRF
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 每分鐘最多 3 次密碼重設
  @ApiOperation({ summary: '忘記密碼 - 發送重設密碼郵件' })
  @ApiResponse({
    status: 200,
    description: '已發送重設密碼郵件（如果帳號存在）',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: '請求過於頻繁，請稍後再試',
    type: ErrorResponseDto,
  })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('reset-password')
  @SkipCsrf() // 使用 Token 驗證，無需 CSRF
  @ApiOperation({ summary: '重設密碼' })
  @ApiResponse({
    status: 200,
    description: '密碼重設成功',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '無效或已過期的重設連結',
    type: ErrorResponseDto,
  })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('verify-reset-token')
  @ApiOperation({ summary: '驗證重設密碼 Token 是否有效' })
  @ApiResponse({
    status: 200,
    description: 'Token 有效',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '無效或已過期的 Token',
    type: ErrorResponseDto,
  })
  verifyResetToken(@Query('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Post('set-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '為 Google 帳號設定密碼' })
  @ApiResponse({
    status: 200,
    description: '密碼設定成功',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '已設定過密碼或非 Google 用戶',
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 401, description: '未認證', type: ErrorResponseDto })
  setPassword(
    @Request() req: { user: { userId: string } },
    @Body() setPasswordDto: SetPasswordDto,
  ) {
    return this.authService.setPassword(req.user.userId, setPasswordDto);
  }

  // ========================================
  // Google OAuth 端點
  // ========================================

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiQuery({
    name: 'redirect',
    required: false,
    description: 'Redirect target: "admin" or "web"',
  })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth.' })
  googleAuth() {
    // GoogleStrategy.authenticate() 會處理 redirect 參數並設定 state
    // Guard 會重導向到 Google，此方法不會實際執行
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint() // 不在 Swagger 中顯示
  async googleAuthCallback(
    @Request()
    req: ExpressRequest & {
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        isActive: boolean;
        oauthState?: string;
      };
    },
    @Res() res: Response,
  ) {
    // 從 user 物件取得 oauthState（由 GoogleStrategy 附加）
    const { oauthState, ...userData } = req.user;

    // Google OAuth 回調處理
    const { user, accessToken } = await this.authService.googleLogin(userData);

    // 設定 CSRF Cookie
    const csrfToken = this.csrfService.generateToken();
    res.cookie('csrf-token', csrfToken, this.csrfService.getCookieOptions());

    if (oauthState === 'admin') {
      // Admin 登入：檢查是否為 ADMIN 角色
      const adminUrl =
        this.configService.get<string>('ADMIN_URL') || 'http://localhost:5174';

      if (user.role !== 'ADMIN') {
        // 非管理員，重導向到錯誤頁面，清除 CSRF Cookie
        res.clearCookie('csrf-token', { path: '/' });
        res.redirect(
          `${adminUrl}/auth/callback#error=${encodeURIComponent('您沒有管理員權限')}`,
        );
        return;
      }

      const redirectUrl = `${adminUrl}/auth/callback#token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}&csrfToken=${csrfToken}`;
      res.redirect(redirectUrl);
      return;
    }

    // Web 登入（預設）
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback#token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}&csrfToken=${csrfToken}`;

    res.redirect(redirectUrl);
  }

  // ========================================
  // CSRF Token 端點
  // ========================================

  @Get('csrf-token')
  @SkipCsrf() // Token 刷新端點不需要 CSRF 驗證
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取得新的 CSRF Token' })
  @ApiResponse({ status: 200, description: '返回新的 CSRF Token' })
  @ApiResponse({ status: 401, description: '未認證', type: ErrorResponseDto })
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    const csrfToken = this.csrfService.generateToken();
    res.cookie('csrf-token', csrfToken, this.csrfService.getCookieOptions());
    return { csrfToken };
  }
}
