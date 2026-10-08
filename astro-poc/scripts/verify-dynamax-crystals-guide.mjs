import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseHTML } from 'linkedom';
import {
  DYNAMAX_CRYSTAL_GUIDE_PATH,
  getReleasedDynamaxCrystals,
  validateReleasedDynamaxCrystals
} from '../../src/utils/dynamaxCrystals.js';

const dist = resolve(process.argv[2] ?? 'dist');
const file = join(dist, 'items', 'dynamax-crystals.html');
assert(existsSync(file), 'Dynamax Crystals guide generated');
const document = parseHTML(readFileSync(file, 'utf8')).document;
const seo = {
  title: 'Dynamax Crystals Guide: All Released Crystal Raids | PokéLore',
  description: 'Learn how Dynamax Crystals work in Pokemon Sword and Shield, how to use them at Watchtower Lair, and which 12 crystals were officially released.',
  canonical: `https://pokelore.net${DYNAMAX_CRYSTAL_GUIDE_PATH}`
};
assert.equal(document.querySelector('h1')?.textContent.trim(), 'Dynamax Crystals Guide: Released Crystal Raids');
assert.equal(document.querySelector('title')?.textContent, seo.title);
assert.equal(document.querySelector('meta[name="description"]')?.getAttribute('content'), seo.description);
assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'), seo.canonical);
assert.equal(document.querySelector('meta[property="og:url"]')?.getAttribute('content'), seo.canonical);
assert.equal(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content'), seo.title);
for (const heading of ['What Dynamax Crystals Are', 'How They Were Obtained', 'Released Dynamax Crystals', 'Unused Crystal Data']) assert([...document.querySelectorAll('h2')].some(node => node.textContent.trim() === heading), `Missing guide heading: ${heading}`);
validateReleasedDynamaxCrystals();
const crystals = getReleasedDynamaxCrystals();
assert.equal(document.querySelectorAll('.crystal').length, crystals.length, 'Every released crystal is static HTML');
for (const crystal of crystals) {
  assert(document.querySelector(`a[href="/item/${crystal.slug}"]`), `Crystal item link: ${crystal.slug}`);
  assert(existsSync(join(dist, 'item', `${crystal.slug}.html`)), `Crystal item document: ${crystal.slug}`);
  for (const pokemon of crystal.raidPokemon) assert(document.querySelector(`a[href="/pokemon/${pokemon}"]`), `Crystal Pokémon link: ${pokemon}`);
}
const sitemap = readFileSync(join(dist, 'sitemap.xml'), 'utf8');
assert.equal((sitemap.match(/<loc>https:\/\/pokelore\.net\/items\/dynamax-crystals<\/loc>/g) ?? []).length, 1, 'Guide appears exactly once in sitemap');
assert(!sitemap.includes('items/dynamax-crystals.html'), 'Sitemap has no .html guide variant');
assert(!sitemap.includes('<loc>https://pokelore.net/learnsets</loc>'), 'Removed /learnsets route is not indexed');
assert(!sitemap.includes('/dev/'), 'Local-only developer routes are not indexed');
console.log(`PASS Dynamax guide: ${crystals.length} released crystals, canonical SEO, static links, and sitemap parity.`);
