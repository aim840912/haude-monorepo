<div align="center">

# 豪德製茶所

**全棧電商平台 | Full-Stack E-Commerce Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-Monorepo-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)

[Demo](#demo) · [功能特色](#-功能特色) · [快速開始](#-快速開始) · [技術架構](#-技術架構) · [API 文檔](#-api-端點)

</div>

---

## Demo

> 🚧 線上 Demo 部署中...

<!--
**線上展示**：[https://haude.vercel.app](https://haude.vercel.app)

**管理後台**：[https://admin.haude.vercel.app](https://admin.haude.vercel.app)
-->

<details>
<summary>📸 專案截圖</summary>

| 首頁 | 產品列表 |
|:---:|:---:|
| ![首頁](docs/screenshots/home.png) | ![產品](docs/screenshots/products.png) |

| 購物車 | 結帳 |
|:---:|:---:|
| ![購物車](docs/screenshots/cart.png) | ![結帳](docs/screenshots/checkout.png) |

| 管理後台 | 訂單管理 |
|:---:|:---:|
| ![後台](docs/screenshots/admin.png) | ![訂單](docs/screenshots/orders.png) |

</details>

---

## 專案亮點

<table>
<tr>
<td width="50%">

### 完整電商功能
- 產品瀏覽與搜尋
- 購物車與結帳
- 多種支付方式
- 訂單追蹤

</td>
<td width="50%">

### 企業級架構
- Monorepo 多應用協作
- TypeScript 全覆蓋
- 模組化可擴展設計
- Docker 容器化部署

</td>
</tr>
<tr>
<td width="50%">

### 金流整合
- 綠界支付 ECPay
- 信用卡 / ATM / 超商代碼
- 完整回調處理
- 支付狀態追蹤

</td>
<td width="50%">

### 管理後台
- 產品與庫存管理
- 訂單與支付管理
- 用戶與權限管理
- 折扣碼系統

</td>
</tr>
</table>

---

## 功能特色

### 用戶端

| 功能 | 說明 |
|------|------|
| 🛒 購物流程 | 完整的 瀏覽 → 購物車 → 結帳 → 付款 流程 |
| 💳 多種支付 | 信用卡、ATM 轉帳、超商代碼、WebATM |
| 👤 會員系統 | 註冊、登入、密碼重設、帳戶管理 |
| 📦 訂單追蹤 | 即時訂單狀態、歷史訂單查詢 |
| 🎫 折扣系統 | 折扣碼驗證與套用 |
| 🍵 農場體驗 | 體驗活動瀏覽與預約 |
| 📍 據點資訊 | 實體店面與市集資訊 |

### 管理後台

| 功能 | 說明 |
|------|------|
| 📊 Dashboard | 營收統計、訂單概覽、用戶分析 |
| 📦 產品管理 | CRUD、圖片上傳、庫存管理 |
| 🧾 訂單管理 | 狀態更新、出貨處理 |
| 💰 支付管理 | 支付記錄、退款處理 |
| 🎫 折扣管理 | 折扣碼設定、使用統計 |
| 👥 用戶管理 | 角色分配、狀態管理 |

---

## 技術架構

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────────┐
│                         用戶端裝置                                │
│                    (瀏覽器 / 行動裝置)                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────┐
│    用戶端 (Web)        │       │   管理後台 (Admin)     │
│    Next.js 15         │       │   Vite + React        │
│    Port: 5173         │       │   Port: 5174          │
│                       │       │                       │
│  ┌─────────────────┐  │       │  ┌─────────────────┐  │
│  │  App Router     │  │       │  │  React Router   │  │
│  │  Server Comp.   │  │       │  │  SPA            │  │
│  │  Zustand Store  │  │       │  │  Axios Client   │  │
│  └─────────────────┘  │       │  └─────────────────┘  │
└───────────┬───────────┘       └───────────┬───────────┘
            │                               │
            └───────────────┬───────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      後端 API (NestJS)                           │
│                        Port: 3001                                │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │   Auth   │ │ Products │ │  Orders  │ │ Payments │   ...      │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │            │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Prisma ORM                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  PostgreSQL   │   │   Supabase    │   │    ECPay      │
│   Database    │   │   Storage     │   │   Payment     │
└───────────────┘   └───────────────┘   └───────────────┘
```

### Monorepo 結構

```
haude-monorepo/
├── apps/
│   ├── web/                 # @haude/web - 用戶端 (Next.js 15)
│   │   ├── src/
│   │   │   ├── app/         # App Router 頁面
│   │   │   ├── components/  # React 元件 (86 個)
│   │   │   ├── stores/      # Zustand 狀態
│   │   │   ├── services/    # API 服務層
│   │   │   └── hooks/       # 自訂 Hooks
│   │   └── package.json
│   │
│   ├── admin/               # @haude/admin - 管理後台 (Vite)
│   │   ├── src/
│   │   │   ├── pages/       # 後台頁面 (10 個)
│   │   │   ├── components/  # 後台元件
│   │   │   └── services/    # API 服務
│   │   └── package.json
│   │
│   └── api/                 # @haude/api - 後端 API (NestJS)
│       ├── src/
│       │   ├── modules/     # 功能模組 (12 個)
│       │   └── prisma/      # Prisma 服務
│       ├── prisma/
│       │   └── schema.prisma # 資料庫 Schema
│       └── package.json
│
├── packages/
│   └── types/               # @haude/types - 共用型別
│       └── src/
│           ├── product.ts   # 產品型別
│           ├── order.ts     # 訂單型別
│           ├── user.ts      # 用戶型別
│           └── review.ts    # 評論型別
│
├── docker-compose.yml       # Docker 編排
├── turbo.json              # Turborepo 設定
├── pnpm-workspace.yaml     # pnpm 工作區
└── package.json            # 根設定
```

### 技術棧

<table>
<tr>
<th>層級</th>
<th>技術</th>
<th>版本</th>
</tr>
<tr>
<td rowspan="5"><strong>前端</strong></td>
<td>Next.js (App Router)</td>
<td>15.5</td>
</tr>
<tr>
<td>React</td>
<td>19.2</td>
</tr>
<tr>
<td>TypeScript</td>
<td>5.9</td>
</tr>
<tr>
<td>Tailwind CSS</td>
<td>4.1</td>
</tr>
<tr>
<td>Zustand</td>
<td>5.0</td>
</tr>
<tr>
<td rowspan="3"><strong>後端</strong></td>
<td>NestJS</td>
<td>11</td>
</tr>
<tr>
<td>Prisma</td>
<td>7</td>
</tr>
<tr>
<td>PostgreSQL</td>
<td>15</td>
</tr>
<tr>
<td rowspan="2"><strong>工具</strong></td>
<td>pnpm + Turborepo</td>
<td>-</td>
</tr>
<tr>
<td>Docker</td>
<td>-</td>
</tr>
</table>

### 資料庫模型

```mermaid
erDiagram
    User ||--o{ Order : places
    User ||--o{ Cart : has
    User ||--o{ Review : writes

    Product ||--o{ ProductImage : has
    Product ||--o{ OrderItem : contains
    Product ||--o{ CartItem : in
    Product ||--o{ Review : receives

    Order ||--o{ OrderItem : contains
    Order ||--o{ Payment : has
    Order }o--o| DiscountCode : uses

    Cart ||--o{ CartItem : contains

    DiscountCode ||--o{ DiscountUsage : tracks

    FarmTour ||--o{ FarmTourBooking : has

    User {
        string id PK
        string email
        string name
        enum role
        datetime createdAt
    }

    Product {
        string id PK
        string name
        int price
        int stock
        boolean isActive
    }

    Order {
        string id PK
        string userId FK
        enum status
        int totalAmount
        datetime createdAt
    }

    Payment {
        string id PK
        string orderId FK
        enum method
        enum status
        int amount
    }
```

---

## 快速開始

### 環境需求

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (或 Supabase)

### 安裝步驟

```bash
# 1. Clone 專案
git clone https://github.com/your-username/haude-monorepo.git
cd haude-monorepo

# 2. 安裝依賴
pnpm install

# 3. 設定環境變數
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.development

# 4. 初始化資料庫
cd apps/api
npx prisma generate
npx prisma migrate dev
cd ../..

# 5. 啟動所有服務
pnpm dev
```

### 存取服務

| 服務 | 網址 | 說明 |
|------|------|------|
| 用戶端 | http://localhost:5173 | Next.js 電商前台 |
| 管理後台 | http://localhost:5174 | Vite 管理系統 |
| API | http://localhost:3001 | NestJS 後端 |
| API 文檔 | http://localhost:3001/api | Swagger UI |

### 常用指令

```bash
# 開發
pnpm dev                      # 啟動所有服務
pnpm dev --filter=@haude/web  # 只啟動用戶端
pnpm dev --filter=@haude/api  # 只啟動 API

# 建置
pnpm build                    # 建置所有專案
pnpm type-check               # TypeScript 檢查

# 資料庫
cd apps/api
npx prisma studio             # 開啟資料庫 GUI
npx prisma migrate dev        # 執行遷移
```

---

## API 端點

### 認證 (Auth)

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/auth/register` | 用戶註冊 |
| POST | `/auth/login` | 用戶登入 |
| GET | `/auth/me` | 取得當前用戶 |
| POST | `/auth/forgot-password` | 忘記密碼 |
| POST | `/auth/reset-password` | 重設密碼 |

### 產品 (Products)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/products` | 產品列表 |
| GET | `/products/:id` | 產品詳情 |
| POST | `/admin/products` | 建立產品 (管理員) |
| PUT | `/admin/products/:id` | 更新產品 (管理員) |
| DELETE | `/admin/products/:id` | 刪除產品 (管理員) |

### 訂單 (Orders)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/orders` | 用戶訂單列表 |
| GET | `/orders/:id` | 訂單詳情 |
| POST | `/orders` | 建立訂單 |
| PATCH | `/orders/:id/cancel` | 取消訂單 |

### 支付 (Payments)

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/payments/ecpay/create` | 發起支付 |
| POST | `/payments/ecpay/notify` | 支付回調 |
| GET | `/payments/ecpay/return` | 支付返回頁 |

### 購物車 (Cart)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/cart` | 取得購物車 |
| POST | `/cart/items` | 加入商品 |
| PUT | `/cart/items/:productId` | 更新數量 |
| DELETE | `/cart/items/:productId` | 移除商品 |

<details>
<summary>查看更多 API 端點</summary>

### 折扣碼 (Discounts)

| 方法 | 端點 | 說明 |
|------|------|------|
| POST | `/discounts/validate` | 驗證折扣碼 |
| GET | `/admin/discounts` | 折扣碼列表 |
| POST | `/admin/discounts` | 建立折扣碼 |

### 評論 (Reviews)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/products/:id/reviews` | 產品評論 |
| POST | `/products/:id/reviews` | 發表評論 |

### 農場體驗 (Farm Tours)

| 方法 | 端點 | 說明 |
|------|------|------|
| GET | `/farm-tours` | 體驗列表 |
| GET | `/farm-tours/:id` | 體驗詳情 |
| POST | `/farm-tours/:id/book` | 預約體驗 |

</details>

---

## 環境變數

### apps/api/.env

```env
# 資料庫
DATABASE_URL="postgresql://user:password@localhost:5432/haude"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# 伺服器
PORT=3001
FRONTEND_URL="http://localhost:5173"

# 綠界支付 (ECPay)
ECPAY_MERCHANT_ID="your-merchant-id"
ECPAY_HASH_KEY="your-hash-key"
ECPAY_HASH_IV="your-hash-iv"

# Supabase (儲存)
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-key"
```

### apps/web/.env.local

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

### apps/admin/.env.development

```env
VITE_API_URL="http://localhost:3001"
```

---

## 部署

### Vercel + Render + Supabase (推薦)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │     │   Render    │     │  Supabase   │
│  (Web/Admin)│────▶│    (API)    │────▶│ (DB/Storage)│
└─────────────┘     └─────────────┘     └─────────────┘
```

### Docker

```bash
# 建置並啟動
docker-compose up -d

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down
```

---

## 專案統計

<table>
<tr>
<td align="center"><strong>40,000+</strong><br/>程式碼行數</td>
<td align="center"><strong>361</strong><br/>TypeScript 檔案</td>
<td align="center"><strong>21</strong><br/>前端頁面</td>
<td align="center"><strong>12</strong><br/>API 模組</td>
</tr>
<tr>
<td align="center"><strong>16</strong><br/>資料庫模型</td>
<td align="center"><strong>86</strong><br/>UI 元件</td>
<td align="center"><strong>4</strong><br/>支付方式</td>
<td align="center"><strong>4</strong><br/>用戶角色</td>
</tr>
</table>

---

## 授權

MIT License

---

<div align="center">

**[回到頂部](#豪德製茶所)**

</div>
