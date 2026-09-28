import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseHTML } from 'linkedom';
import { MOVE_SLUGS, MOVE_SLUG_SET, loadMove, moveLearnerPayload } from '../src/lib/moveData.js';
import { routes } from '../src/lib/routes.js';

const dist = resolve(process.argv[2] ?? 'dist');
const startedAt = performance.now();
const normalize = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const percentile = (values, ratio) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1)];
const getVisibleText = document => { const body = document.body.cloneNode(true); body.querySelectorAll('script,style').forEach(node => node.remove()); return normalize(body.textContent); };

assert.equal(MOVE_SLUGS.length, 937, 'Authoritative Move manifest count');
assert.equal(MOVE_SLUG_SET.size, MOVE_SLUGS.length, 'Move slugs are unique');
const sourceSlugs = readdirSync(resolve('..', 'public', 'data', 'moves')).filter(file => file.endsWith('.json')).map(file => basename(file, '.json')).sort();
assert.deepEqual(sourceSlugs, [...MOVE_SLUGS].sort(), 'Core Move files match the authoritative manifest');
const productionSitemap = readFileSync(resolve('..', 'public', 'sitemap.xml'), 'utf8');
const productionUrls = [...productionSitemap.matchAll(/<loc>(https:\/\/pokelore\.net\/move\/[^<]+)<\/loc>/g)].map(match => match[1]);
const expectedUrls = MOVE_SLUGS.map(slug => `https://pokelore.net/move/${slug}`);
assert.equal(new Set(productionUrls).size, productionUrls.length, 'Production sitemap Move URLs are unique');
assert.deepEqual([...productionUrls].sort(), [...expectedUrls].sort(), 'Production sitemap matches the Move manifest');
const generatedSlugs = readdirSync(join(dist, 'move')).filter(file => file.endsWith('.html')).map(file => basename(file, '.html')).sort();
assert.deepEqual(generatedSlugs, [...MOVE_SLUGS].sort(), 'Generated Move documents match the manifest');

const metrics = [], canonicals = new Set(), moveTargets = new Set(), pokemonTargets = new Set();
const conditions = { nullAccuracy: 0, nullPower: 0, historicalValues: 0, withoutLearnerData: 0, withLearnerData: 0 };
let learnerPayloadCount = 0;

for (const [index, slug] of MOVE_SLUGS.entries()) {
  const file = join(dist, 'move', `${slug}.html`);
  assert(existsSync(file), `${slug}: output exists`);
  const buffer = readFileSync(file), html = buffer.toString(), document = parseHTML(html).document, data = loadMove(slug);
  const text = getVisibleText(document);
  const one = selector => { const nodes = document.querySelectorAll(selector); assert.equal(nodes.length, 1, `${slug}: exactly one ${selector}`); return nodes[0]; };
  conditions.nullAccuracy += Number(data.move.accuracy == null);
  conditions.nullPower += Number(data.move.power == null);
  conditions.historicalValues += Number((data.move.pastValues?.length ?? 0) > 0);
  conditions.withoutLearnerData += Number(data.versions.length === 0);
  conditions.withLearnerData += Number(data.versions.length > 0);

  assert.equal(one('h1').textContent.trim(), data.move.displayName, `${slug}: routed identity`);
  assert(one('title').textContent.trim());
  assert(one('meta[name="description"]').getAttribute('content'));
  const canonical = one('link[rel="canonical"]').getAttribute('href');
  assert.equal(canonical, `https://pokelore.net/move/${slug}`);
  assert(!canonicals.has(canonical), `${slug}: duplicate canonical`); canonicals.add(canonical);
  assert(!canonical.endsWith('/') && !canonical.endsWith('.html'));
  assert(!/noindex/i.test(one('meta[name="robots"]').getAttribute('content')));
  for (const property of ['title','description','url','type']) assert(one(`meta[property="og:${property}"]`).getAttribute('content'), `${slug}: og:${property}`);
  for (const property of ['card','title','description']) assert(one(`meta[name="twitter:${property}"]`).getAttribute('content'), `${slug}: twitter:${property}`);
  const schema = JSON.parse(one('script[type="application/ld+json"]').textContent);
  for (const type of ['WebPage','Thing','BreadcrumbList']) assert(schema['@graph'].some(node => node['@type'] === type), `${slug}: ${type} schema`);
  const typeBadge = one('.move-type-row .type-badge');
  assert((typeBadge.getAttribute('alt') ?? typeBadge.getAttribute('aria-label') ?? '').toLowerCase().includes(data.move.type));
  assert.equal(normalize(one('.move-category').textContent).toLowerCase(), normalize(data.move.category).toLowerCase());
  assert.equal(one('.move-facts dl>div:nth-child(1) dd').textContent.trim(), data.move.power == null ? '—' : String(data.move.power));
  assert.equal(one('.move-facts dl>div:nth-child(2) dd').textContent.trim(), data.move.accuracy == null ? '—' : `${data.move.accuracy}%`);
  assert.equal(one('.move-facts dl>div:nth-child(3) dd').textContent.trim(), data.move.pp == null ? '—' : String(data.move.pp));
  assert.equal(one('.move-facts dl>div:nth-child(4) dd').textContent.trim(), data.move.priority == null ? '—' : String(data.move.priority));
  const expectedEffect = data.move.shortEffect ?? data.move.description ?? data.move.effect;
  assert(expectedEffect ? normalize(one('.move-effect').textContent).includes(normalize(expectedEffect)) : /No detailed effect text is available/.test(one('.move-effect').textContent), `${slug}: effect text`);
  if ((data.move.pastValues?.length ?? 0) > 0) assert([...document.querySelectorAll('.move-disclosure h2')].some(node => node.textContent.trim() === 'Version History'), `${slug}: version history`);
  if ((data.move.machineItems?.length ?? 0) > 0) assert([...document.querySelectorAll('.move-disclosure h2')].some(node => node.textContent.trim() === 'TMs, HMs, and TRs'), `${slug}: machine details`);
  const badTokens = /\$[a-z_]+|\bundefined\b|\bnull\b|\bNaN\b|\[object Object\]/i;
  assert(!badTokens.test(text.replace(/Type Null/gi, '')), `${slug}: no unresolved or invalid visible values`);
  assert(!/file:\/\/|[A-Z]:\\|localhost|pokelore-astro-test|workers\.dev/i.test(html), `${slug}: no local/staging references`);
  assert(!document.querySelector('a[href=""]'), `${slug}: no empty href`); assert(!document.querySelector('img:not([src]), img[src=""]'), `${slug}: no missing image src`);

  for (const learner of data.learners.pokemon ?? []) {
    assert(routes.byName[learner.name], `${slug}: canonical learner ${learner.name}`);
    for (const method of learner.methods ?? []) {
      assert(method.versionGroup && method.method, `${slug}/${learner.name}: complete learner method record`);
    }
  }
  for (const link of document.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href'), url = new URL(href, 'https://pokelore.net');
    assert(!url.pathname.endsWith('.html'), `${slug}: .html link ${href}`);
    if (url.pathname.startsWith('/move/')) { const target = url.pathname.slice(6); assert(!target.endsWith('/') && MOVE_SLUG_SET.has(target), `${slug}: Move target ${href}`); moveTargets.add(target); }
    if (url.pathname.startsWith('/pokemon/')) { const target = url.pathname.slice(9); assert(!/^\d+$/.test(target) && !target.endsWith('/') && routes.byName[target], `${slug}: Pokémon target ${href}`); assert.equal(href, url.pathname); pokemonTargets.add(target); }
  }

  const payloadFile = join(dist, 'data', 'move-learners', `${slug}.json`);
  const island = [...document.querySelectorAll('astro-island')].find(node => node.getAttribute('component-url')?.includes('MoveLearnerExplorer'));
  let hydrationPropBytes = 0, learnerPayloadBytes = 0, staticLearners = 0;
  if (data.versions.length > 0) {
    assert(existsSync(payloadFile), `${slug}: learner payload exists`); learnerPayloadCount++;
    const sourcePayload = moveLearnerPayload(slug); assert.equal(readFileSync(payloadFile, 'utf8'), sourcePayload);
    const payload = JSON.parse(sourcePayload); assert.equal(payload.move, slug); assert.deepEqual(payload.versions, data.versions);
    for (const [version, groups] of Object.entries(payload.groupsByVersion)) for (const group of groups) {
      assert(data.versions.includes(version)); const names = group.pokemon.map(pokemon => pokemon.name); assert.equal(new Set(names).size, names.length, `${slug}/${version}/${group.method}: unique learners`);
      for (const pokemon of group.pokemon) assert(routes.byName[pokemon.name] && !/^\d+$/.test(pokemon.name), `${slug}: payload learner ${pokemon.name}`);
    }
    assert(island, `${slug}: learner island`); const props = island.getAttribute('props') ?? ''; hydrationPropBytes = Buffer.byteLength(props);
    assert(hydrationPropBytes < 10000); assert(!props.includes('groupsByVersion'));
    staticLearners = document.querySelectorAll('#latest-move-learners a[href^="/pokemon/"]').length;
    assert(staticLearners > 0 && staticLearners <= 80, `${slug}: static learner preview ${staticLearners}`);
    learnerPayloadBytes = statSync(payloadFile).size;
  } else {
    assert(!existsSync(payloadFile), `${slug}: no empty learner payload`); assert(!island, `${slug}: no learner control`);
    assert.equal(document.querySelectorAll('#latest-move-learners a').length, 0); assert.match(one('#latest-move-learners').textContent, /No learner records/i);
  }
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(node => Number(node.tagName[1]));
  headings.forEach((level, i) => { if (i) assert(level <= headings[i - 1] + 1, `${slug}: heading hierarchy`); });
  const ids = [...document.querySelectorAll('[id]')].map(node => node.id); assert.equal(new Set(ids).size, ids.length);
  metrics.push({ slug, htmlBytes: buffer.length, gzipBytes: gzipSync(buffer).length, hydrationPropBytes, learnerPayloadBytes, learners: data.learnerCount, staticLearners, historicalValues: data.move.pastValues?.length ?? 0 });
  if ((index + 1) % 100 === 0 || index === MOVE_SLUGS.length - 1) console.log(`PASS ${index + 1}/${MOVE_SLUGS.length}: /move/${slug}`);
}

assert.deepEqual(conditions, { nullAccuracy: 288, nullPower: 338, historicalValues: 168, withoutLearnerData: 104, withLearnerData: 833 });
assert.equal(learnerPayloadCount, 833); assert.equal(canonicals.size, 937); assert(!existsSync(join(dist, 'move', 'not-a-real-move.html')));
const hydrationValues = metrics.filter(m => m.hydrationPropBytes).map(m => m.hydrationPropBytes), htmlValues = metrics.map(m => m.htmlBytes), payloadMetrics = metrics.filter(m => m.learnerPayloadBytes), payloadValues = payloadMetrics.map(m => m.learnerPayloadBytes);
const distribution = values => ({ minimum: Math.min(...values), median: percentile(values,.5), p75: percentile(values,.75), p90: percentile(values,.9), p95: percentile(values,.95), p99: percentile(values,.99), maximum: Math.max(...values) });
const report = {
  routeSet: { expected: 937, generated: generatedSlugs.length, missing: [], unexpected: [], duplicates: 0 }, sitemap: { production: productionUrls.length, missing: [], unexpected: [] }, conditions,
  unresolvedPlaceholders: 0, seoFailures: 0, brokenMoveLinks: 0, brokenPokemonLinks: 0, numericPokemonLinks: 0, moveTargets: moveTargets.size, pokemonTargets: pokemonTargets.size,
  hydrationProps: { pages: hydrationValues.length, ...distribution(hydrationValues) },
  htmlSizes: { ...distribution(htmlValues), largest20: [...metrics].sort((a,b) => b.htmlBytes-a.htmlBytes).slice(0,20) },
  learnerPayloads: { count: payloadMetrics.length, ...distribution(payloadValues), largest20: [...payloadMetrics].sort((a,b) => b.learnerPayloadBytes-a.learnerPayloadBytes).slice(0,20) },
  elapsedMs: Math.round(performance.now() - startedAt)
};
mkdirSync('evidence/moves', { recursive: true }); writeFileSync('evidence/moves/full-verification.json', JSON.stringify(report,null,2)); writeFileSync('evidence/moves/staging-move-urls.txt', `${expectedUrls.join('\n')}\n`);
console.log(`PASS full Move catalog: 937 pages, ${learnerPayloadCount} on-demand learner payloads, zero route/SEO/link/model failures.`); console.log(JSON.stringify(report,null,2));
