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
npx prisma generate && pnpm lint

# 常用指令
pnpm start:dev   # 啟動開發伺服器（熱重載）
pnpm test        # 執行測試
```

### 常用指令

```bash
# 開發
pnpm start:dev    # 開發伺服器（熱重載）http://localhost:3001
pnpm start:debug  # Debug 模式
pnpm build        # 編譯
pnpm start:prod   # 生產模式

# 程式碼品質
pnpm lint         # ESLint 檢查並自動修復
pnpm format       # Prettier 格式化

# 測試
pnpm test         # 單元測試
pnpm test:watch   # 監看模式
pnpm test:cov     # 測試覆蓋率
pnpm test:e2e     # 端對端測試

# 資料庫
npx prisma generate      # 生成 Prisma Client
npx prisma migrate dev   # 開發遷移
npx prisma migrate deploy # 部署遷移
npx prisma studio        # 資料庫管理 UI
npx prisma db seed       # 執行種子資料
```

### 技術棧

版本以 `package.json` 為準。

| 技術       | 用途       |
| ---------- | ---------- |
| NestJS     | 後端框架   |
| TypeScript | 類型系統   |
| Prisma     | ORM        |
| PostgreSQL | 資料庫     |
| Passport   | 認證框架   |
| JWT        | Token 認證 |
| Swagger    | API 文檔   |
| Jest       | 測試框架   |

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
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
```

3. **建立 Service**：

```typescript
// item.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ItemService {
  constructor(private prisma: PrismaService) {}

  async create(createItemDto: CreateItemDto) {
    return this.prisma.item.create({
      data: createItemDto,
    });
  }

  async findAll() {
    return this.prisma.item.findMany();
  }

  async findOne(id: string) {
    return this.prisma.item.findUnique({
      where: { id },
    });
  }
}
```

4. **建立 Controller**：

```typescript
// item.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemService.create(createItemDto);
  }

  @Get()
  findAll() {
    return this.itemService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.itemService.findOne(id);
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
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['USER', 'ADMIN'])
  @IsOptional()
  role?: 'USER' | 'ADMIN';
}
```

---

## 認證與授權

### JWT 認證流程

1. **註冊**：`POST /auth/register`
2. **登入**：`POST /auth/login` → JWT 寫進 httpOnly cookie `access_token`（`jwt.strategy.ts` 先讀 cookie，Bearer header 只是過渡期備援）
3. **驗證**：使用 `@UseGuards(JwtAuthGuard)` 保護端點
4. **取得使用者**：從 `@Request()` 取得當前使用者

### 使用 Guard 保護端點

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user; // { userId, email, name, role }
  }
}
```

### 自訂 Guard（角色檢查）

已實作，不要另寫：guard 在 `src/common/guards/roles.guard.ts`、decorator 在 `src/common/decorators/roles.decorator.ts`。
用法是 `@UseGuards(JwtAuthGuard, RolesGuard)` 加 `@Roles(...)`，實例照 `src/modules/auth/auth.controller.ts`。

---

## 資料庫操作

### Prisma Schema

以 `prisma/schema.prisma` 為準，不在這裡抄 model（抄了就會過時：例如 `Role` 實際有 USER／VIP／STAFF／ADMIN 四種）。
改 schema 前先讀根目錄 `CLAUDE.md`「Git 與部署」：正式環境沒有自動 migration。

### Prisma Service 使用

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: { email: string; password: string; name: string }) {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: { name?: string; isActive?: boolean }) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
```

### 遷移流程

```bash
# 1. 修改 schema.prisma

# 2. 建立遷移（非互動環境不能用 migrate dev，見下方規則 3）
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
#    → 手動建 prisma/migrations/<timestamp>_<name>/migration.sql 貼上輸出

# 3. 生成 Prisma Client
npx prisma generate

# 4. 部署遷移（生產環境）
npx prisma migrate deploy
```

#### 遷移撰寫規則（踩過的雷）

1. **不可用重導向產生 migration**
   `prisma migrate diff ... > migration.sql` 會把指令的 stdout 訊息（如 `Loaded Prisma config from...`）一起寫進 SQL 檔，導致該 migration 在任何新資料庫上必定失敗。產生後務必 `head -3` 確認第一行是 SQL 註解。

2. **Supabase 專屬語法要加存在性判斷**
   `anon` / `authenticated` 是 Supabase 提供的角色，本機 Docker Postgres 沒有。直接 `REVOKE ... FROM anon` 會在本機噴 `role "anon" does not exist`。寫法參考 `migrations/20260720_revoke_anon_write_privileges/migration.sql`：

   ```sql
   DO $$
   BEGIN
     IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
       EXECUTE 'REVOKE ...';
     END IF;
   END $$;
   ```

3. **非互動環境不可用 `migrate dev`**
   會直接被拒絕（即使加 `--create-only`）。改用 `migrate diff --script` 產生後手動建資料夾，再 `migrate deploy`。

---

## 個資與安全規範

專案即將處理真實客戶資料（姓名、電話、地址、綠界金流），適用個資法。以下為已實作的約束，**修改相關程式時勿破壞**。

### 存取控制模型

資料庫僅由本 API 透過 `DATABASE_URL`（postgres 角色）存取。RLS 對所有表啟用且**刻意不建任何 policy**（deny-all），`anon` / `authenticated` 權限已全數撤銷。授權邏輯**完全在 NestJS 層**（`JwtAuthGuard` + `RolesGuard`）。

⚠️ 若日後要啟用 PostgREST / Supabase JS 直連前端，此模型即失效，必須先設計 policy。

### 金流資料處理

原始 payload **一律經 `maskPaymentPayload()` 遮罩後才落地**（`utils/mask-payment-payload.ts`）：

- 遮罩對象：`requestData`、`responseData`、`rawData` 等稽核用 JSON blob
- **不遮罩**結構化欄位（`Payment.vaAccount`、`bankCode`、`paymentCode`）——客戶要靠它們繳費
- 新增任何寫入原始 payload 的程式碼時，必須套用此函式

### 資料保留

`DataRetentionService`（`modules/data-retention/`）每日 03:00 清理：

| 對象               | 預設保留           | 環境變數                     |
| ------------------ | ------------------ | ---------------------------- |
| `payment_logs`     | 180 天             | `PAYMENT_LOG_RETENTION_DAYS` |
| `audit_logs`       | 365 天             | `AUDIT_LOG_RETENTION_DAYS`   |
| 過期 refresh token | 立即 / 撤銷後 7 天 | —                            |

`Order` / `Payment` **不在清理範圍**（會計憑證，另依商業會計法保存）。

---

### 快取標頭：預設 fail-closed

`CacheHeadersInterceptor` 對 GET 的預設是 `no-store`，要公開快取必須明確
`@Cacheable(秒數)`。維護時的三條規則：

1. **在 `@Cacheable` 的 controller 加上任何認證 guard（含 `OptionalJwtAuthGuard`）
   時，該端點必須補 `@NoCache()`**。回應內容一旦依登入狀態而異，就不能進共享快取。
2. **自行呼叫 `res.redirect()` / `res.status().json()` 的地方要自己設 `Cache-Control`**。
   攔截器對 `headersSent` 的回應會短路 —— OAuth redirect 用 `redirectNoStore()`，
   例外回應由 `HttpExceptionFilter` 統一補 `no-store`。
3. **回應內含使用者資料 → 永不 `public`**。個人化端點不要加 `@Cacheable`，預設值就是對的。

---

## 品質標準

### 錯誤處理

```typescript
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class ItemService {
  async findOne(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Item ${id} not found`);
    }

    return item;
  }
}
```

### API 文檔 (Swagger)

```typescript
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('items')
@Controller('items')
export class ItemController {
  @Get()
  @ApiOperation({ summary: '取得所有項目' })
  @ApiResponse({ status: 200, description: '成功' })
  findAll() {
    return this.itemService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '建立新項目' })
  @ApiResponse({ status: 201, description: '建立成功' })
  @ApiResponse({ status: 401, description: '未認證' })
  create(@Body() createItemDto: CreateItemDto) {
    return this.itemService.create(createItemDto);
  }
}
```

### 開發完成檢查

在 `apps/api` 目錄下：

```bash
pnpm type-check && pnpm lint && pnpm test
```

### 完成定義

- [ ] TypeScript 編譯成功（`pnpm type-check`）
- [ ] ESLint 無錯誤（`pnpm lint`；注意它帶 `--fix`，會直接改檔）
- [ ] DTO 有完整的驗證規則
- [ ] 端點有適當的 Guard 保護
- [ ] 錯誤處理使用 NestJS 內建異常
- [ ] 測試覆蓋主要功能

---

## 相關文件

- **專案總覽**：`../../CLAUDE.md`
- **前端規範**：`../web/CLAUDE.md`
- **全域規範**：`~/.claude/CLAUDE.md`
- **Swagger 文檔**：`http://localhost:3001/docs`（只在 `NODE_ENV=development` 掛載，見 `src/main.ts`）
