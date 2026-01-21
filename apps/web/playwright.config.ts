import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E 測試配置
 *
 * 用於測試核心用戶流程：登入、購物、結帳
 * 參考：https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 測試檔案目錄
  testDir: './e2e',

  // 完全並行執行測試
  fullyParallel: true,

  // CI 環境禁止使用 test.only
  forbidOnly: !!process.env.CI,

  // CI 環境失敗重試次數
  retries: process.env.CI ? 2 : 0,

  // CI 環境使用單一 worker
  workers: process.env.CI ? 1 : undefined,

  // 測試報告格式
  reporter: process.env.CI ? 'github' : 'html',

  // 全局設定
  use: {
    // 基礎 URL
    baseURL: 'http://localhost:5173',

    // 失敗時記錄追蹤
    trace: 'on-first-retry',

    // 截圖（僅失敗時）
    screenshot: 'only-on-failure',

    // 視窗大小
    viewport: { width: 1280, height: 720 },
  },

  // 瀏覽器配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // 開發伺服器設定
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
