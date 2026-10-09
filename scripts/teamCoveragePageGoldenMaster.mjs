import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const root = process.cwd(); const host = '127.0.0.1'; const port = 4174; const externalBaseUrl = process.env.E2E_BASE_URL; const baseUrl = externalBaseUrl ?? `http://${host}:${port}`;
const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const storage = { version: 'pokelore:learnset-version', party: 'pokelore:team-coverage-party', sort: 'pokelore:team-coverage-sort:v3' };
const scenarioFlagIndex = process.argv.indexOf('--scenario');
const onlyScenario = process.argv.find(arg => arg.startsWith('--scenario='))?.split('=')[1] ?? (scenarioFlagIndex >= 0 ? process.argv[scenarioFlagIndex + 1] : undefined);
let server; let browser; let attempted = 0; let passed = 0; const logs = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const expect = (value, message) => { if (!value) throw new Error(message); };
function start() {
  if (externalBaseUrl) return;
  expect(existsSync(viteBin), `Missing Vite executable: ${viteBin}`);
  server = spawn(process.execPath, [viteBin, '--host', host, '--port', String(port), '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', data => { logs.push(data.toString()); if (logs.length > 40) logs.shift(); });
}
async function readyServer() {
  if (externalBaseUrl) return;
  for (let i = 0; i < 60; i += 1) {
    if (server.exitCode !== null) throw new Error(`Vite exited (${server.exitCode}):\n${logs.join('')}`);
    try { if ((await fetch(`${baseUrl}/team-coverage`)).ok) return; } catch {}
    await sleep(500);
  }
  throw new Error(`Vite readiness timeout:\n${logs.join('')}`);
}
async function stop() {
  if (!server || server.exitCode !== null) return 'not-running';
  server.kill('SIGTERM');
  if (await Promise.race([once(server, 'exit').then(() => true), sleep(5000).then(() => false)])) return 'SIGTERM';
  server.kill('SIGKILL'); await once(server, 'exit'); return 'SIGKILL';
}
async function pageReady(page) { await page.getByRole('heading', { name: 'Suggested Teammates' }).waitFor({ timeout: 20000 }); await page.getByText(/Showing 1-\d+ of \d+ matches/).waitFor({ timeout: 20000 }); }
async function scenario(name, fn) {
  if (onlyScenario && onlyScenario !== name) return;
  attempted += 1; console.log(`[${name}] start`);
  try {
    await Promise.race([fn(), sleep(30000).then(() => { throw new Error(`${name} exceeded 30 seconds`); })]);
    passed += 1; console.log(`  PASS ${name}`);
  } catch (error) { console.log(`  FAIL ${name}: ${error.message}`); throw error; }
}

async function run() {
  let failure; let cleanup = 'not-started';
  try {
    start(); await readyServer(); console.log(`${externalBaseUrl ? 'External target ready' : `Vite ready: pid=${server.pid}`}; ${baseUrl}`); browser = await chromium.launch();
    await scenario('clean canonical URL and initial requests', async () => {
      const page = await browser.newPage(); const requests = []; page.on('request', request => requests.push(new URL(request.url()).pathname));
      await page.goto(`${baseUrl}/team-coverage`); await pageReady(page); expect(new URL(page.url()).search === '?version=scarlet-violet', page.url());
      for (const path of ['/data/pokemonRoutes.json', '/data/movesIndex.json', '/data/teamCoverage/scarlet-violet.json']) expect(requests.includes(path), `missing ${path}`);
      expect(requests.filter(path => path.startsWith('/data/teamCoverage/')).length === 1, 'more than one coverage dataset'); await page.close();
    });
    await scenario('shared team links are one-time input', async () => {
      const page = await browser.newPage(); await page.addInitScript(keys => { localStorage.setItem(keys.version, JSON.stringify('red-blue')); localStorage.setItem(keys.party, JSON.stringify([1, 4, 7, null, null, null])); }, storage);
      await page.goto(`${baseUrl}/team-coverage?version=emerald&team=25-6-0`); await pageReady(page); expect(new URL(page.url()).search === '?version=emerald', page.url()); expect(await page.getByRole('button', { name: 'Clear Team' }).isEnabled(), 'shared team was not loaded');
      await page.getByRole('button', { name: 'Share Team' }).click(); await page.getByText(/Team link copied|Copy this team link:/).waitFor(); const shareMessage = await page.locator('[aria-live="polite"]').textContent(); expect(shareMessage.includes('Team link copied.') || shareMessage.includes(`version=emerald&team=25-6`), `invalid shared link: ${shareMessage}`);
      await page.reload(); await pageReady(page); expect(!(await page.getByRole('button', { name: 'Clear Team' }).isEnabled()), 'team persisted after refresh'); await page.close();
    });
    await scenario('party requests, version retention, and clear', async () => {
      const page = await browser.newPage(); const requests = []; page.on('request', request => requests.push(new URL(request.url()).pathname));
      await page.goto(`${baseUrl}/team-coverage?version=scarlet-violet&team=25-6`); await pageReady(page);
      for (const path of ['/data/pokemonData/25.json', '/data/pokemonLearnsets/25.json', '/data/pokemonData/6.json', '/data/pokemonLearnsets/6.json']) expect(requests.includes(path), `missing ${path}`);
      expect(new URL(page.url()).search === '?version=scarlet-violet', page.url()); await page.locator('#team-coverage-version').selectOption('emerald'); await page.getByText(/Showing 1-\d+ of \d+ matches/).waitFor(); expect(new URL(page.url()).search === '?version=emerald', page.url());
      await page.getByRole('button', { name: 'Clear Team' }).click(); await page.waitForURL(`${baseUrl}/team-coverage?version=emerald`); expect(!(await page.getByRole('button', { name: 'Clear Team' }).isEnabled()), 'party not cleared');
      await page.reload(); await pageReady(page); expect(new URL(page.url()).search === '?version=emerald', page.url()); expect(!(await page.getByRole('button', { name: 'Clear Team' }).isEnabled()), 'team persisted after refresh'); await page.close();
    });
    await scenario('page reset, responsive size, and storage event', async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }); await page.goto(`${baseUrl}/team-coverage`); await pageReady(page);
      await page.getByRole('button', { name: 'Next' }).click(); await page.getByText(/Page 2 of/).waitFor(); await page.locator('#team-coverage-sort').selectOption('highest-speed'); await page.getByText(/Page 1 of/).waitFor();
      await page.setViewportSize({ width: 540, height: 900 }); await page.getByText(/Showing 1-12 of \d+ matches/).waitFor(); await page.evaluate(keys => { localStorage.setItem(keys.sort, JSON.stringify('national-dex')); window.dispatchEvent(new StorageEvent('storage', { key: keys.sort, newValue: JSON.stringify('national-dex'), storageArea: localStorage })); }, storage);
      expect(await page.locator('#team-coverage-sort').inputValue() === 'national-dex', 'storage event did not update sort'); await page.close();
    });
    await scenario('unavailable', async () => {
      console.log('[S5A] page created'); const page = await browser.newPage();
      console.log('[S5A] navigation started'); await page.goto(`${baseUrl}/team-coverage?version=legends-arceus`, { waitUntil: 'domcontentloaded', timeout: 20000 }); console.log('[S5A] navigation completed');
      await page.getByText(/Availability data is not ready for Legends.*Arceus yet/).waitFor({ timeout: 20000 }); console.log('[S5A] unavailable branch observed'); await page.close(); console.log('[S5A] page closed');
    });
    await scenario('fetch-failure', async () => {
      console.log('[S5B] page created'); const page = await browser.newPage(); let intercepted = false;
      await page.route('**/data/teamCoverage/scarlet-violet.json*', route => { intercepted = true; console.log('[S5B] selected dataset intercepted'); return route.fulfill({ status: 500, body: 'nope' }); }); console.log('[S5B] interception installed');
      console.log('[S5B] navigation started'); await page.goto(`${baseUrl}/team-coverage?version=scarlet-violet`, { waitUntil: 'domcontentloaded', timeout: 20000 }); console.log('[S5B] navigation completed');
      await page.getByText('Loading recommendations...').waitFor({ timeout: 20000 }); expect(intercepted, 'dataset route was not intercepted'); console.log('[S5B] loading branch observed'); await page.close(); console.log('[S5B] page closed');
    });
  } catch (error) { failure = error; }
  finally { await browser?.close(); try { cleanup = await stop(); } catch (error) { failure ??= error; cleanup = `failed: ${error.message}`; } }
  console.log(`TEAM_COVERAGE_PAGE_GOLDEN_MASTER: ${failure ? 'FAIL' : 'PASS'}; scenarios=${attempted}; passed=${passed}; failed=${attempted - passed}; vite-cleanup=${cleanup}`);
  if (failure) { console.error(failure.stack ?? failure); process.exitCode = 1; }
}
await run();
