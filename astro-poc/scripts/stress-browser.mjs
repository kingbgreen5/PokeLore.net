// Run against `npm run preview -- --host 127.0.0.1`.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '../../node_modules/playwright/index.mjs';
import { STRESS_SLUGS } from '../src/lib/links.js';
import { loadPokemon } from '../src/lib/pokemonData.js';

const origin = process.argv[2] ?? 'http://127.0.0.1:4321';
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  for (const slug of STRESS_SLUGS) {
    const data = loadPokemon(slug);
    const response = await page.goto(`${origin}/pokemon/${slug}`, { waitUntil: 'load' });
    assert.equal(response.status(), 200, slug);
    assert.equal(await page.locator('h1').count(), 1, `${slug}: one H1`);
    for (const selector of ['.hero-summary', '.hero-types', '#abilities', '#stats', '#matchups', '#evolution', '#biology', '#learnset', '#dex-entries']) {
      assert.equal(await page.locator(selector).count(), 1, `${slug}: ${selector}`);
    }
    assert.equal(await page.locator('#analysis').count() > 0, Boolean(data.analysis.playthrough || data.analysis.competitive || data.analysis.nuzlocke));
    assert.equal(await page.locator('#encounters').count() > 0, data.hasEncounters);
    assert.equal(await page.locator('#size-comparison').count() > 0, data.hasSizeComparison);
    assert(await page.locator('.hero-artwork').evaluate(image => image.complete && image.naturalWidth > 0), `${slug}: artwork loaded`);
    assert.equal(await page.locator('#navigation a[data-pokemon-name]').count(), 9, `${slug}: nine crawlable nearby navigation links`);
    assert.equal(await page.locator(`#navigation a[data-pokemon-name="${slug}"][aria-current="page"]`).count(), 1, `${slug}: current routed form is identified in navigation`);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: no document overflow at 390px`);
    results.push({ slug, mobile: 'pass' });
  }
  const representatives = ['eevee', 'tyrogue', 'tauros-paldea-combat-breed', 'rotom-heat', 'mewtwo', 'minior-blue'];
  for (const width of [768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const slug of representatives) {
      await page.goto(`${origin}/pokemon/${slug}`, { waitUntil: 'load' });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: no document overflow at ${width}px`);
      assert.equal(await page.locator('#navigation a[data-pokemon-name]').count(), 9, `${slug}: static navigation remains compact at ${width}px`);
      assert.equal(await page.locator(`#navigation a[data-pokemon-name="${slug}"][aria-current="page"]`).count(), 1, `${slug}: current navigation card at ${width}px`);
    }
  }
  const interactive = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  interactive.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  interactive.on('pageerror', error => errors.push(error.message));
  const learnsetResponse = await interactive.goto(`${origin}/pokemon/charizard`, { waitUntil: 'load' });
  assert.equal(learnsetResponse.status(), 200, 'interactive learnset page');
  await interactive.locator('#learnset > summary').click();
  await interactive.locator('#learnset select').scrollIntoViewIfNeeded();
  await interactive.waitForFunction(() => !document.querySelector('#learnset astro-island')?.hasAttribute('ssr'));
  await interactive.locator('#learnset select').selectOption('all');
  await interactive.locator('#learnset .learnset-methods').waitFor();
  assert(await interactive.locator('#learnset-static-charizard').isHidden(), 'alternate selection hides the static latest table');
  assert(await interactive.locator('#learnset .learnset-methods a[href*="/move/"]').count() > 0, 'alternate learnset retains move links');
  assert(await interactive.locator('#learnset .learnsetCard').count() > 1, 'alternate learnset retains method groups');
  await interactive.locator('#learnset select').selectOption(await interactive.locator('#learnset-static-charizard').getAttribute('data-static-version'));
  assert(await interactive.locator('#learnset-static-charizard').isVisible(), 'latest selection restores the static table');
  await interactive.locator('#navigation').scrollIntoViewIfNeeded();
  await interactive.waitForFunction(() => !document.querySelector('#navigation astro-island')?.hasAttribute('ssr'));
  await interactive.locator('#navigation button', { hasText: 'Browse full Pokédex' }).click();
  await interactive.waitForFunction(() => document.querySelectorAll('#navigation a[data-pokemon-name]').length === 1352);
  assert.equal(await interactive.locator('#navigation a[data-pokemon-name]').count(), 1352, 'shared navigation registry loads after interaction');
  assert.equal(await interactive.locator('#navigation a[data-pokemon-name="charizard"][aria-current="page"]').count(), 1, 'current Pokémon remains highlighted after registry load');
  await interactive.locator('#navigation a[data-pokemon-name="charmeleon"]').click();
  await interactive.waitForURL(`${origin}/pokemon/charmeleon`);
  assert.equal(await interactive.locator('h1').textContent(), 'Charmeleon', 'carousel uses ordinary document navigation');
  await interactive.goBack({ waitUntil: 'load' });
  assert.equal(await interactive.locator('h1').textContent(), 'Charizard', 'browser back restores the previous document');
  await interactive.setViewportSize({ width: 390, height: 844 });
  await interactive.goto(`${origin}/pokemon/raichu-alola`, { waitUntil: 'load' });
  await interactive.locator('#navigation').scrollIntoViewIfNeeded();
  await interactive.waitForFunction(() => !document.querySelector('#navigation astro-island')?.hasAttribute('ssr'));
  await interactive.locator('#navigation button', { hasText: 'Browse full Pokédex' }).click();
  await interactive.waitForFunction(() => document.querySelectorAll('#navigation a[data-pokemon-name]').length === 1352);
  assert.equal(await interactive.locator('#navigation a[data-pokemon-name="raichu-alola"][aria-current="page"]').count(), 1, 'regional form remains current in mobile full navigation');
  assert(await interactive.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'interactive navigation does not overflow the mobile document');
  assert.deepEqual(errors, [], `interactive browser errors: ${errors.join('; ')}`);
  await interactive.close();
  mkdirSync('evidence/stress', { recursive: true });
  writeFileSync('evidence/stress/browser.json', JSON.stringify({ origin, results, representativeWidths: [390, 768, 1440], interactiveLearnset: 'pass', interactiveNavigation: 'pass', consoleErrors: errors }, null, 2));
  console.log(`PASS: ${STRESS_SLUGS.length} JavaScript-off pages at 390px; six difficult pages at 768px and 1440px; on-demand learnset and shared navigation interactions.`);
} finally {
  await browser.close();
}
