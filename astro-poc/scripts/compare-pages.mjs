// Optional local audit: uses the existing repository's Playwright installation.
// Start root Vite on 5180 and POC preview on 4321 first. Not needed on Render.
import { chromium } from '../../node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { join } from 'node:path';
import { repositoryRoot } from '../src/lib/routes.js';
import { loadPokemon } from '../src/lib/pokemonData.js';
import assert from 'node:assert/strict';

mkdirSync('evidence', { recursive: true });
const browser = await chromium.launch({ headless: true });
function snapshot(html, slug) {
  const d = parseHTML(html).document;
  const text = d.body.textContent.replace(/\s+/g, ' ');
  const data = loadPokemon(slug);
  return {
    title: d.querySelector('title')?.textContent,
    description: d.querySelector('meta[name="description"]')?.getAttribute('content'),
    canonical: [...d.querySelectorAll('link[rel="canonical"]')].map(n => n.getAttribute('href')),
    h1: [...d.querySelectorAll('h1')].map(n => n.textContent),
    headings: [...d.querySelectorAll('h2,h3')].map(n => n.textContent),
    schema: [...d.querySelectorAll('script[type="application/ld+json"]')].map(n => JSON.parse(n.textContent)),
    summaryPresent: text.includes(data.summary),
    analysis: Object.fromEntries(['playthrough','competitive','nuzlocke','biologyAndBehavior'].map(k => [k,text.includes(data.analysis[k].replace(/\s+/g,' '))])),
    links: [...new Set([...d.querySelectorAll('a[href]')].map(n => n.getAttribute('href')))],
    text
  };
}
try {
  const report = {};
  for (const slug of ['kakuna', 'pikachu', 'charizard']) {
    const rawPath = join(repositoryRoot, 'dist/pokemon', slug);
    const raw = existsSync(rawPath) ? snapshot(readFileSync(rawPath, 'utf8'), slug) : null;
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:5180/pokemon/${slug}`, { waitUntil: 'networkidle' });
    await page.locator('h1').waitFor();
    for (const button of await page.locator('button[aria-expanded="false"]').all()) {
      if (await button.isVisible()) await button.click();
    }
    await page.waitForTimeout(1500);
    const react = snapshot(await page.content(), slug);
    await page.close();
    const staticPage = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
    const response = await staticPage.goto(`http://127.0.0.1:4321/pokemon/${slug}`);
    assert.equal(response.status(), 200);
    for (const id of ['analysis','biology','learnset','encounters']) assert(await staticPage.locator(`#${id}`).isVisible());
    assert(await staticPage.locator('img').evaluate(img => img.complete && img.naturalWidth > 0));
    const astro = snapshot(await staticPage.content(), slug);
    assert(astro.summaryPresent && Object.values(astro.analysis).every(Boolean));
    await staticPage.screenshot({ path: `evidence/${slug}-desktop.png`, fullPage: false });
    await staticPage.setViewportSize({ width: 390, height: 844 });
    assert(await staticPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await staticPage.screenshot({ path: `evidence/${slug}-mobile.png`, fullPage: false });
    report[slug] = { raw, react, astro };
    await staticPage.close();
    console.log(`${slug}: raw=${Boolean(raw)}, React=${react.h1.join(',')}, Astro no-JS content and mobile layout PASS`);
  }
  const page = await browser.newPage({ javaScriptEnabled: false });
  for (const path of ['/pokemon/not-a-real-pokemon', '/random-garbage-path']) {
    const response = await page.goto(`http://127.0.0.1:4321${path}`);
    assert.equal(response.status(), 404);
    assert.equal(await page.locator('h1').textContent(), 'Page not found');
  }
  writeFileSync('evidence/comparison.json', JSON.stringify(report, null, 2));
  console.log('Local preview invalid paths return 404. Render remains a separate acceptance test.');
} finally { await browser.close(); }
