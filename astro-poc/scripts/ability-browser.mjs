import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '../../node_modules/playwright/index.mjs';
import { abilityModel } from '../src/lib/abilityData.js';
import { ABILITY_STRESS_SLUGS } from '../src/lib/abilityRoutes.js';

console.warn = () => {};
const origin = process.argv[2] ?? 'http://127.0.0.1:4329';
const staging = origin.startsWith('https://');
const browser = await chromium.launch({ headless: true });
const results = { origin, checkedAt: new Date().toISOString(), pages: [], responsive: [], regressions: [] };
try {
  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  for (const slug of ABILITY_STRESS_SLUGS) {
    const response = await noJs.goto(`${origin}/ability/${slug}`, { waitUntil: 'load', timeout: 45000 });
    assert.equal(response.status(), 200, slug);
    if (staging) assert.match(response.headers()['x-robots-tag'] ?? '', /noindex/i, `${slug}: staging noindex`);
    const model = abilityModel(slug);
    assert.equal((await noJs.locator('h1').innerText()).trim(), model.displayName);
    assert.equal(await noJs.locator('.ability-holder-cards .pokemon-summary-card').count(), model.routedHolderCount);
    assert(await noJs.locator('.ability-effect').innerText());
    assert(await noJs.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: mobile overflow`);
    results.pages.push({ slug, holders: model.routedHolderCount });
  }
  const invalid = await noJs.goto(`${origin}/ability/not-a-real-ability`, { waitUntil: 'load' });
  assert.equal(invalid.status(), 404);
  if (staging) {
    const slash = await noJs.goto(`${origin}/ability/levitate/`, { waitUntil: 'load' });
    assert.equal(slash.status(), 200);
    assert.equal(new URL(noJs.url()).pathname, '/ability/levitate');
  }
  await noJs.close();

  for (const width of [320, 390, 768, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    for (const slug of ['sturdy', 'protean', 'embody-aspect']) {
      await page.goto(`${origin}/ability/${slug}`, { waitUntil: 'load' });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: ${width}px overflow`);
      results.responsive.push({ slug, width });
    }
    await page.close();
  }

  const regression = await browser.newPage({ javaScriptEnabled: false });
  for (const path of [
    '/pokemon/pikachu', '/pokemon/charizard', '/pokemon/eevee', '/pokemon/mewtwo',
    '/pokemon/raichu-alola', '/pokemon/charizard-mega-x', '/pokemon/rotom-wash',
    '/pokemon/frillish-female', '/pokemon/jellicent-female',
    '/move/tackle', '/move/protect', '/move/swift', '/move/return'
  ]) {
    const response = await regression.goto(`${origin}${path}`, { waitUntil: 'load' });
    assert.equal(response.status(), 200, path);
    assert.equal(await regression.locator('h1').count(), 1, path);
    results.regressions.push(path);
  }
  await regression.close();
  mkdirSync('evidence/abilities', { recursive: true });
  writeFileSync('evidence/abilities/browser.json', JSON.stringify(results, null, 2));
  console.log(`PASS Ability browser: ${ABILITY_STRESS_SLUGS.length} no-JS pages, responsive layouts, normalization, real 404, staging headers, and Pokémon/Move regressions.`);
} finally {
  await browser.close();
}
