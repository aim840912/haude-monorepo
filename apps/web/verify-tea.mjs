import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

const sectionTop = await page.evaluate(() => {
  for (const s of document.querySelectorAll('section')) {
    if ((s.className || '').includes('h-[200vh]') || (s.className || '').includes('h-[300vh]'))
      return s.getBoundingClientRect().top + window.scrollY;
  }
  return 0;
});

if (sectionTop > 0) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), sectionTop);
}

await new Promise(() => {});
