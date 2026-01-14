---
description: "Monorepo 健康檢查（工作區、依賴、構建）"
---

# Monorepo 健康檢查

執行完整的 Monorepo 健康檢查，確保所有專案配置正確且可正常建置。

## 1. 工作區配置檢查

```bash
# 顯示 pnpm-workspace.yaml 配置
cat pnpm-workspace.yaml

# 檢查內部依賴版本一致性
echo "=== @haude/* 內部依賴 ==="
grep -r '"@haude/' apps/ packages/ --include="package.json" | grep -v node_modules
```

## 2. 依賴健康檢查

```bash
# 檢查依賴樹（頂層）
pnpm ls --depth=0

# 查找過時依賴
echo "=== 過時依賴檢查 ==="
pnpm outdated || echo "所有依賴都是最新的"
```

## 3. 完整建置驗證

```bash
# 清理快取
pnpm clean

# 重新安裝依賴
pnpm install

# 型別檢查
echo "=== 型別檢查 ==="
pnpm type-check

# 完整建置
echo "=== 完整建置 ==="
pnpm build
```

## 4. 檢查清單

完成上述步驟後，確認以下項目：

- [ ] `pnpm-workspace.yaml` 包含所有專案目錄
- [ ] 所有 `@haude/*` 依賴使用 `workspace:*` 協議
- [ ] 無循環依賴警告
- [ ] 型別檢查通過
- [ ] 所有專案建置成功

## 常見問題排解

### 依賴版本不一致

```bash
# 強制重新解析依賴
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### 型別錯誤

```bash
# 重新生成 Prisma Client
cd apps/api && npx prisma generate && cd ../..

# 重建 types 套件
pnpm --filter @haude/types build
```

### 建置失敗

```bash
# 單獨建置各專案找出問題
pnpm --filter @haude/types build
pnpm --filter @haude/api build
pnpm --filter @haude/web build
pnpm --filter @haude/admin build
```
