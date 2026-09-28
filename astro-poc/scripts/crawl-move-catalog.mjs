import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { MOVE_SLUGS, MOVE_SLUG_SET } from '../src/lib/moveData.js';
import { POKEMON_SLUG_SET } from '../src/lib/routes.js';

const origin = process.argv[2] ?? 'http://127.0.0.1:4321';
const startedAt = performance.now();
const results = new Array(MOVE_SLUGS.length);
let nextIndex = 0;

async function worker() {
  while (nextIndex < MOVE_SLUGS.length) {
    const index = nextIndex++;
    const slug = MOVE_SLUGS[index], pathname = `/move/${slug}`;
    const response = await fetch(new URL(pathname, origin), { redirect: 'manual' });
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html/i, `${pathname}: HTML MIME`);
    const html = await response.text();
    assert(html.includes(`<link rel="canonical" href="https://pokelore.net${pathname}"`), `${pathname}: canonical`);
    assert(html.includes('<h1'), `${pathname}: H1`);
    assert(!/Loading (?:Move|learners)/i.test(html), `${pathname}: no client-only core placeholder`);
    for (const match of html.matchAll(/href="(\/(?:move|pokemon)\/[^"?#]+)"/g)) {
      const link = match[1];
      assert(!link.endsWith('/') && !link.endsWith('.html'), `${pathname}: noncanonical link ${link}`);
      if (link.startsWith('/move/')) assert(MOVE_SLUG_SET.has(link.slice(6)), `${pathname}: broken Move link ${link}`);
      if (link.startsWith('/pokemon/')) assert(POKEMON_SLUG_SET.has(link.slice(9)) && !/^\d+$/.test(link.slice(9)), `${pathname}: broken Pokémon link ${link}`);
    }
    results[index] = { slug, status: response.status, bytes: Buffer.byteLength(html) };
  }
}

await Promise.all(Array.from({ length: 16 }, worker));
for (const pathname of ['/move/not-a-real-move', '/random-invalid-move-like-path']) {
  const response = await fetch(new URL(pathname, origin), { redirect: 'manual' });
  assert.equal(response.status, 404, `${pathname}: real 404`);
}
const elapsedMs = Math.round(performance.now() - startedAt);
const report = { origin, routeCount: results.length, failures: 0, elapsedMs, invalidStatus: 404, results };
mkdirSync('evidence/moves', { recursive: true });
writeFileSync('evidence/moves/static-crawl.json', JSON.stringify(report, null, 2));
console.log(`PASS: crawled ${results.length} canonical Move URLs in ${elapsedMs} ms; internal links canonical; invalid routes return 404.`);
