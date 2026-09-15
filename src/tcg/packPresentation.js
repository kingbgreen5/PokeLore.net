import { seededRandom } from './engine.js';

export const OPENING_ORDERS = {
  'suggested-v1': 'Suggested',
  'historical-v1': 'Original Order',
};
export const ORDER_LABELS = {
  ...OPENING_ORDERS,
  'rare-last-v1': 'Rare last',
  'legacy-v1': 'Rare last (original simulator)',
};
export const selectableOrder = order => order === 'historical-v1' ? order : 'suggested-v1';

// Face-up reading order, before doing a collector's "card trick".
// Justin Keena documents these blocks from observed YouTube pack openings:
// https://pokemonboosterpack.com/archive/pages/about
// Stamp & Stamp (153 Base Unlimited packs) explicitly note box-to-box variation:
// https://www.cs.sjsu.edu/~stamp/cv/papers/pokemon.pdf
// These are representative arrangements, not every print-run/sheet sequence.
export const PACK_PRESENTATION = {
  base1: { blocks: ['common', 'energy', 'rare', 'uncommon'], summary: '5 common → 2 Energy → rare → 3 uncommon', note: 'Base Set Energy placement and block order varied between print runs and boxes.' },
  base2: { blocks: ['common', 'rare', 'uncommon'], summary: '7 common → rare → 3 uncommon' },
  base3: { blocks: ['common', 'rare', 'uncommon'], summary: '7 common → rare → 3 uncommon' },
  base4: { blocks: ['uncommon', 'common', 'rare', 'energy'], summary: '3 uncommon → 5 common → rare → 2 Energy' },
  base5: { blocks: ['common', 'rare', 'uncommon'], summary: '7 common → rare → 3 uncommon' },
  gym1: { blocks: ['common', 'rare', 'uncommon', 'energy'], summary: '6 common → rare → 3 uncommon → Energy' },
  gym2: { blocks: ['common', 'rare', 'uncommon', 'energy'], summary: '6 common → rare → 3 uncommon → Energy' },
  neo1: { blocks: ['energy', 'rare', 'uncommon', 'common'], summary: 'Energy → rare → 3 uncommon → 6 common' },
  neo2: { blocks: ['uncommon', 'rare', 'common'], summary: '3 uncommon → rare → 7 common' },
  neo3: { blocks: ['common', 'rare', 'uncommon'], summary: '7 common → rare → 3 uncommon' },
  neo4: { blocks: ['common', 'rare', 'uncommon'], summary: '7 common → rare → 3 uncommon' },
};

export function arrangePack(cards, set, order = 'legacy-v1', data) {
  if (!Object.hasOwn(ORDER_LABELS, order)) throw new Error('Unknown reveal order');
  if (order === 'legacy-v1') return [...cards];
  const blocks = PACK_PRESENTATION[set]?.blocks;
  if (!blocks) throw new Error('No pack order configured for this set');
  const group = card => ['common', 'uncommon', 'energy'].includes(card.pool) ? card.pool : 'rare';
  const historical = blocks.flatMap(block => cards.filter(card => group(card) === block));
  if (historical.length !== cards.length) throw new Error('Pack order lost cards');
  if (order === 'suggested-v1') {
    if (!data) throw new Error('Suggested order requires card data');
    const byId = new Map(data.cards.map(c => [c.id, c]));
    const isPokemon = c => byId.get(c.id)?.category === 'Pokemon';
    const ordinary = historical.filter(c => group(c) !== 'rare');
    // Only trainer-heavy packs need substitutions. Keep rarity counts and the rare draw.
    let missing = Math.max(0, 2 - ordinary.filter(isPokemon).length);
    const random = seededRandom(JSON.stringify(['suggested-v1', set, cards]));
    const used = new Set(cards.map(c => c.id));
    for (let i = 0; i < ordinary.length && missing; i++) {
      const card = ordinary[i];
      if (isPokemon(card) || !['common', 'uncommon'].includes(card.pool)) continue;
      const candidates = data.pools[card.pool].filter(id => byId.get(id)?.category === 'Pokemon' && !used.has(id));
      if (!candidates.length) continue;
      const id = candidates[Math.floor(random() * candidates.length)];
      ordinary[i] = { ...card, id }; used.add(id); missing--;
    }
    if (missing) throw new Error('This set cannot supply two opening Pokémon');
    const first = ordinary.filter(isPokemon).slice(0, 2);
    return [...first, ...ordinary.filter(c => !first.includes(c)), ...historical.filter(c => group(c) === 'rare')];
  }
  // Move the rare slot only. This is a presentation choice, not a new draw.
  return order === 'rare-last-v1' ? [...historical.filter(c => group(c) !== 'rare'), ...historical.filter(c => group(c) === 'rare')] : historical;
}

export function boosterArtwork(artwork, set, seed, index) {
  const choices = artwork?.sets?.[set] ?? [];
  const random = seededRandom(JSON.stringify(['wrapper-v1', set, seed, index]));
  return choices[Math.floor(random() * choices.length)] ?? null;
}
