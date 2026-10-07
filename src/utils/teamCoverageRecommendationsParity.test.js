import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';
import { ALL_POKEMON_TYPES, DEFAULT_TEAM_RECOMMENDATION_WEIGHTS } from './teamCoverage.js';
import { buildRecommendationCandidates } from './teamCoverageRecommendations.js';
import { productionRecommendationOracle, productionVisibleSlice } from '../test/helpers/teamCoverageProductionRecommendationOracle.js';
import golden from '../test/fixtures/teamCoverage/teamCoverageRecommendationGoldenMaster.json';

const data = version => JSON.parse(readFileSync(join(process.cwd(), 'public', 'data', 'teamCoverage', `${version}.json`), 'utf8')).pokemon;
const scarletViolet = data('scarlet-violet');
const emerald = data('emerald');
const tealMask = data('the-teal-mask');

const defaults = {
  candidates: scarletViolet,
  selectedIds: [],
  consideredTypes: ALL_POKEMON_TYPES,
  missingTypes: ALL_POKEMON_TYPES,
  missingDefensiveTypes: ALL_POKEMON_TYPES,
  hasOpenPartySlot: true,
  hasActiveRecommendationNeed: true,
  hasPureNormalPartyMember: false,
  coverageFilter: 'both',
  focusType: 'water',
  legendaryFilter: 'hide',
  tradeEvolutionFilter: 'hide',
  includeMachineMoves: false,
  maxMoveLevel: 50,
  minMovePower: 60,
  weights: DEFAULT_TEAM_RECOMMENDATION_WEIGHTS,
  sortMode: 'custom-score'
};

const scenarios = [
  ['A default empty team', {}],
  ['B three-member balanced team', { selectedIds: [6, 25, 149], missingTypes: ['ground', 'rock', 'water'], missingDefensiveTypes: ['rock', 'fairy'] }],
  ['C shared defensive weakness', { selectedIds: [6, 59, 94], missingTypes: ['ground'], missingDefensiveTypes: ['water', 'ground', 'rock'] }],
  ['D offensive coverage gap', { selectedIds: [25, 6], missingTypes: ['ghost', 'psychic', 'steel'], missingDefensiveTypes: [] }],
  ['E strict recommendation move filters', { maxMoveLevel: 10, minMovePower: 100 }],
  ['F high recommendation minimum power', { minMovePower: 150 }],
  ['G legendary hidden', { legendaryFilter: 'hide' }],
  ['H legendary shown', { legendaryFilter: 'show' }],
  ['I trade evolutions hidden', { tradeEvolutionFilter: 'hide' }],
  ['J trade evolutions shown', { tradeEvolutionFilter: 'show' }],
  ['K offensive coverage filter', { coverageFilter: 'offensive' }],
  ['K defensive coverage filter', { coverageFilter: 'defensive' }],
  ['K either coverage filter', { coverageFilter: 'either' }],
  ['K both coverage filter', { coverageFilter: 'both' }],
  ['L fire focus', { focusType: 'fire', sortMode: 'selected-type-first' }],
  ['L steel focus', { focusType: 'steel', sortMode: 'selected-type-first' }],
  ['M default score weights', {}],
  ['N coverage-emphasized score weights', { weights: { ...DEFAULT_TEAM_RECOMMENDATION_WEIGHTS, coverageType: 5, regionalDex: 0 } }],
  ['O zeroed coverage score component', { weights: { ...DEFAULT_TEAM_RECOMMENDATION_WEIGHTS, coverageType: 0 } }],
  ['Q representative alternate forms', { candidates: tealMask, selectedIds: [550, 668, 741], missingTypes: ['water', 'ground', 'psychic'], missingDefensiveTypes: ['fire', 'fighting'] }],
  ['R unavailable version dataset', { candidates: [], missingTypes: [], missingDefensiveTypes: [], hasActiveRecommendationNeed: false }]
];

const sortModes = ['custom-score', 'national-dex', 'most-coverage', 'selected-type-first', 'highest-bst', 'highest-hp', 'highest-attack', 'highest-defense', 'highest-special-attack', 'highest-special-defense', 'highest-speed'];

function signature(result) {
  return {
    fallbackMode: result.fallbackMode,
    ids: result.candidates.map(candidate => candidate.id),
    scores: result.candidates.map(candidate => ({ id: candidate.id, total: candidate.playthroughScore.total, parts: candidate.playthroughScore.parts })),
    eligibleIds: result.candidates.map(candidate => candidate.id)
  };
}

function pageSlice(result, page, pageSize) {
  const production = productionVisibleSlice({ candidates: result.candidates, page, pageSize });
  const count = Math.max(1, Math.ceil(result.candidates.length / pageSize));
  const current = Math.min(page, count);
  return { currentPage: current, pageCount: count, ids: result.candidates.slice((current - 1) * pageSize, current * pageSize).map(candidate => candidate.id), production };
}

describe('Team Coverage recommendation production parity', () => {
  it.each(scenarios)('%s has exact candidate, score, fallback, and desktop/mobile page parity', (_, override) => {
    const input = { ...defaults, ...override };
    const production = productionRecommendationOracle(input);
    const module = buildRecommendationCandidates(input);
    expect(signature(module)).toEqual(signature(production));
    expect(pageSlice(module, 2, 20)).toEqual(pageSlice(production, 2, 20));
    expect(pageSlice(module, 2, 12)).toEqual(pageSlice(production, 2, 12));
  });

  it.each(sortModes)('P freezes production ordering for %s, including its tie-break chain', sortMode => {
    const input = { ...defaults, sortMode, missingTypes: ['water', 'ground', 'psychic', 'ghost'], missingDefensiveTypes: ['fire', 'fighting', 'ground'], focusType: 'water' };
    expect(signature(buildRecommendationCandidates(input))).toEqual(signature(productionRecommendationOracle(input)));
  });

  it('Q uses National Dex as the final tie break for a tie-heavy candidate set', () => {
    const tied = scarletViolet.filter(pokemon => [25, 26, 172].includes(pokemon.id)).map(pokemon => ({ ...pokemon, baseStatTotal: 500, stats: { hp: 80, attack: 80, defense: 80, specialAttack: 80, specialDefense: 80, speed: 80 }, attackTypePowerLevels: { water: [{ level: 1, power: 100 }] }, playthroughFlags: { inRegionalDex: true, tier: null, tradeEvolution: false } }));
    const input = { ...defaults, candidates: tied, missingTypes: ['fire'], missingDefensiveTypes: [], coverageFilter: 'offensive', sortMode: 'custom-score' };
    const production = productionRecommendationOracle(input);
    expect(signature(buildRecommendationCandidates(input))).toEqual(signature(production));
    expect(production.candidates.map(candidate => candidate.id)).toEqual([25, 26, 172]);
  });

  it('uses Emerald data as a second populated version', () => {
    const input = { ...defaults, candidates: emerald, selectedIds: [3, 9, 257], missingTypes: ['electric', 'psychic', 'ghost'], missingDefensiveTypes: ['ground', 'rock'], focusType: 'ground' };
    expect(signature(buildRecommendationCandidates(input))).toEqual(signature(productionRecommendationOracle(input)));
  });

  it.each(Object.entries(golden.scenarios))('keeps production-captured golden fixture %s', (_, fixture) => {
    const input = { ...defaults, ...fixture.input };
    const production = productionRecommendationOracle(input);
    const module = buildRecommendationCandidates(input);
    for (const result of [production, module]) {
      expect(result.candidates).toHaveLength(fixture.count);
      expect(result.fallbackMode).toBe(fixture.fallbackMode);
      expect(result.candidates.slice(0, 20).map(candidate => candidate.id)).toEqual(fixture.orderedIds);
      expect(result.candidates.slice(0, 5).map(candidate => [candidate.id, candidate.playthroughScore.total])).toEqual(fixture.scores);
      expect(productionVisibleSlice({ candidates: result.candidates, page: 2, pageSize: 20 }).ids).toEqual(fixture.desktopPage2);
      expect(productionVisibleSlice({ candidates: result.candidates, page: 2, pageSize: 12 }).ids).toEqual(fixture.mobilePage2);
    }
  });
});
