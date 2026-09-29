import { ITEM_SLUGS } from '../src/lib/itemData.js';
const base = process.argv[2] ?? 'https://pokelore-astro-test.thebeakeh.workers.dev';
const results = { total: ITEM_SLUGS.length, ok: 0, redirects: 0, notFound: 0, serverErrors: 0, failures: [] };
const check = async slug => { try { const response = await fetch(`${base}/item/${slug}`, { redirect: 'manual' }); return { slug, status: response.status }; } catch (error) { return { slug, error: error.message }; } };
for (let index = 0; index < ITEM_SLUGS.length; index += 25) {
  const batch = await Promise.all(ITEM_SLUGS.slice(index, index + 25).map(check));
  for (const result of batch) { if (result.status === 200) results.ok++; else if (result.status >= 300 && result.status < 400) results.redirects++; else if (result.status === 404) results.notFound++; else if (result.status >= 500) results.serverErrors++; else results.failures.push(result); }
}
const bad = results.total !== results.ok || results.redirects || results.notFound || results.serverErrors || results.failures.length;
console.log(JSON.stringify(results, null, 2));
if (bad) process.exitCode = 1;
