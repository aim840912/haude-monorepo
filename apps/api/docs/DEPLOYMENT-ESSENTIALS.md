# 部署必備知識大全

> 🎓 **適合對象**：已經會基本部署，想深入了解的開發者
>
> 📚 **你會學到**：部署的完整知識體系，從基礎到進階

---

## 目錄

1. [前後端如何連接](#1-前後端如何連接)
2. [環境的概念](#2-環境的概念-development--staging--production)
3. [CI/CD 持續整合與部署](#3-cicd-持續整合與部署)
4. [網域 (Domain) 完整指南](#4-網域-domain-完整指南)
5. [安全性最佳實踐](#5-安全性最佳實踐)
6. [Debug 除錯指南](#6-debug-除錯指南)
7. [費用估算與優化](#7-費用估算與優化)
8. [部署後維護](#8-部署後維護)
9. [監控與告警](#9-監控與告警)
10. [學習路線圖](#10-學習路線圖)

---

## 1. 前後端如何連接

### 架構總覽

當你把前端和後端分別部署到不同平台時，它們需要透過網路溝通：

```
┌─────────────────────────────────────────────────────────────────┐
│                         使用者的瀏覽器                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ↓                       ↓
        ┌───────────────────┐   ┌───────────────────┐
        │   前端 (Vercel)   │   │  後端 (Render)    │
        │   myapp.com       │   │  api.myapp.com    │
        │                   │   │                   │
        │  - React/Next.js  │   │  - NestJS/Express │
        │  - 靜態檔案       │   │  - API 端點       │
        │  - 使用者介面     │   │  - 商業邏輯       │
        └───────────────────┘   └─────────┬─────────┘
                                          │
                                          ↓
                                ┌───────────────────┐
                                │  資料庫 (Render)  │
                                │  PostgreSQL       │
                                └───────────────────┘
```

### 前端設定

#### 環境變數設定

```bash
# .env.development（開發環境）
VITE_API_URL=http://localhost:3001

# .env.production（正式環境）
VITE_API_URL=https://api.myapp.com
```

#### 程式碼中使用

```typescript
// src/lib/api.ts
const API_URL = import.meta.env.VITE_API_URL

export async function fetchUsers() {
  const response = await fetch(`${API_URL}/users`, {
    credentials: 'include',  // 如果需要傳送 cookies
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return response.json()
}
```

#### 常見錯誤

```typescript
// ❌ 錯誤：寫死 localhost
fetch('http://localhost:3001/users')

// ❌ 錯誤：忘記加 VITE_ 前綴
const url = import.meta.env.API_URL  // undefined!

// ✅ 正確：使用環境變數
const url = import.meta.env.VITE_API_URL
fetch(`${url}/users`)
```

### 後端 CORS 設定

CORS（Cross-Origin Resource Sharing）是瀏覽器的安全機制。當前端和後端在不同網域時，後端必須明確允許前端的請求。

#### NestJS 設定

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // CORS 設定
  app.enableCors({
    // 允許的前端網域
    origin: [
      'http://localhost:5173',        // 本地開發
      'https://myapp.com',            // 正式環境
      'https://www.myapp.com',        // www 版本
      'https://*.vercel.app',         // Vercel Preview
    ],
    // 允許的 HTTP 方法
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // 允許傳送 cookies
    credentials: true,
    // 允許的 headers
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  await app.listen(3001)
}
bootstrap()
```

#### Express 設定

```typescript
// src/index.ts
import express from 'express'
import cors from 'cors'

const app = express()

app.use(cors({
  origin: ['https://myapp.com', 'https://www.myapp.com'],
  credentials: true,
}))
```

#### CORS 錯誤排查

```
錯誤訊息：
Access to fetch at 'https://api.myapp.com' from origin 'https://myapp.com'
has been blocked by CORS policy
```

**檢查清單**：
- [ ] 後端有設定 CORS
- [ ] origin 有包含前端網域
- [ ] 網域拼寫正確（注意 www 和 https）
- [ ] credentials 設定一致（前後端都要設定）

### 請求流程圖解

```
使用者操作
    │
    ▼
前端 JavaScript 發送請求
    │
    │  fetch('https://api.myapp.com/users', {
    │    method: 'GET',
    │    credentials: 'include',
    │    headers: { 'Authorization': 'Bearer xxx' }
    │  })
    │
    ▼
瀏覽器檢查 CORS
    │
    ├─ 不同網域？→ 發送 Preflight 請求 (OPTIONS)
    │                    │
    │                    ▼
    │             後端回應 CORS headers
    │                    │
    │                    ├─ 允許 → 繼續
    │                    └─ 拒絕 → CORS 錯誤
    │
    ▼
後端處理請求
    │
    ▼
回傳資料給前端
    │
    ▼
前端更新畫面
```

---

## 2. 環境的概念 (Development / Staging / Production)

### 三種環境

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   Development (開發環境)                                        │
│   ─────────────────────                                        │
│   📍 位置：你的電腦                                              │
│   🎯 目的：開發和測試新功能                                      │
│   👤 使用者：只有你                                              │
│   📊 資料：測試資料，可以隨便刪                                  │
│   🔧 特性：                                                     │
│      - Hot Reload（改 code 自動更新）                           │
│      - 詳細錯誤訊息                                             │
│      - 可以 console.log 到處印                                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Staging (測試/預覽環境)                                       │
│   ────────────────────                                         │
│   📍 位置：雲端（和 Production 一樣的設定）                      │
│   🎯 目的：上線前的最後測試                                      │
│   👤 使用者：團隊成員、QA                                        │
│   📊 資料：接近真實的測試資料                                    │
│   🔧 特性：                                                     │
│      - 模擬正式環境                                             │
│      - 可以測試部署流程                                         │
│      - Vercel 的 Preview Deployment 就是這個                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Production (正式環境)                                         │
│   ─────────────────                                            │
│   📍 位置：雲端                                                  │
│   🎯 目的：給真實用戶使用                                        │
│   👤 使用者：所有用戶                                            │
│   📊 資料：真實資料，絕對不能亂動！                              │
│   🔧 特性：                                                     │
│      - 效能優化                                                 │
│      - 錯誤訊息簡化（不暴露細節）                                │
│      - 需要監控和告警                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 環境變數管理

每個環境應該有獨立的設定：

```bash
# .env.development
NODE_ENV=development
VITE_API_URL=http://localhost:3001
DATABASE_URL=postgresql://localhost:5432/myapp_dev

# .env.staging
NODE_ENV=staging
VITE_API_URL=https://api-staging.myapp.com
DATABASE_URL=postgresql://staging-db.render.com:5432/myapp_staging

# .env.production
NODE_ENV=production
VITE_API_URL=https://api.myapp.com
DATABASE_URL=postgresql://prod-db.render.com:5432/myapp_prod
```

### 環境隔離的重要性

```
❌ 錯誤做法：所有環境用同一個資料庫

開發時不小心執行：
DELETE FROM users;
    ↓
正式環境用戶資料全部消失！！！
```

```
✅ 正確做法：每個環境獨立資料庫

開發資料庫：隨便玩
測試資料庫：測試用
正式資料庫：只有正式程式碼能存取
```

### Vercel 環境變數設定

Vercel 讓你為不同環境設定不同的變數：

```
Project Settings → Environment Variables

┌─────────────────┬─────────────┬─────────────┬─────────────┐
│ Name            │ Production  │ Preview     │ Development │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ VITE_API_URL    │ api.myapp   │ api-stg     │ localhost   │
│ VITE_GA_ID      │ UA-xxx-1    │ (empty)     │ (empty)     │
│ VITE_DEBUG      │ false       │ true        │ true        │
└─────────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 3. CI/CD 持續整合與部署

### 什麼是 CI/CD？

```
CI (Continuous Integration) - 持續整合
────────────────────────────────────────
每次 push 程式碼，自動執行：
  1. 安裝依賴
  2. 編譯程式碼
  3. 執行測試
  4. 程式碼品質檢查

目的：儘早發現問題


CD (Continuous Deployment) - 持續部署
────────────────────────────────────────
CI 通過後，自動：
  1. 建置 production 版本
  2. 部署到伺服器
  3. 更新線上網站

目的：快速、安全地發布更新
```

### 視覺化流程

```
你的電腦                     GitHub                        雲端平台
   │                           │                              │
   │  git push                 │                              │
   ├──────────────────────────→│                              │
   │                           │                              │
   │                           │  Webhook 通知                │
   │                           ├─────────────────────────────→│
   │                           │                              │
   │                           │                    ┌─────────┴─────────┐
   │                           │                    │  CI Pipeline       │
   │                           │                    │  ──────────────    │
   │                           │                    │  1. npm install    │
   │                           │                    │  2. npm run lint   │
   │                           │                    │  3. npm run test   │
   │                           │                    │  4. npm run build  │
   │                           │                    └─────────┬─────────┘
   │                           │                              │
   │                           │                    ┌─────────┴─────────┐
   │                           │                    │  CD Pipeline       │
   │                           │                    │  ──────────────    │
   │                           │                    │  5. 部署到 CDN     │
   │                           │                    │  6. 更新 DNS       │
   │                           │                    │  7. 清除快取       │
   │                           │                    └─────────┬─────────┘
   │                           │                              │
   │                           │         部署成功通知         │
   │←─────────────────────────────────────────────────────────┤
   │                           │                              │
```

### Vercel/Netlify 已經幫你做好了

如果你用 Vercel 或 Netlify，CI/CD 是自動的：

```bash
git add .
git commit -m "新功能"
git push origin main
```

然後就會自動：
1. 偵測到 push
2. 安裝依賴
3. 執行 build
4. 部署到全球 CDN
5. 完成！

### 自訂 GitHub Actions

如果需要更多控制，可以用 GitHub Actions：

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # CI: 測試和檢查
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Test
        run: npm run test

      - name: Build
        run: npm run build

  # CD: 部署（只在 main 分支）
  deploy:
    needs: test  # 等待 test 完成
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 分支策略

```
main (production)
  │
  │←── PR 合併後自動部署到正式環境
  │
develop (staging)
  │
  │←── PR 合併後自動部署到測試環境
  │
  ├── feature/user-auth
  │     └── 開發中...
  │
  ├── feature/payment
  │     └── 開發中...
  │
  └── fix/login-bug
        └── 修復中...
```

---

## 4. 網域 (Domain) 完整指南

### 網域結構解析

```
https://www.blog.myapp.com:443/posts/123?sort=date#comments
──────   ─── ──── ────────  ─── ─────────  ─────── ────────
  │       │   │      │       │      │         │       │
協議    子域 子域   主域    埠號   路徑      查詢    錨點
(Protocol)(Subdomain)(Domain)(Port)(Path)   (Query) (Hash)


常見結構：
┌─────────────────────────────────────────────────────────┐
│  myapp.com          ← 根域名（Apex Domain）             │
│  www.myapp.com      ← www 子域名                        │
│  api.myapp.com      ← API 子域名                        │
│  admin.myapp.com    ← 管理後台子域名                    │
│  staging.myapp.com  ← 測試環境子域名                    │
│  blog.myapp.com     ← 部落格子域名                      │
└─────────────────────────────────────────────────────────┘
```

### DNS 記錄類型

```
┌────────┬────────────────────────────────────────────────────┐
│ 類型   │ 用途                                               │
├────────┼────────────────────────────────────────────────────┤
│ A      │ 將域名指向 IPv4 地址                                │
│        │ 例：myapp.com → 192.168.1.1                        │
├────────┼────────────────────────────────────────────────────┤
│ AAAA   │ 將域名指向 IPv6 地址                                │
│        │ 例：myapp.com → 2001:db8::1                        │
├────────┼────────────────────────────────────────────────────┤
│ CNAME  │ 將域名指向另一個域名（別名）                        │
│        │ 例：www.myapp.com → myapp.vercel.app               │
├────────┼────────────────────────────────────────────────────┤
│ MX     │ 郵件伺服器記錄                                      │
│        │ 例：收信用 Gmail                                    │
├────────┼────────────────────────────────────────────────────┤
│ TXT    │ 文字記錄（驗證用）                                  │
│        │ 例：驗證網域所有權、SPF、DKIM                       │
└────────┴────────────────────────────────────────────────────┘
```

### 設定自訂網域步驟

#### 步驟 1：購買網域

推薦的域名註冊商：

| 註冊商 | 特點 | .com 價格 |
|--------|------|-----------|
| **Cloudflare** | 成本價，無加價 | ~$9/年 |
| **Namecheap** | 常有特價 | ~$10/年 |
| **Porkbun** | 便宜、介面好 | ~$10/年 |
| **Google Domains** | 已轉移到 Squarespace | ~$12/年 |
| **GoDaddy** | 知名但較貴 | ~$15/年 |

#### 步驟 2：在部署平台加入網域

**Vercel**：
1. Project Settings → Domains
2. 輸入你的網域（如 `myapp.com`）
3. Vercel 會顯示需要設定的 DNS 記錄

**Render**：
1. Service Settings → Custom Domains
2. Add Custom Domain
3. 複製顯示的 DNS 記錄

#### 步驟 3：設定 DNS 記錄

到你的 DNS 供應商（通常是買網域的地方，或 Cloudflare）：

```
前端（Vercel）：
┌──────────┬───────┬─────────────────────────────┐
│ Type     │ Name  │ Value                       │
├──────────┼───────┼─────────────────────────────┤
│ A        │ @     │ 76.76.21.21                 │
│ CNAME    │ www   │ cname.vercel-dns.com        │
└──────────┴───────┴─────────────────────────────┘

後端（Render）：
┌──────────┬───────┬─────────────────────────────┐
│ Type     │ Name  │ Value                       │
├──────────┼───────┼─────────────────────────────┤
│ CNAME    │ api   │ your-service.onrender.com   │
└──────────┴───────┴─────────────────────────────┘
```

#### 步驟 4：等待 DNS 生效

- 通常 5 分鐘 ~ 24 小時
- 可以用 `dig` 或 [dnschecker.org](https://dnschecker.org) 檢查

```bash
# 檢查 DNS 記錄
dig myapp.com
dig api.myapp.com
```

### HTTPS / SSL 憑證

**好消息**：現代平台都自動處理！

| 平台 | HTTPS |
|------|-------|
| Vercel | 自動（Let's Encrypt） |
| Netlify | 自動（Let's Encrypt） |
| Cloudflare | 自動 |
| Render | 自動（Let's Encrypt） |

你只需要確保：
- 用 `https://` 而不是 `http://`
- 設定 HTTP 自動跳轉到 HTTPS（平台通常自動做）

---

## 5. 安全性最佳實踐

### 常見安全問題與解決方案

#### 1. 環境變數外洩

```
❌ 錯誤：把 .env 推到 GitHub

$ git add .
$ git commit -m "update"
# .env 被推上去了！

任何人都可以看到你的：
- 資料庫密碼
- API 金鑰
- JWT Secret
```

```
✅ 正確：使用 .gitignore

# .gitignore
.env
.env.local
.env.*.local
```

**如果已經推上去了**：
1. 立即更換所有外洩的密鑰
2. 使用 `git filter-branch` 或 BFG 清除歷史
3. 通知團隊

#### 2. 前端存放機密

```typescript
// ❌ 極度危險：前端程式碼任何人都能看到！
const API_KEY = 'sk-secret-key-12345'
const DB_PASSWORD = 'my-password'

// ✅ 正確：機密只放後端
// 前端只放公開資訊
const API_URL = import.meta.env.VITE_API_URL
```

**記住**：前端程式碼 = 公開資訊

#### 3. CORS 設定太寬鬆

```typescript
// ❌ 危險：允許任何網域
app.enableCors({
  origin: '*',
})

// ✅ 正確：明確指定允許的網域
app.enableCors({
  origin: [
    'https://myapp.com',
    'https://www.myapp.com',
  ],
})
```

#### 4. 錯誤訊息暴露太多

```typescript
// ❌ 危險：暴露系統細節
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack,  // 暴露程式碼路徑！
    query: req.query,  // 暴露請求內容！
  })
})

// ✅ 正確：Production 只回傳通用訊息
app.use((err, req, res, next) => {
  console.error(err)  // 記錄到 log，不是回傳給用戶

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: '發生錯誤，請稍後再試' })
  } else {
    res.status(500).json({ error: err.message, stack: err.stack })
  }
})
```

#### 5. SQL Injection

```typescript
// ❌ 危險：直接拼接 SQL
const query = `SELECT * FROM users WHERE id = ${userId}`

// ✅ 正確：使用參數化查詢（Prisma 自動處理）
const user = await prisma.user.findUnique({
  where: { id: userId }
})
```

### 安全檢查清單

```
環境變數安全
├── [ ] .env 加入 .gitignore
├── [ ] 定期輪換密鑰
├── [ ] 不同環境用不同密鑰
└── [ ] 前端不存放機密

認證與授權
├── [ ] 使用 HTTPS
├── [ ] JWT 設定合理的過期時間
├── [ ] 敏感操作需要重新驗證
└── [ ] 實作 Rate Limiting

資料保護
├── [ ] 密碼使用 bcrypt 加密
├── [ ] 敏感資料加密儲存
├── [ ] 定期備份資料庫
└── [ ] 日誌不記錄敏感資訊

依賴安全
├── [ ] 定期執行 npm audit
├── [ ] 更新有漏洞的套件
└── [ ] 審查新安裝的套件
```

---

## 6. Debug 除錯指南

### Debug 三寶

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  1. 看 Logs（日誌）                                             │
│  ─────────────────                                             │
│  後端出問題？第一步永遠是看 logs                                 │
│                                                                 │
│  Vercel:   Dashboard → Deployments → 選擇部署 → Logs           │
│  Render:   Dashboard → 選擇服務 → Logs                          │
│  Railway:  執行 `railway logs`                                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  2. 瀏覽器 DevTools                                             │
│  ──────────────────                                            │
│  前端出問題？打開 F12                                           │
│                                                                 │
│  Console Tab:                                                   │
│    - JavaScript 錯誤                                            │
│    - console.log 輸出                                           │
│                                                                 │
│  Network Tab:                                                   │
│    - API 請求有沒有成功                                         │
│    - 回應內容是什麼                                             │
│    - 是不是 CORS 錯誤                                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  3. 本地重現問題                                                │
│  ────────────────                                              │
│  能在本地重現 = 好 debug                                        │
│                                                                 │
│  $ npm run build                                                │
│  $ npm run preview                                              │
│                                                                 │
│  試著用跟 production 一樣的方式跑                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 常見問題排查

#### 問題：部署後頁面空白

```
排查步驟：
1. 打開 DevTools Console → 看錯誤訊息
2. 檢查 Network → 看資源是否 404
3. 檢查 base URL 設定
4. 檢查 build 輸出路徑是否正確
```

#### 問題：API 請求失敗

```
排查步驟：
1. DevTools Network → 找到該請求
2. 看 Status Code
   - 404: URL 錯誤或端點不存在
   - 401/403: 認證問題
   - 500: 後端錯誤 → 看後端 logs
   - CORS error: 後端 CORS 設定問題
3. 看 Response 內容
4. 檢查環境變數 API_URL 是否正確
```

#### 問題：Production 正常但 Preview 壞了

```
排查步驟：
1. 檢查環境變數是否有設定 Preview 環境
2. 確認 API URL 是否指向正確環境
3. 檢查是否有 Production-only 的設定
```

### 有效的錯誤回報

當你需要求助時，提供這些資訊：

```markdown
## 問題描述
簡短描述問題

## 重現步驟
1. 打開某頁面
2. 點擊某按鈕
3. 發生錯誤

## 預期行為
應該要怎樣

## 實際行為
實際發生什麼

## 錯誤訊息
貼上完整錯誤訊息

## 環境
- 平台：Vercel
- Node 版本：20
- 瀏覽器：Chrome 120

## 已嘗試的解決方法
1. 試過 A，沒用
2. 試過 B，沒用
```

---

## 7. 費用估算與優化

### 成本結構

```
┌─────────────────────────────────────────────────────────────────┐
│  部署成本構成                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  固定成本                                                        │
│  ─────────                                                      │
│  □ 網域費用（~$10-15/年）                                        │
│  □ 付費方案月費                                                  │
│                                                                 │
│  變動成本（依使用量）                                            │
│  ─────────────────                                              │
│  □ 頻寬（流量越大越貴）                                          │
│  □ Build 時間（CI/CD 次數越多越貴）                              │
│  □ 資料庫儲存空間                                                │
│  □ Serverless 函數執行次數                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 不同規模的費用估算

#### 🌱 個人專案 / 學習用

| 項目 | 選擇 | 月費 |
|------|------|------|
| 前端 | Vercel Free | $0 |
| 後端 | Render Free | $0 |
| 資料庫 | Render Free PostgreSQL | $0 |
| 網域 | 可選（用平台免費子域名） | $0 |
| **總計** | | **$0/月** |

**限制**：
- 後端會休眠（冷啟動 10-30 秒）
- 資料庫有儲存限制
- 沒有自訂網域

#### 🌿 Side Project / 小型產品

| 項目 | 選擇 | 月費 |
|------|------|------|
| 前端 | Vercel Free | $0 |
| 後端 | Render Starter | $7 |
| 資料庫 | Render Starter | $7 |
| 網域 | Cloudflare | ~$1 |
| **總計** | | **~$15/月** |

**獲得**：
- 後端不休眠
- 更多資料庫空間
- 自訂網域

#### 🌳 正式產品 / 小型公司

| 項目 | 選擇 | 月費 |
|------|------|------|
| 前端 | Vercel Pro | $20 |
| 後端 | Railway | $20-50 |
| 資料庫 | Railway PostgreSQL | $20-50 |
| 網域 | Cloudflare | ~$1 |
| 監控 | Sentry Free → Pro | $0-26 |
| **總計** | | **$60-150/月** |

#### 🌲 成長中的公司

| 項目 | 選擇 | 月費 |
|------|------|------|
| 前端 | Vercel Pro/Enterprise | $20-400 |
| 後端 | AWS/GCP | $100-500 |
| 資料庫 | AWS RDS / Cloud SQL | $50-200 |
| CDN | Cloudflare Pro | $20 |
| 監控 | Datadog / New Relic | $50-200 |
| **總計** | | **$300-1500/月** |

### 省錢技巧

```
1. 善用免費方案
   ────────────
   - 先用免費方案驗證想法
   - 有用戶再升級

2. 選擇適合的方案
   ──────────────
   - 不要過度配置
   - 按需求選擇，不是選最貴的

3. 監控使用量
   ──────────
   - 設定帳單警報
   - 定期檢查是否有浪費

4. 靜態優先
   ─────────
   - 能用 SSG 就不要用 SSR
   - 靜態內容走 CDN，便宜又快

5. 圖片優化
   ─────────
   - 使用 WebP 格式
   - 使用 CDN 圖片服務
   - 減少頻寬費用
```

---

## 8. 部署後維護

### 維護時程表

```
┌─────────────────────────────────────────────────────────────────┐
│  每日（自動化）                                                  │
├─────────────────────────────────────────────────────────────────┤
│  □ 監控網站存活（UptimeRobot 自動）                              │
│  □ 錯誤追蹤收集（Sentry 自動）                                   │
│  □ 自動備份資料庫（平台通常自動）                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  每週                                                           │
├─────────────────────────────────────────────────────────────────┤
│  □ 檢查錯誤日誌，處理重複出現的問題                              │
│  □ 檢視效能指標（頁面載入速度、API 回應時間）                    │
│  □ 確認監控沒有異常警報                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  每月                                                           │
├─────────────────────────────────────────────────────────────────┤
│  □ npm audit 檢查安全漏洞                                        │
│  □ 更新有安全問題的依賴                                          │
│  □ 檢查帳單是否正常                                              │
│  □ 清理不需要的資源（舊的 Preview 部署等）                        │
│  □ 檢查 SSL 憑證狀態                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  每季                                                           │
├─────────────────────────────────────────────────────────────────┤
│  □ 更新所有依賴到最新穩定版                                      │
│  □ 檢視架構是否需要調整                                          │
│  □ 效能優化                                                      │
│  □ 安全性審計                                                    │
│  □ 備份恢復測試                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 常用維護指令

```bash
# 檢查安全漏洞
npm audit

# 自動修復安全漏洞
npm audit fix

# 檢查過時的套件
npm outdated

# 更新所有套件（小心使用）
npm update

# 清理 npm 快取
npm cache clean --force

# 檢查 bundle 大小
npm run build && npx source-map-explorer dist/assets/*.js
```

### 資料庫維護

```bash
# Prisma 相關

# 檢視目前的 migration 狀態
npx prisma migrate status

# 重置資料庫（危險！只在開發環境用）
npx prisma migrate reset

# 備份資料（PostgreSQL）
pg_dump DATABASE_URL > backup.sql

# 還原資料
psql DATABASE_URL < backup.sql
```

### 處理緊急事件

```
網站掛了！怎麼辦？

1. 保持冷靜
   ─────────
   慌張只會讓事情更糟

2. 確認問題範圍
   ─────────────
   □ 只有你看不到？還是所有人？
   □ 只有某個功能？還是整個網站？
   □ 用 https://downdetector.com 或請朋友幫忙確認

3. 檢查明顯原因
   ─────────────
   □ 最近有部署嗎？→ 回滾
   □ 看 logs 有沒有錯誤
   □ 檢查第三方服務狀態（Vercel Status、AWS Status）

4. 快速止血
   ─────────
   □ 如果是新部署造成 → 立即回滾
   □ 如果是第三方問題 → 等待或切換備援

5. 通知相關人員
   ─────────────
   □ 通知團隊
   □ 必要時通知用戶

6. 事後檢討
   ─────────
   □ 寫 Postmortem
   □ 找出根本原因
   □ 防止再次發生
```

---

## 9. 監控與告警

### 為什麼需要監控？

```
沒有監控的情況：

用戶：「你們網站掛了！」
你：「蛤？什麼時候掛的？」
用戶：「不知道，反正打不開」
你：「...」

有監控的情況：

警報：「API 回應時間超過 5 秒」
你：（立即收到通知）
你：（開始調查）
（用戶還沒發現問題就修好了）
```

### 推薦的免費監控工具

#### 1. UptimeRobot - 網站存活監控

```
功能：每 5 分鐘檢查網站是否活著
價格：免費 50 個監控點
網址：https://uptimerobot.com

設定步驟：
1. 註冊帳號
2. Add New Monitor
3. 選擇 HTTP(s)
4. 輸入網址
5. 設定通知方式（Email、Slack、Discord）
```

#### 2. Sentry - 錯誤追蹤

```
功能：收集和分析程式錯誤
價格：免費 5K 錯誤/月
網址：https://sentry.io

安裝（React）：
$ npm install @sentry/react

// main.tsx
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  environment: import.meta.env.MODE,
})
```

#### 3. Vercel Analytics - 效能監控

```
功能：追蹤 Core Web Vitals
價格：Vercel 專案免費
網址：Vercel Dashboard → Analytics

自動追蹤：
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
```

#### 4. Better Stack (前 Logtail) - 日誌管理

```
功能：集中管理和搜尋日誌
價格：免費 1GB/月
網址：https://betterstack.com

整合：
大多數平台可以直接串接
```

### 監控 Dashboard 範例

```
┌─────────────────────────────────────────────────────────────────┐
│  Production Status                                    🟢 正常   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  服務狀態                                                       │
│  ─────────                                                      │
│  🟢 前端 (myapp.com)           正常    回應: 45ms              │
│  🟢 後端 (api.myapp.com)       正常    回應: 120ms             │
│  🟢 資料庫                     正常    連線: 5/20              │
│                                                                 │
│  最近 24 小時                                                   │
│  ─────────────                                                  │
│  請求數: 15,234                                                 │
│  錯誤數: 12 (0.08%)                                            │
│  平均回應: 89ms                                                 │
│                                                                 │
│  警報                                                           │
│  ─────                                                          │
│  ⚠️ 10:30 - API 回應時間偶爾超過 500ms                          │
│  ✅ 昨天 - 全天正常                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 設定告警規則

```
建議設定的警報：

1. 網站掛了
   觸發條件：連續 2 次檢查失敗
   嚴重程度：🔴 Critical
   通知方式：簡訊 + 電話 + Slack

2. API 回應變慢
   觸發條件：P95 回應時間 > 1 秒
   嚴重程度：🟡 Warning
   通知方式：Slack + Email

3. 錯誤率上升
   觸發條件：錯誤率 > 1%
   嚴重程度：🟡 Warning
   通知方式：Slack

4. 資料庫連線滿了
   觸發條件：連線數 > 80%
   嚴重程度：🟡 Warning
   通知方式：Slack + Email

5. 磁碟空間不足
   觸發條件：使用率 > 80%
   嚴重程度：🟡 Warning
   通知方式：Email
```

---

## 10. 學習路線圖

### 完整學習路徑

```
                                    你現在在這裡
                                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Level 1: 基礎部署 ✅                                           │
│  ──────────────────                                            │
│  □ 會用 Vercel/Netlify 部署前端                                 │
│  □ 會用 Render/Railway 部署後端                                 │
│  □ 理解環境變數的概念                                           │
│  □ 會設定自訂網域                                               │
│  □ 理解 CORS 並能解決問題                                       │
│                                                                 │
│  預計時間：1-2 週                                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Level 2: 進階部署                                              │
│  ──────────────────                                            │
│  □ 學會 Docker 容器化                                           │
│  □ 理解 CI/CD Pipeline                                         │
│  □ 會看 Logs 排查問題                                           │
│  □ 設定監控和告警                                               │
│  □ 理解快取策略                                                 │
│                                                                 │
│  預計時間：2-4 週                                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Level 3: 雲端平台                                              │
│  ──────────────────                                            │
│  □ 學 AWS 或 GCP 基礎服務                                       │
│  □ 理解 VPC、Security Group、IAM                               │
│  □ 會用 managed 服務（RDS、Cloud SQL）                         │
│  □ 理解負載平衡和自動擴展                                       │
│  □ 學習 Infrastructure as Code (Terraform)                     │
│                                                                 │
│  預計時間：1-3 個月                                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Level 4: DevOps / SRE                                         │
│  ─────────────────────                                         │
│  □ Kubernetes 容器編排                                          │
│  □ 進階監控（Prometheus、Grafana）                              │
│  □ 日誌聚合（ELK Stack）                                        │
│  □ 服務網格（Service Mesh）                                     │
│  □ 混沌工程                                                     │
│                                                                 │
│  預計時間：持續學習                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 每個 Level 的學習資源

#### Level 1: 基礎部署
- [Vercel 官方教學](https://vercel.com/docs)
- [Render 官方教學](https://render.com/docs)
- [freeCodeCamp 部署教學](https://www.freecodecamp.org/)

#### Level 2: 進階部署
- [Docker 官方入門](https://docs.docker.com/get-started/)
- [GitHub Actions 教學](https://docs.github.com/en/actions)
- [The Twelve-Factor App](https://12factor.net/)

#### Level 3: 雲端平台
- [AWS 免費培訓](https://aws.amazon.com/training/digital/)
- [GCP 免費課程](https://cloud.google.com/training)
- [Terraform 入門](https://learn.hashicorp.com/terraform)

#### Level 4: DevOps
- [Kubernetes 官方教學](https://kubernetes.io/docs/tutorials/)
- [Site Reliability Engineering 書籍](https://sre.google/books/)
- [DevOps Roadmap](https://roadmap.sh/devops)

### 實作建議

```
最好的學習方式 = 實際做專案

建議路徑：
1. 部署一個 Side Project（用免費方案）
2. 設定自訂網域
3. 加上 CI/CD（GitHub Actions）
4. 設定監控（UptimeRobot + Sentry）
5. 練習處理問題（故意弄壞再修好）
6. 寫文章記錄學到的東西（強化記憶）
```

---

## 總結

### 核心觀念

```
1. 環境隔離很重要
   開發、測試、正式環境要分開

2. 機密不能放前端
   前端程式碼 = 公開資訊

3. 監控比你想的重要
   出問題時，你要比用戶先知道

4. 備份是保險
   資料掉了是真的掉了

5. 從簡單開始
   先用 Vercel/Render，之後再學 AWS
```

### 快速參考

```
部署出問題？
├── 頁面空白 → 看 Console 錯誤、檢查 base URL
├── API 失敗 → 看 Network tab、檢查 CORS
├── 網站掛了 → 看 Logs、檢查環境變數
└── 很慢 → 檢查 bundle 大小、API 回應時間

要記住的網址
├── 監控：uptimerobot.com
├── 錯誤追蹤：sentry.io
├── DNS 檢查：dnschecker.org
└── 效能測試：pagespeed.web.dev
```

---

## 附錄：快速指令備忘

```bash
# 本地測試 production build
npm run build && npm run preview

# 檢查安全漏洞
npm audit

# 檢查過時套件
npm outdated

# 檢查 bundle 大小
npx source-map-explorer dist/assets/*.js

# 檢查 DNS
dig myapp.com

# 看 Vercel logs
vercel logs

# 看 Railway logs
railway logs

# 產生安全的 secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
