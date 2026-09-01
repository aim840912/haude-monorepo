#!/usr/bin/env node
/**
 * 線上快取標頭驗收
 *
 * 為什麼需要這支：程式碼裡的設定不是最終真相。Vercel / Cloudflare 的 Dashboard
 * 規則、Nginx 設定、平台對預渲染頁面的預設行為，都可能覆蓋 origin 送出的標頭。
 * 唯一能確認的方法是對線上站台實際發請求。
 *
 * 用法：
 *   node scripts/check-cache-headers.mjs https://haude-web.vercel.app
 *   node scripts/check-cache-headers.mjs https://haude-api.onrender.com --api
 *
 * 任何個人化路徑允許共享快取就 exit 1。
 */

const target = process.argv[2]
const isApi = process.argv.includes('--api')

if (!target) {
  console.error('用法: node scripts/check-cache-headers.mjs <base-url> [--api]')
  process.exit(2)
}

const base = target.replace(/\/$/, '')

/** 絕不可被共享快取的路徑 */
const PERSONALIZED = isApi
  ? ['/api/v1/auth/me', '/api/v1/orders', '/api/v1/cart']
  : ['/account', '/orders', '/cart', '/checkout', '/auth/callback']

/** 應該仍享有 CDN 快取的公開路徑（確認防護沒有誤殺效能） */
const PUBLIC = isApi ? ['/api/v1/products'] : ['/', '/products']

async function head(path) {
  let res
  try {
    res = await fetch(base + path, { redirect: 'manual' })
  } catch (err) {
    // 網路錯誤不該讓整支腳本噴 stack trace —— 回報成可讀的結果
    return { error: err.cause?.code ?? err.message }
  }
  return {
    status: res.status,
    cacheControl: res.headers.get('cache-control'),
    vary: res.headers.get('vary'),
    edge:
      res.headers.get('x-vercel-cache') ??
      res.headers.get('cf-cache-status') ??
      res.headers.get('x-cache'),
    // 建置期預渲染的靜態產物。有這個標記時，邊緣快取命中是安全的 —— 被快取的是
    // 「所有人共用的靜態骨架」，個資由瀏覽器在 hydration 後才填入。
    // 危險的是「命中 + 沒有這個標記」：那代表快取了 request-time 產生的回應。
    prerendered: res.headers.get('x-nextjs-prerender') === '1',
  }
}

const failures = []

console.log(`\n檢查 ${base}\n${'─'.repeat(72)}`)

console.log('\n[個人化路徑] 不得含 public / s-maxage')
for (const path of PERSONALIZED) {
  const { status, cacheControl, vary, edge, prerendered, error } = await head(path)

  if (error) {
    console.log(`  ? ${path.padEnd(22)} 請求失敗：${error}`)
    failures.push(`${path}: 請求失敗（${error}）—— 無法驗證`)
    continue
  }

  const cc = cacheControl ?? ''
  const problems = []

  if (!cacheControl) problems.push('沒有 Cache-Control（交給中介快取自行決定）')
  if (/\bpublic\b/.test(cc)) problems.push('含 public')
  if (/s-maxage=[1-9]/.test(cc)) problems.push('含 s-maxage')
  // 邊緣命中只在「非預渲染」時才是問題：預渲染產物人人相同、不含個資
  if (edge && /HIT/i.test(edge) && !prerendered) {
    problems.push(`邊緣快取命中且非預渲染產物：${edge}`)
  }

  const mark = problems.length ? '✗' : '✓'
  const note = prerendered ? '  [預渲染骨架]' : ''
  console.log(`  ${mark} ${path.padEnd(22)} ${status}  ${cc || '(none)'}${note}`)
  if (vary) console.log(`      Vary: ${vary}`)
  if (problems.length) {
    console.log(`      → ${problems.join('；')}`)
    failures.push(`${path}: ${problems.join('；')}`)
  }
}

console.log('\n[公開路徑] 應維持 CDN 快取')
for (const path of PUBLIC) {
  const { status, cacheControl, edge, error } = await head(path)

  if (error) {
    console.log(`  ? ${path.padEnd(22)} 請求失敗：${error}`)
    continue
  }

  const cc = cacheControl ?? ''
  const cacheable = /\bpublic\b/.test(cc) && /s-maxage=\d+/.test(cc)

  console.log(
    `  ${cacheable ? '✓' : '!'} ${path.padEnd(22)} ${status}  ${cc || '(none)'}${
      edge ? `  [${edge}]` : ''
    }`
  )
  if (!cacheable) {
    console.log('      → 未享有共享快取（不算失敗，但確認是否為預期）')
  }
}

console.log(`\n${'─'.repeat(72)}`)
if (failures.length) {
  console.error(`\n✗ ${failures.length} 個個人化路徑可被共享快取：\n`)
  for (const f of failures) console.error(`  - ${f}`)
  console.error('\n個人化回應一旦進入共享快取，第一個訪客的頁面會被發給所有後續訪客。\n')
  process.exit(1)
}

console.log('\n✓ 所有個人化路徑都不會進入共享快取\n')
