// Versioned independently of UI: keep v1 data/pool ordering stable for shared seeds.
export const MODEL_VERSION = 'v1';
const guide = 'https://www.elitefourum.com/t/the-english-pokemon-card-rarity-guide/39762';
const definitions = [
  ['base1', 'Base Set', 2, 2], ['base2', 'Jungle', 0, 3],
  ['base3', 'Fossil', 0, 4], ['base4', 'Base Set 2', 2, 10],
  ['base5', 'Team Rocket', 0, 13], ['gym1', 'Gym Heroes', 1, 14],
  ['gym2', 'Gym Challenge', 1, 18], ['neo1', 'Neo Genesis', 1, 19],
  ['neo2', 'Neo Discovery', 0, 20], ['neo3', 'Neo Revelation', 0, 24],
  ['neo4', 'Neo Destiny', 0, 25],
];

export const PACK_RULES = Object.fromEntries(definitions.map(([id, name, energy, post]) => {
  const special = id === 'base5' ? 6 / 330 : id === 'neo3' ? 12 / 330 : id === 'neo4' ? 1 / 12 : 0;
  const distribution = [{ pool: 'rare', probability: 2 / 3 },
    { pool: 'holo', probability: 1 / 3 - special }];
  if (special) distribution.push({ pool: id === 'base5' ? 'secret' : 'shining', probability: special });
  return [id, {
    id, name, modelVersion: MODEL_VERSION, cardsPerPack: 11,
    energyEra: id.startsWith('neo') ? 'neo' : 'base',
    excludedIds: id === 'base1' ? ['base1-8'] : [],
    specialIds: id === 'base5' ? ['base5-83'] : id === 'neo3' ? ['neo3-65', 'neo3-66'] :
      id === 'neo4' ? Array.from({ length: 8 }, (_, i) => `neo4-${106 + i}`) : [],
    slots: [
      { type: 'common', count: 7 - energy, pool: 'common', unique: true },
      ...(energy ? [{ type: 'energy', count: energy, pool: 'energy', unique: false }] : []),
      { type: 'uncommon', count: 3, pool: 'uncommon', unique: true },
      { type: 'rare', count: 1, distribution, unique: true },
    ],
    compositionConfidence: 'documented-pack-composition',
    oddsConfidence: 'collector-reconstruction',
    sources: [{ name: `English Pokémon card rarity guide — ${name}`, url: `${guide}/${post}`, supports: 'Composition, sheets and collector box-opening reconstruction' }],
    notes: 'Individual packs; no box guarantees or error print runs. Uniform selection within pools except explicit weights. Basic Energy may repeat; other exact card IDs do not repeat within a pack.',
  }];
}));

export function poolForCard(card, rules) {
  if (rules.excludedIds.includes(card.id)) return null;
  if (rules.specialIds.includes(card.id)) return rules.id === 'base5' ? 'secret' : 'shining';
  if (card.category === 'Energy' && card.energyType === 'Normal') return 'energy';
  if (card.rarity === 'Common') return 'common';
  if (card.rarity === 'Uncommon') return 'uncommon';
  if (['Rare', 'Rare Holo', 'Holo Rare'].includes(card.rarity)) return card.holo || card.rarity.includes('Holo') ? 'holo' : 'rare';
  throw new Error(`Unclassified rarity: ${card.id} (${card.rarity})`);
}
