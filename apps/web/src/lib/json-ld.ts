/**
 * JSON-LD 安全序列化
 *
 * `JSON.stringify()` 不會跳脫 `<`、`>`、`&`，因此若 schema 內含使用者/管理員
 * 可編輯的欄位（如產品名稱、描述），攻擊者可用 `</script><script>...` 跳出
 * `<script type="application/ld+json">` 標籤，在所有訪客瀏覽器執行任意 JS
 * （stored XSS）。
 *
 * 將這些字元轉為 JSON 的 unicode escape：在 JSON 字串中語意完全等價，
 * Google 結構化資料解析不受影響，但不再具備跳出 HTML 標籤的能力。
 *
 * ⚠️ 所有輸出 JSON-LD 的元件都必須使用此函式，不要在各元件內各自 replace，
 * 否則新增元件時極易漏套（這正是原本 5 個 Schema 元件的問題成因）。
 */
export function safeJsonLd(schema: unknown): string {
  return JSON.stringify(schema)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}
