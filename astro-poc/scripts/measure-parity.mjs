// Run against a built POC preview; payload sizes exclude HTTP compression headers.
import { chromium } from '../../node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { parseHTML } from 'linkedom';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const scripts = new Set();
  page.on('request', request => { if (request.resourceType() === 'script') scripts.add(request.url()); });
  await page.goto('http://127.0.0.1:4321/pokemon/kakuna', { waitUntil: 'networkidle' });
  const initial = [...scripts];
  for (const selector of ['#learnset', '#encounters', '#additional-images', '.etsy-merch-promo', '#size-comparison', '#navigation']) {
    const target = page.locator(selector);
    if (await target.count()) await target.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(350);
  }
  const sizes = urls => urls.filter(url => url.includes('/_astro/') && url.endsWith('.js')).map(url => {
    const file = decodeURIComponent(new URL(url).pathname.split('/').pop());
    const bytes = readFileSync(`dist/_astro/${file}`);
    return { file, bytes: bytes.length, gzip: gzipSync(bytes).length };
  });
  const html = readFileSync('dist/pokemon/kakuna');
  const document = parseHTML(html.toString()).document;
  const inline = [...document.querySelectorAll('script:not([src])')].filter(s => s.type !== 'application/ld+json').map(s => s.textContent).join('\n');
  const report = { html: { bytes: html.length, gzip: gzipSync(html).length }, inlineScriptBytes: Buffer.byteLength(inline), initial: sizes(initial), afterScrolling: sizes([...scripts]), searchDataBytes: readFileSync('dist/data/search.json').length };
  mkdirSync('evidence/phase1b', { recursive: true });
  writeFileSync('evidence/phase1b/performance.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); }
