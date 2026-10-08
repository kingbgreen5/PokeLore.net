import assert from 'node:assert/strict';
import { chromium } from '../../node_modules/playwright/index.mjs';

const origin = (process.argv[2] ?? 'http://127.0.0.1:8788').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true });
const errors = [];

try {
  const page = await browser.newPage();
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));

  const directUrl = `${origin}/single-type-coverage?version=red-blue&type=fire`;
  await page.goto(directUrl, { waitUntil: 'networkidle' });
  await page.locator('.single-type-recommendation').first().waitFor({ state: 'visible' });
  assert.equal(await page.locator('#single-type-coverage-version').inputValue(), 'red-blue');
  assert.equal(await page.locator('#single-type-coverage-type').inputValue(), 'fire');

  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.single-type-recommendation').first().waitFor({ state: 'visible' });
  assert.equal(await page.locator('#single-type-coverage-version').inputValue(), 'red-blue');
  assert.equal(await page.locator('#single-type-coverage-type').inputValue(), 'fire');

  const noJavaScript = await browser.newPage({ javaScriptEnabled: false });
  await noJavaScript.goto(`${origin}/single-type-coverage`, { waitUntil: 'domcontentloaded' });
  assert.match(await noJavaScript.locator('body').textContent(), /This calculator requires JavaScript to run\./);
  await noJavaScript.close();

  assert.deepEqual(errors, [], `browser errors on direct load or refresh:\n${errors.join('\n')}`);
  console.log(`Single Type Coverage browser regression passed against ${origin}.`);
} finally {
  await browser.close();
}
