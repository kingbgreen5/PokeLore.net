import { describe, expect, it } from 'vitest';
import typeChart from '../constants/Types';
import golden from '../test/fixtures/teamCoverage/teamCoverageGoldenMaster.json';
import { getCoveredDefenseTypes, getDefensiveCoverageBreakdown, getTeamRecommendationScore } from './teamCoverage';

describe('Team Coverage production golden master', () => {
  it('freezes the empty calculator defaults', () => {
    expect(golden.initialState).toMatchObject({ version: 'scarlet-violet', party: [null, null, null, null, null, null], sort: 'custom-score', coverageFilter: 'both', desktopPageSize: 20, mobilePageSize: 12 });
  });
  it('preserves representative offensive coverage', () => {
    expect(getCoveredDefenseTypes({ attackTypes: golden.offensive.attackTypes, typeChart })).toEqual(golden.offensive.coveredTypes);
  });
  it('preserves immunity and dual-type resistance classification', () => {
    expect(getDefensiveCoverageBreakdown({ defenseTypes: ['ghost'], typeChart })).toEqual(golden.defensive.ghost);
    expect(getDefensiveCoverageBreakdown({ defenseTypes: ['steel', 'flying'], typeChart })).toEqual(golden.defensive.steelFlying);
  });
  it.each(Object.entries(golden.scores))('preserves weighted %s score components', (_, fixture) => {
    const score = getTeamRecommendationScore({ pokemon: fixture.input });
    expect(score.total).toBeCloseTo(fixture.total);
    for (const [key, value] of Object.entries(fixture.parts)) expect(score.parts[key]).toBeCloseTo(value);
  });
});
