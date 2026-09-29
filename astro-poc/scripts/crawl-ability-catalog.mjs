import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ABILITY_SLUGS, ABILITY_SLUG_SET } from '../src/lib/abilityData.js';
import { POKEMON_SLUG_SET } from '../src/lib/routes.js';

const origin = process.argv[2] ?? 'http://127.0.0.1:4321';
const startedAt = performance.now(), results = new Array(ABILITY_SLUGS.length);
let nextIndex = 0;
async function worker() {
  while (nextIndex < ABILITY_SLUGS.length) {
    const index = nextIndex++, slug = ABILITY_SLUGS[index], pathname = `/ability/${slug}`;
    const response = await fetch(new URL(pathname, origin), { redirect: 'manual' });
    assert.equal(response.status, 200, pathname); assert.equal(response.headers.get('location'), null, `${pathname}: no redirect`);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html/i, `${pathname}: HTML MIME`);
    if (origin.startsWith('https://')) assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i, `${pathname}: staging noindex`);
    const html = await response.text(); assert(html.includes(`<link rel="canonical" href="https://pokelore.net${pathname}"`), `${pathname}: canonical`); assert(html.includes('<h1'), `${pathname}: H1`); assert(!/Loading (?:Ability|holders)/i.test(html), `${pathname}: static core`);
    for (const match of html.matchAll(/href="(\/(?:ability|pokemon)\/[^"?#]+)"/g)) {
      const link = match[1]; assert(!link.endsWith('/') && !link.endsWith('.html'), `${pathname}: noncanonical link ${link}`);
      if (link.startsWith('/ability/')) assert(ABILITY_SLUG_SET.has(link.slice(9)), `${pathname}: bad Ability link ${link}`);
      if (link.startsWith('/pokemon/')) assert(POKEMON_SLUG_SET.has(link.slice(9)) && !/^\d+$/.test(link.slice(9)), `${pathname}: bad Pokémon link ${link}`);
    }
    results[index] = { slug, status: response.status, bytes: Buffer.byteLength(html) };
  }
}
await Promise.all(Array.from({ length: 16 }, worker));
for (const pathname of ['/ability/not-a-real-ability', '/ability/definitely-invalid-ability', '/random-invalid-ability-like-path']) { const response = await fetch(new URL(pathname, origin), { redirect: 'manual' }); assert.equal(response.status, 404, `${pathname}: real 404`); }
const elapsedMs = Math.round(performance.now() - startedAt), report = { origin, routeCount: results.length, failures: 0, elapsedMs, invalidStatus: 404, results };
mkdirSync('evidence/abilities', { recursive: true }); writeFileSync('evidence/abilities/live-sweep.json', JSON.stringify(report, null, 2));
console.log(`PASS: crawled ${results.length} canonical Ability URLs in ${elapsedMs} ms; no redirects; canonical links valid; invalid routes return 404.`);
