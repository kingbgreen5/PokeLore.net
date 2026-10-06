// Run against `npm run preview -- --host 127.0.0.1 --port 4329` after a completed build.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from '../../node_modules/playwright/index.mjs';
import {
  GBA_SAVE_SIZE,
  GEN3_FEEBAS_SAVE_PROFILES,
  SECTOR_CHECKSUM_OFFSET,
  SECTOR_COUNTER_OFFSET,
  SECTOR_ID_OFFSET,
  SECTOR_SIGNATURE,
  SECTOR_SIGNATURE_OFFSET,
  SECTOR_SIZE,
  SECTORS_PER_SLOT,
  calculateGen3SaveChecksum
} from '../../src/utils/emeraldSaveParser.js';
import { buildPublicTileSet } from '../../src/utils/rseFeebasPublicCalculator.js';

const origin = process.argv[2] ?? 'http://127.0.0.1:4329';
const results = { origin, checkedAt: new Date().toISOString(), cases: [] };

function u16(bytes, offset, value) { bytes[offset] = value & 0xff; bytes[offset + 1] = value >>> 8; }
function u32(bytes, offset, value) { bytes[offset] = value & 0xff; bytes[offset + 1] = value >>> 8; bytes[offset + 2] = value >>> 16; bytes[offset + 3] = value >>> 24; }
function syntheticSave(profile, value) {
  const layout = GEN3_FEEBAS_SAVE_PROFILES[profile === 'emerald' ? 'emerald' : 'rubySapphire'];
  const save = new Uint8Array(GBA_SAVE_SIZE);
  for (let id = 0; id < SECTORS_PER_SLOT; id += 1) {
    const sector = new Uint8Array(SECTOR_SIZE);
    if (id === 0) u16(sector, 0x0a, 12345);
    if (id === 3) u16(sector, layout.feebasSectorOffset, Number.parseInt(value, 16));
    u16(sector, SECTOR_ID_OFFSET, id);
    u16(sector, SECTOR_CHECKSUM_OFFSET, calculateGen3SaveChecksum(sector, layout.sectorDataSizes[id]));
    u32(sector, SECTOR_SIGNATURE_OFFSET, SECTOR_SIGNATURE);
    u32(sector, SECTOR_COUNTER_OFFSET, 7);
    save.set(sector, id * SECTOR_SIZE);
  }
  return save;
}

async function chooseWords(page) {
  await page.locator('[data-rse-calculator] button', { hasText: 'Game Information' }).click();
  await page.locator('input[inputmode="numeric"]').fill('12345');
  await page.locator('select').nth(0).selectOption({ index: 1 });
  await page.locator('select').nth(1).selectOption({ index: 1 });
}

async function load(page) {
  const response = await page.goto(`${origin}/rse-feebas-calculator`, { waitUntil: 'load' });
  assert.equal(response.status(), 200);
  await page.locator('[data-rse-calculator]').waitFor();
  assert.equal(await page.locator('[data-rse-calculator] button[aria-pressed="true"]', { hasText: 'Emerald' }).count(), 1, 'Emerald is the default profile');
  assert.equal(await page.locator('[data-rse-calculator] button[aria-selected="true"]', { hasText: 'Upload Save File' }).count(), 1, 'save upload is the default method');
}

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const requests = [];
  page.on('request', request => requests.push(request.url()));
  await load(page);

  const emerald = syntheticSave('emerald', '1234');
  await page.locator('input[type=file]').setInputFiles({ name: 'emerald.sav', mimeType: 'application/octet-stream', buffer: emerald });
  await page.getByText('Save read successfully. Your save stays on your device.').waitFor();
  const expectedEmeraldTiles = buildPublicTileSet('1234').reachableTiles.length;
  assert.equal(await page.locator('.rse-route119-highlight').count(), expectedEmeraldTiles, 'Emerald save renders canonical player-facing locations');
  await page.getByRole('button', { name: 'Hint' }).click();
  assert.equal(await page.locator('.rse-route119-area-tile').count() > 0, true, 'hint mode renders search areas');
  await page.getByRole('button', { name: 'Exact' }).click();
  assert.equal(await page.locator('.rse-route119-highlight').count(), expectedEmeraldTiles, 'exact mode restores exact highlights');
  results.cases.push('emerald-save-and-map-modes');

  await page.getByRole('button', { name: 'Ruby/Sapphire' }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'wrong-profile.sav', mimeType: 'application/octet-stream', buffer: emerald });
  await page.getByRole('alert').filter({ hasText: /does not match the selected game profile/i }).waitFor();
  const ruby = syntheticSave('ruby-sapphire', 'BEEF');
  await page.locator('input[type=file]').setInputFiles({ name: 'ruby.sav', mimeType: 'application/octet-stream', buffer: ruby });
  await page.getByText('Save read successfully. Your save stays on your device.').waitFor();
  assert.equal(await page.locator('.rse-route119-highlight').count(), buildPublicTileSet('BEEF').reachableTiles.length, 'Ruby/Sapphire save uses selected parser');
  results.cases.push('selected-profile-and-wrong-profile');

  await page.getByRole('button', { name: 'Reset calculator' }).click();
  await chooseWords(page);
  await page.getByRole('button', { name: 'Calculate' }).click();
  await page.getByText('Possible tile sets calculated.').waitFor();
  assert.equal(await page.locator('.rse-feebas-set-card').count() > 0, true, 'Emerald phrase recovery creates tile sets');
  await page.locator('.rse-feebas-set-card input[type=checkbox]').first().check();
  results.cases.push('emerald-recovery-and-set-toggle');

  await page.getByRole('button', { name: 'Ruby/Sapphire' }).click();
  await page.getByRole('radio', { name: 'Dead' }).check();
  await page.getByRole('button', { name: 'Calculate' }).click();
  await page.getByText('Possible tile sets calculated.').waitFor();
  assert.equal(await page.locator('.rse-feebas-set-card').count() > 0, true, 'dead battery recovery creates tile sets');
  await page.getByRole('radio', { name: 'Unsure' }).check();
  await page.getByRole('button', { name: 'Calculate' }).click();
  await page.getByRole('alert').filter({ hasText: /Choose whether the internal battery/i }).waitFor();
  results.cases.push('ruby-sapphire-dead-and-unsure');

  await page.getByRole('radio', { name: 'Working' }).check();
  await page.getByRole('button', { name: 'Calculate' }).click();
  await page.getByText('Working-battery priority map calculated.').waitFor({ timeout: 45000 });
  const workerTileCount = await page.locator('.rse-route119-priority-tile').count();
  assert(workerTileCount > 0, 'worker calculation produces priority tiles');
  await page.getByRole('button', { name: 'Heatmap' }).click();
  await page.getByLabel('Show priority tiles').selectOption('top10');
  assert.equal(await page.locator('.rse-route119-priority-tile').count() <= 10, true, 'priority filter limits visible tiles');
  results.cases.push('working-battery-worker-and-priority-controls');

  const uploadedRequests = requests.filter(url => /emerald\.sav|ruby\.sav|wrong-profile\.sav/i.test(url));
  assert.equal(uploadedRequests.length, 0, 'save input creates no network upload');
  await page.close();

  const fallback = await browser.newPage();
  await fallback.addInitScript(() => { Object.defineProperty(window, 'Worker', { value: undefined, configurable: true }); });
  await load(fallback);
  await fallback.getByRole('button', { name: 'Ruby/Sapphire' }).click();
  await chooseWords(fallback);
  await fallback.getByRole('radio', { name: 'Working' }).check();
  await fallback.getByRole('button', { name: 'Calculate' }).click();
  await fallback.getByText('Working-battery priority map calculated.').waitFor({ timeout: 45000 });
  assert.equal(await fallback.locator('.rse-route119-priority-tile').count(), workerTileCount, 'same-thread fallback agrees with Worker output');
  await fallback.close();
  results.cases.push('working-battery-same-thread-fallback');

  const imageFallback = await browser.newPage();
  await imageFallback.route('**/images/maps/route-119-feebas-map.png', route => route.fulfill({ status: 404, body: '' }));
  await load(imageFallback);
  await imageFallback.getByRole('button', { name: 'Ruby/Sapphire' }).click();
  await imageFallback.locator('input[type=file]').setInputFiles({ name: 'ruby.sav', mimeType: 'application/octet-stream', buffer: ruby });
  await imageFallback.getByText(/Map image not found at/).waitFor();
  await imageFallback.close();
  results.cases.push('map-image-failure');

  mkdirSync('evidence/rse-feebas', { recursive: true });
  writeFileSync('evidence/rse-feebas/browser.json', JSON.stringify(results, null, 2));
  console.log(`PASS RSE Feebas browser: ${results.cases.length} calculator, parser-profile, recovery, map, Worker/fallback, and local-privacy checks.`);
} finally {
  await browser.close();
}
