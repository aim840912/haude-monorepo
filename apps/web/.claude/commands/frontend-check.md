---
description: "前端開發完成檢查（TypeScript、ESLint、元件結構）"
---

# 前端開發完成檢查清單 (Frontend Check)

前端開發完成後，執行全面的品質檢查，確保遵循專案規範和最佳實踐。

**用法**：`/frontend-check [元件或頁面路徑]`（可選）

**檢查目標**：$ARGUMENTS

---

## 檢查項目

### 1. TypeScript 類型檢查

**目標**：確保類型安全，無編譯錯誤

```bash
# 執行 TypeScript 檢查
npm run build
```

**檢查清單**：

- [ ] **編譯是否成功？** - 無紅色錯誤
- [ ] **是否避免使用 `any` 類型？**
  ```bash
  # 搜尋 any 類型
  Grep ": any" src/ --output_mode=content --glob="*.tsx"
  ```
- [ ] **Props 是否有明確類型定義？**
- [ ] **API 回應是否有類型定義？**

---

### 2. ESLint 程式碼品質

**目標**：確保程式碼風格一致

```bash
npm run lint
```

**檢查清單**：

- [ ] **ESLint 是否通過？** - 無錯誤或警告
- [ ] **Hooks 使用是否正確？** - 無 hooks 規則警告
- [ ] **import 順序是否正確？**

---

### 3. 元件結構檢查

**目標**：確保元件遵循專案規範

**檢查清單**：

- [ ] **元件是否小於 200 行？**
  ```bash
  wc -l [元件路徑]
  ```

- [ ] **Props 是否少於 7 個？**

- [ ] **是否使用 lucide-react 圖示？**
  ```bash
  # 檢查是否使用其他圖示庫
  Grep "heroicons\|@mui/icons\|react-icons" src/ --output_mode=content
  ```

- [ ] **是否正確使用 Tailwind CSS？**
  - 避免內聯樣式
  - 避免漸層（禁止使用 `bg-gradient-*`）

---

### 4. 狀態管理檢查

**目標**：確保正確使用 Zustand

**檢查清單**：

- [ ] **是否使用 Zustand store？**
  ```bash
  Grep "useAuthStore\|create\(" src/stores/ --output_mode=content
  ```

- [ ] **是否避免 prop drilling？**
  - 跨多層傳遞的資料應放入 store

- [ ] **Store 是否有正確的持久化設定？**
  - 認證狀態應持久化到 localStorage

---

### 5. API 整合檢查

**目標**：確保使用統一的 API 服務

**檢查清單**：

- [ ] **是否使用 `api` 實例？**
  ```bash
  # 應該使用 api 實例，而非直接使用 axios
  Grep "import axios from" src/ --output_mode=content
  ```
  - 除了 `services/api.ts`，其他檔案不應直接 import axios

- [ ] **是否處理 API 錯誤？**
  - 使用 try-catch 包裹 API 呼叫
  - 顯示適當的錯誤訊息

- [ ] **是否有 loading 狀態？**
  - 非同步操作應顯示 loading 狀態

---

### 6. 路由保護檢查

**目標**：確保認證頁面有保護

**檢查清單**：

- [ ] **需要認證的頁面是否使用 ProtectedRoute？**
  ```bash
  Grep "ProtectedRoute" src/App.tsx --output_mode=content
  ```

- [ ] **登入/註冊頁面是否排除保護？**

---

## 最終檢查清單

完成以上檢查後，填寫以下清單：

- [ ] **TypeScript**：編譯成功，無 any 類型
- [ ] **ESLint**：無錯誤或警告
- [ ] **元件結構**：遵循大小和結構規範
- [ ] **狀態管理**：正確使用 Zustand
- [ ] **API 整合**：使用統一 api 實例
- [ ] **路由保護**：認證頁面有保護

---

## 輸出格式

```
# 前端檢查報告

## TypeScript 類型檢查
- [通過/需改進]
- 發現問題：[...]

## ESLint 程式碼品質
- [通過/需改進]
- 發現問題：[...]

## 元件結構
- [通過/需改進]
- 建議：[...]

## 狀態管理
- [通過/需改進]
- 建議：[...]

## API 整合
- [通過/需改進]
- 建議：[...]

## 總體評估
- 是否可提交：[是/否]
- 必須修正：[列表]
- 建議改進：[列表]
```

---

## 相關指令

- `/api-check` - 後端 API 開發檢查（在 haude-v2-backend 使用）
