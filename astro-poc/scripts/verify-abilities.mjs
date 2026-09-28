import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseHTML } from 'linkedom';
import { abilityModel } from '../src/lib/abilityData.js';
import { ABILITY_STRESS_CASES, ABILITY_STRESS_SLUGS } from '../src/lib/abilityRoutes.js';

console.warn = () => {};
const dist = resolve(process.argv[2] ?? 'dist');
const metrics = [];
for (const slug of ABILITY_STRESS_SLUGS) {
  const path = join(dist, 'ability', `${slug}.html`);
  assert(existsSync(path), `${slug}: generated`);
  const buffer = readFileSync(path);
  const document = parseHTML(buffer.toString()).document;
  const visibleBody = document.body.cloneNode(true);
  visibleBody.querySelectorAll('script,style').forEach(node => node.remove());
  const model = abilityModel(slug);
  const one = selector => { const nodes = document.querySelectorAll(selector); assert.equal(nodes.length, 1, `${slug}: one ${selector}`); return nodes[0]; };
  assert.equal(one('h1').textContent.trim(), model.displayName);
  assert.equal(one('title').textContent.trim(), model.seo.title);
  assert.equal(one('meta[name="description"]').getAttribute('content'), model.seo.description);
  assert.equal(one('link[rel="canonical"]').getAttribute('href'), model.seo.canonical);
  assert(one('.ability-summary').textContent.includes(model.shortEffect));
  assert(one('.ability-effect').textContent.includes(model.effect));
  assert(one('.ability-header>p:first-child').textContent.includes(model.generationDisplay));
  assert.equal(document.querySelectorAll('.ability-holder-cards .pokemon-summary-card').length, model.routedHolderCount);
  assert.equal(document.querySelectorAll('.ability-holder-cards a[href^="/pokemon/"]').length, model.routedHolderCount);
  assert.equal(document.querySelectorAll('#regular-holders .pokemon-summary-card').length, model.regularHolders.length);
  assert.equal(document.querySelectorAll('#hidden-holders .pokemon-summary-card').length, model.hiddenHolders.length);
  assert(!document.querySelector('a[href^="/pokemon/"]') || [...document.querySelectorAll('a[href^="/pokemon/"]')].every(link => !/^\/pokemon\/\d+$/.test(link.getAttribute('href'))));
  assert(!/\$[a-z_]+|\bundefined\b|\bnull\b|\bNaN\b/i.test(visibleBody.textContent.replace(/Type Null/gi, '')));
  assert.equal(document.querySelectorAll('astro-island').length, 1, `${slug}: only global search hydrates`);
  const props = document.querySelector('astro-island')?.getAttribute('props') ?? '';
  metrics.push({ slug, reason: ABILITY_STRESS_CASES.find(([value]) => value === slug)[1], holders: model.routedHolderCount, htmlBytes: buffer.length, gzipBytes: gzipSync(buffer).length, hydrationPropBytes: Buffer.byteLength(props), supportingJsonBytes: 0 });
}
assert(!existsSync(join(dist, 'ability', 'not-a-real-ability.html')));
const sorted = metrics.map(metric => metric.htmlBytes).sort((a, b) => a - b);
const report = {
  pages: metrics,
  html: { minimum: sorted[0], median: sorted[Math.ceil(sorted.length / 2) - 1], maximum: sorted.at(-1) },
  hydrationProps: { maximum: Math.max(...metrics.map(metric => metric.hydrationPropBytes)) },
  supportingJsonBytes: 0,
  estimatedFullCatalogHtmlBytes: Math.round(sorted[Math.ceil(sorted.length / 2) - 1] * 313)
};
mkdirSync('evidence/abilities', { recursive: true });
writeFileSync('evidence/abilities/stress-metrics.json', JSON.stringify(report, null, 2));
console.log(`PASS Ability stress pages: ${metrics.length} static pages, canonical holder roles and links, no Ability-specific hydration.`);
console.log(JSON.stringify(report, null, 2));
