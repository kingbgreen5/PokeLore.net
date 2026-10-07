// Test-only parity oracle. This is a literal, non-runtime extraction of the
// recommendation expressions in TeamCoveragePage.jsx as of Phase 10H.1.
// Keep this independent from teamCoverageRecommendations.js: the production
// page remains the authority and this file makes any future drift observable.
import typeChart from '../../constants/Types.js';
import {
  getCoveredDefenseTypes,
  getDefensiveCoverageTypes,
  getTeamRecommendationScore
} from '../../utils/teamCoverage.js';

const STAT_SORT_MODES = [
  { value: 'highest-bst', stat: 'baseStatTotal' }, { value: 'highest-hp', stat: 'hp' },
  { value: 'highest-attack', stat: 'attack' }, { value: 'highest-defense', stat: 'defense' },
  { value: 'highest-special-attack', stat: 'specialAttack' },
  { value: 'highest-special-defense', stat: 'specialDefense' }, { value: 'highest-speed', stat: 'speed' }
];

function compareByNationalDex(a, b) { return a.id - b.id; }
function coverageScore(recommendation) { return Number(recommendation?.coverageScore) || 0; }
function compareByMostCoverage(a, b) {
  return coverageScore(b) - coverageScore(a) || (b.missingHits?.length ?? 0) - (a.missingHits?.length ?? 0) || (b.missingDefensiveHits?.length ?? 0) - (a.missingDefensiveHits?.length ?? 0) || (b.coveredTypes?.length ?? 0) - (a.coveredTypes?.length ?? 0) || compareByNationalDex(a, b);
}
function statMode(value) { return STAT_SORT_MODES.find(option => option.value === value); }
function statValue(pokemon, stat) { return Number(stat === 'baseStatTotal' ? pokemon?.baseStatTotal : pokemon?.stats?.[stat]) || 0; }
function sortCandidates(candidates, sortMode, focusType) {
  return [...candidates].sort((a, b) => {
    if (sortMode === 'custom-score') return (b.playthroughScore?.total ?? 0) - (a.playthroughScore?.total ?? 0) || statValue(b, 'baseStatTotal') - statValue(a, 'baseStatTotal') || compareByMostCoverage(a, b);
    if (sortMode === 'most-coverage') return compareByMostCoverage(a, b);
    if (sortMode === 'selected-type-first') return Number(b.missingHits.includes(focusType) || b.missingDefensiveHits?.includes(focusType)) - Number(a.missingHits.includes(focusType) || a.missingDefensiveHits?.includes(focusType)) || compareByMostCoverage(a, b);
    const mode = statMode(sortMode);
    return mode ? statValue(b, mode.stat) - statValue(a, mode.stat) || compareByNationalDex(a, b) : compareByNationalDex(a, b);
  });
}
function attackPowers({ includeMachineMoves = false, maxMoveLevel = 0, pokemon }) {
  const levelCap = Number(maxMoveLevel) || 0;
  const levels = includeMachineMoves ? pokemon.attackTypePowerLevelsWithMachineMoves ?? pokemon.attackTypePowerLevels : pokemon.attackTypePowerLevels;
  const powers = includeMachineMoves ? pokemon.attackTypePowersWithMachineMoves ?? pokemon.attackTypePowers : pokemon.attackTypePowers;
  const byLevel = includeMachineMoves ? pokemon.attackTypePowersByLevelWithMachineMoves ?? pokemon.attackTypePowersByLevel : pokemon.attackTypePowersByLevel;
  return levels ? Object.fromEntries(Object.entries(levels).flatMap(([type, entries]) => {
    const available = levelCap > 0 ? entries.filter(entry => Number(entry.level) <= levelCap) : entries;
    const strongest = available[available.length - 1];
    return strongest ? [[type, Number(strongest.power) || 0]] : [];
  })) : levelCap > 0 ? byLevel?.[String(levelCap)] ?? powers ?? {} : powers ?? {};
}
function matches({ coverageFilter, defensiveHits, normalTypeQualifierEligible = false, offensiveHits }) {
  if (normalTypeQualifierEligible) return true;
  const offensive = offensiveHits.length > 0;
  const defensive = defensiveHits.length > 0;
  if (coverageFilter === 'defensive') return defensive;
  if (coverageFilter === 'either') return offensive || defensive;
  if (coverageFilter === 'both') return offensive && defensive;
  return offensive;
}

export function productionRecommendationOracle(input) {
  const { candidates = [], selectedIds = [], consideredTypes, missingTypes, missingDefensiveTypes, hasOpenPartySlot, hasActiveRecommendationNeed, hasPureNormalPartyMember, coverageFilter, focusType, legendaryFilter, tradeEvolutionFilter, includeMachineMoves = false, maxMoveLevel = 0, minMovePower = 0, weights, sortMode } = input;
  const selected = new Set(selectedIds);
  const scored = candidates.filter(pokemon => !selected.has(pokemon.id) && pokemon.isMythical !== true && (legendaryFilter === 'show' || pokemon.isLegendary !== true) && (tradeEvolutionFilter === 'show' || pokemon.playthroughScore?.flags?.tradeEvolution !== true && pokemon.playthroughFlags?.tradeEvolution !== true)).map(pokemon => {
    const powers = attackPowers({ includeMachineMoves, maxMoveLevel, pokemon });
    const attackTypes = minMovePower <= 0 ? consideredTypes.filter(type => Object.hasOwn(powers, type)) : consideredTypes.filter(type => Number(powers[type]) >= minMovePower);
    const coveredTypes = getCoveredDefenseTypes({ attackTypes, consideredTypes, typeChart });
    const defensiveCoverageTypes = getDefensiveCoverageTypes({ consideredTypes, defenseTypes: pokemon.types ?? [], typeChart });
    const missingHits = coveredTypes.filter(type => missingTypes.includes(type));
    const missingDefensiveHits = defensiveCoverageTypes.filter(type => missingDefensiveTypes.includes(type));
    const normalTypeQualifierEligible = !hasPureNormalPartyMember && pokemon.types?.length === 1 && pokemon.types[0] === 'normal';
    const stabIceTypeBonusEligible = pokemon.types?.includes('ice') && Number(powers.ice) > 60;
    const coverageScore = coverageFilter === 'defensive' ? missingDefensiveHits.length : coverageFilter === 'offensive' ? missingHits.length : missingHits.length + missingDefensiveHits.length;
    const scoredPokemon = { ...pokemon, attackTypes, coveredTypes, coverageScore, defensiveCoverageTypes, missingDefensiveHits, missingHits, normalTypeQualifierEligible, stabIceTypeBonusEligible };
    return { ...scoredPokemon, playthroughScore: getTeamRecommendationScore({ includeTradeEvolutionPenalty: tradeEvolutionFilter !== 'show', pokemon: scoredPokemon, weights }) };
  });
  const strict = scored.filter(pokemon => !hasOpenPartySlot || !hasActiveRecommendationNeed || matches({ coverageFilter, defensiveHits: pokemon.missingDefensiveHits, normalTypeQualifierEligible: pokemon.normalTypeQualifierEligible, offensiveHits: pokemon.missingHits }));
  const sorted = sortCandidates(strict, sortMode, focusType);
  if (sorted.length) return { candidates: sorted, fallbackMode: null };
  if (coverageFilter !== 'both' || !hasOpenPartySlot || !hasActiveRecommendationNeed) return { candidates: sorted, fallbackMode: null };
  const either = sortCandidates(scored.filter(pokemon => matches({ coverageFilter: 'either', defensiveHits: pokemon.missingDefensiveHits, normalTypeQualifierEligible: pokemon.normalTypeQualifierEligible, offensiveHits: pokemon.missingHits })), sortMode, focusType).slice(0, 5);
  return either.length ? { candidates: either, fallbackMode: 'either' } : { candidates: sortCandidates(scored, 'highest-bst', focusType).slice(0, 5), fallbackMode: 'bst' };
}

export function productionVisibleSlice({ candidates, page = 1, pageSize = 20 }) {
  const pageCount = Math.max(1, Math.ceil(candidates.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  return { currentPage, pageCount, ids: candidates.slice(start, start + pageSize).map(candidate => candidate.id) };
}
