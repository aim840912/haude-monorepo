# React 前端部署完整指南

> 🎓 **適合對象**：第一次部署前端的開發者
>
> 📚 **你會學到**：前端部署概念、平台選擇、實際部署步驟

---

## 目錄

1. [前端部署 vs 後端部署](#1-前端部署-vs-後端部署)
2. [部署前準備](#2-部署前準備)
3. [平台比較與選擇](#3-平台比較與選擇)
4. [Vercel 部署教學（推薦）](#4-vercel-部署教學推薦)
5. [Netlify 部署教學](#5-netlify-部署教學)
6. [Cloudflare Pages 部署教學](#6-cloudflare-pages-部署教學)
7. [GitHub Pages 部署教學（免費）](#7-github-pages-部署教學免費)
8. [Next.js vs 純 React 部署差異](#8-nextjs-vs-純-react-部署差異)
9. [常見問題 FAQ](#9-常見問題-faq)

---

## 1. 前端部署 vs 後端部署

### 關鍵差異

| 特性 | 前端部署 | 後端部署 |
|------|----------|----------|
| **產出物** | 靜態檔案 (HTML/CSS/JS) | 持續運行的伺服器 |
| **需要伺服器** | ❌ 只需 CDN | ✅ 需要運算資源 |
| **費用** | 大多免費 | 通常需付費 |
| **複雜度** | ⭐ 簡單 | ⭐⭐⭐ 較複雜 |
| **冷啟動** | ❌ 沒有這問題 | ⚠️ 免費方案常有 |

### 前端部署原理

```
你的 React 程式碼
        ↓
   npm run build
        ↓
   產生 dist/ 或 build/ 資料夾
   (純靜態檔案：index.html, main.js, style.css)
        ↓
   上傳到 CDN
        ↓
   全世界都能透過網址存取
```

### 為什麼前端部署比較簡單？

```
後端部署：需要一台 24 小時運行的電腦執行你的程式
前端部署：只要把檔案放到網路上讓人下載就好
```

---

## 2. 部署前準備

### 2.1 確保專案能正常 Build

```bash
# 建置專案
npm run build

# 本地預覽 production 版本
npm run preview   # Vite
# 或
npx serve build   # Create React App
```

### 2.2 檢查環境變數

前端的環境變數會被打包進程式碼，所以：

```bash
# ⚠️ 絕對不要放機密資料！
# 前端環境變數會暴露給所有使用者

# ✅ 可以放的：
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App

# ❌ 不能放的：
VITE_SECRET_KEY=xxx        # 機密！
VITE_DATABASE_URL=xxx      # 這是後端用的！
```

> 💡 **命名規則**：
> - Vite：必須用 `VITE_` 開頭
> - Create React App：必須用 `REACT_APP_` 開頭
> - Next.js：用 `NEXT_PUBLIC_` 開頭（公開）或不加前綴（私密/伺服器端）

### 2.3 設定正確的 Base URL

如果不是部署在網域根目錄，需要設定 base：

```typescript
// vite.config.ts
export default defineConfig({
  base: '/my-project/',  // 如果部署在 https://user.github.io/my-project/
})
```

### 2.4 檢查清單

- [ ] `npm run build` 成功
- [ ] `npm run preview` 本地預覽正常
- [ ] 環境變數不包含機密資訊
- [ ] 路由在 production 正常運作
- [ ] 圖片和靜態資源正確載入

---

## 3. 平台比較與選擇

### 快速選擇指南

| 你的情況 | 推薦平台 |
|----------|----------|
| Next.js 專案 | **Vercel**（官方支援最好） |
| 純 React (Vite/CRA) | **Vercel** 或 **Netlify** |
| 想要最快的速度 | **Cloudflare Pages** |
| 完全免費 + 開源專案 | **GitHub Pages** |
| 需要邊緣函數 | **Vercel** 或 **Cloudflare** |

### 詳細比較表

| 特性 | Vercel | Netlify | Cloudflare Pages | GitHub Pages |
|------|--------|---------|------------------|--------------|
| **難度** | ⭐ 超簡單 | ⭐ 超簡單 | ⭐ 簡單 | ⭐⭐ 中等 |
| **免費方案** | ✅ 很夠用 | ✅ 很夠用 | ✅ 非常大方 | ✅ 完全免費 |
| **Build 分鐘數/月** | 6000 | 300 | 500 | 無限* |
| **頻寬/月** | 100 GB | 100 GB | 無限 | 100 GB |
| **自訂網域** | ✅ 免費 | ✅ 免費 | ✅ 免費 | ✅ 免費 |
| **HTTPS** | ✅ 自動 | ✅ 自動 | ✅ 自動 | ✅ 自動 |
| **Preview 部署** | ✅ 每個 PR | ✅ 每個 PR | ✅ 每個 PR | ❌ 無 |
| **Edge Functions** | ✅ | ✅ | ✅ | ❌ |
| **Next.js SSR** | ✅ 最佳 | ⚠️ 有限 | ⚠️ 有限 | ❌ 不支援 |
| **全球 CDN** | ✅ | ✅ | ✅ 最快 | ✅ |

### 什麼是 Preview 部署？

每次開 Pull Request，平台會自動部署一個預覽版本：

```
PR #42: Add dark mode
  ↓ 自動部署
https://my-app-pr-42.vercel.app
  ↓
團隊可以在合併前預覽和測試
```

這是 Vercel/Netlify 的殺手級功能！

---

## 4. Vercel 部署教學（推薦）

### 為什麼選 Vercel？

- Next.js 的親爸爸（Vercel 開發的）
- 部署體驗業界最佳
- 每個 PR 自動 Preview
- 免費方案非常夠用

### 方法 A：網頁介面（最簡單）

1. 前往 [vercel.com](https://vercel.com)
2. 點擊 **Sign Up** → 用 GitHub 登入
3. 點擊 **Add New...** → **Project**
4. 選擇你的 GitHub Repo
5. Vercel 會自動偵測框架，直接點 **Deploy**
6. 等待 1-2 分鐘，完成！

### 方法 B：CLI

```bash
# 安裝 Vercel CLI
npm install -g vercel

# 登入
vercel login

# 在專案目錄執行
cd my-react-app
vercel

# 第一次會問你一些問題，之後直接 deploy
vercel --prod
```

### 設定環境變數

**網頁介面**：
1. Project Settings → Environment Variables
2. 加入你的變數（記得選擇 Production/Preview/Development）

**CLI**：
```bash
vercel env add VITE_API_URL
```

### 設定自訂網域

1. Project Settings → Domains
2. 輸入你的網域（如 `myapp.com`）
3. 到你的 DNS 供應商加入 CNAME 記錄
4. 等待 DNS 生效（通常幾分鐘）

---

## 5. Netlify 部署教學

### 為什麼選 Netlify？

- 介面友善，功能完整
- 表單處理功能（不用寫後端）
- 很多實用的 Add-ons

### 部署步驟

1. 前往 [netlify.com](https://netlify.com)
2. GitHub 登入
3. **Add new site** → **Import an existing project**
4. 選擇 GitHub Repo
5. 設定 Build 指令：

| 設定 | Vite | Create React App | Next.js |
|------|------|------------------|---------|
| Build command | `npm run build` | `npm run build` | `npm run build` |
| Publish directory | `dist` | `build` | `.next` |

6. 點擊 **Deploy site**

### netlify.toml 設定檔（可選）

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

# SPA 路由支援
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# 環境變數
[build.environment]
  NODE_VERSION = "20"
```

### 設定環境變數

Site settings → Environment variables → Add a variable

---

## 6. Cloudflare Pages 部署教學

### 為什麼選 Cloudflare Pages？

- **最快的 CDN**：Cloudflare 本來就是 CDN 巨頭
- **無限頻寬**：免費方案沒有流量限制
- **邊緣運算**：Workers 整合

### 部署步驟

1. 前往 [pages.cloudflare.com](https://pages.cloudflare.com)
2. 登入 Cloudflare 帳號
3. **Create a project** → **Connect to Git**
4. 選擇 GitHub Repo
5. 設定 Build：

| 框架 | Build command | Build output |
|------|---------------|--------------|
| Vite | `npm run build` | `dist` |
| CRA | `npm run build` | `build` |
| Next.js | `npx @cloudflare/next-on-pages` | `.vercel/output/static` |

6. 點擊 **Save and Deploy**

### wrangler CLI

```bash
# 安裝
npm install -g wrangler

# 登入
wrangler login

# 部署
wrangler pages deploy dist
```

---

## 7. GitHub Pages 部署教學（免費）

### 為什麼選 GitHub Pages？

- 完全免費，沒有任何限制
- 適合開源專案、個人作品集
- 直接從 GitHub Repo 部署

### 限制

- ❌ 只能部署靜態網站（不支援 SSR）
- ❌ 沒有 Preview 部署
- ⚠️ 公開 Repo 才免費（私有需 Pro）

### 方法 A：GitHub Actions（推薦）

建立 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist  # Vite 用 dist，CRA 用 build

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 方法 B：gh-pages 套件

```bash
# 安裝
npm install -D gh-pages

# package.json 加入 script
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}

# 部署
npm run deploy
```

### 設定 Base URL

```typescript
// vite.config.ts
export default defineConfig({
  base: '/your-repo-name/',  // 重要！
})
```

### 啟用 GitHub Pages

1. Repo Settings → Pages
2. Source 選擇 **GitHub Actions**
3. 等待 Actions 執行完成

---

## 8. Next.js vs 純 React 部署差異

### 純 React (Vite/CRA) - 靜態部署

```
特性：
- 純靜態檔案 (HTML/JS/CSS)
- 可以部署到任何平台
- 不需要伺服器
- 所有平台都支援
```

### Next.js - 看你用什麼功能

| Next.js 功能 | 部署方式 | 支援平台 |
|-------------|----------|----------|
| 純靜態 (`next export`) | 靜態 | 全部 |
| SSR / API Routes | 需要伺服器 | Vercel, Netlify, 自架 |
| ISR / RSC | 需要特殊支援 | Vercel（最佳）, Netlify |

### Next.js 靜態導出

如果你的 Next.js 不需要 SSR：

```typescript
// next.config.js
module.exports = {
  output: 'export',  // 產生純靜態檔案
}
```

這樣就能部署到任何平台（包括 GitHub Pages）。

### 部署平台對 Next.js 的支援程度

| 平台 | SSR | API Routes | ISR | App Router |
|------|-----|------------|-----|------------|
| **Vercel** | ✅ 完美 | ✅ | ✅ | ✅ |
| **Netlify** | ✅ | ✅ | ⚠️ 有限 | ⚠️ |
| **Cloudflare** | ⚠️ 需設定 | ⚠️ | ❌ | ⚠️ |
| **GitHub Pages** | ❌ | ❌ | ❌ | ❌ |

---

## 9. 常見問題 FAQ

### Q: 部署後頁面空白？

**檢查順序**：
1. 打開瀏覽器 DevTools → Console，看錯誤訊息
2. 檢查 base URL 設定是否正確
3. 檢查 build 輸出的資料夾是否正確

```typescript
// vite.config.ts - 常見錯誤
export default defineConfig({
  base: '/my-repo/',  // 確保斜線正確
})
```

### Q: 路由 404 錯誤？

SPA 需要設定重定向，否則直接訪問 `/about` 會 404：

**Netlify** - `public/_redirects`：
```
/*    /index.html   200
```

**Vercel** - `vercel.json`：
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Q: 圖片/資源載入失敗？

```typescript
// ❌ 錯誤：絕對路徑
<img src="/images/logo.png" />

// ✅ 正確：使用 import
import logo from './assets/logo.png'
<img src={logo} />

// ✅ 或放在 public 資料夾並使用 base URL
<img src={`${import.meta.env.BASE_URL}images/logo.png`} />
```

### Q: 環境變數沒生效？

1. 確認變數名稱前綴正確：
   - Vite: `VITE_`
   - CRA: `REACT_APP_`
   - Next.js: `NEXT_PUBLIC_`

2. 環境變數改變後需要重新 build

3. 在平台上設定的變數要選對環境（Production/Preview）

### Q: Build 失敗？

```bash
# 本地先測試
npm run build

# 常見問題：
# 1. TypeScript 錯誤 - 修復類型問題
# 2. ESLint 錯誤 - 修復或暫時停用
# 3. 依賴問題 - 刪除 node_modules 重裝
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Q: 如何設定 HTTPS？

所有推薦的平台都自動提供免費 HTTPS：
- Vercel: 自動
- Netlify: 自動
- Cloudflare: 自動
- GitHub Pages: 自動

### Q: 部署後更新很慢？

可能是 CDN 快取問題：

```bash
# Vercel - 清除快取
vercel --force

# 或在平台 Dashboard 找 "Clear Cache" 選項
```

### Q: 免費方案夠用嗎？

| 情況 | 建議 |
|------|------|
| 個人專案/作品集 | ✅ 完全夠用 |
| Side Project | ✅ 夠用 |
| 小型商業網站 | ✅ 通常夠用 |
| 高流量網站 | ⚠️ 可能需升級 |

---

## 總結

### 新手建議路線

```
React 純靜態 → Vercel 或 Netlify
     ↓
Next.js SSR → Vercel（最省心）
     ↓
想省錢/開源 → GitHub Pages
     ↓
追求速度 → Cloudflare Pages
```

### 部署前檢查清單

- [ ] `npm run build` 本地成功
- [ ] `npm run preview` 預覽正常
- [ ] 環境變數已設定（且不含機密）
- [ ] Base URL 設定正確
- [ ] 路由在 production 正常
- [ ] 圖片資源正確載入

### 部署後檢查清單

- [ ] 首頁正常顯示
- [ ] 路由跳轉正常（直接訪問也正常）
- [ ] API 呼叫成功
- [ ] HTTPS 正常
- [ ] 自訂網域生效（如有設定）

---

## 延伸學習

- [Vercel 官方文件](https://vercel.com/docs)
- [Netlify 官方文件](https://docs.netlify.com/)
- [Cloudflare Pages 文件](https://developers.cloudflare.com/pages/)
- [GitHub Pages 文件](https://docs.github.com/en/pages)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
