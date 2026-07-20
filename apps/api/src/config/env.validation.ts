import * as Joi from 'joi';

/**
 * 環境變數驗證 Schema
 *
 * 在應用程式啟動時驗證所有必要環境變數，避免因缺少設定而在執行期間崩潰。
 * 使用 Joi 進行 schema 驗證，配合 NestJS ConfigModule 實現啟動時驗證。
 *
 * 驗證規則：
 * - 必要變數：缺少會導致啟動失敗
 * - 選填變數：有合理預設值或可為空
 * - 格式驗證：URL 格式、最小長度等
 */
export const envValidationSchema = Joi.object({
  // === 必要環境變數（缺少會啟動失敗）===
  DATABASE_URL: Joi.string()
    .uri()
    .required()
    .description('PostgreSQL 連線字串'),
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT 簽名密鑰（至少 32 字元以確保安全性）'),

  // === 伺服器設定（有預設值）===
  PORT: Joi.number().default(3001).description('API 服務埠號'),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development')
    .description('執行環境'),

  // === 前端 URL（有預設值，用於 CORS 設定）===
  FRONTEND_URL: Joi.string()
    .uri()
    .default('http://localhost:5173')
    .description('用戶端前端 URL（用於 CORS）'),
  ADMIN_URL: Joi.string()
    .uri()
    .default('http://localhost:5174')
    .description('管理後台 URL（用於 CORS）'),

  // === Google OAuth（選填，但若填了核心欄位需成對）===
  GOOGLE_CLIENT_ID: Joi.string()
    .optional()
    .description('Google OAuth Client ID'),
  GOOGLE_CLIENT_SECRET: Joi.string()
    .optional()
    .description('Google OAuth Client Secret'),
  GOOGLE_CALLBACK_URL: Joi.string()
    .uri()
    .optional()
    .description('Google OAuth 回調 URL'),

  // === Email 服務（選填）===
  RESEND_API_KEY: Joi.string().optional().description('Resend API 金鑰'),
  RESEND_FROM_EMAIL: Joi.string()
    .email()
    .optional()
    .description('Resend 寄件者 Email'),

  // === ECPay 金流（選填，生產環境需設定）===
  ECPAY_MERCHANT_ID: Joi.string().optional().description('ECPay 商店代號'),
  ECPAY_HASH_KEY: Joi.string().optional().description('ECPay HashKey'),
  ECPAY_HASH_IV: Joi.string().optional().description('ECPay HashIV'),
  ECPAY_API_URL: Joi.string().uri().optional().description('ECPay API URL'),
  ECPAY_NOTIFY_URL: Joi.string()
    .uri()
    .optional()
    .description('ECPay 付款通知 URL（後端）'),
  ECPAY_RETURN_URL: Joi.string()
    .uri()
    .optional()
    .description('ECPay 付款完成返回 URL（前端）'),
  ECPAY_CLIENT_BACK_URL: Joi.string()
    .uri()
    .optional()
    .description('ECPay 取消付款返回 URL（前端）'),
  ECPAY_PAYMENT_INFO_URL: Joi.string()
    .uri()
    .optional()
    .description('ECPay 付款資訊通知 URL（ATM/CVS）'),

  // === Supabase 儲存（選填）===
  SUPABASE_URL: Joi.string().uri().optional().description('Supabase 專案 URL'),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string()
    .optional()
    .description('Supabase Service Role Key'),

  // === 效能監控 ===
  SLOW_REQUEST_THRESHOLD: Joi.number()
    .default(500)
    .description('慢請求閾值（毫秒）'),

  // === 開發後門（預設關閉，fail-safe）===
  // dev-login 端點免憑證即可取得 ADMIN session，僅供本機開發使用。
  // 刻意設計為「未設定 = 關閉」，讓漏設環境變數的後果是「本機不能用」而非「後門大開」。
  // 切勿在任何雲端環境（含 preview / staging）設為 true。
  ENABLE_DEV_LOGIN: Joi.string()
    .valid('true', 'false')
    .default('false')
    .description('是否啟用 dev-login 端點（僅限本機開發）'),
});
