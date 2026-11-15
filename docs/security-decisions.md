# 安全設計決策

2026-11 安全審查（api / web / admin 全面掃描，HIGH 與主要 MEDIUM 已修並上線）留下的**設計理由、被否決的做法、踩過的坑**。
修了哪些項目看 git log；必須遵守的不變式寫在根目錄與各 app 的 `CLAUDE.md`，這裡只說明「為什麼」，不重複規則本身。

---

## 1. 狀態寫入：先讀後寫一律改成條件式寫入

審查中的 MEDIUM 有一半是同一種錯：先讀出狀態、判斷、再寫入，中間沒保證狀態沒變。
兩個請求同時進來（連按兩次、綠界重送通知、逾期取消同時觸發）就會讓副作用跑兩次，而且不報錯。

**統一寫法**：`updateMany({ where: { id, status: 讀到的值 } })` 再看 `count`，`count === 0` 代表被別人搶先，整筆交易回滾。
套用處：綠界付款通知、退款（用 payment 的 `updatedAt` 當樂觀鎖，只放行一個請求呼叫綠界）、折扣碼使用次數、預約佔名額與取消、訂單取消。

建立付款則用 `SELECT … FOR UPDATE` 鎖訂單列：
- **否決**：在 `payments` 加 partial unique index（`order_id WHERE status='pending'`）。正確，但正式環境沒有自動 migration，要手動對正式庫跑，且既有重複資料會讓 migration 失敗。列鎖不改 schema，效果相同。
- **坑**：鎖之前讀到的訂單狀態，拿到鎖時可能已過期（顧客剛取消）。鎖內要**重新讀一次所有判斷條件**，不能只重讀「有沒有 pending 付款」（審查抓到，`8b5598f`）。

## 2. 退款

- **累計退滿才把付款標成已退款**：部分退款不動訂單狀態。早期版本部分退款就把整張訂單設成已退款。
- **綠界已退款、之後資料庫出錯 → 不回滾、不標失敗**：錢已經退了，標失敗會讓人重試而重複退款。改標 `paymentStatus: refunded` 並記 error log 供人工核對。
- **請求送出後讀不到回應 → 維持 `processing`**：不知道綠界有沒有收到，標 failed 會誘發重試。
- 未出貨全額退款自動取消並補庫存；已出貨／已送達轉 `refunded` 並收回點數。收回點數統一走 `MembersService.revokeOrderRewardsSafe`（失敗只記 log，不讓已完成的退款回錯誤）。

## 3. 已付款訂單不能直接取消

取消只補庫存、不退錢，所以已付款訂單要先走退款。「是不是綠界付款」看**有沒有 `status: 'paid'` 的 Payment 紀錄**。

- **否決**：看 `order.paymentMethod`。那是顧客結帳時自己送的字串，可以偽造成「線下付款」來繞過檢查（冷眼審查抓到，`082127c`）。
- 線下收款（電話確認）的訂單仍可由後台直接取消，退款在線下處理。

## 4. Google 登入

- **帳號預佔**：只接受 Google 回報已驗證的 email（布林或字串 `"true"` 都要接受，套件兩種都會給）。綁定既有密碼帳號時清掉原密碼並撤銷所有登入 —— 否則先用別人的 email 註冊密碼帳號的人，能在對方用 Google 登入後繼續用密碼登入。
- **登入 CSRF**：`state` 原本是固定值。改成 `<target>.<nonce>`，nonce 存 httpOnly cookie（path 限 `/api/v1/auth/google`、10 分鐘）。
  比對放在 `GoogleStrategy.validate`，**在建立或綁定帳號之前**；最初只在 controller 比對，帳號已經建好了才拒絕（冷眼審查改，`47d1a12`）。
- 改 OAuth 一定要用無痕視窗實測 web 與 admin 各一次：一般模式的 Chrome 不擋第三方 cookie，測不出問題（見根目錄 `CLAUDE.md`「Web 登入 Cookie 必須是第一方」）。

## 5. Token 存雜湊

refresh token 與重設密碼 token 改存 SHA-256。schema 不用改（同一欄位改存雜湊），但**要用 migration 就地把舊 token 轉成雜湊**，否則部署當下所有人被登出。
做法：migration `20261115_hash_auth_tokens`，部署後立刻對正式庫套用。

## 6. 登入的帳號列舉與鎖定

- Google 帳號用密碼登入時的訊息，改成和「帳號不存在」相同。
- 帳號不存在時也跑一次 bcrypt（`TIMING_DUMMY_HASH`），讓回應時間一致。
- 失敗次數用原子遞增；重設密碼即解鎖。
- **刻意保留**：第 5 次失敗的鎖定訊息（讓真正的使用者知道被鎖）、註冊時的「email 已存在」（要先做 email 驗證才能消除）。

## 7. 權限

- `RolesGuard` 在沒設 `@Roles` 時**拒絕**（fail-closed）。原本是放行，等於忘了加 `@Roles` 的端點對所有登入者開放。
  `common/guards/roles-coverage.spec.ts` 讀遍所有 controller 的 metadata，掛了 guard 卻沒 `@Roles` 會讓 CI 失敗；它含一個故意漏設的對照組，證明它真的抓得到。
- 退款與確認人工退款限 ADMIN（方法層級 `@Roles` 覆蓋類別層級）：STAFF 可查詢、不可動錢。

## 8. 公開端點

- **公開路由用 `findOnePublic()`，`findOne()` 留給後台與內部**（規則見 `apps/api/CLAUDE.md`）。
  **否決**：直接在 `findOne` 加上架篩選 —— 後台編輯頁也打公開端點，草稿會打不開。正確做法是先替後台開 `GET /admin/<資源>/:id`。
- farm-tours 的公開 `findOne` 曾帶出所有預約人的姓名、電話、備註（唯一的 HIGH，`9b79ac6`）。
- 公開評論不回傳 `userId`；API 比對登入者後回傳 `isOwn`，前端只需要知道「是不是我的」。

## 9. 輸入與輸出

- 分頁參數用 `ParseBoundedIntPipe` 限上下限。**坑**：`main.ts` 的全域 `ValidationPipe({ transform: true })` 會先把 `limit: number` 轉成數字，`?limit=abc` 到自訂 pipe 時已是 `NaN`；單元測試直接傳字串測不出來，是啟動 Docker 映像實際打請求才發現（`8e787dc`）。
- 後台訂單列表上限是 10000 而不是 100：後台 CSV 匯出一次要 10000 筆。
- CSV 匯出：字串以 `= + - @ Tab CR` 開頭時加前綴 `'`，防公式注入；帶正負號的數字（如 `+5.2%`）不加。
- Email 範本裡使用者可控的欄位一律 `escapeHtml`。
- 上傳副檔名改白名單（jpg / jpeg / png / webp / gif），不取用戶端檔名：bucket 是公開的，`.html`、`.svg` 能在 storage 網域執行腳本。
- 首頁新聞的 `link_url` 只接受站內路徑或 `http(s)://`。

## 10. 前端

- 登入後的導向用 `lib/safe-redirect.ts`：URL 解析後比對 origin，並擋正規化後仍以 `//` 開頭的路徑（`/.//evil.com` 能通過單純的 origin 比對）。
- 付款結果頁改查後端的付款狀態，不看網址的 `?status=success`。
- 登出時清掉結帳表單（收件人姓名、電話、地址存在 localStorage，共用電腦會被下一個人看到）。
- 後台 store 只存 id、名稱、頭像，不存 email 與角色（沒有人讀，localStorage 任何腳本都讀得到）。
- 後台加 `X-Frame-Options: DENY` 與 `frame-ancestors 'none'`（點擊劫持）；`form-action` 加入綠界網域，否則付款表單送不出去。

## 11. 依賴與部署

- 依賴升級後，套件的 `engines.node` 要和 Docker 映像對照。`@supabase/supabase-js` 2.119 需要 Node 22，映像還是 Node 20 時 Render 啟動失敗，**而且靜默保留舊版本**；本機（Node 22）、單元測試與 e2e（Supabase 被 mock）全部測不出來。
- 驗收方式：本機 `docker build -f Dockerfile.api` 後帶假的 `SUPABASE_URL` 啟動容器（讓 `createClient()` 真的執行），`/health/ready` 回 connected 才算過。
- GitHub 的 Dependabot alerts、Secret scanning、Push protection 已開啟。

---

## 審查方法的教訓

- **寫程式的 session 會替自己的決定找理由**：金流、權限、登入相關的改動 push 前一律另開審查。這輪的冷眼審查抓到了 4 個寫的人沒看到的問題（OAuth 比對時機、`paymentMethod` 可偽造、鎖內沒重讀訂單狀態、退款送出後的錯誤處理）。
- **改狀態前先找齊所有寫入點**：同一個狀態（如 `cancelled`）有多條寫入路徑，只修其中一條，另一條照樣會重複執行副作用。
