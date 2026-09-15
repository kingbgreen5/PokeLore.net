// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { arrangePack, PACK_PRESENTATION, boosterArtwork, OPENING_ORDERS, selectableOrder } from './packPresentation.js';
import { generatePack } from './engine.js';
import { challengeUrl, readSetup, validSave } from './storage.js';
const setup = { game: 'crystal', set: 'neo1', seed: '73A9A788', modelVersion: 'v1' };
const data = id => JSON.parse(fs.readFileSync(`public/data/tcg/v1/${id}.json`));
const expected = {
  base1: 'CCCCCEERUUU', base2: 'CCCCCCCRUUU', base3: 'CCCCCCCRUUU',
  base4: 'UUUCCCCCREE', base5: 'CCCCCCCRUUU', gym1: 'CCCCCCRUUUE', gym2: 'CCCCCCRUUUE',
  neo1: 'ERUUUCCCCCC', neo2: 'UUURCCCCCCC', neo3: 'CCCCCCCRUUU', neo4: 'CCCCCCCRUUU',
};
const symbol = c => ({ common: 'C', uncommon: 'U', energy: 'E' })[c.pool] ?? 'R';
describe('Suggested order', () => {
  it('offers exactly two modes and maps retired modes to Suggested', () => {
    expect(Object.values(OPENING_ORDERS)).toEqual(['Suggested', 'Original Order']);
    for (const order of [undefined, 'legacy-v1', 'rare-last-v1', 'suggested-v1']) expect(selectableOrder(order)).toBe('suggested-v1');
    expect(selectableOrder('historical-v1')).toBe('historical-v1');
    const selected = { ...setup, order: 'suggested-v1' };
    expect(readSetup(challengeUrl(selected).split('?')[1])).toEqual(selected);
  });
  for (const id of Object.keys(PACK_PRESENTATION)) it(`${id}: guarantees two Pokémon first and preserves rare pulls`, () => {
    const set = data(id);
    const category = c => set.cards.find(card => card.id === c.id).category;
    for (let index = 0; index < 100; index++) {
      const original = generatePack(set, setup, index);
      const snapshot = structuredClone(original);
      const pack = arrangePack(original, id, 'suggested-v1', set);
      expect(pack.slice(0, 2).map(category)).toEqual(['Pokemon', 'Pokemon']);
      expect(symbol(pack.at(-1))).toBe('R');
      expect(pack.at(-1)).toEqual(original.find(c => symbol(c) === 'R'));
      expect(pack.map(c => c.pool).sort()).toEqual(original.map(c => c.pool).sort());
      if (original.filter(c => symbol(c) !== 'R' && category(c) === 'Pokemon').length >= 2) {
        expect(pack.map(c => c.id).sort()).toEqual(original.map(c => c.id).sort());
      }
      expect(arrangePack(original, id, 'suggested-v1', set)).toEqual(pack);
      expect(original).toEqual(snapshot);
    }
  });
  it('fills a trainer-only opening without changing the rare or creating duplicates', () => {
    const set = data('base1');
    const cards = generatePack(set, setup, 0).map(c => {
      if (!['common', 'uncommon'].includes(c.pool)) return c;
      return { ...c, id: set.pools[c.pool].find(id => set.cards.find(card => card.id === id).category === 'Trainer') };
    });
    const pack = arrangePack(cards, set.id, 'suggested-v1', set);
    expect(pack.slice(0, 2).every(c => set.cards.find(card => card.id === c.id).category === 'Pokemon')).toBe(true);
    expect(pack[0].id).not.toBe(pack[1].id);
    expect(pack.at(-1)).toEqual(cards.at(-1));
  });
});
describe('historical reveal order', () => {
  for (const id of Object.keys(PACK_PRESENTATION)) it(`${id}: orders rarity blocks without changing any draws`, () => {
    const original = generatePack(data(id), setup, 0);
    const snapshot = structuredClone(original);
    const historical = arrangePack(original, id, 'historical-v1');
    expect(historical.map(symbol).join('')).toBe(expected[id]);
    expect(historical.map(c => c.id).sort()).toEqual(original.map(c => c.id).sort());
    expect(original).toEqual(snapshot);
    const rareLast = arrangePack(original, id, 'rare-last-v1');
    expect(symbol(rareLast.at(-1))).toBe('R');
    expect(rareLast.map(c => c.id).sort()).toEqual(original.map(c => c.id).sort());
    expect(arrangePack(original, id)).toEqual(original);
  });
  it('preserves common Trainers in the first slot rather than forcing Pokémon first', () => {
    const base = data('base1');
    let found = false;
    for (let i = 0; i < 100; i++) {
      const pack = arrangePack(generatePack(base, setup, i), 'base1', 'historical-v1');
      if (base.cards.find(c => c.id === pack[0].id).category === 'Trainer') found = true;
    }
    expect(found).toBe(true);
  });
  it('shares order explicitly while old links and saved arrays retain legacy behavior', () => {
    const selected = { ...setup, order: 'historical-v1' };
    expect(readSetup(challengeUrl(selected).split('?')[1])).toEqual(selected);
    expect(readSetup(challengeUrl(setup).split('?')[1])).toEqual(setup);
    expect(readSetup(`${challengeUrl(setup).split('?')[1]}&order=invalid`)).toBeNull();
    const cards = generatePack(data('neo1'), setup, 0);
    const save = { ...setup, id: 'test', name: 'Existing run', progress: '', team: [], packs: [{ cards, revealed: 3 }] };
    expect(validSave(save)).toBe(true);
    expect(validSave({ ...save, order: 'historical-v1' })).toBe(true);
    expect(save.packs[0].cards).toEqual(cards);
  });
});
describe('local historical artwork', () => {
  const manifest = JSON.parse(fs.readFileSync('public/data/tcg/artwork.json'));
  it('includes 41 original wrapper scans, all eleven sets, and a card back', () => {
    expect(Object.keys(manifest.sets).sort()).toEqual(Object.keys(PACK_PRESENTATION).sort());
    expect(Object.values(manifest.sets).flat()).toHaveLength(41);
    for (const asset of [manifest.cardBack, ...Object.values(manifest.sets).flat()]) {
      expect(asset.source).toMatch(/^https:\/\/archives.bulbagarden.net\/wiki\/File:/);
      const bytes = fs.readFileSync(`public${asset.image}`);
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF');
      expect(bytes.toString('ascii', 8, 12)).toBe('WEBP');
    }
  });
  it('chooses wrapper art deterministically without consuming the pull generator', () => {
    const pack = generatePack(data('neo1'), setup, 0);
    expect(boosterArtwork(manifest, 'neo1', setup.seed, 0)).toEqual(boosterArtwork(manifest, 'neo1', setup.seed, 0));
    expect(generatePack(data('neo1'), setup, 0)).toEqual(pack);
    expect(boosterArtwork(null, 'neo1', '', 0)).toBeNull();
  });
});
