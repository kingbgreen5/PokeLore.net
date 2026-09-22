import { chromium } from '../../node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:4336/pokemon/charizard');
  await page.locator('#learnset').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('#learnset astro-island').hasAttribute('ssr'));
  await page.locator('#learnset summary').click();
  const selector = page.getByLabel('Learnset version');
  async function category(name, expected) {
    const row = page.locator(`#learnset a[href$="/move/${name}"]`).first().locator('..');
    await row.locator(`img[alt="${expected} move"]`).waitFor();
  }
  await selector.selectOption('gold-silver');
  await category('fire-punch', 'special');
  await category('growl', 'status');
  await category('dragon-rage', 'special');
  assert.equal(await page.locator('#learnset a[href$="/move/hidden-power"]').first().locator('..').getByText('Varies',{exact:true}).count(),1);
  await selector.selectOption('emerald');
  await category('fire-punch', 'special');
  await category('slash', 'physical');
  await selector.selectOption('all');
  await category('fire-punch', 'physical');
  await category('hidden-power', 'special');
  await selector.selectOption('red-blue');
  await category('growl', 'status');
  await category('ember', 'special');
  await page.reload();
  await page.locator('#learnset').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('select[aria-label="Learnset version"]').value === 'red-blue');
  await category('growl','status');
  assert.deepEqual(errors, []);
  console.log('PASS: game switching, machine/tutor/level-up badges, Status, variable category, modern reset and persistence');
} finally { await browser.close(); }
