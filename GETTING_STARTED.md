# Haude V2 快速開始指南

本文件將引導你完成 haude-v2 專案的設定和啟動。

---

## 目錄

- [前置需求](#前置需求)
- [步驟 1：設定環境變數](#步驟-1設定環境變數)
- [步驟 2：設定 Supabase 資料庫](#步驟-2設定-supabase-資料庫)
- [步驟 3：執行資料庫遷移](#步驟-3執行資料庫遷移)
- [步驟 4：啟動開發伺服器](#步驟-4啟動開發伺服器)
- [步驟 5：測試 API](#步驟-5測試-api)
- [步驟 6：測試前端](#步驟-6測試前端)
- [常見問題](#常見問題)
- [部署到 AWS](#部署到-aws)

---

## 前置需求

確保你的電腦已安裝以下工具：

| 工具 | 版本 | 檢查指令 |
|------|------|---------|
| Node.js | >= 20 | `node -v` |
| npm | >= 10 | `npm -v` |
| Git | 任意 | `git --version` |
| Docker (可選) | 任意 | `docker -v` |

---

## 步驟 1：設定環境變數

### 1.1 複製環境變數範例

```bash
# 前端
cp /home/aim840912/projects/haude-v2-frontend/.env.example /home/aim840912/projects/haude-v2-frontend/.env

# 後端
cp /home/aim840912/projects/haude-v2-backend/.env.example /home/aim840912/projects/haude-v2-backend/.env
```

### 1.2 編輯前端環境變數

編輯 `haude-v2-frontend/.env`：

```env
# Supabase（步驟 2 會取得）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 後端 API
VITE_API_URL=http://localhost:3001
```

### 1.3 編輯後端環境變數

編輯 `haude-v2-backend/.env`：

```env
# Database（步驟 2 會取得）
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# JWT（請更換為安全的隨機字串）
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d

# App
PORT=3001
FRONTEND_URL=http://localhost:5173
```

---

## 步驟 2：設定 Supabase 資料庫

### 2.1 建立 Supabase 專案

1. 前往 [supabase.com](https://supabase.com) 並登入
2. 點擊 **New Project**
3. 填寫專案資訊：
   - **Name**: `haude-v2`
   - **Database Password**: 設定一個強密碼（請記住！）
   - **Region**: 選擇離你最近的區域（建議：Singapore 或 Tokyo）
4. 點擊 **Create new project**
5. 等待約 2 分鐘讓專案建立完成

### 2.2 取得連線資訊

1. 在 Supabase Dashboard 左側選單點擊 **Settings** (齒輪圖示)
2. 點擊 **Database**
3. 找到 **Connection string** 區塊
4. 選擇 **URI** 標籤
5. 複製連線字串，格式如下：

```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

6. 將 `[YOUR-PASSWORD]` 替換為你設定的資料庫密碼

### 2.3 取得 API Keys

1. 在左側選單點擊 **Settings** → **API**
2. 複製以下資訊：
   - **Project URL**: 貼到前端的 `VITE_SUPABASE_URL`
   - **anon public key**: 貼到前端的 `VITE_SUPABASE_ANON_KEY`

### 2.4 更新環境變數

將取得的資訊更新到 `.env` 檔案中。

---

## 步驟 3：執行資料庫遷移

### 3.1 生成 Prisma Client

```bash
cd /home/aim840912/projects/haude-v2-backend
npx prisma generate
```

### 3.2 執行遷移

```bash
npx prisma migrate dev --name init
```

這會：
- 建立 `users` 資料表
- 建立 `Role` enum (USER, ADMIN)

### 3.3 驗證資料庫

```bash
npx prisma studio
```

這會開啟 Prisma Studio（資料庫管理介面），確認資料表已建立。

---

## 步驟 4：啟動開發伺服器

### 方式 A：分開啟動（推薦開發時使用）

**Terminal 1 - 後端：**

```bash
cd /home/aim840912/projects/haude-v2-backend
npm run start:dev
```

預期輸出：
```
🚀 Application is running on: http://localhost:3001
📚 Swagger documentation: http://localhost:3001/api
```

**Terminal 2 - 前端：**

```bash
cd /home/aim840912/projects/haude-v2-frontend
npm run dev
```

預期輸出：
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### 方式 B：Docker 一鍵啟動

```bash
cd /home/aim840912/projects/haude-v2
docker-compose up -d
```

存取位置：
- 前端: http://localhost:3000
- 後端: http://localhost:3001

---

## 步驟 5：測試 API

### 5.1 開啟 Swagger 文檔

在瀏覽器開啟：http://localhost:3001/api

### 5.2 測試健康檢查

```bash
curl http://localhost:3001/health
```

預期回應：
```json
{
  "status": "ok",
  "timestamp": "2025-12-11T...",
  "uptime": 123.456
}
```

### 5.3 測試註冊 API

在 Swagger 介面中：

1. 展開 **Auth** 區塊
2. 點擊 `POST /auth/register`
3. 點擊 **Try it out**
4. 輸入以下 JSON：

```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

5. 點擊 **Execute**
6. 確認回應狀態碼為 `201`

### 5.4 測試登入 API

1. 點擊 `POST /auth/login`
2. 輸入剛才註冊的帳號密碼
3. 確認回應包含 `accessToken`

### 5.5 測試需要認證的 API

1. 複製登入回應中的 `accessToken`
2. 點擊 Swagger 頁面右上角的 **Authorize** 按鈕
3. 輸入：`Bearer <your-token>`（注意要加 `Bearer ` 前綴）
4. 點擊 **Authorize**
5. 現在可以測試 `GET /auth/me` 和 Users 相關 API

---

## 步驟 6：測試前端

### 6.1 開啟前端

在瀏覽器開啟：http://localhost:5173

### 6.2 測試頁面

1. **首頁** - 確認可以看到歡迎頁面
2. **註冊** - 點擊註冊，建立新帳號
3. **登入** - 使用剛建立的帳號登入
4. **Dashboard** - 確認登入後可以看到 Dashboard

### 6.3 確認認證流程

1. 登入後重新整理頁面，確認仍保持登入狀態
2. 點擊登出，確認被導向登入頁面
3. 嘗試直接訪問 `/dashboard`，確認被重定向到登入頁面

---

## 常見問題

### Q1: Prisma migrate 失敗

**錯誤訊息：** `Error: P1001: Can't reach database server`

**解決方案：**
1. 確認 `DATABASE_URL` 格式正確
2. 確認 Supabase 專案已啟動
3. 確認密碼中的特殊字元已 URL encode

```bash
# 如果密碼包含特殊字元，需要 encode
# 例如：password = "my@pass#word"
# encode 後：my%40pass%23word
```

### Q2: 前端無法連接後端

**錯誤訊息：** `Network Error` 或 `CORS error`

**解決方案：**
1. 確認後端正在運行（`npm run start:dev`）
2. 確認 `VITE_API_URL` 設定正確
3. 確認後端的 `FRONTEND_URL` 設定正確

### Q3: JWT 驗證失敗

**錯誤訊息：** `401 Unauthorized`

**解決方案：**
1. 確認前後端的 `JWT_SECRET` 一致（如果使用同一套認證）
2. 確認 Token 未過期
3. 確認 Authorization header 格式：`Bearer <token>`

### Q4: Tailwind CSS 不生效

**解決方案：**
1. 確認 `tailwind.config.js` 的 `content` 路徑正確
2. 確認 `index.css` 包含 Tailwind directives
3. 重新啟動 Vite dev server

---

## 部署到 AWS

### 選項 1：AWS App Runner（最簡單）

適合：快速部署，自動擴展

```bash
# 1. 安裝 AWS CLI 和 Copilot
brew install aws-cli
brew install aws/tap/copilot-cli

# 2. 配置 AWS 認證
aws configure

# 3. 初始化並部署後端
cd haude-v2-backend
copilot init

# 4. 初始化並部署前端
cd haude-v2-frontend
copilot init
```

### 選項 2：AWS ECS + Fargate

適合：需要更多控制，生產環境

1. 建立 ECR Repository
2. 推送 Docker Image
3. 建立 ECS Cluster
4. 建立 Task Definition
5. 建立 Service

### 選項 3：AWS EC2

適合：需要完全控制，有 DevOps 經驗

1. 建立 EC2 Instance (建議 t3.small 以上)
2. 安裝 Docker 和 Docker Compose
3. 設定 Security Group（開放 80, 443, 3001 端口）
4. 使用 docker-compose 部署

### 資料庫選項

| 選項 | 優點 | 缺點 |
|------|------|------|
| **Supabase** | 免費方案慷慨、功能完整 | 非 AWS 原生 |
| **AWS RDS** | AWS 原生、穩定 | 成本較高 |
| **AWS Aurora Serverless** | 自動擴展 | 配置較複雜 |

### 推薦的 AWS 架構

```
                    ┌─────────────┐
                    │   Route 53  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │ CloudFront  │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌─────▼─────┐    ┌─────▼─────┐
    │   S3    │      │    ALB    │    │    ALB    │
    │(Frontend)│     │ (Backend) │    │ (Backend) │
    └─────────┘      └─────┬─────┘    └─────┬─────┘
                           │                │
                    ┌──────▼──────┐  ┌──────▼──────┐
                    │ ECS Fargate │  │ ECS Fargate │
                    │  (NestJS)   │  │  (NestJS)   │
                    └──────┬──────┘  └──────┬──────┘
                           │                │
                    ┌──────▼────────────────▼──────┐
                    │        Supabase / RDS        │
                    └─────────────────────────────┘
```

---

## 下一步建議

完成基礎設定後，你可以：

1. **添加更多功能模組**
   - 產品管理
   - 訂單系統
   - 檔案上傳

2. **強化安全性**
   - 添加 Rate Limiting
   - 實作 Refresh Token
   - 添加 2FA

3. **改善開發體驗**
   - 設定 CI/CD (GitHub Actions)
   - 添加測試覆蓋率
   - 設定 Pre-commit Hooks

4. **優化效能**
   - 添加 Redis 快取
   - 實作資料庫索引
   - 配置 CDN

---

*最後更新：2025 年 12 月*
