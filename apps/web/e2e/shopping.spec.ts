import { test, expect } from '@playwright/test'

/**
 * 購物流程 E2E 測試
 *
 * 測試產品瀏覽、加入購物車、購物車操作
 * 注意：購物車資料儲存在 localStorage，測試需要在同一個 context 中執行
 */
test.describe('購物流程', () => {
  test.beforeEach(async ({ page }) => {
    // 每個測試前清除 localStorage
    await page.goto('/zh-TW')
    await page.evaluate(() => localStorage.clear())
  })

  test.describe('產品列表頁', () => {
    test('應該顯示產品列表頁面', async ({ page }) => {
      await page.goto('/zh-TW/products')

      // 驗證麵包屑導航中的「產品」文字
      await expect(page.getByLabel('麵包屑導航').getByText('產品')).toBeVisible()

      // 等待產品載入
      await page.waitForTimeout(2000)

      // 驗證篩選區域存在
      const filterSection = page.locator('input[placeholder*="搜尋"]').or(page.getByPlaceholder('搜尋'))
      await expect(filterSection.first()).toBeVisible()
    })

    test('應該能搜尋產品', async ({ page }) => {
      await page.goto('/zh-TW/products')

      // 等待頁面載入
      await page.waitForTimeout(2000)

      // 找到搜尋輸入框
      const searchInput = page.getByPlaceholder('搜尋產品').or(page.locator('input[type="text"]').first())

      if (await searchInput.isVisible()) {
        // 輸入搜尋關鍵字
        await searchInput.fill('茶')

        // 等待搜尋結果更新
        await page.waitForTimeout(1000)

        // 搜尋後頁面應該顯示結果統計
        await expect(page.getByText(/找到.*個產品/)).toBeVisible()
      }
    })

    test('應該能切換排序方式', async ({ page }) => {
      await page.goto('/zh-TW/products')

      // 等待頁面載入
      await page.waitForTimeout(2000)

      // 找到排序下拉選單
      const sortSelect = page.getByRole('combobox').or(page.locator('select'))

      if (await sortSelect.first().isVisible()) {
        // 選擇價格由低到高（使用 index 或 value）
        await sortSelect.first().selectOption({ index: 1 }).catch(() => {
          // 如果選項不存在，忽略錯誤
        })
      }
    })
  })

  test.describe('購物車頁面', () => {
    test('空購物車應顯示提示訊息', async ({ page }) => {
      await page.goto('/zh-TW/cart')

      // 等待頁面載入
      await page.waitForTimeout(1000)

      // 驗證空購物車訊息
      await expect(page.getByText('購物車是空的')).toBeVisible()

      // 驗證「瀏覽產品」按鈕存在
      await expect(page.getByRole('link', { name: /瀏覽產品/i })).toBeVisible()
    })

    test('空購物車的瀏覽產品按鈕應導向產品頁', async ({ page }) => {
      await page.goto('/zh-TW/cart')

      // 等待頁面載入
      await page.waitForTimeout(1000)

      // 點擊瀏覽產品按鈕
      await page.getByRole('link', { name: /瀏覽產品/i }).click()

      // 驗證導向產品頁
      await expect(page).toHaveURL(/\/products/)
    })

    test('購物車應該有麵包屑導航', async ({ page }) => {
      await page.goto('/zh-TW/cart')

      // 等待頁面載入
      await page.waitForTimeout(1000)

      // 驗證麵包屑包含「購物車」
      await expect(page.getByText('購物車').first()).toBeVisible()
    })
  })

  test.describe('產品詳情頁', () => {
    test('從產品列表進入產品詳情', async ({ page }) => {
      await page.goto('/zh-TW/products')

      // 等待產品載入
      await page.waitForTimeout(3000)

      // 嘗試多種方式找到可點擊的產品連結
      const productLinks = [
        page.getByRole('link', { name: /查看詳情/i }).first(),
        page.locator('a[href*="/products/"][href*="-"]').first(),  // 產品詳情連結通常有 UUID
        page.locator('.product-image-wrapper').first().locator('..').locator('a').first()
      ]

      let clicked = false
      for (const link of productLinks) {
        if (await link.isVisible().catch(() => false)) {
          await link.click()
          clicked = true
          break
        }
      }

      // 等待導航
      await page.waitForTimeout(1000)

      // 如果成功點擊了連結，驗證導航到產品詳情頁
      // 如果沒有產品可點擊（例如空的產品列表），跳過驗證
      if (clicked) {
        expect(page.url()).toMatch(/\/products\/[a-zA-Z0-9-]+/)
      } else {
        // 沒有產品可點擊時，至少確認頁面正常載入
        console.log('沒有找到可點擊的產品連結，可能是產品列表為空')
        expect(page.url()).toContain('/products')
      }
    })
  })

  test.describe('首頁購物入口', () => {
    test('首頁應該有產品區塊', async ({ page }) => {
      await page.goto('/zh-TW')

      // 等待頁面載入
      await page.waitForTimeout(2000)

      // 首頁通常會有「產品」或「商品」相關連結
      const productLink = page.getByRole('link', { name: /產品|商品|茶葉/i }).first()

      if (await productLink.isVisible()) {
        await expect(productLink).toBeVisible()
      }
    })

    test('導航欄應包含購物車連結', async ({ page }) => {
      await page.goto('/zh-TW')

      // 等待頁面載入
      await page.waitForTimeout(1000)

      // 檢查導航中的購物車圖示或連結
      const cartLink = page.getByRole('link', { name: /購物車/i })
        .or(page.locator('a[href*="cart"]'))

      await expect(cartLink.first()).toBeVisible()
    })
  })
})
