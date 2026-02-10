const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
const API_VERSION = 'v1'

/** API URL（含版本前綴）— Server / Client Components 皆可安全匯入 */
export const API_URL = `${API_BASE}/api/${API_VERSION}`
