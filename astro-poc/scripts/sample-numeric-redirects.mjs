// Read-only HEAD checks. Never follows redirects, changes Cloudflare, or deploys.
// node scripts/sample-numeric-redirects.mjs [origin] [--all]
import { readFileSync } from 'node:fs';
const origin = process.argv.slice(2).find(arg => !arg.startsWith('--')) ?? 'https://pokelore-astro-test.thebeakeh.workers.dev';
const registry = JSON.parse(readFileSync(new URL('../../public/data/pokemonRoutes.json', import.meta.url), 'utf8'));
const entries = Object.entries(registry.byId).sort(([a],[b]) => Number(a)-Number(b));
const sampleIds = [...new Set([
  '1','6','14','25','150','251','493','10001','10100',
  ...[.25,.5,.75].map(fraction => entries[Math.floor(entries.length*fraction)][0]),
  ...entries.slice(-10).map(([id])=>id)
])];
const ids = process.argv.includes('--all') ? entries.map(([id])=>id) : sampleIds;
let failed=0;
for (const id of ids) {
  const source=`/pokemon/${id}`;
  const expected=`/pokemon/${registry.byId[id]}`;
  try {
    const response=await fetch(new URL(source,origin),{method:'HEAD',redirect:'manual',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
    const location=response.headers.get('location');
    const target=location ? new URL(location,origin) : null;
    const passed=response.status===301 && target?.origin===new URL(origin).origin && target.pathname===expected && !target.search && !target.hash;
    if(!passed) failed++;
    console.log(`${passed?'PASS':'FAIL'} ${source}: ${response.status} Location=${location ?? '(none)'}; expected 301 ${expected}`);
  } catch(error) {
    failed++;
    console.log(`FAIL ${source}: ${error.message}; expected 301 ${expected}`);
  }
}
console.log(`${ids.length-failed}/${ids.length} passed at ${origin}. HEAD only; redirects were not followed.`);
if(failed) process.exitCode=1;
