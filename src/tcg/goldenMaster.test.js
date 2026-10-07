// @vitest-environment node
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import fixtures from '../test/fixtures/tcgChallenge/packGoldenMaster.json';
import { generatePack } from './engine.js';
import { arrangePack } from './packPresentation.js';

const loadSet = id => JSON.parse(fs.readFileSync(`public/data/tcg/v1/${id}.json`));

describe('production-derived TCG pack golden master', () => {
  for (const fixture of fixtures) it(fixture.name, () => {
    const data = loadSet(fixture.set);
    const generated = generatePack(data, { game: fixture.game, set: fixture.set, seed: fixture.seed, modelVersion: 'v1' }, fixture.packIndex);
    const pack = arrangePack(generated, fixture.set, fixture.order, data);
    expect(pack.map(card => [card.id, card.pool])).toEqual(fixture.cards);
  });
});
