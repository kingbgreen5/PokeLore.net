import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseHTML } from 'linkedom';

const dist = join(process.cwd(), 'dist');
const html = readFileSync(join(dist, 'ev-training-routes.html'), 'utf8');
const document = parseHTML(html).document;
const payload = join(dist, 'data', 'evTrainingRoutes.json');
assert(existsSync(payload), 'EV training dataset is emitted as an independent static asset');
assert.equal(document.querySelector('h1')?.textContent, 'Best Pokémon EV Training Locations Calculator');
assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'), 'https://pokelore.net/ev-training-routes');
assert.match(html, /This calculator requires JavaScript to run\./);
const island = [...document.querySelectorAll('astro-island')].find(node => node.getAttribute('component-url')?.includes('EvTrainingRoutesTool'));
assert(island, 'EV training React island exists');
assert.equal(island.getAttribute('client'), 'load', 'Calculator hydrates immediately');
const props = island.getAttribute('props') ?? '';
assert(props.length < 2000, `Island props stay compact (${props.length} bytes)`);
assert(!props.includes('routesByVersion') && !props.includes('expectedEvPerEncounter'), 'Dataset is not serialized into hydration props');
assert(!html.includes('"generatedAt":"2026-09-02T18:17:31.080Z"'), 'Dataset is not duplicated into page HTML');
const data = JSON.parse(readFileSync(payload, 'utf8'));
assert.equal(data.versions.length, 24, 'Every production-supported version is included');
for (const version of data.versions) {
  assert(data.routesByVersion[version.version], `${version.displayName}: route data exists`);
}
const source = JSON.parse(readFileSync(join('..', 'public', 'data', 'evTrainingRoutes.json'), 'utf8'));
for (const [version, stat] of [['platinum', 'hp'], ['emerald', 'speed'], ['black-2', 'attack'], ['sword', 'specialAttack']]) {
  assert.deepEqual(data.routesByVersion[version][stat], source.routesByVersion[version][stat], `${version}/${stat}: rank order and encounter details match production data`);
}
for (const multiplier of [1, 2, 2, 4]) {
  const expected = data.routesByVersion.platinum.hp[0].expectedEvPerEncounter * multiplier;
  assert(Number.isFinite(expected) && expected > 0, `Multiplier ${multiplier}: expected EV display remains valid`);
}
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<loc>https:\/\/pokelore\.net\/ev-training-routes<\/loc>/g) ?? []).length, 1, 'Route appears once in sitemap');
console.log(JSON.stringify({ html: statSync(join(dist, 'ev-training-routes.html')).size, htmlGzip: gzipSync(html).length, dataset: statSync(payload).size, datasetGzip: gzipSync(readFileSync(payload)).length, islandProps: props.length, islandJs: statSync(join(dist, decodeURIComponent(island.getAttribute('component-url')))).size, versions: data.versions.length }, null, 2));
console.log('PASS EV training routes: static shell, immediate island, static payload, query-safe compact props, and parity samples.');
