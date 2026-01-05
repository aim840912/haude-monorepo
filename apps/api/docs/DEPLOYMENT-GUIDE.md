# 後端部署完整指南

> 🎓 **適合對象**：第一次部署後端的開發者
>
> 📚 **你會學到**：什麼是部署、如何選擇平台、實際部署步驟

---

## 目錄

1. [部署是什麼？](#1-部署是什麼)
2. [部署前準備](#2-部署前準備)
3. [平台比較與選擇](#3-平台比較與選擇)
4. [Render 部署教學（推薦新手）](#4-render-部署教學推薦新手)
5. [Railway 部署教學](#5-railway-部署教學)
6. [Docker 部署（進階）](#6-docker-部署進階)
7. [AWS/GCP 企業級部署（進階）](#7-awsgcp-企業級部署進階)
8. [常見問題 FAQ](#8-常見問題-faq)

---

## 1. 部署是什麼？

### 簡單比喻

| 開發階段 | 部署後 |
|----------|--------|
| 在自己電腦寫程式 | 程式放到雲端伺服器 |
| `localhost:3001` | `api.yourapp.com` |
| 只有你能用 | 全世界都能用 |
| 電腦關機就沒了 | 24 小時運行 |

### 部署架構圖

```
使用者 (瀏覽器/App)
        ↓
   [網域] api.yourapp.com
        ↓
   [伺服器] 運行 NestJS
        ↓
   [資料庫] PostgreSQL
```

---

## 2. 部署前準備

### 2.1 確保程式能正常 Build

```bash
# 在本地測試 production build
npm run build

# 測試 production 模式啟動
npm run start:prod
```

### 2.2 準備環境變數

建立 `.env.example` 讓團隊知道需要哪些變數：

```env
# 資料庫連線
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT 設定
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# 應用設定
NODE_ENV=production
PORT=3001
```

> ⚠️ **重要**：`.env` 檔案絕對不能上傳到 GitHub！

### 2.3 確保 Prisma 設定正確

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2.4 檢查清單

- [ ] `npm run build` 成功
- [ ] `npm run lint` 無錯誤
- [ ] `.gitignore` 包含 `.env`
- [ ] 有 `.env.example` 範本
- [ ] `package.json` 有 `start:prod` 指令

---

## 3. 平台比較與選擇

### 快速選擇指南

| 你的情況 | 推薦平台 |
|----------|----------|
| 第一次部署，想快速上線 | **Render** |
| 想要最好的開發體驗 | **Railway** |
| 需要免費但不介意冷啟動 | **Render Free** |
| 準備長期運營的專案 | **Railway / DigitalOcean** |
| 公司專案或大流量 | **AWS / GCP** |

### 詳細比較表

| 特性 | Render | Railway | Fly.io | DigitalOcean | AWS | GCP |
|------|--------|---------|--------|--------------|-----|-----|
| **難度** | ⭐ 簡單 | ⭐ 簡單 | ⭐⭐ 中等 | ⭐⭐ 中等 | ⭐⭐⭐⭐ 困難 | ⭐⭐⭐ 中高 |
| **免費方案** | ✅ 有 | ⚠️ $5額度 | ✅ 有限 | ❌ 無 | ⚠️ 12個月免費層 | ⚠️ $300 額度 |
| **最低月費** | $0 | ~$5 | $0 | $5 | ~$15 | ~$10 |
| **冷啟動** | 15分鐘休眠 | 無 | 無 | 無 | 無 | 看服務 |
| **資料庫** | ✅ 內建 | ✅ 內建 | ❌ 需自建 | ✅ 內建 | ✅ RDS | ✅ Cloud SQL |
| **自動部署** | ✅ GitHub | ✅ GitHub | ✅ GitHub | ✅ GitHub | ⚠️ 需設定 | ⚠️ 需設定 |
| **自訂網域** | ✅ 免費 | ✅ 免費 | ✅ 免費 | ✅ 免費 | ✅ Route53 | ✅ Cloud DNS |
| **學習曲線** | 30分鐘 | 30分鐘 | 2小時 | 4小時 | 1-2週 | 1週 |
| **適合對象** | 新手 | 新手 | 中級 | 中級 | 企業/進階 | 企業/進階 |

### 什麼是「冷啟動」？

免費方案通常會在一段時間沒人用時「休眠」省資源。
當有人訪問時，需要 10-30 秒「喚醒」，這就是冷啟動。

```
正常請求：使用者 → 伺服器 → 回應（200ms）
冷啟動：  使用者 → 喚醒伺服器 → 回應（10-30秒）
```

---

## 4. Render 部署教學（推薦新手）

### 為什麼選 Render？

- 介面簡單直覺
- 有免費方案可以練習
- 內建 PostgreSQL
- 從 GitHub 自動部署

### 步驟 1：準備 GitHub Repo

確保你的程式碼已經 push 到 GitHub：

```bash
git add .
git commit -m "準備部署"
git push origin main
```

### 步驟 2：註冊 Render

1. 前往 [render.com](https://render.com)
2. 使用 GitHub 帳號註冊

### 步驟 3：建立 PostgreSQL 資料庫

1. Dashboard → **New +** → **PostgreSQL**
2. 設定：
   - Name: `haude-db`
   - Region: `Singapore` (離台灣近)
   - Plan: `Free` (練習用) 或 `Starter $7/月` (正式用)
3. 點擊 **Create Database**
4. 記下 **Internal Database URL**（等等會用到）

### 步驟 4：建立 Web Service

1. Dashboard → **New +** → **Web Service**
2. 連接你的 GitHub Repo
3. 設定：

| 欄位 | 值 |
|------|-----|
| Name | `haude-v2-backend` |
| Region | `Singapore` |
| Branch | `main` |
| Runtime | `Node` |
| Build Command | `npm install && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && npm run start:prod` |

### 步驟 5：設定環境變數

在 **Environment** 區塊加入：

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (貼上步驟3的 Internal Database URL) |
| `JWT_SECRET` | (自己產生一個隨機字串) |
| `NODE_ENV` | `production` |

> 💡 **產生 JWT_SECRET**：
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 步驟 6：部署！

點擊 **Create Web Service**，等待部署完成（約 3-5 分鐘）

### 步驟 7：測試

部署完成後，你會得到一個網址如：
`https://haude-v2-backend.onrender.com`

測試健康檢查：
```bash
curl https://haude-v2-backend.onrender.com/health
```

---

## 5. Railway 部署教學

### 為什麼選 Railway？

- 開發體驗最好
- 介面現代化
- 部署速度快
- 沒有冷啟動

### 方法 A：網頁介面

1. 前往 [railway.app](https://railway.app)
2. GitHub 登入
3. **New Project** → **Deploy from GitHub repo**
4. 選擇你的 repo
5. 加入 PostgreSQL：**New** → **Database** → **PostgreSQL**
6. 設定環境變數（同 Render）

### 方法 B：CLI（推薦）

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入
railway login

# 在專案目錄初始化
cd haude-v2-backend
railway init

# 加入 PostgreSQL
railway add --database postgres

# 部署
railway up

# 查看網址
railway domain
```

### 設定環境變數

```bash
# 設定 JWT_SECRET
railway variables set JWT_SECRET=your-secret-key

# 查看所有變數
railway variables
```

---

## 6. Docker 部署（進階）

如果你想學習容器化部署，這是業界標準做法。

### 建立 Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 安裝依賴
COPY package*.json ./
RUN npm ci

# 複製原始碼並建置
COPY . .
RUN npx prisma generate
RUN npm run build

# 生產階段
FROM node:20-alpine AS production

WORKDIR /app

# 只複製必要檔案
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# 設定環境
ENV NODE_ENV=production
EXPOSE 3001

# 啟動指令
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
```

### 建立 .dockerignore

```
node_modules
dist
.env
.git
*.md
```

### 本地測試

```bash
# 建置 image
docker build -t haude-backend .

# 執行容器
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your-secret" \
  haude-backend
```

### 部署到 Fly.io

```bash
# 安裝 flyctl
curl -L https://fly.io/install.sh | sh

# 登入
fly auth login

# 初始化（會自動偵測 Dockerfile）
fly launch

# 設定 secrets
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="your-secret"

# 部署
fly deploy
```

---

## 7. AWS/GCP 企業級部署（進階）

> ⚠️ **給新手的話**：如果你剛開始學部署，建議先跳過這章，從 Render/Railway 開始。
> 等你熟悉基本部署流程後，再回來學這些。

### 為什麼 AWS/GCP 比較難？

| 簡單平台 (Render/Railway) | AWS/GCP |
|---------------------------|---------|
| 一個服務搞定所有事 | 需要組合 5-10 個服務 |
| 點幾下就部署完成 | 要學 IAM、VPC、Security Group... |
| 價格透明（$7/月） | 帳單像天書，不小心就超支 |
| 出錯有明確提示 | Debug 要翻一堆 CloudWatch Logs |
| 30 分鐘學會 | 1-2 週才能上手 |

### AWS 部署一個 NestJS 需要懂的東西

```
                        ┌─────────────────┐
                        │   Route 53      │ ← DNS 管理
                        │  (網域解析)      │
                        └────────┬────────┘
                                 ↓
                        ┌─────────────────┐
                        │ Load Balancer   │ ← 負載平衡
                        │   (ALB/NLB)     │
                        └────────┬────────┘
                                 ↓
┌──────────────────────────────────────────────────────────┐
│                        VPC                                │
│  ┌─────────────────┐          ┌─────────────────┐        │
│  │  Public Subnet  │          │ Private Subnet  │        │
│  │  ┌───────────┐  │          │  ┌───────────┐  │        │
│  │  │EC2 / ECS  │←─┼──────────┼─→│    RDS    │  │        │
│  │  │(你的程式)  │  │          │  │ (資料庫)  │  │        │
│  │  └───────────┘  │          │  └───────────┘  │        │
│  └─────────────────┘          └─────────────────┘        │
│                                                          │
│  Security Groups (防火牆規則)                             │
│  IAM Roles (權限管理)                                     │
└──────────────────────────────────────────────────────────┘
```

**對比 Render**：
```
GitHub Repo → 點 Deploy → 完成 ✅
```

### 什麼時候該學 AWS/GCP？

| 你的情況 | 建議 |
|----------|------|
| 剛開始學後端 | ❌ 先不要，用 Render/Railway |
| 個人 Side Project | ❌ 殺雞用牛刀，浪費時間 |
| 準備找後端工作 | ✅ 履歷加分，學基礎概念 |
| 公司要求使用 | ✅ 必須學，這是工作需求 |
| 專案有大流量需求 | ✅ 這才是 AWS/GCP 的正確使用場景 |

### AWS 基礎部署方式比較

| 服務 | 難度 | 適合場景 | 月費估算 |
|------|------|----------|----------|
| **Elastic Beanstalk** | ⭐⭐ | 想要簡單一點的 AWS | ~$20 |
| **ECS Fargate** | ⭐⭐⭐ | 容器化部署，不想管伺服器 | ~$30 |
| **EC2** | ⭐⭐⭐⭐ | 完全控制，自己管理一切 | ~$15 |
| **Lambda + API Gateway** | ⭐⭐⭐ | Serverless，按使用量計費 | $0~$50 |

### AWS Elastic Beanstalk 快速部署（最簡單的 AWS 方式）

```bash
# 1. 安裝 AWS CLI 和 EB CLI
pip install awscli awsebcli

# 2. 設定 AWS 憑證
aws configure
# 輸入 Access Key ID、Secret Access Key、Region

# 3. 初始化 Elastic Beanstalk
cd haude-v2-backend
eb init

# 4. 建立環境並部署
eb create haude-backend-env

# 5. 設定環境變數
eb setenv DATABASE_URL=postgresql://... JWT_SECRET=your-secret

# 6. 開啟應用程式
eb open
```

### GCP Cloud Run 部署（推薦的 GCP 方式）

Cloud Run 是 GCP 最簡單的容器部署服務，比較像「進階版的 Render」。

```bash
# 1. 安裝 Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# 2. 登入並設定專案
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 3. 建置並推送 Docker image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/haude-backend

# 4. 部署到 Cloud Run
gcloud run deploy haude-backend \
  --image gcr.io/YOUR_PROJECT_ID/haude-backend \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,JWT_SECRET=your-secret"

# 5. 設定 Cloud SQL（PostgreSQL）
gcloud sql instances create haude-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=asia-east1
```

### AWS vs GCP 選擇建議

| 考量 | 選 AWS | 選 GCP |
|------|--------|--------|
| **公司已經用** | ✅ | ✅ |
| **想學業界標準** | ✅ AWS 市佔 ~32% | |
| **想要較簡單的體驗** | | ✅ GCP 介面較友善 |
| **有用 Firebase** | | ✅ 整合好 |
| **機器學習需求** | | ✅ GCP 較強 |
| **文件和社群資源** | ✅ 最多 | |

### 學習資源

**AWS**：
- [AWS 免費培訓](https://aws.amazon.com/tw/training/digital/)
- [AWS NestJS 部署教學](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/nodejs-getstarted.html)

**GCP**：
- [GCP 免費課程](https://cloud.google.com/training)
- [Cloud Run 快速入門](https://cloud.google.com/run/docs/quickstarts)

---

## 8. 常見問題 FAQ

### Q: 部署後 API 回傳 500 錯誤？

**檢查順序**：
1. 查看部署平台的 Logs
2. 確認環境變數都有設定
3. 確認 `DATABASE_URL` 格式正確
4. 確認資料庫遷移有執行

```bash
# Render: 在 Dashboard 查看 Logs
# Railway:
railway logs
```

### Q: 資料庫連不上？

**常見原因**：
1. `DATABASE_URL` 格式錯誤
2. 用了 External URL 而不是 Internal URL
3. 資料庫還沒建立完成

**正確格式**：
```
postgresql://使用者:密碼@主機:5432/資料庫名稱
```

### Q: Prisma migrate 失敗？

```bash
# 確保本地 schema 是最新的
npx prisma generate

# 如果是第一次部署，可能需要 push 而不是 migrate
npx prisma db push
```

### Q: 如何查看線上日誌？

```bash
# Railway
railway logs

# Fly.io
fly logs

# Render: 網頁 Dashboard → Logs
```

### Q: 免費方案夠用嗎？

| 情況 | 建議 |
|------|------|
| 學習/練習 | 免費方案足夠 |
| Side Project（少量使用者） | 免費方案可以 |
| 正式產品 | 建議付費方案（$5-20/月） |
| 公司專案 | 一定要付費 |

### Q: 如何綁定自訂網域？

所有平台都支援，步驟大同小異：

1. 在平台設定頁面加入你的網域
2. 到你的 DNS 供應商（如 Cloudflare）
3. 新增 CNAME 記錄指向平台給的網址
4. 等待 DNS 生效（5分鐘~24小時）

---

## 總結

### 新手建議路線

```
1. 先用 Render Free 練習部署流程
      ↓
2. 熟悉後換 Railway 正式運營
      ↓
3. 學習 Docker 容器化
      ↓
4. 進階到 AWS/GCP
```

### 部署檢查清單

- [ ] 程式碼已 push 到 GitHub
- [ ] `npm run build` 本地測試成功
- [ ] 環境變數都已設定
- [ ] 資料庫已建立
- [ ] Prisma migrate 已執行
- [ ] 健康檢查端點正常回應
- [ ] 測試主要 API 功能

---

## 延伸學習

- [NestJS 官方部署文件](https://docs.nestjs.com/faq/serverless)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)
- [Docker 入門教學](https://docs.docker.com/get-started/)
- [Render 官方文件](https://render.com/docs)
- [Railway 官方文件](https://docs.railway.app/)
