// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { PACK_RULES, poolForCard } from './packRules.js';
import { generatePack, validateSet } from './engine.js';
import { energyRewardTypes } from './energyRules.js';
import { challengePokemonTypes } from './gameIntegration.js';
import { SAVE_KEY, readSetup, challengeUrl, loadChallenges, saveChallenges, validSave } from './storage.js';
const data = Object.fromEntries(Object.keys(PACK_RULES).map(id => [id, JSON.parse(fs.readFileSync(`public/data/tcg/v1/${id}.json`))]));
const setup = { game: 'emerald', set: 'base1', seed: 'A7D92C18', modelVersion: 'v1' };
describe('validated committed TCG data', () => {
  for (const [id, set] of Object.entries(data)) it(`${id}: size, pools, rarities, dex mappings and deterministic packs`, () => {
    expect(validateSet(set)).toEqual([]);
    expect(set.rules).toEqual(PACK_RULES[id]);
    for (const card of set.cards) {
      const pool = poolForCard(card, set.rules);
      if (pool) expect(set.pools[pool]).toContain(card.id);
      if (card.category === 'Pokemon') expect(card.dexIds.length).toBeGreaterThan(0);
      if (card.category === 'Energy') expect(energyRewardTypes(card, set.rules.energyEra, 'emerald').length).toBeGreaterThan(0);
    }
    for (let i = 0; i < 60; i++) {
      const pack = generatePack(set, setup, i);
      expect(pack).toHaveLength(11);
      expect(pack).toEqual(generatePack(JSON.parse(JSON.stringify(set)), setup, i));
      const nonEnergy = pack.filter(c => c.pool !== 'energy').map(c => c.id);
      expect(new Set(nonEnergy).size).toBe(nonEnergy.length);
      for (const slot of set.rules.slots.filter(s => s.pool)) expect(pack.filter(c => c.pool === slot.pool)).toHaveLength(slot.count);
    }
  });
  it('locks a v1 golden sequence and separates games/seeds/pack indices', () => {
    expect(generatePack(data.base1, setup, 0).map(c => c.id)).toEqual(['base1-69', 'base1-66', 'base1-43', 'base1-54', 'base1-65', 'base1-98', 'base1-100', 'base1-39', 'base1-42', 'base1-87', 'base1-70']);
    for (const changed of [{ ...setup, seed: 'different' }, { ...setup, game: 'yellow' }]) expect(generatePack(data.base1, changed, 0)).not.toEqual(generatePack(data.base1, setup, 0));
    expect(generatePack(data.base1, setup, 1)).not.toEqual(generatePack(data.base1, setup, 0));
    expect(() => generatePack(data.base1, { ...setup, modelVersion: 'v2' }, 0)).toThrow();
  });
  it('excludes starter-only Machamp and keeps Double Colorless out of basic Energy slots', () => {
    expect(Object.values(data.base1.pools).flat()).not.toContain('base1-8');
    expect(data.base1.pools.uncommon).toContain('base1-96');
    expect(data.base1.pools.energy).toHaveLength(6);
  });
  it('special pools have the exact card IDs and estimated frequencies', () => {
    expect(data.base5.pools.secret).toEqual(['base5-83']);
    expect(data.neo3.pools.shining).toEqual(['neo3-65', 'neo3-66']);
    expect(data.neo4.pools.shining).toHaveLength(8);
    for (const [id, probability, pool] of [['base5', 6 / 330, 'secret'], ['neo3', 12 / 330, 'shining'], ['neo4', 1 / 12, 'shining']]) {
      let hits = 0; const cards = new Set();
      for (let i = 0; i < 12000; i++) { const last = generatePack(data[id], setup, i).at(-1); if (last.pool === pool) { hits++; cards.add(last.id); } }
      expect(Math.abs(hits / 12000 - probability)).toBeLessThan(.012);
      expect(cards.size).toBe(data[id].pools[pool].length);
    }
  });
  it('dex index preserves every card mapping including excluded cards', () => {
    const index = JSON.parse(fs.readFileSync('public/data/tcg/v1/dex-index.json'));
    for (const set of Object.values(data)) for (const card of set.cards) for (const dex of card.dexIds) expect(index[dex]).toContain(card.id);
    expect(index[68]).toContain('base1-8');
  });
  it('rejects broken pool and probability configurations', () => {
    const broken = structuredClone(data.base1);
    broken.pools.common = []; broken.rules.slots.at(-1).distribution[0].probability = .8;
    expect(validateSet(broken)).toContain('Probabilities');
    expect(validateSet(broken)).toContain('Invalid pool common');
  });
});
describe('WotC Energy rewards', () => {
  it('displays historical Pokémon types while keeping all species eligible', () => {
    expect(challengePokemonTypes({ id: 81, types: ['electric', 'steel'] }, 'red-blue')).toEqual(['electric']);
    expect(challengePokemonTypes({ id: 35, types: ['fairy'] }, 'emerald')).toEqual(['normal']);
    expect(challengePokemonTypes({ id: 176, types: ['fairy', 'flying'] }, 'emerald')).toEqual(['normal', 'flying']);
    expect(challengePokemonTypes({ id: 122, types: ['psychic', 'fairy'] }, 'emerald')).toEqual(['psychic']);
    expect(challengePokemonTypes({ id: 35, types: ['fairy'] }, 'x-y')).toEqual(['fairy']);
  });
  const reward = (name, game = 'emerald', era = 'neo') => energyRewardTypes({ name }, era, game);
  it('keeps historical Poison, Dragon and generation-one restrictions', () => {
    expect(reward('Grass Energy')).toEqual(['grass', 'bug', 'poison']);
    expect(reward('Psychic Energy')).toEqual(['psychic', 'ghost']);
    expect(reward('Fighting Energy')).toEqual(['fighting', 'rock', 'ground']);
    expect(reward('Double Colorless Energy')).toContain('dragon');
    expect(reward('Darkness Energy', 'red-blue')).toEqual([]);
    expect(reward('Metal Energy')).toEqual(['steel']);
    expect(reward('Rainbow Energy', 'emerald', 'base')).not.toContain('dark');
    expect(reward('Miracle Energy')).toContain('dark');
    expect(reward('Miracle Energy')).not.toContain('fairy');
  });
});
describe('seeds and local saves', () => {
  const challenge = { ...setup, id: 'test', name: 'My run', progress: 'One badge', team: [1], packs: [{ cards: generatePack(data.base1, setup, 0), revealed: 4 }] };
  it('round-trips share URLs without journal, team or progress', () => {
    expect(readSetup(challengeUrl(challenge).split('?')[1])).toEqual(setup);
    expect(challengeUrl(challenge)).not.toContain('badge');
    expect(readSetup('?game=no&set=neo4&seed=x')).toBeNull();
    expect(readSetup('?game=emerald&set=neo4&seed=x&model=v2')).toBeNull();
  });
  it('round-trips partially revealed packs and validates corrupt saves', () => {
    let text = null;
    const storage = { getItem: () => text, setItem: (key, value) => { expect(key).toBe(SAVE_KEY); text = value; } };
    expect(saveChallenges(storage, [challenge])).toBe('');
    expect(loadChallenges(storage).challenges).toEqual([challenge]);
    expect(validSave({ ...challenge, packs: [null] })).toBe(false);
    text = '{broken'; expect(loadChallenges(storage).error).toBeTruthy(); expect(text).toBe('{broken');
    text = '{}'; expect(loadChallenges(storage).error).toBeTruthy();
  });
  it('reports unavailable storage instead of silently claiming a save', () => {
    const storage = { getItem: () => { throw Error(); }, setItem: () => { throw Error(); } };
    expect(loadChallenges(storage).error).toBeTruthy();
    expect(saveChallenges(storage, [])).toContain('only in memory');
  });
});
