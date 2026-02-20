import { Module, Logger } from '@nestjs/common';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';

// 動態提供 GoogleStrategy（僅在配置完整時啟用）
const googleStrategyProvider = {
  provide: GoogleStrategy,
  useFactory: (configService: ConfigService, authService: AuthService) => {
    const logger = new Logger('AuthModule');
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');

    if (clientId && clientSecret) {
      logger.log('Google OAuth enabled');
      return new GoogleStrategy(configService, authService);
    }

    logger.warn(
      'Google OAuth disabled - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not configured',
    );
    // 返回一個空的占位符，不會被使用
    return null;
  },
  inject: [ConfigService, AuthService],
};

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          throw new Error(
            'JWT_SECRET environment variable is required. Please set it in your .env file.',
          );
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: 900, // 15 分鐘（秒）
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, googleStrategyProvider],
  exports: [AuthService],
})
export class AuthModule {}
