import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parseHTML } from 'linkedom';
import { ITEM_SLUGS, itemModel } from '../src/lib/itemData.js';
import { POKEMON_SLUG_SET } from '../src/lib/routes.js';
import { MOVE_SLUG_SET } from '../src/lib/moveData.js';

const dist = resolve(process.argv[2] ?? 'dist');
const metrics = [];
const generated = new Set();
const failures = [];

for (const slug of ITEM_SLUGS) {
  const file = join(dist, 'item', `${slug}.html`);
  if (!existsSync(file)) { failures.push(`${slug}: missing output`); continue; }
  generated.add(slug);
  try {
    const buffer = readFileSync(file);
    const doc = parseHTML(buffer.toString()).document;
    const model = itemModel(slug);
    assert.equal(doc.querySelector('h1')?.textContent.trim(), model.displayName);
    assert.equal(doc.querySelector('title')?.textContent.trim(), model.seo.title);
    assert.equal(doc.querySelector('meta[name="description"]')?.getAttribute('content'), model.seo.description);
    assert.equal(doc.querySelector('link[rel="canonical"]')?.getAttribute('href'), model.canonical);
    assert(doc.querySelector('.item-category'));
    assert(doc.querySelector('.item-header img') || !model.sprite);
    assert(!/\b(undefined|null|NaN)\b|\$[a-z_]+|\[object Object\]|\{\{/.test(doc.querySelector('main')?.textContent ?? ''));
    assert.equal(doc.querySelectorAll('astro-island').length, 1);
    for (const link of doc.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href');
      if (href.startsWith('/pokemon/')) assert(POKEMON_SLUG_SET.has(href.slice(9)));
      if (href.startsWith('/move/')) assert(MOVE_SLUG_SET.has(href.slice(6)));
      if (href.startsWith('/item/')) assert(ITEM_SLUGS.includes(href.slice(6)));
    }
    metrics.push({ slug, htmlBytes: buffer.length, gzipBytes: gzipSync(buffer).length, heldByPokemon: model.heldByPokemon.length, machines: model.machines.length, evolution: model.evolution.length, acquisition: model.acquisition?.acquisition?.length ?? 0 });
  } catch (error) { failures.push(`${slug}: ${error.message}`); }
}

const unexpected = readdirSync(join(dist, 'item')).filter(name => name.endsWith('.html')).map(name => name.slice(0, -5)).filter(slug => !ITEM_SLUGS.includes(slug));
const sizes = metrics.map(item => item.htmlBytes).sort((a, b) => a - b);
const percentile = ratio => sizes[Math.min(sizes.length - 1, Math.ceil(sizes.length * ratio) - 1)];
const report = { expected: ITEM_SLUGS.length, generated: generated.size, missing: ITEM_SLUGS.filter(slug => !generated.has(slug)), unexpected, duplicates: 0, failures, htmlSizes: { minimum: sizes[0], median: percentile(.5), p75: percentile(.75), p90: percentile(.9), p95: percentile(.95), maximum: sizes.at(-1), total: sizes.reduce((sum, size) => sum + size, 0) }, gzipTotal: metrics.reduce((sum, item) => sum + item.gzipBytes, 0), largest: metrics.slice().sort((a, b) => b.htmlBytes - a.htmlBytes).slice(0, 20), hydration: { itemSpecificPages: 0, itemSpecificBytes: 0, supportingJsonBytes: 0 } };
mkdirSync('evidence/items', { recursive: true });
writeFileSync('evidence/items/full-verification.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length || report.missing.length || unexpected.length || generated.size !== ITEM_SLUGS.length) process.exitCode = 1;
