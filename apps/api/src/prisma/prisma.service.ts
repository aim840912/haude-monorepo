import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 查詢事件型別
interface QueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly SLOW_QUERY_THRESHOLD = 100; // 100ms

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // 監聽查詢事件，記錄慢查詢
    this.$on('query' as never, (e: QueryEvent) => {
      if (e.duration > this.SLOW_QUERY_THRESHOLD) {
        this.logger.warn(
          `Slow Query (${e.duration}ms): ${e.query.substring(0, 200)}${e.query.length > 200 ? '...' : ''}`,
        );
      }
    });

    // 監聽錯誤事件
    this.$on('error' as never, (e: { message: string }) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from database');
  }
}
