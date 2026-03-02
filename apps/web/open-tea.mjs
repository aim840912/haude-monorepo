import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

// Find the tea ceremony section and scroll to it
const sectionTop = await page.evaluate(() => {
  for (const s of document.querySelectorAll('section')) {
    if ((s.className || '').includes('h-[200vh]') || (s.className || '').includes('h-[300vh]'))
      return s.getBoundingClientRect().top + window.scrollY;
  }
  return 0;
});

console.log('Tea section top:', sectionTop);

if (sectionTop > 0) {
  // Scroll ~40% into section to see both teapot and teacup
  await page.evaluate((y) => window.scrollTo({ top: y }), sectionTop + 1200);
}

await page.waitForTimeout(1000);
await page.screenshot({ path: './screenshots/2026-02-20/tea-spacing-verify.png' });
console.log('Screenshot saved. Browser stays open for inspection.');

// Keep browser open for user
await new Promise(() => {});
