---
description: "Admin 後台開發完成檢查"
---

# Admin 品質檢查

執行 Admin 後台的完整品質檢查流程。

## 檢查項目

### 1. TypeScript 型別檢查

```bash
pnpm --filter @haude/admin type-check
```

### 2. ESLint 檢查

```bash
pnpm --filter @haude/admin lint
```

### 3. 建置測試

```bash
pnpm --filter @haude/admin build
```

## Vite 特定檢查

請確認以下項目：

- [ ] import 路徑使用 `@/` alias
- [ ] 環境變數使用 `VITE_` 前綴
- [ ] 沒有直接引用 node_modules 路徑
- [ ] API 呼叫使用 `VITE_API_URL` 環境變數

## 常見問題

### 環境變數未定義

確認 `.env.development` 包含：

```env
VITE_API_URL=http://localhost:3001
```

### 建置失敗

1. 清理快取：`rm -rf dist .turbo`
2. 重新安裝：`pnpm install`
3. 重新建置：`pnpm --filter @haude/admin build`
