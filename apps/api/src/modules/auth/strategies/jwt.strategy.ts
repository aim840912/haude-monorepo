import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { Role } from '@prisma/client';

interface JwtPayload {
  sub: string;
  email: string;
}

export interface JwtUser {
  userId: string;
  email: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    // 查詢用戶以取得最新的角色資訊
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('用戶不存在');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('帳戶已被停用');
    }

    const result: JwtUser = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return result;
  }
}
