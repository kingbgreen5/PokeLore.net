import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseHTML } from 'linkedom';
import { ABILITY_SLUGS, ABILITY_SLUG_SET, abilityModel } from '../src/lib/abilityData.js';
import { POKEMON_SLUG_SET } from '../src/lib/routes.js';

console.warn = () => {};
const dist = resolve(process.argv[2] ?? 'dist');
const startedAt = performance.now();
const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const percentile = (values, ratio) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1)];
const distribution = values => ({ minimum: Math.min(...values), median: percentile(values, .5), p75: percentile(values, .75), p90: percentile(values, .9), p95: percentile(values, .95), maximum: Math.max(...values), total: values.reduce((sum, value) => sum + value, 0) });

assert.equal(ABILITY_SLUGS.length, 313, 'canonical Ability count');
assert.equal(ABILITY_SLUG_SET.size, ABILITY_SLUGS.length, 'canonical Ability slugs unique');
const generated = readdirSync(join(dist, 'ability')).filter(file => file.endsWith('.html')).map(file => basename(file, '.html'));
const generatedSet = new Set(generated), missing = ABILITY_SLUGS.filter(slug => !generatedSet.has(slug)), unexpected = generated.filter(slug => !ABILITY_SLUG_SET.has(slug));
assert.equal(generated.length, generatedSet.size, 'no duplicate generated Ability documents');
assert.deepEqual([...generated].sort(), [...ABILITY_SLUGS].sort(), 'generated Ability documents exactly match registry');

const sitemap = readFileSync(resolve('..', 'public', 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/pokelore\.net\/ability\/[^<]+)<\/loc>/g)].map(match => match[1]);
const expectedUrls = ABILITY_SLUGS.map(slug => `https://pokelore.net/ability/${slug}`);
assert.equal(new Set(sitemapUrls).size, sitemapUrls.length, 'Ability sitemap URLs unique');
assert.deepEqual([...sitemapUrls].sort(), [...expectedUrls].sort(), 'Ability sitemap parity');

const metrics = [], canonicals = new Set(), titles = new Set(), descriptions = new Set(), pokemonTargets = new Set(), abilityTargets = new Set();
let pagesWithAnyIslands = 0, abilitySpecificIslandPages = 0, abilitySpecificHydrationBytes = 0;
for (const [index, slug] of ABILITY_SLUGS.entries()) {
  const file = join(dist, 'ability', `${slug}.html`); assert(existsSync(file), `${slug}: generated`);
  const buffer = readFileSync(file), html = buffer.toString(), document = parseHTML(html).document;
  const body = document.body.cloneNode(true); body.querySelectorAll('script,style').forEach(node => node.remove());
  const text = normalize(body.textContent), model = abilityModel(slug);
  const one = selector => { const nodes = document.querySelectorAll(selector); assert.equal(nodes.length, 1, `${slug}: exactly one ${selector}`); return nodes[0]; };
  assert.equal(one('h1').textContent.trim(), model.displayName, `${slug}: H1`);
  const title = one('title').textContent.trim(), description = one('meta[name="description"]').getAttribute('content');
  assert.equal(title, model.seo.title); assert.equal(description, model.seo.description); assert(title && description);
  assert(!titles.has(title), `${slug}: duplicate title`); assert(!descriptions.has(description), `${slug}: duplicate description`); titles.add(title); descriptions.add(description);
  const canonical = one('link[rel="canonical"]').getAttribute('href'); assert.equal(canonical, model.seo.canonical); assert(!canonicals.has(canonical)); canonicals.add(canonical);
  assert(!canonical.endsWith('/') && !canonical.endsWith('.html')); assert(!/noindex/i.test(one('meta[name="robots"]').getAttribute('content')));
  for (const property of ['title','description','url','type']) assert(one(`meta[property="og:${property}"]`).getAttribute('content'), `${slug}: og:${property}`);
  for (const property of ['card','title','description']) assert(one(`meta[name="twitter:${property}"]`).getAttribute('content'), `${slug}: twitter:${property}`);
  assert(normalize(one('.ability-summary').textContent).includes(normalize(model.shortEffect)), `${slug}: summary`);
  assert(normalize(one('.ability-effect').textContent).includes(normalize(model.effect)), `${slug}: effect`);
  assert(normalize(one('.ability-header>p:first-child').textContent).includes(model.generationDisplay), `${slug}: generation`);
  assert.equal(document.querySelectorAll('.ability-holder-cards .pokemon-summary-card').length, model.routedHolderCount, `${slug}: holder cards`);
  assert.equal(document.querySelectorAll('#regular-holders .pokemon-summary-card').length, model.regularHolders.length, `${slug}: regular holders`);
  assert.equal(document.querySelectorAll('#hidden-holders .pokemon-summary-card').length, model.hiddenHolders.length, `${slug}: hidden holders`);
  if (!model.routedHolderCount) assert.match(one('.ability-holders>p').textContent, /No canonical Pokémon form/, `${slug}: factual empty state`);
  for (const holder of model.holders) {
    const card = one(`.ability-holder-cards a[href="/pokemon/${holder.name}"]`); assert(card.querySelector('img[src]'), `${slug}/${holder.name}: artwork`);
    assert(Boolean(document.querySelector(`#regular-holders a[href="/pokemon/${holder.name}"]`)) === holder.regular, `${slug}/${holder.name}: regular role`);
    assert(Boolean(document.querySelector(`#hidden-holders a[href="/pokemon/${holder.name}"]`)) === holder.hidden, `${slug}/${holder.name}: hidden role`);
  }
  assert(!/\$[a-z_]+|\{\{|\[\[|\bundefined\b|\bnull\b|\bNaN\b|\[object Object\]/i.test(text.replace(/Type Null/gi, '')), `${slug}: no bad visible tokens`);
  assert(!/file:\/\/|[A-Z]:\\|localhost|workers\.dev/i.test(html), `${slug}: no local/staging references`);
  assert(!document.querySelector('a[href=""]')); assert(!document.querySelector('img:not([src]), img[src=""]'));
  for (const link of document.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href'), url = new URL(href, 'https://pokelore.net'); assert(!url.pathname.endsWith('.html'), `${slug}: .html href ${href}`);
    if (url.pathname.startsWith('/pokemon/')) { const target = url.pathname.slice(9); assert(!/^\d+$/.test(target) && !target.endsWith('/') && POKEMON_SLUG_SET.has(target), `${slug}: Pokémon href ${href}`); assert.equal(href, url.pathname); pokemonTargets.add(target); }
    if (url.pathname.startsWith('/ability/')) { const target = url.pathname.slice(9); assert(!target.endsWith('/') && ABILITY_SLUG_SET.has(target), `${slug}: Ability href ${href}`); abilityTargets.add(target); }
  }
  const schema = JSON.parse(one('script[type="application/ld+json"]').textContent);
  for (const type of ['WebPage','Thing','BreadcrumbList']) assert(schema['@graph'].some(node => node['@type'] === type), `${slug}: ${type} schema`);
  const schemaText = JSON.stringify(schema); assert(!/undefined|localhost|workers\.dev|\/pokemon\/\d+(?:"|\/)/i.test(schemaText), `${slug}: schema values`);
  assert(schema['@graph'].every(node => !node.url || node.url.startsWith('https://pokelore.net/')), `${slug}: canonical schema URLs`);
  const islands = [...document.querySelectorAll('astro-island')]; pagesWithAnyIslands += Number(islands.length > 0);
  const abilityIslands = islands.filter(node => !node.getAttribute('component-url')?.includes('GlobalSiteSearch'));
  abilitySpecificIslandPages += Number(abilityIslands.length > 0); abilitySpecificHydrationBytes += abilityIslands.reduce((sum, node) => sum + Buffer.byteLength(node.getAttribute('props') ?? ''), 0);
  const holderMarkupBytes = Buffer.byteLength(one('.ability-holders').outerHTML), sourceTextBytes = Buffer.byteLength(`${model.shortEffect}${model.effect}${model.oaksNotes ? JSON.stringify(model.oaksNotes) : ''}`);
  metrics.push({ slug, holders: model.routedHolderCount, regular: model.regularHolders.length, hidden: model.hiddenHolders.length, htmlBytes: buffer.length, gzipBytes: gzipSync(buffer).length, holderMarkupBytes, sourceTextBytes, sharedAndOtherBytes: buffer.length - holderMarkupBytes });
  if ((index + 1) % 50 === 0 || index === ABILITY_SLUGS.length - 1) console.log(`PASS ${index + 1}/${ABILITY_SLUGS.length}: /ability/${slug}`);
}

assert.equal(canonicals.size, 313); assert.equal(titles.size, 313); assert.equal(descriptions.size, 313); assert.equal(abilitySpecificIslandPages, 0); assert.equal(abilitySpecificHydrationBytes, 0);
assert(!existsSync(join(dist, 'ability', 'not-a-real-ability.html')));
const htmlValues = metrics.map(metric => metric.htmlBytes), gzipValues = metrics.map(metric => metric.gzipBytes), largest20 = [...metrics].sort((a, b) => b.htmlBytes - a.htmlBytes || a.slug.localeCompare(b.slug)).slice(0, 20);
const distFiles = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? distFiles(join(directory, entry.name)) : [join(directory, entry.name)]);
const allFiles = distFiles(dist), totalArtifactBytes = allFiles.reduce((sum, file) => sum + statSync(file).size, 0);
const report = { routeSet: { expected: 313, generated: generated.length, missing, unexpected, duplicates: generated.length - generatedSet.size }, sitemap: { expected: 313, found: sitemapUrls.length, missing: [], unexpected: [] }, models: { successes: 313, fatalFailures: 0 }, htmlAuditFailures: 0, seoFailures: 0, structuredDataFailures: 0, unresolvedPlaceholders: 0, brokenPokemonLinks: 0, numericPokemonLinks: 0, pokemonTargets: pokemonTargets.size, abilityTargets: abilityTargets.size, hydration: { pagesWithAnyIslands, abilitySpecificIslandPages, abilitySpecificHydrationBytes, supportingAbilityJsonBytes: 0 }, htmlSizes: { ...distribution(htmlValues), gzip: distribution(gzipValues), largest20 }, totalArtifactBytes, elapsedMs: Math.round(performance.now() - startedAt) };
mkdirSync('evidence/abilities', { recursive: true }); writeFileSync('evidence/abilities/full-verification.json', JSON.stringify(report, null, 2)); writeFileSync('evidence/abilities/staging-ability-urls.txt', `${expectedUrls.join('\n')}\n`);
console.log('PASS full Ability catalog: 313 pages, zero route/model/HTML/SEO/link/schema/hydration failures.'); console.log(JSON.stringify(report, null, 2));
