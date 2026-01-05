---
description: "API 開發完成檢查（DTO、Guard、錯誤處理、TypeScript）"
---

# API 開發完成檢查清單 (API Check)

API 開發完成後，執行全面的品質檢查，確保遵循 NestJS 最佳實踐和專案規範。

**用法**：`/api-check [模組或檔案路徑]`（可選）

**檢查目標**：$ARGUMENTS

---

## 檢查項目

### 1. TypeScript 編譯檢查

**目標**：確保程式碼編譯成功

```bash
npm run build
```

**檢查清單**：

- [ ] **編譯是否成功？** - 無錯誤訊息
- [ ] **是否避免使用 `any` 類型？**
  ```bash
  Grep ": any" src/modules/ --output_mode=content --glob="*.ts"
  ```
- [ ] **Prisma Client 是否已生成？**
  ```bash
  npx prisma generate
  ```

---

### 2. DTO 驗證檢查

**目標**：確保輸入資料有適當的驗證

```bash
# 檢查 DTO 檔案是否有驗證裝飾器
Grep "@Is|@Min|@Max|@Length" src/modules/*/dto/ --output_mode=content
```

**檢查清單**：

- [ ] **每個 DTO 屬性是否有驗證？**
  - `@IsString()`, `@IsEmail()`, `@IsNotEmpty()` 等

- [ ] **可選屬性是否使用 `@IsOptional()`？**

- [ ] **敏感欄位是否有適當限制？**
  - 密碼使用 `@MinLength(8)`
  - Email 使用 `@IsEmail()`

**範例**：
```typescript
// ✅ 正確
import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(8)
  password: string

  @IsString()
  @IsNotEmpty()
  name: string
}

// ❌ 錯誤：缺少驗證
export class RegisterDto {
  email: string
  password: string
  name: string
}
```

---

### 3. Guard 使用檢查

**目標**：確保端點有適當的認證保護

```bash
# 檢查 Controller 是否使用 Guard
Grep "@UseGuards\|JwtAuthGuard" src/modules/*/.*controller.ts --output_mode=content
```

**檢查清單**：

- [ ] **需要認證的端點是否使用 `@UseGuards(JwtAuthGuard)`？**
  - POST、PUT、PATCH、DELETE 通常需要認證

- [ ] **管理員端點是否有角色檢查？**

- [ ] **公開端點是否確實不需要認證？**
  - 例如：登入、註冊、公開資料查詢

**範例**：
```typescript
// ✅ 正確
@Post()
@UseGuards(JwtAuthGuard)
create(@Body() dto: CreateDto) {
  return this.service.create(dto)
}

// ❌ 錯誤：寫入操作缺少認證
@Post()
create(@Body() dto: CreateDto) {
  return this.service.create(dto)
}
```

---

### 4. 錯誤處理檢查

**目標**：確保使用 NestJS 內建異常

```bash
# 檢查是否使用 NestJS 異常
Grep "NotFoundException|BadRequestException|UnauthorizedException" src/modules/ --output_mode=content
```

**檢查清單**：

- [ ] **是否使用 NestJS 內建異常？**
  - `NotFoundException` - 資源不存在 (404)
  - `BadRequestException` - 請求無效 (400)
  - `UnauthorizedException` - 未認證 (401)
  - `ForbiddenException` - 無權限 (403)

- [ ] **異常訊息是否清晰？**
  ```typescript
  throw new NotFoundException(`User ${id} not found`)
  ```

- [ ] **是否避免直接回傳錯誤？**
  ```typescript
  // ❌ 錯誤
  return { error: 'Not found' }

  // ✅ 正確
  throw new NotFoundException('Not found')
  ```

---

### 5. Service 層檢查

**目標**：確保業務邏輯在 Service 層

```bash
# 檢查 Service 是否使用 PrismaService
Grep "PrismaService" src/modules/*/.*service.ts --output_mode=content
```

**檢查清單**：

- [ ] **Controller 是否只做路由和驗證？**
  - 業務邏輯應在 Service 層

- [ ] **Service 是否使用 PrismaService？**
  - 不應直接在 Controller 使用 Prisma

- [ ] **是否有適當的事務處理？**
  - 複雜操作使用 `prisma.$transaction()`

---

### 6. API 文檔檢查

**目標**：確保 Swagger 文檔完整

```bash
# 檢查是否有 Swagger 裝飾器
Grep "@ApiTags|@ApiOperation|@ApiBearerAuth" src/modules/*/.*controller.ts --output_mode=content
```

**檢查清單**：

- [ ] **Controller 是否有 `@ApiTags()`？**

- [ ] **重要端點是否有 `@ApiOperation()`？**

- [ ] **需要認證的端點是否有 `@ApiBearerAuth()`？**

- [ ] **是否定義回應類型？**
  ```typescript
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '找不到資源' })
  ```

---

### 7. 測試覆蓋檢查

**目標**：確保重要功能有測試

```bash
# 執行測試
npm run test

# 檢查測試覆蓋率
npm run test:cov
```

**檢查清單**：

- [ ] **測試是否通過？**
- [ ] **是否有 Service 層測試？**
- [ ] **是否測試主要功能？**
  - 成功場景
  - 錯誤場景
  - 邊界條件

---

## 最終檢查清單

完成以上檢查後，填寫以下清單：

- [ ] **TypeScript**：編譯成功，無 any 類型
- [ ] **DTO 驗證**：所有欄位有驗證規則
- [ ] **Guard 保護**：敏感端點有認證
- [ ] **錯誤處理**：使用 NestJS 內建異常
- [ ] **Service 層**：業務邏輯封裝完整
- [ ] **API 文檔**：Swagger 文檔完整
- [ ] **測試覆蓋**：主要功能有測試

---

## 輸出格式

```
# API 檢查報告

## TypeScript 編譯
- [通過/需改進]
- 發現問題：[...]

## DTO 驗證
- [通過/需改進]
- 缺少驗證的欄位：[...]

## Guard 保護
- [通過/需改進]
- 未保護的端點：[...]

## 錯誤處理
- [通過/需改進]
- 建議：[...]

## Service 層
- [通過/需改進]
- 建議：[...]

## API 文檔
- [通過/需改進]
- 缺少文檔的端點：[...]

## 測試覆蓋
- [通過/需改進]
- 建議新增測試：[...]

## 總體評估
- 是否可上線：[是/否]
- 必須修正：[列表]
- 建議改進：[列表]
```

---

## 相關指令

- `/frontend-check` - 前端開發檢查（在 haude-v2-frontend 使用）
