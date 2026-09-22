import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { parseHTML } from 'linkedom';
import { POC_SLUGS, routes, pokemonPath } from '../src/lib/routes.js';
import { loadPokemon } from '../src/lib/pokemonData.js';
import { referenceSeo } from '../src/lib/seo.js';

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
assert.deepEqual(files.filter(f => f.endsWith('.html')).sort(),
  ['index.html', '404.html', ...POC_SLUGS.map(s => `pokemon/${s}.html`)].sort(), 'Exactly six HTML documents');
assert(!files.some(f => /^pokemon\/\d+(?:[/.]|$)/.test(f)), 'No numeric resources');
// Phase 1B permits scoped islands; core HTML and the head remain server-owned.
for (const file of readdirSync('src/islands').filter(f=>f.endsWith('.jsx'))) {
  const source=readFileSync(join('src/islands',file),'utf8');
  assert(!/from\s*["']react-router|document\.title|querySelector\([^)]*canonical|<Seo\b/.test(source), `${file}: no router or SEO repair`);
}

for (const slug of POC_SLUGS) {
  const d = documentAt(`pokemon/${slug}.html`);
  const data = loadPokemon(slug);
  const seo = referenceSeo(data);
  const text = normalize(d.body.textContent);
  const one = selector => { const matches = d.querySelectorAll(selector); assert.equal(matches.length, 1, `${slug}: exactly one ${selector}`); return matches[0]; };
  assert.equal(one('h1').textContent, data.name);
  assert.equal(one('title').textContent, seo.title);
  assert.equal(one('meta[name="description"]').getAttribute('content'), seo.description);
  const canonical = one('link[rel="canonical"]').getAttribute('href');
  assert.equal(canonical, `https://pokelore.net${pokemonPath(slug)}`);
  assert(!canonical.endsWith('/') && !/\/pokemon\/\d+(?:[/?#]|$)/.test(canonical));
  assert(!/noindex/i.test(one('meta[name="robots"]').getAttribute('content')));
  for (const property of ['title', 'description', 'url', 'type', 'image', 'image:alt']) assert(one(`meta[property="og:${property}"]`).getAttribute('content'));
  for (const property of ['card', 'title', 'description', 'image']) assert(one(`meta[name="twitter:${property}"]`).getAttribute('content'));
  const schema = JSON.parse(one('script[type="application/ld+json"]').textContent);
  assert.deepEqual(schema, seo.structuredData);
  for (const type of ['WebPage', 'BreadcrumbList', 'Thing']) assert(schema['@graph'].some(n => n['@type'] === type));
  for (const section of ['abilities', 'stats', 'matchups', 'evolution', 'analysis', 'biology', 'learnset', 'encounters']) {
    assert(one(`#${section} h2`).textContent.trim());
    assert(normalize(one(`#${section}`).textContent).length > 20, `${slug}: substantive ${section}`);
  }
  assert(text.includes(normalize(data.summary)), `${slug}: factual summary`);
  for (const key of ['playthrough', 'competitive', 'nuzlocke', 'biologyAndBehavior']) {
    assert(text.includes(normalize(data.analysis[key])), `${slug}: complete ${key}`);
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
  for (const move of data.learnset.moves) assert(d.querySelector(`#learnset a[href="https://pokelore.net/move/${move.move}"]`),`${slug}: all-method SSR move ${move.move}`);
  for (const row of data.preview.rows) assert(d.querySelector(`#learnset a[href="https://pokelore.net/move/${row.move}"]`));
  for (const location of data.encounters?.locations ?? []) assert(d.querySelector(`#encounters a[href="https://pokelore.net/location/${location.location.name}"]`));
  assert(!d.querySelector('meta[http-equiv="refresh"]'));
  assert.equal(d.querySelectorAll('astro-island').length,7,'Seven focused islands, not one whole-page app');
  for (const id of ['abilities','stats','matchups','evolution','analysis','biology']) assert(!one(`#${id}`).closest('astro-island'),`${id} remains static`);
  assert(one('#dex-entries').textContent.includes(data.p.dexEntries[0].text));
  assert(one('#size-comparison').textContent.includes('Compare with'));
  assert(!/Loading (?:Pokémon|Pokemon|evolution|learnset)/i.test(text));
  for (const link of d.querySelectorAll('a[href]')) {
    const url = new URL(link.getAttribute('href'), 'https://pokelore.net');
    if (url.pathname.startsWith('/pokemon/')) {
      const name = url.pathname.slice('/pokemon/'.length);
      assert(routes.byName[name] && !/^\d+$/.test(name), `Invalid Pokémon link: ${url}`);
    }
    assert(!url.pathname.endsWith('.html'), `HTML alias link: ${url}`);
  }
  for (const img of d.querySelectorAll('img')) { const src=img.getAttribute('src'); if(src?.startsWith('/')) assert(existsSync(join(dist,decodeURIComponent(src))), `Missing local image: ${src}`); }
  const headings = [...d.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => Number(h.tagName[1]));
  headings.forEach((level, i) => { if (i) assert(level <= headings[i - 1] + 1, `${slug}: heading hierarchy`); });
  console.log(`PASS /pokemon/${slug}: metadata, schema, full static content, links and artwork`);
}
const home = documentAt('index.html');
for (const slug of POC_SLUGS) assert(home.querySelector(`a[href="${pokemonPath(slug)}"]`));
assert(!/noindex/.test(home.querySelector('meta[name="robots"]').getAttribute('content')));
const notFound = documentAt('404.html');
assert.equal(notFound.querySelector('h1').textContent, 'Page not found');
assert(!notFound.querySelector('link[rel="canonical"]'), '404 must not canonicalize to homepage');
assert(!notFound.querySelector('meta[http-equiv="refresh"]'));
for (const [id, slug] of [[14, 'kakuna'], [25, 'pikachu'], [6, 'charizard'], [10100, 'raichu-alola']]) assert.equal(routes.byId[id], slug);
console.log('PASS: six documents; homepage, 404, registry redirects; static core and scoped islands.');
