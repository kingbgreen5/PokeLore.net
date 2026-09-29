import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, join, relative, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseHTML } from 'linkedom';
import { POKEMON_SLUGS, routes, pokemonPath } from '../src/lib/routes.js';
import { STRESS_SLUGS, publicHref } from '../src/lib/links.js';
import { loadPokemon } from '../src/lib/pokemonData.js';
import { getPokemonNavigation } from '../src/lib/pokemonNavigation.js';
import { referenceSeo } from '../src/lib/seo.js';
import { MOVE_SLUGS } from '../src/lib/moveData.js';
import { ABILITY_SLUGS } from '../src/lib/abilityData.js';
import { ITEM_SLUGS } from '../src/lib/itemData.js';
import { LOCATION_STRESS_SLUGS } from '../src/lib/locationData.js';
import { registryRedirects } from './generate-redirects.mjs';
import { validateRedirects } from './validate-redirects.mjs';

const dist = resolve(process.argv[2] ?? 'dist');
const normalize = text => text.replace(/\s+/g, ' ').trim();
function documentAt(file) {
  assert(existsSync(join(dist, file)), `Missing output: ${file}`);
  return parseHTML(readFileSync(join(dist, file), 'utf8')).document;
}
function filesAt(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? filesAt(join(dir, entry.name)) : [relative(dist, join(dir, entry.name)).replaceAll('\\', '/')]);
}
const files = filesAt(dist);
const pageMetrics = [];
const canonicalUrls = new Set();
const internalPokemonTargets = new Set();
const navigationPath = join(dist, 'data', 'navigation', 'pokemon-navigation.json');
assert(existsSync(navigationPath), 'Shared Pokémon navigation registry emitted once');
const sharedNavigation = JSON.parse(readFileSync(navigationPath, 'utf8'));
assert.deepEqual(sharedNavigation, getPokemonNavigation(), 'Shared navigation registry preserves canonical ordering and compact records');
assert.equal(sharedNavigation.length, POKEMON_SLUGS.length, 'Shared navigation includes every canonical route');
assert.equal(new Set(sharedNavigation.map(entry => entry.name)).size, POKEMON_SLUGS.length, 'Shared navigation names are unique');
assert(sharedNavigation.every(entry => Object.keys(entry).sort().join(',') === 'id,name,sprite'), 'Navigation records contain only id, name and sprite');
assert.deepEqual(files.filter(f => f.endsWith('.html')).sort(),
  ['index.html', '404.html', ...POKEMON_SLUGS.map(s => `pokemon/${s}.html`), ...MOVE_SLUGS.map(s => `move/${s}.html`), ...ABILITY_SLUGS.map(s => `ability/${s}.html`), ...ITEM_SLUGS.map(s => `item/${s}.html`), ...LOCATION_STRESS_SLUGS.map(s => `location/${s}.html`)].sort(), 'Exactly the canonical Astro HTML documents');
const hostingFiles = new Set(['_headers', '_redirects']);
for (const file of hostingFiles) {
  assert(readFileSync(join(dist, file)).equals(readFileSync(join('public', file))), `${file}: hosting configuration copied unchanged`);
}
assert.deepEqual(files.filter(f => !extname(f) && !hostingFiles.has(f)).sort(),
  [], 'No extensionless page copies');
const redirects = registryRedirects();
for (const file of [join('public', '_redirects'), join(dist, '_redirects')]) {
  const checked = validateRedirects(readFileSync(file, 'utf8'), routes);
  console.log(`PASS ${file}: all ${checked.numeric.length} exact numeric source/destination/301 mappings verified independently`);
}
assert.equal(readFileSync(join(dist, '_redirects'), 'utf8'), redirects.text, 'Complete generated registry redirects and exact normalization rules');
console.log(`Redirect artifact SHA256: ${createHash('sha256').update(readFileSync(join(dist, '_redirects'))).digest('hex')}`);
const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
assert.equal(config.assets.directory, './dist');
assert.equal(config.assets.html_handling, 'drop-trailing-slash');
assert.equal(config.assets.not_found_handling, '404-page');
assert(!config.main && !config.assets.run_worker_first, 'Static assets only, no Worker runtime');
const headers = readFileSync(join(dist, '_headers'), 'utf8');
assert.match(headers, /\/\*\s+X-Robots-Tag: noindex/);
assert(!/Content-Type:/i.test(headers), 'Native HTML and asset MIME types');
console.log(`PASS: ${redirects.count} static numeric redirects (< 2000), six dynamic 301 rules, no SPA fallback, staging noindex.`);
assert(!files.some(f => /^pokemon\/\d+(?:[/.]|$)/.test(f)), 'No numeric resources');
// Phase 1B permits scoped islands; core HTML and the head remain server-owned.
for (const file of readdirSync('src/islands').filter(f=>f.endsWith('.jsx'))) {
  const source=readFileSync(join('src/islands',file),'utf8');
  assert(!/from\s*["']react-router|document\.title|querySelector\([^)]*canonical|<Seo\b/.test(source), `${file}: no router or SEO repair`);
}

for (const [routeIndex, slug] of POKEMON_SLUGS.entries()) {
  const relativeFile = `pokemon/${slug}.html`;
  const htmlBuffer = readFileSync(join(dist, relativeFile));
  const d = parseHTML(htmlBuffer.toString()).document;
  const data = loadPokemon(slug);
  const seo = referenceSeo(data);
  const text = normalize(d.body.textContent);
  const visibleBody = d.body.cloneNode(true);
  visibleBody.querySelectorAll('script,style').forEach(node => node.remove());
  const visibleText = normalize(visibleBody.textContent);
  const one = selector => { const matches = d.querySelectorAll(selector); assert.equal(matches.length, 1, `${slug}: exactly one ${selector}`); return matches[0]; };
  assert.equal(one('h1').textContent, data.name);
  assert.equal(one('title').textContent, seo.title);
  assert.equal(one('meta[name="description"]').getAttribute('content'), seo.description);
  const canonical = one('link[rel="canonical"]').getAttribute('href');
  assert.equal(canonical, `https://pokelore.net${pokemonPath(slug)}`);
  assert(!canonical.endsWith('/') && !canonical.endsWith('.html') && !/\/pokemon\/\d+(?:[/?#]|$)/.test(canonical));
  assert(!canonicalUrls.has(canonical), `${slug}: duplicate canonical ${canonical}`);
  canonicalUrls.add(canonical);
  assert(!/noindex/i.test(one('meta[name="robots"]').getAttribute('content')));
  for (const property of ['title', 'description', 'url', 'type', 'image', 'image:alt']) assert(one(`meta[property="og:${property}"]`).getAttribute('content'));
  for (const property of ['card', 'title', 'description', 'image']) assert(one(`meta[name="twitter:${property}"]`).getAttribute('content'));
  const schema = JSON.parse(one('script[type="application/ld+json"]').textContent);
  assert.deepEqual(schema, seo.structuredData);
  for (const type of ['WebPage', 'BreadcrumbList', 'Thing']) assert(schema['@graph'].some(n => n['@type'] === type));
  for (const section of ['abilities', 'stats', 'matchups', 'evolution', 'biology', 'learnset']) {
    assert(one(`#${section} h2`).textContent.trim());
    assert(normalize(one(`#${section}`).textContent).length > 20, `${slug}: substantive ${section}`);
  }
  assert.equal(Boolean(d.querySelector('#analysis')), ['playthrough','competitive','nuzlocke'].some(key => data.analysis[key]),
    `${slug}: analysis section visibility follows available editorial data`);
  assert.equal(Boolean(d.querySelector('#encounters')), data.hasEncounters, `${slug}: encounter section visibility follows useful data`);
  assert(text.includes(normalize(data.summary)), `${slug}: factual summary`);
  for (const key of ['playthrough', 'competitive', 'nuzlocke', 'biologyAndBehavior']) {
    if (data.analysis[key]) assert(text.includes(normalize(data.analysis[key])), `${slug}: complete ${key}`);
  }
  const statLabels=['HP','Attack','Defense','Sp. Atk','Sp. Def','Speed'];
  Object.values(data.p.stats).forEach((value,i)=>assert(normalize(one('#stats').textContent).includes(`${statLabels[i]}: ${value}`)));
  assert(normalize(one('#stats').textContent).includes(`Total: ${data.total}`));
  assert.equal(d.querySelectorAll('#stats div[style*="height:12px"]').length,6,'Six graphical stat bars');
  for(const ability of data.abilities) {
    assert(one(`#abilities a[href="https://pokelore.net/ability/${ability.slug}"]`).textContent.includes(ability.name));
    assert(one('#abilities').textContent.includes(ability.description));
  }
  for (const group of ['weaknesses', 'resistances', 'immunities']) for (const match of data.matchups[group]) {
    assert(d.querySelector(`#matchups a[aria-label="${match.typeName} attacking moves deal ${match.multiplierLabel} damage"]`));
  }
  assert(text.includes(data.evolutionSummary));
  assert(one('#learnset select[aria-label="Learnset version"]'));
  const staticLearnset = one(`#learnset-static-${slug}`);
  assert.equal(staticLearnset.getAttribute('data-static-version'), data.preview.versionGroup);
  for (const row of data.preview.rows) assert(staticLearnset.querySelector(`a[href="${publicHref(`/move/${row.move}`)}"]`), `${slug}: latest level-up move ${row.move} is static`);
  const payloadPath = join(dist, 'data', 'learnsets', `${slug}.json`);
  assert(existsSync(payloadPath), `${slug}: optional learnset payload emitted`);
  const payload = JSON.parse(readFileSync(payloadPath, 'utf8'));
  assert.deepEqual(payload.pokemonData, data.learnset, `${slug}: on-demand payload retains every learnset record`);
  assert.deepEqual(payload.movesData, data.moves, `${slug}: on-demand payload retains move display data`);
  const learnsetIsland = [...d.querySelectorAll('astro-island')].find(island => island.getAttribute('component-url')?.includes('LearnsetCard'));
  assert(learnsetIsland, `${slug}: learnset control island exists`);
  const learnsetProps = learnsetIsland.getAttribute('props') ?? '';
  assert(learnsetProps.length < 10000, `${slug}: learnset hydration props remain lightweight (${learnsetProps.length} bytes)`);
  assert(!learnsetProps.includes('pokemonData') && !learnsetProps.includes('movesData'), `${slug}: complete learnset is not duplicated in hydration props`);
  for (const location of data.encounters?.locations ?? []) assert(d.querySelector(`#encounters a[href="https://pokelore.net/location/${location.location.name}"]`));
  assert(!d.querySelector('meta[http-equiv="refresh"]'));
  assert.equal(d.querySelectorAll('astro-island').length, 5 + Number(data.hasEncounters) + Number(data.hasSizeComparison),
    `${slug}: focused islands only, with optional data hydrated only when supported`);
  for (const id of ['abilities','stats','matchups','evolution','analysis','biology']) {
    const section = d.querySelector(`#${id}`);
    if (section) assert(!section.closest('astro-island'), `${id} remains static`);
  }
  assert(one('#dex-entries').textContent.includes(data.p.dexEntries[0].text));
  assert.equal(Boolean(d.querySelector('#size-comparison')), data.hasSizeComparison, `${slug}: size comparison requires form bounds`);
  if (data.hasSizeComparison) assert(one('#size-comparison').textContent.includes('Compare with'));
  assert(!/Loading (?:Pokémon|Pokemon|evolution|learnset)/i.test(text));
  for (const link of d.querySelectorAll('a[href]')) {
    const url = new URL(link.getAttribute('href'), 'https://pokelore.net');
    if (url.pathname.startsWith('/pokemon/')) {
      const name = url.pathname.slice('/pokemon/'.length);
      assert(routes.byName[name] && !/^\d+$/.test(name), `Invalid Pokémon link: ${url}`);
      assert.equal(link.getAttribute('href'), url.pathname, `Pokémon links must be relative canonical paths: ${url}`);
      internalPokemonTargets.add(name);
    }
    assert(!url.pathname.endsWith('.html'), `HTML alias link: ${url}`);
  }
  for (const img of d.querySelectorAll('img')) { const src=img.getAttribute('src'); if(src?.startsWith('/')) assert(existsSync(join(dist,decodeURIComponent(src))), `Missing local image: ${src}`); }
  for (const element of d.querySelectorAll('[src], link[rel="stylesheet"], link[rel="modulepreload"], astro-island')) {
    for (const attr of ['src', 'href', 'component-url', 'renderer-url']) {
      const url = element.getAttribute(attr);
      if (url?.startsWith('/') && !url.startsWith('//')) assert(existsSync(join(dist, decodeURIComponent(new URL(url, 'https://pokelore.net').pathname))), `${relativeFile}: missing asset ${url}`);
    }
  }
  const headings = [...d.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => Number(h.tagName[1]));
  headings.forEach((level, i) => { if (i) assert(level <= headings[i - 1] + 1, `${slug}: heading hierarchy`); });
  assert(!/\b(?:undefined|null|NaN|\[object Object\])\b/.test(visibleText), `${slug}: no invalid visible values`);
  assert(!d.querySelector('a[href=""]'), `${slug}: no empty links`);
  const ids = [...d.querySelectorAll('[id]')].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length, `${slug}: unique element IDs`);
  assert.equal(new Set(data.abilities.map(ability => ability.slug)).size, data.abilities.length, `${slug}: unique abilities`);
  assert.equal(schema['@graph'].find(node => node['@type'] === 'Thing').identifier, `National Pokédex #${data.nationalDexNumber}`);
  const navigationIsland = [...d.querySelectorAll('astro-island')].find(island => island.getAttribute('component-url')?.includes('PokemonSpriteCarousel'));
  assert(navigationIsland, `${slug}: navigation island exists`);
  const navigationProps = navigationIsland.getAttribute('props') ?? '';
  assert(navigationProps.length < 10000, `${slug}: navigation hydration props stay below 10 KB (${navigationProps.length} bytes)`);
  assert(!navigationProps.includes('bulbasaur') || data.navigation.initialWindow.some(entry => entry.name === 'bulbasaur'), `${slug}: full registry is not serialized into hydration props`);
  const staticNavigationLinks = [...navigationIsland.querySelectorAll('a[data-pokemon-name]')];
  assert.equal(staticNavigationLinks.length, data.navigation.initialWindow.length, `${slug}: compact static navigation window`);
  assert.deepEqual(staticNavigationLinks.map(link => link.getAttribute('data-pokemon-name')),
    data.navigation.initialWindow.map(entry => entry.name), `${slug}: static navigation preserves canonical order`);
  assert(staticNavigationLinks.some(link => link.getAttribute('data-pokemon-name') === slug), `${slug}: routed form is centered in static navigation`);
  pageMetrics.push({
    slug,
    htmlBytes: htmlBuffer.length,
    htmlGzipBytes: gzipSync(htmlBuffer).length,
    learnsetHydrationPropBytes: learnsetProps.length,
    navigationHydrationPropBytes: navigationProps.length,
    navigationMarkupBytes: navigationIsland.outerHTML.length,
    historicalLearnsetPayloadBytes: statSync(payloadPath).size
  });
  if ((routeIndex + 1) % 100 === 0 || routeIndex === POKEMON_SLUGS.length - 1) console.log(`PASS ${routeIndex + 1}/${POKEMON_SLUGS.length}: /pokemon/${slug}`);
}
const stressDocument = slug => documentAt(`pokemon/${slug}.html`);
assert.equal(stressDocument('eevee').querySelectorAll('#evolution .pokemon-summary-card').length, 9, 'Eevee plus eight branches');
assert.match(normalize(stressDocument('tyrogue').querySelector('#evolution').textContent), /level 20 Attack > Defense/);
assert(!normalize(stressDocument('tyrogue').querySelector('#evolution').textContent).includes('20Attack'), 'Evolution conditions are spaced');
assert.match(stressDocument('nincada').querySelector('#evolution').textContent, /Shed/i, 'Uncommon evolution trigger remains visible');
assert.equal(stressDocument('ditto').querySelectorAll('#evolution .pokemon-summary-card').length, 1, 'No fake evolution for Ditto');
assert(JSON.parse(readFileSync(join(dist, 'data/learnsets/rotom-heat.json'), 'utf8')).pokemonData.moves.some(move => move.method === 'form-change' && move.move === 'overheat'), 'Form-change moves remain available on demand');
assert(!stressDocument('minior-blue').querySelector('#analysis'), 'Missing editorial analysis is omitted');
assert(!stressDocument('minior-blue').querySelector('#encounters'), 'Missing encounters are omitted');
for (const slug of ['palafin-hero', 'aegislash-blade', 'charizard-mega-x']) {
  const evolution = stressDocument(slug).querySelector('#evolution');
  assert(evolution.querySelector('.evolution-form-note'), `${slug}: base relationship clarification shown`);
  assert(![...evolution.querySelectorAll('.pokemon-summary-card strong')].some(node => normalize(node.textContent) === loadPokemon(slug).name), `${slug}: transformation is not inserted as an evolution stage`);
}
assert([...stressDocument('raichu-alola').querySelectorAll('#evolution .pokemon-summary-card strong')].some(node => /Alola/i.test(node.textContent)), 'Regional form participates in its regional evolution branch');
const home = documentAt('index.html');
assert.equal(home.querySelector('link[rel="canonical"]').getAttribute('href'), 'https://pokelore.net/');
for (const slug of STRESS_SLUGS) assert(home.querySelector(`a[href="${pokemonPath(slug)}"]`));
assert(!/noindex/.test(home.querySelector('meta[name="robots"]').getAttribute('content')));
const notFound = documentAt('404.html');
assert.equal(notFound.querySelector('h1').textContent, 'Page not found');
assert(!notFound.querySelector('link[rel="canonical"]'), '404 must not canonicalize to homepage');
assert(!notFound.querySelector('meta[http-equiv="refresh"]'));
// Non-Pokémon documents also retain their referenced assets.
for (const file of ['index.html', '404.html']) {
  const document = documentAt(file);
  for (const element of document.querySelectorAll('[src], link[rel="stylesheet"], link[rel="modulepreload"], astro-island')) {
    for (const attr of ['src', 'href', 'component-url', 'renderer-url']) {
      const url = element.getAttribute(attr);
      if (url?.startsWith('/') && !url.startsWith('//')) {
        assert(existsSync(join(dist, decodeURIComponent(new URL(url, 'https://pokelore.net').pathname))), `${file}: missing asset ${url}`);
      }
    }
  }
}
assert(files.some(f => f.endsWith('.css')), 'CSS output retained');
assert(files.some(f => f.endsWith('.js')), 'Island JavaScript retained');
assert(Array.isArray(JSON.parse(readFileSync(join(dist, 'data/search.json'), 'utf8'))), 'Search JSON retained');
for (const [id, slug] of [[14, 'kakuna'], [25, 'pikachu'], [6, 'charizard'], [10100, 'raichu-alola']]) assert.equal(routes.byId[id], slug);
console.log(`PASS: ${POKEMON_SLUGS.length} canonical Pokémon documents plus homepage and 404; static core and scoped islands.`);

const sortedSizes = [...pageMetrics].sort((a, b) => a.htmlBytes - b.htmlBytes);
const percentile = value => sortedSizes[Math.min(sortedSizes.length - 1, Math.ceil(sortedSizes.length * value) - 1)];
const metricPercentile = (key, value) => [...pageMetrics]
  .sort((a, b) => a[key] - b[key])[Math.min(pageMetrics.length - 1, Math.ceil(pageMetrics.length * value) - 1)][key];
const expectedUrls = POKEMON_SLUGS.map(slug => `https://pokelore.net/pokemon/${slug}`);
const productionSitemap = readFileSync(join('..', 'public', 'sitemap.xml'), 'utf8');
const productionPokemonUrls = [...productionSitemap.matchAll(/<loc>(https:\/\/pokelore\.net\/pokemon\/[^<]+)<\/loc>/g)].map(match => match[1]);
const expectedSet = new Set(expectedUrls);
const productionSet = new Set(productionPokemonUrls);
const sitemapMissing = expectedUrls.filter(url => !productionSet.has(url));
const sitemapUnexpected = productionPokemonUrls.filter(url => !expectedSet.has(url));
const fileStats = files.map(file => ({ file, bytes: statSync(join(dist, file)).size }));
const extensionCounts = Object.fromEntries(['html', 'js', 'css', 'json', 'images', 'other'].map(key => [key, 0]));
for (const { file } of fileStats) {
  const extension = extname(file).toLowerCase();
  if (extension === '.html') extensionCounts.html++;
  else if (extension === '.js') extensionCounts.js++;
  else if (extension === '.css') extensionCounts.css++;
  else if (extension === '.json') extensionCounts.json++;
  else if (['.png', '.webp', '.jpg', '.jpeg', '.svg', '.gif'].includes(extension)) extensionCounts.images++;
  else extensionCounts.other++;
}
const report = {
  routeSet: {
    expected: POKEMON_SLUGS.length,
    generated: files.filter(file => /^pokemon\/.+\.html$/.test(file)).length,
    missing: [], unexpected: [], duplicates: POKEMON_SLUGS.length - new Set(POKEMON_SLUGS).size
  },
  canonicalCount: canonicalUrls.size,
  internalPokemonTargetCount: internalPokemonTargets.size,
  pageSizes: {
    minimum: sortedSizes[0], median: percentile(.5), p75: percentile(.75), p90: percentile(.9),
    p95: percentile(.95), p99: percentile(.99), maximum: sortedSizes.at(-1),
    over2MB: pageMetrics.filter(page => page.htmlBytes > 2_000_000).length,
    over3MB: pageMetrics.filter(page => page.htmlBytes > 3_000_000).length,
    largest20: [...pageMetrics].sort((a, b) => b.htmlBytes - a.htmlBytes).slice(0, 20)
  },
  navigationPayload: {
    minimumBytes: Math.min(...pageMetrics.map(page => page.navigationHydrationPropBytes)),
    medianBytes: metricPercentile('navigationHydrationPropBytes', .5),
    maximumBytes: Math.max(...pageMetrics.map(page => page.navigationHydrationPropBytes)),
    maximumMarkupBytes: Math.max(...pageMetrics.map(page => page.navigationMarkupBytes)),
    medianMarkupBytes: metricPercentile('navigationMarkupBytes', .5),
    duplicatedAcrossDocuments: pageMetrics.filter(page => page.navigationHydrationPropBytes > 0).length,
    sharedRegistryBytes: statSync(navigationPath).size,
    sharedRegistryRecords: sharedNavigation.length
  },
  learnset: {
    maximumHydrationPropBytes: Math.max(...pageMetrics.map(page => page.learnsetHydrationPropBytes)),
    maximumHistoricalPayload: [...pageMetrics].sort((a, b) => b.historicalLearnsetPayloadBytes - a.historicalLearnsetPayloadBytes)[0]
  },
  dist: {
    fileCount: files.length,
    totalBytes: fileStats.reduce((sum, file) => sum + file.bytes, 0),
    counts: extensionCounts
  },
  sitemapComparison: {
    expected: expectedUrls.length,
    productionPokemonUrls: productionPokemonUrls.length,
    missing: sitemapMissing,
    unexpected: sitemapUnexpected
  }
};
assert.equal(report.routeSet.generated, POKEMON_SLUGS.length, 'Every canonical Pokémon document generated');
assert.equal(report.routeSet.duplicates, 0, 'No duplicate canonical registry names');
assert.deepEqual(sitemapMissing, [], 'Production sitemap policy contains every canonical Pokémon URL');
assert.deepEqual(sitemapUnexpected, [], 'Production sitemap has no non-registry Pokémon URLs');
mkdirSync('evidence/full-catalog', { recursive: true });
writeFileSync('evidence/full-catalog/verification.json', JSON.stringify(report, null, 2));
writeFileSync('evidence/full-catalog/staging-pokemon-urls.txt', `${expectedUrls.join('\n')}\n`);
console.log(`PASS full catalog: ${report.routeSet.generated} pages, ${report.dist.fileCount} files, ${report.dist.totalBytes} bytes; sitemap parity and size audit recorded.`);
