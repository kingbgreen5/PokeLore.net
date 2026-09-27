// Run against `npm run preview -- --host 127.0.0.1 --port 4321`.
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { routes, POKEMON_SLUGS, POKEMON_SLUG_SET } from '../src/lib/routes.js';

const origin = process.argv[2] ?? 'http://127.0.0.1:4321';
const startedAt = performance.now();
const results = new Array(POKEMON_SLUGS.length);
let nextIndex = 0;

async function worker() {
  while (nextIndex < POKEMON_SLUGS.length) {
    const index = nextIndex++;
    const slug = POKEMON_SLUGS[index];
    const pathname = `/pokemon/${slug}`;
    const response = await fetch(new URL(pathname, origin), { redirect: 'manual' });
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get('content-type') ?? '', /^text\/html/i, `${pathname}: HTML MIME`);
    const html = await response.text();
    assert(html.includes(`<link rel="canonical" href="https://pokelore.net${pathname}"`), `${pathname}: expected canonical`);
    assert(html.includes('<h1'), `${pathname}: H1`);
    assert(!/Loading (?:Pokémon|Pokemon|evolution|learnset)/i.test(html), `${pathname}: no client-only core placeholder`);
    const links = [...html.matchAll(/href="(\/pokemon\/[^"?#]+)"/g)].map(match => match[1]);
    for (const link of links) {
      const target = link.slice('/pokemon/'.length);
      assert(!/^\d+$/.test(target), `${pathname}: numeric Pokémon href ${link}`);
      assert(!target.endsWith('.html') && !target.endsWith('/'), `${pathname}: noncanonical Pokémon href ${link}`);
      assert(POKEMON_SLUG_SET.has(target), `${pathname}: broken Pokémon href ${link}`);
    }
    results[index] = { slug, status: response.status, bytes: Buffer.byteLength(html), pokemonLinks: links.length };
  }
}

await Promise.all(Array.from({ length: 12 }, worker));
const invalid = await fetch(new URL('/pokemon/not-a-real-pokemon', origin), { redirect: 'manual' });
assert.equal(invalid.status, 404, 'invalid Pokémon route is a real 404');
const random = await fetch(new URL('/random-garbage-path', origin), { redirect: 'manual' });
assert.equal(random.status, 404, 'random route is a real 404');
const elapsedMs = Math.round(performance.now() - startedAt);
const report = { origin, routeCount: results.length, failures: 0, elapsedMs, invalidStatus: invalid.status, randomStatus: random.status, results };
mkdirSync('evidence/full-catalog', { recursive: true });
writeFileSync('evidence/full-catalog/static-crawl.json', JSON.stringify(report, null, 2));
console.log(`PASS: crawled ${results.length} canonical Pokémon URLs in ${elapsedMs} ms; internal Pokémon links canonical; invalid routes return 404.`);
