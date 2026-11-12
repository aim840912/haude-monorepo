import { defineConfig, devices } from '@playwright/test'
import path from 'path'

// Production smoke-account credentials live in .env.smoke.local (git-ignored
// via *.local, filled in by hand). Variables already set in the shell win.
try {
  process.loadEnvFile(path.join(__dirname, '.env.smoke.local'))
} catch {
  // File is optional: without it the tests skip unless the shell provides them
}

/**
 * 線上冒煙測試（登入 cookie）
 *
 * 和 playwright.config.ts（本機 E2E）分開：預設打正式站、只用 WebKit、不啟動 dev server。
 * 檔名用 *.smoke.ts，一般的 `pnpm test:e2e` 不會跑到它。
 *
 * 用 WebKit 是因為它和 Safari 一樣擋第三方 cookie —— 「無痕 / Safari 登入 401」
 * 這類問題用 Chromium 測不出來。每個測試都是全新的 context，等同無痕視窗。
 *
 * 執行：帳密填在 apps/web/.env.smoke.local 之後直接 `pnpm test:smoke`。
 * 也可以在指令前面用環境變數覆蓋（例如本機：SMOKE_BASE_URL=http://localhost:5173 加本機測試帳號）。
 */
export default defineConfig({
  testDir: './e2e/smoke-prod',
  testMatch: '**/*.smoke.ts',
  // 登入端點每分鐘限 5 次；依序跑，不平行
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.SMOKE_BASE_URL || 'https://haude-web.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }],
})
