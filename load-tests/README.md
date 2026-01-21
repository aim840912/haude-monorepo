# 負載測試（k6）

使用 [k6](https://k6.io/) 進行 API 負載測試。

## 安裝 k6

```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 執行測試

### 本地開發環境

```bash
# 確保 API 在本地運行
pnpm dev:api

# 執行負載測試
k6 run load-tests/api-load.js
```

### 測試生產環境

```bash
# 使用環境變數指定 API URL
k6 run -e API_URL=https://your-api.example.com/api/v1 load-tests/api-load.js
```

## 測試場景

### api-load.js

| 階段 | 持續時間 | 虛擬用戶數 | 說明 |
|------|---------|-----------|------|
| 預熱 | 30 秒 | 0 → 10 | 逐步增加負載 |
| 加載 | 1 分鐘 | 20 | 穩定負載測試 |
| 峰值 | 30 秒 | 20 → 50 | 模擬流量高峰 |
| 維持 | 1 分鐘 | 50 | 高負載持續測試 |
| 冷卻 | 30 秒 | 50 → 0 | 逐步降低負載 |

### 測試端點

| 端點 | 預期回應時間 | 說明 |
|------|------------|------|
| `GET /products` | < 300ms (p95) | 產品列表 |
| `GET /products/:id` | < 200ms (p95) | 產品詳情 |
| `GET /categories` | < 200ms (p95) | 類別列表 |

## 效能閾值

| 指標 | 閾值 | 說明 |
|------|-----|------|
| `http_req_duration` | p95 < 500ms | 95% 請求在 500ms 內完成 |
| `errors` | < 1% | 錯誤率低於 1% |

## 輸出解讀

執行後會看到類似的輸出：

```
     data_received..................: 1.2 MB  9.8 kB/s
     data_sent......................: 156 kB  1.3 kB/s
     http_req_blocked...............: avg=2.35ms   min=0s       med=1µs
     http_req_connecting............: avg=2.32ms   min=0s       med=0s
   ✓ http_req_duration..............: avg=45.12ms  min=12.34ms  med=42.56ms  max=234.56ms  p(95)=98.34ms
     http_req_failed................: 0.00%   ✓ 0    ✗ 1234
     http_req_receiving.............: avg=134µs    min=12µs     med=89µs
     http_req_sending...............: avg=35µs     min=4µs      med=23µs
     http_req_tls_handshaking.......: avg=0s       min=0s       med=0s
     http_req_waiting...............: avg=44.95ms  min=12.29ms  med=42.44ms
     http_reqs......................: 1234    10.28/s
     iteration_duration.............: avg=3.05s    min=3.01s    med=3.04s
     iterations.....................: 411     3.43/s
     vus............................: 1       min=1  max=50
     vus_max........................: 50      min=50 max=50
```

### 關鍵指標

- **http_req_duration**：請求持續時間，p(95) 應低於閾值
- **http_req_failed**：失敗請求百分比，應為 0% 或接近 0%
- **http_reqs**：總請求數和每秒請求數 (RPS)

## 自訂測試

如需自訂測試場景，修改 `api-load.js` 中的 `options.stages`：

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 100 },  // 更高的負載
    { duration: '5m', target: 100 },  // 更長的持續時間
    { duration: '30s', target: 0 },
  ],
}
```

## 整合 CI/CD

可以在 CI 管道中執行負載測試：

```yaml
# .github/workflows/load-test.yml
name: Load Test
on:
  workflow_dispatch:  # 手動觸發

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load test
        run: k6 run -e API_URL=${{ secrets.API_URL }} load-tests/api-load.js
```

## 進階主題

- [k6 官方文檔](https://k6.io/docs/)
- [k6 Cloud](https://k6.io/cloud/) - 雲端負載測試服務
- [Grafana + k6](https://k6.io/docs/results-visualization/grafana-dashboards/) - 視覺化測試結果
