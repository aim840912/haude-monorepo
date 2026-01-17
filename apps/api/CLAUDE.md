# 後端開發指南

## 📑 目錄

- [快速開始](#-快速開始)
- [專案結構](#-專案結構)
- [模組開發規範](#-模組開發規範)
- [認證與授權](#-認證與授權)
- [資料庫操作](#-資料庫操作)
- [品質標準](#-品質標準)

---

## 快速開始

### 5 秒速查

```bash
# 開發前必做
npx prisma generate && npm run lint

# 常用指令
npm run start:dev   # 啟動開發伺服器（熱重載）
npm run test        # 執行測試
```

### 常用指令

```bash
# 開發
npm run start:dev    # 開發伺服器（熱重載）http://localhost:3001
npm run start:debug  # Debug 模式
npm run build        # 編譯
npm run start:prod   # 生產模式

# 程式碼品質
npm run lint         # ESLint 檢查並自動修復
npm run format       # Prettier 格式化

# 測試
npm run test         # 單元測試
npm run test:watch   # 監看模式
npm run test:cov     # 測試覆蓋率
npm run test:e2e     # 端對端測試

# 資料庫
npx prisma generate      # 生成 Prisma Client
npx prisma migrate dev   # 開發遷移
npx prisma migrate deploy # 部署遷移
npx prisma studio        # 資料庫管理 UI
npx prisma db seed       # 執行種子資料
```

### 技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| NestJS | 11.0 | 後端框架 |
| TypeScript | 5.7 | 類型系統 |
| Prisma | 7.1 | ORM |
| PostgreSQL | 15 | 資料庫 |
| Passport | 0.7 | 認證框架 |
| JWT | 11.0 | Token 認證 |
| Swagger | 11.2 | API 文檔 |
| Jest | 30.0 | 測試框架 |

---

## 專案結構

```
src/
├── modules/                 # 功能模組
│   ├── auth/               # 認證模組
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       └── login.dto.ts
│   ├── users/              # 使用者模組
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/
│   └── health/             # 健康檢查
│       ├── health.controller.ts
│       └── health.module.ts
├── prisma/                  # Prisma ORM
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/                  # 共用功能
│   ├── guards/             # 自訂守衛
│   ├── decorators/         # 自訂裝飾器
│   ├── filters/            # 異常過濾器
│   └── interceptors/       # 攔截器
├── app.module.ts            # 根模組
├── app.service.ts
├── app.controller.ts
└── main.ts                  # 應用入口

prisma/
├── schema.prisma            # 資料庫 Schema
└── migrations/              # 遷移記錄

test/
├── app.e2e-spec.ts          # E2E 測試
└── jest-e2e.json
```

---

## 模組開發規範

### 新增模組步驟

1. **建立模組結構**：
```bash
nest generate module modules/your-module
nest generate controller modules/your-module
nest generate service modules/your-module
```

2. **建立 DTO**：
```typescript
// dto/create-item.dto.ts
import { IsString, IsNotEmpty, IsOptional } from 'class-validator'

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsString()
  @IsOptional()
  description?: string
}
```

3. **建立 Service**：
```typescript
// item.service.ts
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { CreateItemDto } from './dto/create-item.dto'

@Injectable()
export class ItemService {
  constructor(private prisma: PrismaService) {}

  async create(createItemDto: CreateItemDto) {
    return this.prisma.item.create({
      data: createItemDto,
    })
  }

  async findAll() {
    return this.prisma.item.findMany()
  }

  async findOne(id: string) {
    return this.prisma.item.findUnique({
      where: { id },
    })
  }
}
```

4. **建立 Controller**：
```typescript
// item.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'
import { ItemService } from './item.service'
import { CreateItemDto } from './dto/create-item.dto'

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemService.create(createItemDto)
  }

  @Get()
  findAll() {
    return this.itemService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemService.findOne(id)
  }
}
```

### DTO 驗證規範

使用 `class-validator` 進行輸入驗證：

```typescript
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  @IsNotEmpty()
  name: string

  @IsEnum(['USER', 'ADMIN'])
  @IsOptional()
  role?: 'USER' | 'ADMIN'
}
```

---

## 認證與授權

### JWT 認證流程

1. **註冊**：`POST /auth/register`
2. **登入**：`POST /auth/login` → 返回 JWT Token
3. **驗證**：使用 `@UseGuards(JwtAuthGuard)` 保護端點
4. **取得使用者**：從 `@Request()` 取得當前使用者

### 使用 Guard 保護端點

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common'
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard'

@Controller('protected')
export class ProtectedController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user  // { userId, email, name, role }
  }
}
```

### 自訂 Guard（角色檢查）

```typescript
// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler())
    if (!requiredRoles) {
      return true
    }
    const { user } = context.switchToHttp().getRequest()
    return requiredRoles.includes(user.role)
  }
}

// 使用方式
@Get('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
getAdminData() {
  return { message: '管理員資料' }
}
```

---

## 資料庫操作

### Prisma Schema

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum Role {
  USER
  ADMIN
}
```

### Prisma Service 使用

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  async create(data: { email: string; password: string; name: string }) {
    return this.prisma.user.create({
      data,
    })
  }

  async update(id: string, data: { name?: string; isActive?: boolean }) {
    return this.prisma.user.update({
      where: { id },
      data,
    })
  }
}
```

### 遷移流程

```bash
# 1. 修改 schema.prisma

# 2. 建立遷移
npx prisma migrate dev --name add_new_field

# 3. 生成 Prisma Client
npx prisma generate

# 4. 部署遷移（生產環境）
npx prisma migrate deploy
```

---

## 品質標準

### 錯誤處理

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'

@Injectable()
export class ItemService {
  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    })

    if (!item) {
      throw new NotFoundException(`Item ${id} not found`)
    }

    return item
  }
}
```

### API 文檔 (Swagger)

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'

@ApiTags('items')
@Controller('items')
export class ItemController {
  @Get()
  @ApiOperation({ summary: '取得所有項目' })
  @ApiResponse({ status: 200, description: '成功' })
  findAll() {
    return this.itemService.findAll()
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '建立新項目' })
  @ApiResponse({ status: 201, description: '建立成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemService.create(createItemDto)
  }
}
```

### 開發完成檢查

使用專案指令執行 API 檢查：

```bash
/api-check
```

### 完成定義

- [ ] TypeScript 編譯成功
- [ ] ESLint 無錯誤（`npm run lint`）
- [ ] DTO 有完整的驗證規則
- [ ] 端點有適當的 Guard 保護
- [ ] 錯誤處理使用 NestJS 內建異常
- [ ] 測試覆蓋主要功能

---

## 相關文件

- **專案總覽**：`../haude-v2/CLAUDE.md`
- **前端規範**：`../haude-v2-frontend/CLAUDE.md`
- **全域規範**：`~/.claude/CLAUDE.md`
- **Swagger 文檔**：`http://localhost:3001/api`


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

### Jan 17, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #1849 | 6:01 PM | 🔵 | E2E test infrastructure exists but contains only placeholder test file | ~380 |
| #1838 | 5:58 PM | 🔵 | Complete API source file inventory reveals limited test coverage | ~422 |
| #1835 | " | 🔵 | API backend package configuration reviewed for improvement planning | ~341 |
| #1810 | 5:07 PM | ⚖️ | Comprehensive Code Quality Analysis with Prioritized Improvements | ~701 |
| #1799 | " | 🔵 | NestJS API: Haude Tea Shop Backend with Full Testing Infrastructure | ~573 |
| #1797 | 5:06 PM | 🔵 | Production Environment Configuration with Taiwan Payment and Email Services | ~631 |
| #1773 | 5:05 PM | 🔵 | Modern TypeScript Configuration with ES2023 and Decorators | ~431 |
| #1754 | 5:03 PM | 🔵 | NestJS API with Prisma, Supabase, and Multi-Auth Strategy | ~516 |
| #1738 | 4:57 PM | 🔵 | API CLAUDE.md Content Analysis Reveals Minimal Duplication | ~560 |
| #1677 | 4:41 PM | 🔵 | API App CLAUDE.md Documents NestJS Backend Patterns | ~697 |
| #1668 | 4:40 PM | 🔵 | Complete CLAUDE.md Configuration Audit Performed | ~698 |
| #1650 | 4:39 PM | 🔵 | API App CLAUDE.md Configuration Structure Analyzed | ~507 |
| #1634 | 4:35 PM | 🔵 | Image Storage Architecture Investigation and Root Cause Analysis | ~634 |
</claude-mem-context>