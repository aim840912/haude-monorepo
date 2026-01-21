# 測試指南

本指南涵蓋專案的 E2E 測試（Playwright）和負載測試（k6）。

## 目錄

- [E2E 測試（Playwright）](#e2e-測試playwright)
- [負載測試（k6）](#負載測試k6)
- [CI 整合](#ci-整合)

---

## E2E 測試（Playwright）

### 安裝

Playwright 已包含在 `@haude/web` 的依賴中，執行 `pnpm install` 即可。

首次使用需安裝瀏覽器：

```bash
cd apps/web
npx playwright install chromium
```

### 測試檔案結構

```
apps/web/e2e/
├── auth.spec.ts      # 認證流程（8 個測試）
├── shopping.spec.ts  # 購物流程（9 個測試）
└── checkout.spec.ts  # 結帳流程（7 個測試）
```

### 執行測試

```bash
# 從根目錄執行
pnpm test:e2e

# 或從 web 目錄執行
cd apps/web
pnpm test:e2e
```

### 常用選項

```bash
# 開啟 Playwright UI 互動模式（推薦用於除錯）
pnpm --filter @haude/web test:e2e:ui

# 有頭模式（可看到瀏覽器操作）
pnpm --filter @haude/web test:e2e:headed

# 只執行特定測試檔案
cd apps/web
npx playwright test auth.spec.ts

# 只執行包含特定關鍵字的測試
npx playwright test -g "登入"

# 產生 HTML 報告
npx playwright test --reporter=html
npx playwright show-report
```

### 測試覆蓋範圍

| 測試檔案 | 覆蓋流程 |
|---------|---------|
| `auth.spec.ts` | 登入頁顯示、表單驗證、錯誤處理、Google OAuth、頁面導航 |
| `shopping.spec.ts` | 產品列表、搜尋篩選、購物車、產品詳情、首頁入口 |
| `checkout.spec.ts` | 未登入重導向、空購物車處理、表單欄位、付款方式、訂單摘要 |

### 注意事項

1. **需要啟動開發伺服器**：測試會自動啟動 `pnpm dev`，但需確保 port 5173 未被佔用
2. **後端 API**：部分測試（如實際登入）需要後端 API 運行
3. **測試環境**：測試會清除 localStorage，確保狀態獨立

---

## 負載測試（k6）

### 安裝 k6

```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### 執行測試

```bash
# 測試本地 API（需先啟動 API）
pnpm dev:api  # 在另一個終端機
pnpm load-test

# 測試生產環境
k6 run -e API_URL=https://your-api.example.com/api/v1 load-tests/api-load.js
```

### 測試場景

預設測試場景（約 3.5 分鐘）：

| 階段 | 持續時間 | 虛擬用戶數 | 說明 |
|------|---------|-----------|------|
| 預熱 | 30 秒 | 0 → 10 | 逐步增加負載 |
| 加載 | 1 分鐘 | 20 | 穩定負載測試 |
| 峰值 | 30 秒 | 20 → 50 | 模擬流量高峰 |
| 維持 | 1 分鐘 | 50 | 高負載持續測試 |
| 冷卻 | 30 秒 | 50 → 0 | 逐步降低負載 |

### 效能閾值

| 指標 | 閾值 | 說明 |
|------|-----|------|
| `http_req_duration` | p95 < 500ms | 95% 請求在 500ms 內完成 |
| `product_list_duration` | p95 < 300ms | 產品列表 API |
| `product_detail_duration` | p95 < 200ms | 產品詳情 API |
| `errors` | < 1% | 錯誤率 |

### 解讀測試結果

```
     http_req_duration..............: avg=45.12ms  p(95)=98.34ms  ✓
     http_req_failed................: 0.00%   ✓ 0    ✗ 1234
     http_reqs......................: 1234    10.28/s
```

- **http_req_duration**：請求回應時間，p(95) 應低於閾值
- **http_req_failed**：失敗率，應為 0% 或接近 0%
- **http_reqs**：總請求數和每秒請求數 (RPS)

---

## CI 整合

### E2E 測試（已在 CI 中）

E2E 測試可整合至 GitHub Actions：

```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Install Playwright Browsers
        run: cd apps/web && npx playwright install chromium --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/web/playwright-report/
          retention-days: 30
```

### 負載測試（手動觸發）

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  workflow_dispatch:
    inputs:
      api_url:
        description: 'API URL to test'
        required: true
        default: 'https://your-api.example.com/api/v1'

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
            --keyserver hkp://keyserver.ubuntu.com:80 \
            --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
            | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load test
        run: k6 run -e API_URL=${{ github.event.inputs.api_url }} load-tests/api-load.js
```

---

## 快速參考

| 指令 | 說明 |
|------|------|
| `pnpm test:e2e` | 執行所有 E2E 測試 |
| `pnpm --filter @haude/web test:e2e:ui` | Playwright UI 模式 |
| `pnpm --filter @haude/web test:e2e:headed` | 有頭模式 |
| `pnpm load-test` | 執行負載測試（本地 API） |
| `k6 run -e API_URL=<url> load-tests/api-load.js` | 測試指定 API |
