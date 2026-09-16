# 網站設計資源指南

本文件整理了網站設計的方法、工具和推薦資源，幫助快速開始設計工作。

---

## 目錄

- [方法一：參考優秀網站](#方法一參考優秀網站)
- [方法二：使用 UI 元件庫](#方法二使用-ui-元件庫)
- [方法三：AI 輔助設計](#方法三ai-輔助設計)
- [方法四：設計系統模板](#方法四設計系統模板)
- [專案設計建議](#專案設計建議豪德製茶所)
- [工作流程](#推薦工作流程)

---

## 方法一：參考優秀網站

### 設計靈感網站

| 網站 | 特點 | 網址 |
|------|------|------|
| **Dribbble** | 設計師作品集，UI 靈感豐富 | https://dribbble.com |
| **Behance** | 完整專案展示，有設計過程 | https://behance.net |
| **Awwwards** | 獲獎網站，高品質設計 | https://awwwards.com |
| **Land-book** | Landing Page 專門收集 | https://land-book.com |
| **Mobbin** | App/Web UI 模式庫 | https://mobbin.com |
| **Godly** | 精選高品質網站 | https://godly.website |
| **SiteInspire** | 網頁設計靈感庫 | https://siteinspire.com |
| **One Page Love** | 單頁網站設計 | https://onepagelove.com |
| **Lapa Ninja** | Landing Page 設計靈感 | https://lapa.ninja |
| **Httpster** | 精選優質網站 | https://httpster.net |

### 電商專用靈感

| 網站 | 特點 | 網址 |
|------|------|------|
| **Commerce Cream** | 電商設計靈感 | https://commercecream.com |
| **Ecomm.design** | 電商 UI/UX 案例 | https://ecomm.design |
| **CartFrenzy** | 購物車設計參考 | https://cartfrenzy.com |

### 使用方式

```bash
# 1. 找到喜歡的網站後，先用研究指令分析
/research-study-website https://example.com

# 2. 再用還原指令生成程式碼
/clone-design https://example.com
```

---

## 方法二：使用 UI 元件庫

### React + Tailwind 元件庫

| 元件庫 | 風格 | 特點 | 網址 |
|--------|------|------|------|
| **shadcn/ui** | 簡約現代 | 可客製化、複製貼上使用 | https://ui.shadcn.com |
| **Radix UI** | 無樣式基底 | 高度可訪問性、無障礙 | https://radix-ui.com |
| **Headless UI** | Tailwind 官方 | 與 Tailwind 完美整合 | https://headlessui.com |
| **DaisyUI** | 多主題 | 開箱即用、主題豐富 | https://daisyui.com |
| **Mantine** | 功能完整 | 100+ 元件、hooks | https://mantine.dev |
| **Chakra UI** | 易於使用 | 主題系統完善 | https://chakra-ui.com |

### Tailwind 元件集合

| 資源 | 說明 | 網址 |
|------|------|------|
| **Tailwind UI** | 官方高品質元件（部分付費） | https://tailwindui.com |
| **Flowbite** | 免費 Tailwind 元件 | https://flowbite.com |
| **Hyperui** | 免費 Tailwind 元件集 | https://hyperui.dev |
| **Tailblocks** | 響應式區塊模板 | https://tailblocks.cc |
| **Meraki UI** | 免費漂亮元件 | https://merakiui.com |
| **Kutty** | Tailwind 插件元件 | https://kutty.netlify.app |

### 安裝 shadcn/ui（推薦）

```bash
# 初始化
npx shadcn@latest init

# 安裝常用元件
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add select
npx shadcn@latest add tabs
npx shadcn@latest add toast
```

---

## 方法三：AI 輔助設計

### 使用 Claude 設計

直接描述你的需求，Claude 可以：

1. **提供設計方向建議**
2. **生成配色方案**
3. **建議版面佈局**
4. **直接生成程式碼**

### 範例提示詞

```
「我要設計一個茶葉電商網站，風格要：
- 自然、有機的感覺
- 主色調是綠色和米色
- 簡約但不無聊
- 參考日本茶道的美學
- 需要有產品列表、購物車、結帳功能」
```

### AI 設計工具

| 工具 | 用途 | 網址 |
|------|------|------|
| **v0.dev** | Vercel AI 生成 UI | https://v0.dev |
| **Galileo AI** | AI 生成設計稿 | https://usegalileo.ai |
| **Uizard** | 草圖轉設計 | https://uizard.io |
| **Framer AI** | AI 網站建置 | https://framer.com |

### Claude Code 設計指令

```bash
# 研究參考網站的效果
/research-study-website https://example.com

# 還原網站設計並生成程式碼
/clone-design https://example.com

# 生成設計後驗證程式碼
/verify
```

---

## 方法四：設計系統模板

### 免費設計資源

| 資源 | 類型 | 說明 | 網址 |
|------|------|------|------|
| **Figma Community** | 模板 | 大量免費 UI Kit | https://figma.com/community |
| **Sketch App Sources** | 模板 | Sketch 設計資源 | https://sketchappsources.com |
| **Uplabs** | 模板/元件 | UI 設計資源市集 | https://uplabs.com |
| **UI8** | 模板 | 高品質 UI 資源（部分付費） | https://ui8.net |

### 設計系統參考

| 設計系統 | 公司 | 特點 | 網址 |
|----------|------|------|------|
| **Material Design** | Google | 完整規範、元件豐富 | https://m3.material.io |
| **Ant Design** | Alibaba | 企業級、中文友好 | https://ant.design |
| **Carbon** | IBM | 企業風格、無障礙 | https://carbondesignsystem.com |
| **Polaris** | Shopify | 電商專用 | https://polaris.shopify.com |
| **Spectrum** | Adobe | 專業設計工具風格 | https://spectrum.adobe.com |

### 配色工具

| 工具 | 用途 | 網址 |
|------|------|------|
| **Coolors** | 配色生成器 | https://coolors.co |
| **Color Hunt** | 配色方案集合 | https://colorhunt.co |
| **Happy Hues** | 配色靈感 + 預覽 | https://happyhues.co |
| **Realtime Colors** | 即時預覽配色 | https://realtimecolors.com |
| **Huemint** | AI 配色生成 | https://huemint.com |

### 字體資源

| 資源 | 說明 | 網址 |
|------|------|------|
| **Google Fonts** | 免費網頁字體 | https://fonts.google.com |
| **Font Squirrel** | 免費商用字體 | https://fontsquirrel.com |
| **Fontpair** | 字體配對建議 | https://fontpair.co |

---

## 專案設計建議（豪德製茶所）

### 設計方向

| 面向 | 建議 |
|------|------|
| **風格** | 自然、溫暖、手作感 |
| **主色調** | 綠色（茶葉）+ 米色/大地色（自然） |
| **輔助色** | 棕色（茶湯）、白色（乾淨） |
| **字體** | 有溫度的無襯線體 |
| **圖片風格** | 茶園、製茶過程、產品特寫 |

### 推薦配色

```css
/* 主要配色 */
--color-primary: #4A7C59;      /* 茶葉綠 */
--color-secondary: #8B7355;    /* 茶湯棕 */
--color-background: #F5F0E8;   /* 米色背景 */
--color-text: #2D3436;         /* 深灰文字 */
--color-accent: #D4A574;       /* 暖金強調 */
```

### 類似風格參考

- 日本茶品牌官網
- 有機農產品電商
- 精品咖啡網站
- 手作陶瓷品牌

### 搜尋關鍵字

在靈感網站搜尋這些關鍵字：

```
tea brand
organic food
artisan
natural products
japanese minimal
craft goods
farm to table
```

---

## 推薦工作流程

### 快速開始（1-2 小時）

```
1. 在靈感網站找到 2-3 個喜歡的設計
2. 截圖或記下 URL
3. 使用 /clone-design 還原其中一個
4. 修改顏色和內容成你的品牌
5. 使用 /verify 確認程式碼無誤
```

### 完整流程（1-2 天）

```
1. 研究階段
   - 收集 5-10 個參考網站
   - 使用 /research-study-website 分析每個
   - 記錄喜歡的元素

2. 設計階段
   - 確定配色方案
   - 選擇字體組合
   - 規劃頁面結構

3. 實作階段
   - 使用 /clone-design 還原主要區塊
   - 整合到專案中
   - 調整細節

4. 優化階段
   - 使用 /verify 驗證
   - 測試響應式
   - 優化效能
```

### 持續迭代

```
發現更好的設計 → /research-study-website 研究
                → /clone-design 還原部分元素
                → 整合到現有專案
```

---

## 相關指令

| 指令 | 用途 |
|------|------|
| `/research-study-website <URL>` | 深度研究網站效果 |
| `/clone-design <URL>` | 還原網站設計並生成程式碼 |
| `/verify` | 驗證程式碼（type-check + build） |

---

## 附錄：設計原則速查

### 視覺層級

1. **標題** - 最大、最粗
2. **副標題** - 中等大小
3. **內文** - 舒適閱讀大小（16px+）
4. **輔助文字** - 較小、較淡

### 間距規則

- 使用 **4px 或 8px** 的倍數
- 相關元素間距較小
- 不相關元素間距較大
- 留白是設計的一部分

### 響應式斷點

| 斷點 | 尺寸 | 裝置 |
|------|------|------|
| `sm` | 640px | 大手機 |
| `md` | 768px | 平板 |
| `lg` | 1024px | 小筆電 |
| `xl` | 1280px | 桌機 |
| `2xl` | 1536px | 大螢幕 |

---

*最後更新：2026-01-13*
