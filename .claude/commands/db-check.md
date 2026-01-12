---
description: "檢查資料庫狀態（Prisma schema + migration）"
---

# 資料庫狀態檢查

請在 apps/api 目錄下執行以下檢查：

## 執行步驟

### 1. 驗證 Schema

```bash
cd apps/api && npx prisma validate
```

### 2. 檢查 Migration 狀態

```bash
npx prisma migrate status
```

### 3. 檢查是否需要生成 Client

```bash
npx prisma generate --dry-run 2>&1 || echo "需要重新生成"
```

## 輸出格式

```
# 資料庫狀態

## Schema 驗證
- [通過/失敗]

## Migration 狀態
- 待執行的 migrations：[數量]
- 是否需要 migrate：[是/否]

## Prisma Client
- 是否需要重新生成：[是/否]

## 建議操作
- [列表]
```
