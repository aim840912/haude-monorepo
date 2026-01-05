# Haude V2

React + NestJS + PostgreSQL 全端應用程式

## 專案結構

```
haude-v2/
├── docker-compose.yml        # 統一啟動前後端 + 資料庫
├── haude-v2-frontend/        # React + Vite 前端
└── haude-v2-backend/         # NestJS 後端
```

## 快速開始

### 1. 設定環境變數

```bash
# 前端
cp haude-v2-frontend/.env.example haude-v2-frontend/.env

# 後端
cp haude-v2-backend/.env.example haude-v2-backend/.env
```

### 2. 開發模式啟動

**方式一：分開啟動（推薦開發時使用）**

```bash
# Terminal 1: 啟動後端
cd haude-v2-backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Terminal 2: 啟動前端
cd haude-v2-frontend
npm install
npm run dev
```

**方式二：Docker 一鍵啟動**

```bash
cd haude-v2
docker-compose up -d
```

### 3. 存取服務

| 服務 | 網址 |
|------|------|
| 前端 | http://localhost:5173 (dev) / http://localhost:3000 (docker) |
| 後端 API | http://localhost:3001 |
| Swagger 文檔 | http://localhost:3001/api |

## 技術棧

### 前端
- React 18 + TypeScript
- Vite (建構工具)
- React Router (路由)
- Zustand (狀態管理)
- Tailwind CSS (樣式)
- Axios (API 請求)
- Supabase Client (可選認證)

### 後端
- NestJS 10 + TypeScript
- Prisma (ORM)
- PostgreSQL (資料庫)
- Passport + JWT (認證)
- Swagger (API 文檔)
- class-validator (驗證)

## API 端點

### 認證 (Auth)
- `POST /auth/register` - 註冊
- `POST /auth/login` - 登入
- `GET /auth/me` - 取得當前用戶
- `POST /auth/logout` - 登出

### 用戶 (Users)
- `GET /users` - 取得所有用戶
- `GET /users/:id` - 取得單一用戶
- `PATCH /users/:id` - 更新用戶
- `DELETE /users/:id` - 刪除用戶

### 健康檢查
- `GET /health` - 服務健康狀態

## 資料庫

### 使用 Supabase (推薦)

1. 建立 Supabase 專案
2. 複製 Connection String
3. 更新 `.env` 的 `DATABASE_URL`
4. 執行 `npx prisma migrate deploy`

### 使用本地 PostgreSQL

```bash
# 啟動 PostgreSQL
docker-compose up -d postgres

# 執行遷移
cd haude-v2-backend
npx prisma migrate dev
```

## 開發指令

### 前端

```bash
npm run dev        # 開發模式
npm run build      # 建構生產版本
npm run preview    # 預覽生產版本
npm run lint       # 程式碼檢查
```

### 後端

```bash
npm run start:dev  # 開發模式 (熱重載)
npm run build      # 建構生產版本
npm run start:prod # 生產模式
npm run lint       # 程式碼檢查
npm run test       # 執行測試
```

### Prisma

```bash
npx prisma generate      # 生成 Client
npx prisma migrate dev   # 開發遷移
npx prisma migrate deploy # 部署遷移
npx prisma studio        # 資料庫管理 UI
```
