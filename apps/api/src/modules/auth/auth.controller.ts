import {
  Controller,
  Post,
  Get,
  Body,
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
import type { Response, Request as ExpressRequest } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: 200, description: 'Return current user.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getMe(@Request() req: { user: { userId: string } }) {
    return this.authService.getMe(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful.' })
  logout() {
    // With JWT, logout is handled client-side by removing the token
    return { message: 'Logged out successfully' };
  }

  // ========================================
  // Google OAuth 端點
  // ========================================

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiQuery({ name: 'redirect', required: false, description: 'Redirect target: "admin" or "web"' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth.' })
  googleAuth() {
    // GoogleStrategy.authenticate() 會處理 redirect 參數並設定 state
    // Guard 會重導向到 Google，此方法不會實際執行
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiExcludeEndpoint() // 不在 Swagger 中顯示
  async googleAuthCallback(
    @Request() req: ExpressRequest & { user: { id: string; email: string; name: string; role: string; oauthState?: string } },
    @Res() res: Response,
  ) {
    // 從 user 物件取得 oauthState（由 GoogleStrategy 附加）
    const { oauthState, ...userData } = req.user;

    // Google OAuth 回調處理
    const { user, accessToken } = await this.authService.googleLogin(userData);

    if (oauthState === 'admin') {
      // Admin 登入：檢查是否為 ADMIN 角色
      const adminUrl = this.configService.get<string>('ADMIN_URL') || 'http://localhost:5174';

      if (user.role !== 'ADMIN') {
        // 非管理員，重導向到錯誤頁面
        res.redirect(`${adminUrl}/auth/callback#error=${encodeURIComponent('您沒有管理員權限')}`);
        return;
      }

      const redirectUrl = `${adminUrl}/auth/callback#token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}`;
      res.redirect(redirectUrl);
      return;
    }

    // Web 登入（預設）
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback#token=${accessToken}&user=${encodeURIComponent(JSON.stringify(user))}`;

    res.redirect(redirectUrl);
  }
}
