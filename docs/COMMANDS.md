# Claude Code 可用命令總覽

> 最後更新：2026-01-08

## 開發工作流（專案層級）

這些命令定義在 `.claude/commands/`，專為 haude-v2 專案設計。

| 命令 | 說明 | 使用時機 |
|------|------|----------|
| `/verify` | 快速驗證（type-check + build） | 每次變更後確認沒壞掉 |
| `/test-runner` | 執行測試並分析結果 | 跑單元測試或 E2E 測試 |
| `/refactor` | 安全重構現有程式碼 | 重構時確保每步都驗證 |
| `/code-simplifier` | 簡化程式碼（移除冗餘、提升可讀性） | 清理過度複雜的程式碼 |

---

## 規劃類（全域）

這些命令定義在 `~/.claude/commands/`，所有專案都能使用。

| 命令 | 說明 | 使用時機 |
|------|------|----------|
| `/planning-ultraplan` | 深度規劃（使用 ultrathink） | 複雜功能需要詳細計畫 |
| `/planning-archdesign` | 系統架構設計 | 設計新系統或大型重構 |
| `/planning-deepdive` | 深度探索程式碼庫和系統架構 | 理解不熟悉的程式碼 |
| `/planning-safereview` | 唯讀模式程式碼審查 | 只想看不想改 |

---

## 分析類（全域）

| 命令 | 說明 | 使用時機 |
|------|------|----------|
| `/code-quality-pre-dev-check` | 開發前檢查（Code Reuse、依賴、架構、效能） | 開始新功能前 |
| `/code-quality-tech-debt-scan` | 技術債掃描（建置時間、警告、重複程式碼、過時依賴） | 定期維護 |
| `/maintenance-check` | 維護檢查（支援 quick/full 模式） | 每月定期執行 |
| `/simplification-architecture-analysis` | 深度分析專案架構複雜度，評估是否過度工程化 | 懷疑專案太複雜時 |
| `/simplification-simplify-architecture` | 執行專案架構簡化，移除過度工程化的抽象層 | 確認要簡化後執行 |
| `/simplification-execute` | 執行簡化任務（infrastructure/large-files/service-pattern） | 具體簡化任務 |

---

## Git 工作流（全域）

| 命令 | 說明 | 使用時機 |
|------|------|----------|
| `/git-commit-push` | Commit + Push（不建立 PR） | 日常提交 |
| `/git-pr` | Commit + Push + 建立 Pull Request | 功能完成要合併時 |

---

## 研究類（全域）

| 命令 | 說明 | 使用時機 |
|------|------|----------|
| `/research-study-website` | 深度研究參考網站的前端效果實作 | 想模仿某網站效果時 |

---

## Plugin 提供的命令

這些是透過 Claude Code Plugin 提供的功能。

| 命令 | 說明 |
|------|------|
| `/code-review` | Code review a pull request |
| `/feature-dev` | Guided feature development with codebase understanding |
| `/frontend-design` | Create distinctive, production-grade frontend interfaces |

---

## 快速參考

### 日常開發流程

```
1. 開始功能前    → /code-quality-pre-dev-check
2. 開發中       → /verify（每次變更後）
3. 重構時       → /refactor
4. 完成後       → /test-runner
5. 提交        → /git-commit-push 或 /git-pr
```

### 維護流程

```
1. 定期檢查     → /maintenance-check quick
2. 深度檢查     → /maintenance-check full
3. 技術債評估   → /code-quality-tech-debt-scan
4. 架構評估     → /simplification-architecture-analysis
```
