import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { CacheHeadersInterceptor } from './common/interceptors/cache-headers.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 安全性強化 - Helmet HTTP 安全標頭
  // 提供：X-Content-Type-Options, X-Frame-Options, HSTS, 移除 X-Powered-By 等
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: [
            "'self'",
            process.env.FRONTEND_URL || 'http://localhost:5173',
            process.env.ADMIN_URL || 'http://localhost:5174',
          ],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          objectSrc: ["'none'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === 'production' ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false, // 允許嵌入外部資源
    }),
  );

  // Cookie Parser - httpOnly cookie 認證所需
  app.use(cookieParser());

  // CORS - 允許 web 和 admin 前端
  // Production: 必須設定環境變數，不 fallback 到 localhost
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL || !process.env.ADMIN_URL) {
      throw new Error(
        'FRONTEND_URL and ADMIN_URL environment variables are required in production',
      );
    }
  }
  const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.ADMIN_URL || 'http://localhost:5174',
  ];
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // API 版本控制 - 全域前綴 /api/v1
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'], // 健康檢查保持根路徑
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全域異常過濾器 - 統一錯誤回應格式
  app.useGlobalFilters(new AllExceptionsFilter());

  // 效能監控 - 追蹤 API 請求時間
  app.useGlobalInterceptors(new PerformanceInterceptor());

  // HTTP 快取標頭 - GET 請求自動添加 Cache-Control
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new CacheHeadersInterceptor(reflector));

  // Swagger API documentation - 僅在 development 環境啟用
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Haude V2 API')
      .setDescription('The Haude V2 API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API endpoints: http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV === 'development') {
    console.log(`📚 Swagger documentation: http://localhost:${port}/docs`);
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
