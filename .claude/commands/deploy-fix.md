# Vercel Deployment Debug

按以下順序檢查並修復 Vercel 部署失敗：

1. **Git email**：確認 `git config user.email` 不是 `tien@mochibits.com`
2. **Types 預建置**：執行 `pnpm --filter @haude/types build`
3. **環境變數**：確認 `NEXT_PUBLIC_*` 在 Vercel Dashboard 設定（非只在 .env.local）
4. **建置測試**：執行 `pnpm build --filter=@haude/web`
5. **推送觸發**：commit + push 觸發新部署
6. **驗證**：用 Playwright 開啟部署 URL 檢查頁面狀態

直接執行，不進入 Plan Mode。
