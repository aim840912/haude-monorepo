import { defineConfig, devices } from '@playwright/test'

/**
 * 線上冒煙測試（登入 cookie）
 *
 * 和 playwright.config.ts（本機 E2E）分開：預設打正式站、只用 WebKit、不啟動 dev server。
 * 檔名用 *.smoke.ts，一般的 `pnpm test:e2e` 不會跑到它。
 *
 * 用 WebKit 是因為它和 Safari 一樣擋第三方 cookie —— 「無痕 / Safari 登入 401」
 * 這類問題用 Chromium 測不出來。每個測試都是全新的 context，等同無痕視窗。
 *
 * 執行（Git Bash）：
 *   SMOKE_EMAIL=... SMOKE_PASSWORD=... pnpm test:smoke
 *   SMOKE_BASE_URL=http://localhost:5173 SMOKE_EMAIL=... SMOKE_PASSWORD=... pnpm test:smoke   # 本機
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
