# 多代理並行工作指南

> 基於 Boris Cherny（Claude Code 創造者）的工作流程設計

---

## 核心概念

**目標**：讓一個人達到小型工程團隊的產出能力

**方法**：
1. 同時運行多個 Claude 實例
2. 每個實例負責不同的工作區域
3. 使用通知系統追蹤任務完成狀態

---

## 工作區域分配

### Monorepo 天然分區

```
Claude 實例 1 → apps/web      （用戶端前端）
Claude 實例 2 → apps/admin    （管理後台）
Claude 實例 3 → apps/api      （後端 API）
Claude 實例 4 → packages/     （共用套件）
Claude 實例 5 → 測試/文檔/Review
```

### 為什麼這樣分？

| 區域 | 說明 | 衝突風險 |
|------|------|----------|
| apps/web | Next.js 用戶端，獨立部署 | 低 |
| apps/admin | Vite 管理後台，獨立部署 | 低 |
| apps/api | NestJS 後端，獨立部署 | 低 |
| packages/types | 共用型別，需協調 | 中 |

**關鍵原則**：不同代理不應同時編輯同一個檔案

---

## 啟動多代理的步驟

### 1. 開啟多個終端機標籤

使用 iTerm2（Mac）或其他支援標籤的終端機：

```bash
# Tab 1: Web 開發
cd ~/projects/haude-v2
claude --scope apps/web

# Tab 2: Admin 開發
cd ~/projects/haude-v2
claude --scope apps/admin

# Tab 3: API 開發
cd ~/projects/haude-v2
claude --scope apps/api

# Tab 4: 測試/驗證
cd ~/projects/haude-v2
claude
```

### 2. 設定系統通知（iTerm2）

1. 開啟 iTerm2 → Preferences → Profiles → Terminal
2. 啟用 "Notification Center" 選項
3. 當 Claude 需要輸入時會收到系統通知

### 3. 分配任務

每個終端機分配不同類型的任務：

```
Tab 1 (Web):   「幫我實作產品列表頁的篩選功能」
Tab 2 (Admin): 「幫我修復管理後台的表格排序問題」
Tab 3 (API):   「幫我新增訂單匯出的 API 端點」
Tab 4 (Test):  「/verify」「/test-runner」
```

---

## 避免衝突的策略

### 策略 1：區域鎖定

每個 Claude 實例只能編輯特定目錄：

```markdown
# 在每個 session 開始時說明

你只能編輯 apps/web 目錄下的檔案。
如果需要修改其他目錄（如 packages/types），
請告訴我，我會切換到對應的實例處理。
```

### 策略 2：共用資源協調

當需要修改共用資源（如 `packages/types`）時：

1. 暫停其他實例的工作
2. 在一個實例中完成共用資源的修改
3. 通知其他實例更新：`pnpm install`
4. 繼續其他實例的工作

### 策略 3：Git 分支隔離

每個主要功能使用獨立分支：

```bash
# 大型功能開發
git checkout -b feat/product-filter   # Web 實例
git checkout -b feat/admin-sorting    # Admin 實例
git checkout -b feat/order-export     # API 實例
```

---

## 推薦工作流程

### 階段 1：規劃（Plan Mode）

所有實例都先進入 Plan Mode（Shift+Tab 兩次）：

```
1. 描述任務需求
2. 與 Claude 討論實作方案
3. 確認計畫後再開始實作
```

### 階段 2：並行開發

```
┌─────────────────────────────────────────────┐
│ 時間軸                                        │
├─────────────────────────────────────────────┤
│ 09:00 │ 分配任務給各實例                      │
│ 09:05 │ 各實例進入 Plan Mode                  │
│ 09:15 │ 確認計畫，開始實作                    │
│ 10:00 │ 收到通知：Web 實例完成                │
│ 10:05 │ 驗證 Web 變更                         │
│ 10:30 │ 收到通知：API 實例完成                │
│ 10:35 │ 驗證 API 變更                         │
│ 11:00 │ 整合測試                              │
└─────────────────────────────────────────────┘
```

### 階段 3：驗證與整合

```bash
# 在驗證實例中
pnpm type-check   # 全專案型別檢查
pnpm build        # 全專案建置
```

---

## 常用指令快速參考

| 指令 | 用途 | 使用時機 |
|------|------|----------|
| `/verify` | 快速驗證變更 | 每次變更後 |
| `/code-simplifier` | 簡化程式碼 | 功能完成後 |
| `/refactor` | 重構模式 | 需要改善結構時 |
| `/test-runner` | 執行測試 | 功能完成後 |
| `/git-pr` | 提交並建立 PR | 準備合併時 |

---

## 效能提升預期

| 場景 | 單一實例 | 多代理並行 | 提升 |
|------|----------|------------|------|
| 3 個獨立功能 | 3 小時 | 1.5 小時 | 2x |
| 前後端聯調 | 2 小時 | 1 小時 | 2x |
| 重構 + 測試 | 4 小時 | 2 小時 | 2x |

**注意**：實際提升取決於任務的獨立性。高度耦合的任務不適合並行。

---

## 疑難排解

### Q: 兩個實例同時編輯了同一個檔案怎麼辦？

```bash
# 查看衝突
git status

# 手動解決衝突
git diff

# 選擇保留哪個版本
git checkout --ours <file>    # 保留本地
git checkout --theirs <file>  # 保留遠端
```

### Q: 共用型別改了，其他實例報錯？

```bash
# 在其他實例中執行
pnpm install  # 更新依賴
```

### Q: 如何知道哪個實例在做什麼？

建議在每個終端機標籤上標記：
- Tab 1: 🌐 Web - 產品篩選
- Tab 2: 🔧 Admin - 表格排序
- Tab 3: 🔌 API - 訂單匯出
- Tab 4: ✅ Verify

---

## 進階：使用 --teleport

Boris Cherny 提到他會用 `--teleport` 在本地終端機和網頁版 Claude 之間同步：

```bash
# 將本地 session 傳送到網頁版
claude --teleport

# 在網頁版繼續工作，然後傳回本地
```

這對於需要更長上下文或更多思考時間的任務很有用。
