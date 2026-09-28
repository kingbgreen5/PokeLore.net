import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '../../node_modules/playwright/index.mjs';
import { MOVE_STRESS_SLUGS } from '../src/lib/moveRoutes.js';
import { MOVE_SLUGS, loadMove } from '../src/lib/moveData.js';

const origin = process.argv[2] ?? 'http://127.0.0.1:4324';
const localOnly = process.argv.includes('--local-only');
const browser = await chromium.launch({ headless: true });
const results = { origin, checkedAt: new Date().toISOString(), javascriptDisabled: [], responsive: [], productionParity: [], consoleErrors: [] };
const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const browserSamples = [...new Set([...MOVE_STRESS_SLUGS, ...MOVE_SLUGS.filter((_, index) => index % 97 === 0).slice(0, 10)])];
try {
  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  for (const slug of browserSamples) {
    const response = await noJs.goto(`${origin}/move/${slug}`, { waitUntil: 'load' });
    assert.equal(response.status(), 200, slug);
    assert.equal(await noJs.locator('h1').count(), 1, `${slug}: H1`);
    assert(await noJs.locator('.move-effect').innerText(), `${slug}: effect`);
    const data = loadMove(slug);
    assert.equal(await noJs.locator('.move-learner-card').count() > 0, data.learnerCount > 0, `${slug}: static learner availability follows source`);
    assert(await noJs.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: mobile overflow`);
    results.javascriptDisabled.push(slug);
  }
  await noJs.close();

  for (const width of [768, 1440]) {
    const page = await browser.newPage({ javaScriptEnabled: false, viewport: { width, height: 1000 } });
    for (const slug of ['protect', 'curse', 'population-bomb', 'tera-starstorm']) {
      await page.goto(`${origin}/move/${slug}`, { waitUntil: 'load' });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${slug}: ${width}px overflow`);
      results.responsive.push({ slug, width });
    }
    await page.close();
  }

  const interactive = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  interactive.on('console', message => { if (message.type() === 'error') results.consoleErrors.push(message.text()); });
  interactive.on('pageerror', error => results.consoleErrors.push(error.message));
  await interactive.goto(`${origin}/move/protect`, { waitUntil: 'load' });
  const explorer = interactive.locator('.move-learner-explorer');
  await explorer.scrollIntoViewIfNeeded();
  await interactive.waitForFunction(() => {
    const island = [...document.querySelectorAll('astro-island')].find(node => node.querySelector('.move-learner-explorer'));
    return island && !island.hasAttribute('ssr');
  });
  await interactive.locator('.move-learner-tools').waitFor();
  await interactive.locator('.move-historical-learners').waitFor();
  assert(await interactive.locator('.move-historical-learners a').count() > 800, 'complete latest learner set loads');
  assert(await interactive.locator('.move-size-pokemon').count() > 800, 'height chart reflects complete learner set');
  await explorer.getByLabel('Sort by').selectOption('speed');
  await explorer.getByLabel('Direction').selectOption('asc');
  const speedValues = await interactive.locator('.move-historical-learners li span').allTextContents();
  assert(speedValues.every(value => /^Speed: \d+$/.test(value)), 'selected stat is shown');
  await explorer.getByLabel('Minimum').fill('100');
  assert((await interactive.locator('.move-historical-learners li span').allTextContents()).every(value => Number(value.split(': ')[1]) >= 100), 'minimum filter');
  const methods = await explorer.getByLabel('Method').locator('option').allTextContents();
  assert(methods.length > 1, 'method filter populated');
  await explorer.getByRole('button', { name: 'Reset', exact: true }).first().click();
  const older = await explorer.getByLabel('Game generation').locator('option').first().getAttribute('value');
  await explorer.getByLabel('Game generation').selectOption(older);
  await interactive.locator('.move-historical-learners').waitFor();
  await interactive.locator('.move-historical-learners a').first().click();
  await interactive.waitForLoadState('domcontentloaded');
  await interactive.goBack({ waitUntil: 'domcontentloaded' });
  assert.equal(normalize(await interactive.locator('h1').innerText()), 'Protect', 'browser Back restores Move page');
  const applicationErrors = results.consoleErrors.filter(message => !message.includes('ERR_NETWORK_ACCESS_DENIED'));
  assert.equal(applicationErrors.length, 0, 'no interactive application errors');
  await interactive.close();

  const mobileTools = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobileTools.goto(`${origin}/move/protect`, { waitUntil: 'load' });
  const mobileExplorer = mobileTools.locator('.move-learner-explorer');
  await mobileExplorer.scrollIntoViewIfNeeded();
  await mobileTools.waitForFunction(() => [...document.querySelectorAll('astro-island')].some(node => node.querySelector('.move-learner-explorer') && !node.hasAttribute('ssr')));
  await mobileTools.locator('.move-learner-tools').waitFor();
  await mobileTools.locator('.move-size-chart').waitFor();
  assert(await mobileTools.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'interactive tools: 390px page overflow');
  assert(await mobileExplorer.getByLabel('Sort by').isVisible(), 'interactive tools: mobile sort visible');
  assert(await mobileTools.locator('.move-size-scroll').evaluate(element => element.scrollWidth > element.clientWidth), 'interactive tools: chart scrolls internally');
  await mobileTools.close();

  if (!localOnly) for (const slug of ['thunderbolt', 'protect', 'fissure', 'swift', 'tackle', 'tera-starstorm']) {
    const expected = loadMove(slug).move;
    const pair = {};
    for (const [label, site] of [['production', 'https://pokelore.net'], ['astro', origin]]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const response = await page.goto(`${site}/move/${slug}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      assert.equal(response.status(), 200, `${label}: ${slug}`);
      await page.locator('h1').waitFor({ timeout: 30000 });
      if (label === 'production') await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      const text = normalize(await page.locator('body').textContent());
      pair[label] = {
        h1: normalize(await page.locator('h1').innerText()),
        type: text.toLowerCase().includes(expected.type) || await page.locator(`img[alt*="${expected.type}" i]`).count() > 0,
        category: text.toLowerCase().includes(expected.category),
        power: expected.power == null || text.includes(String(expected.power)),
        accuracy: expected.accuracy == null || text.includes(String(expected.accuracy)),
        pp: expected.pp == null || text.includes(String(expected.pp)),
        priority: expected.priority == null || text.includes(String(expected.priority)),
        effect: text.includes(normalize(expected.shortEffect ?? expected.description ?? expected.effect)),
        generation: text.toLowerCase().includes(expected.generation.replace('-', ' ')) || text.toLowerCase().includes(expected.generation),
        learners: /Pokémon That Learn/i.test(text),
        disclosures: expected.pastValues?.length ? /Version History/i.test(text) : true
      };
      await page.close();
    }
    assert.equal(pair.astro.h1, pair.production.h1, `${slug}: identity parity`);
    for (const key of ['type', 'category', 'power', 'accuracy', 'pp', 'priority', 'effect', 'generation', 'learners', 'disclosures']) assert(pair.astro[key], `${slug}: Astro ${key}`);
    results.productionParity.push({ slug, ...pair });
  }

  const invalid = await browser.newPage({ javaScriptEnabled: false });
  const invalidResponse = await invalid.goto(`${origin}/move/not-a-real-move`, { waitUntil: 'load' });
  assert.equal(invalidResponse.status(), 404, 'invalid Move returns 404');
  assert.equal(await invalid.locator('h1').innerText(), 'Page not found');
  results.invalidRoute = 404;
  await invalid.close();
  mkdirSync('evidence/moves', { recursive: true });
  writeFileSync('evidence/moves/browser.json', JSON.stringify(results, null, 2));
  console.log(`PASS Move browser: ${browserSamples.length} no-JS pages, responsive layouts, learner interaction and Back navigation, ${localOnly ? 'local/staging acceptance' : 'production parity'}, real 404.`);
} finally { await browser.close(); }
