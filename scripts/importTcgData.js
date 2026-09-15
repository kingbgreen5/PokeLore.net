import fs from 'node:fs/promises';
import path from 'node:path';
import { PACK_RULES, poolForCard } from '../src/tcg/packRules.js';
import { validateSet } from '../src/tcg/engine.js';

const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'public/data/tcg/v1');
const cache = path.join(root, '.tcg-cache');
await fs.mkdir(output, { recursive: true });
await fs.mkdir(cache, { recursive: true });
async function get(endpoint) {
  const file = path.join(cache, endpoint.replaceAll('/', '_') + '.json');
  if (!process.argv.includes('--refresh')) {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { /* fetch cache miss */ }
  }
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(`https://api.tcgdex.net/v2/en/${endpoint}`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`);
      const data = await response.json();
      await fs.writeFile(file, JSON.stringify(data));
      return data;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}
async function mapLimited(values, fn) {
  const result = new Array(values.length);
  let next = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (next < values.length) { const i = next++; result[i] = await fn(values[i]); }
  }));
  return result;
}
const sets = [];
const dexIndex = {};
// Fetch and validate everything before replacing the normalized files.
const datasets = [];
for (const rules of Object.values(PACK_RULES)) {
  const set = await get(`sets/${rules.id}`);
  const cards = await mapLimited(set.cards, async brief => {
    const c = await get(`cards/${brief.id}`);
    return {
      id: c.id, name: c.name, number: c.localId, category: c.category,
      image: c.image ? `${c.image}/high.webp` : null,
      imageFallback: `https://images.pokemontcg.io/${rules.id}/${c.localId}.png`,
      rarity: c.rarity, holo: Boolean(c.variants?.holo && !c.variants?.normal),
      dexIds: c.dexId ?? [], types: c.types ?? [], energyType: c.energyType ?? null,
      illustrator: c.illustrator ?? null, description: c.description ?? c.effect ?? null,
      attacks: c.attacks ?? [], abilities: c.abilities ?? [],
    };
  });
  cards.sort((a, b) => Number(a.number) - Number(b.number) || (a.id < b.id ? -1 : 1));
  const pools = {};
  for (const card of cards) {
    const pool = poolForCard(card, rules);
    if (pool) (pools[pool] ??= []).push(card.id);
    for (const id of card.dexIds) (dexIndex[id] ??= []).push(card.id);
  }
  const weights = {};
  // Documented Team Rocket holo-sheet multiplicities; special slot is 6/330.
  if (rules.id === 'base5') for (const id of pools.holo) weights[id] = ['base5-2', 'base5-14'].includes(id) ? 7 : 6;
  const data = { id: rules.id, schemaVersion: 1, rules, cards, pools, weights };
  const errors = validateSet(data);
  if (errors.length) throw new Error(`${rules.id}: ${errors.join(', ')}`);
  datasets.push(data);
  sets.push({ id: set.id, name: set.name, cardCount: cards.length, logo: set.logo ? `${set.logo}.webp` : null, releaseDate: set.releaseDate, modelVersion: 'v1' });
  console.log(`${rules.name}: ${cards.length} cards, ${JSON.stringify(Object.fromEntries(Object.entries(pools).map(([k, v]) => [k, v.length])))}`);
}
for (const data of datasets) await fs.writeFile(path.join(output, `${data.id}.json`), JSON.stringify(data));
await fs.writeFile(path.join(output, 'dex-index.json'), JSON.stringify(dexIndex));
await fs.writeFile(path.join(output, 'sets.json'), JSON.stringify(sets));
console.log('TCG cache validated and written. Review any regenerated v1 changes before committing; future model changes require a new version.');
