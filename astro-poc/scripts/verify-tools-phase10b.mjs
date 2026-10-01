import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { parseHTML } from 'linkedom';
import { VERSION_GROUP_ORDER } from '../../src/constants/versionOrder.js';

const dist = join(process.cwd(), 'dist');
const html = file => readFileSync(join(dist, file), 'utf8');
const documentAt = file => parseHTML(html(file)).document;

const tools = documentAt('tools.html');
assert.equal(tools.querySelector('h1')?.textContent, 'Tools');
assert.equal(tools.querySelector('title')?.textContent, 'Pokemon Tools and Calculators | PokéLore');
assert.equal(tools.querySelector('meta[name="description"]')?.getAttribute('content'), 'Use Pokemon tools for team coverage, EV training routes, Feebas tiles, and single type coverage planning.');
assert.equal(tools.querySelector('link[rel="canonical"]')?.getAttribute('href'), 'https://pokelore.net/tools');
const expectedTools = ['/tcg-challenge', '/team-coverage', '/ev-training-routes', '/dppt-feebas-calculator', '/rse-feebas-calculator', '/single-type-coverage'];
const toolLinks = [...tools.querySelectorAll('.tools-grid a')].map(link => link.getAttribute('href'));
assert.deepEqual(toolLinks, expectedTools.map(path => path === '/single-type-coverage' ? path : `https://pokelore.net${path}`));
assert.equal(tools.querySelectorAll('astro-island').length, 1, 'Only the global search island is present on static /tools');

const single = documentAt('single-type-coverage.html');
assert.equal(single.querySelector('h1')?.textContent, 'Single Type Coverage');
assert.equal(single.querySelector('title')?.textContent, 'Single Type Coverage Calculator | PokéLore');
assert.equal(single.querySelector('link[rel="canonical"]')?.getAttribute('href'), 'https://pokelore.net/single-type-coverage');
assert.match(html('single-type-coverage.html'), /This calculator requires JavaScript to run\./);
const island = [...single.querySelectorAll('astro-island')].find(node => node.getAttribute('component-url')?.includes('SingleTypeCoverageTool'));
assert(island, 'Single Type Coverage React island exists');
assert.equal(island.getAttribute('client'), 'load', 'Calculator hydrates immediately');
const props = island.getAttribute('props') ?? '';
assert(props.length < 2000, `Calculator props stay compact (${props.length} bytes)`);
assert(!props.includes('pokemon') && !props.includes('teamCoverage'), 'Coverage data is not serialized into hydration props');

const coverageDirectory = join(dist, 'data', 'teamCoverage');
const files = readdirSync(coverageDirectory).filter(file => file.endsWith('.json') && file !== 'index.json');
assert.deepEqual(files.map(file => file.slice(0, -5)).sort(), [...VERSION_GROUP_ORDER].sort(), 'Every production-supported coverage version is emitted exactly once');
for (const version of VERSION_GROUP_ORDER) {
  const file = join(coverageDirectory, `${version}.json`);
  assert(existsSync(file), `${version}: coverage payload exists`);
  const data = JSON.parse(readFileSync(file, 'utf8'));
  assert.equal(data.versionGroup, version, `${version}: coverage payload does not fall back`);
  assert(Array.isArray(data.pokemon), `${version}: coverage payload has Pokémon rows`);
}

const sitemap = html('sitemap.xml');
for (const path of ['/tools', '/single-type-coverage']) assert.equal((sitemap.match(new RegExp(`<loc>https://pokelore\\.net${path}</loc>`, 'g')) ?? []).length, 1, `${path} appears exactly once in sitemap`);
const metrics = {
  tools: { html: statSync(join(dist, 'tools.html')).size, gzip: gzipSync(html('tools.html')).length, islands: tools.querySelectorAll('astro-island').length },
  singleTypeCoverage: { html: statSync(join(dist, 'single-type-coverage.html')).size, gzip: gzipSync(html('single-type-coverage.html')).length, islandProps: props.length, islandJs: Object.fromEntries([...new Set([island.getAttribute('component-url'), island.getAttribute('renderer-url')])].filter(Boolean).map(url => [url, statSync(join(dist, decodeURIComponent(url))).size])), representativePayloads: Object.fromEntries(['red-blue', 'heartgold-soulsilver', 'scarlet-violet'].map(version => [version, statSync(join(coverageDirectory, `${version}.json`)).size])) }
};
console.log(JSON.stringify(metrics, null, 2));
console.log(`PASS Phase 10B: static /tools, immediate Single Type Coverage island, ${files.length} version payloads, sitemap and payload-boundary checks.`);
