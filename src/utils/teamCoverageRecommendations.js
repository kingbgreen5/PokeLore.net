import typeChart from '../constants/Types.js';
import { getCoveredDefenseTypes, getDefensiveCoverageTypes, getTeamRecommendationScore } from './teamCoverage.js';

export const TEAM_COVERAGE_STAT_SORTS = { 'highest-bst': 'baseStatTotal', 'highest-hp': 'hp', 'highest-attack': 'attack', 'highest-defense': 'defense', 'highest-special-attack': 'specialAttack', 'highest-special-defense': 'specialDefense', 'highest-speed': 'speed' };
const stat = (pokemon, name) => Number(name === 'baseStatTotal' ? pokemon?.baseStatTotal : pokemon?.stats?.[name]) || 0;
const dex = (a, b) => a.id - b.id;
const coverage = pokemon => Number(pokemon?.coverageScore) || 0;
const mostCoverage = (a, b) => coverage(b) - coverage(a) || (b.missingHits?.length ?? 0) - (a.missingHits?.length ?? 0) || (b.missingDefensiveHits?.length ?? 0) - (a.missingDefensiveHits?.length ?? 0) || (b.coveredTypes?.length ?? 0) - (a.coveredTypes?.length ?? 0) || dex(a, b);
export function sortRecommendationCandidates(candidates, sortMode, focusType) {
  return [...candidates].sort((a, b) => {
    if (sortMode === 'custom-score') return (b.playthroughScore?.total ?? 0) - (a.playthroughScore?.total ?? 0) || stat(b, 'baseStatTotal') - stat(a, 'baseStatTotal') || mostCoverage(a, b);
    if (sortMode === 'most-coverage') return mostCoverage(a, b);
    if (sortMode === 'selected-type-first') return Number(b.missingHits.includes(focusType) || b.missingDefensiveHits?.includes(focusType)) - Number(a.missingHits.includes(focusType) || a.missingDefensiveHits?.includes(focusType)) || mostCoverage(a, b);
    const sortStat = TEAM_COVERAGE_STAT_SORTS[sortMode];
    return sortStat ? stat(b, sortStat) - stat(a, sortStat) || dex(a, b) : dex(a, b);
  });
}
function powers(pokemon, machine, cap) {
  const levels = machine
    ? pokemon.attackTypePowerLevelsWithMachineMoves ?? pokemon.attackTypePowerLevels
    : pokemon.attackTypePowerLevels;
  const fallback = machine
    ? pokemon.attackTypePowersWithMachineMoves ?? pokemon.attackTypePowers
    : pokemon.attackTypePowers;
  const byLevel = machine
    ? pokemon.attackTypePowersByLevelWithMachineMoves ?? pokemon.attackTypePowersByLevel
    : pokemon.attackTypePowersByLevel;

  if (!levels) return cap > 0 ? byLevel?.[String(cap)] ?? fallback ?? {} : fallback ?? {};

  return Object.fromEntries(Object.entries(levels).flatMap(([type, entries]) => {
    const entry = (cap > 0 ? entries.filter(item => Number(item.level) <= cap) : entries).at(-1);
    return entry ? [[type, Number(entry.power) || 0]] : [];
  }));
}
function matches(filter, offensiveHits, defensiveHits, normal) { if (normal) return true; if (filter === 'defensive') return defensiveHits.length > 0; if (filter === 'either') return offensiveHits.length > 0 || defensiveHits.length > 0; if (filter === 'both') return offensiveHits.length > 0 && defensiveHits.length > 0; return offensiveHits.length > 0; }
export function buildRecommendationCandidates({ candidates = [], selectedIds = [], consideredTypes, missingTypes, missingDefensiveTypes, hasOpenPartySlot, hasActiveRecommendationNeed, hasPureNormalPartyMember, coverageFilter, focusType, legendaryFilter, tradeEvolutionFilter, includeMachineMoves = false, maxMoveLevel = 0, minMovePower = 0, weights, sortMode }) {
  const selected = new Set(selectedIds);
  const scored = candidates.filter(pokemon => !selected.has(pokemon.id) && pokemon.isMythical !== true && (legendaryFilter === 'show' || pokemon.isLegendary !== true) && (tradeEvolutionFilter === 'show' || pokemon.playthroughScore?.flags?.tradeEvolution !== true && pokemon.playthroughFlags?.tradeEvolution !== true)).map(pokemon => {
    const attackPowers = powers(pokemon, includeMachineMoves, maxMoveLevel);
    const attackTypes = consideredTypes.filter(type => Object.hasOwn(attackPowers, type) && (minMovePower <= 0 || Number(attackPowers[type]) >= minMovePower));
    const coveredTypes = getCoveredDefenseTypes({ attackTypes, consideredTypes, typeChart });
    const defensiveCoverageTypes = getDefensiveCoverageTypes({ consideredTypes, defenseTypes: pokemon.types ?? [], typeChart });
    const missingHits = coveredTypes.filter(type => missingTypes.includes(type)); const missingDefensiveHits = defensiveCoverageTypes.filter(type => missingDefensiveTypes.includes(type));
    const normalTypeQualifierEligible = !hasPureNormalPartyMember && pokemon.types?.length === 1 && pokemon.types[0] === 'normal';
    const stabIceTypeBonusEligible = pokemon.types?.includes('ice') && Number(attackPowers.ice) > 60;
    const coverageScore = coverageFilter === 'defensive' ? missingDefensiveHits.length : coverageFilter === 'offensive' ? missingHits.length : missingHits.length + missingDefensiveHits.length;
    const candidate = { ...pokemon, attackTypes, coveredTypes, defensiveCoverageTypes, missingHits, missingDefensiveHits, normalTypeQualifierEligible, stabIceTypeBonusEligible, coverageScore };
    return { ...candidate, playthroughScore: getTeamRecommendationScore({ includeTradeEvolutionPenalty: tradeEvolutionFilter !== 'show', pokemon: candidate, weights }) };
  });
  const strict = scored.filter(pokemon => !hasOpenPartySlot || !hasActiveRecommendationNeed || matches(coverageFilter, pokemon.missingHits, pokemon.missingDefensiveHits, pokemon.normalTypeQualifierEligible));
  const sorted = sortRecommendationCandidates(strict, sortMode, focusType);
  if (sorted.length) return { candidates: sorted, fallbackMode: null };
  if (coverageFilter !== 'both' || !hasOpenPartySlot || !hasActiveRecommendationNeed) return { candidates: sorted, fallbackMode: null };
  const either = sortRecommendationCandidates(scored.filter(pokemon => matches('either', pokemon.missingHits, pokemon.missingDefensiveHits, pokemon.normalTypeQualifierEligible)), sortMode, focusType).slice(0, 5);
  return either.length ? { candidates: either, fallbackMode: 'either' } : { candidates: sortRecommendationCandidates(scored, 'highest-bst', focusType).slice(0, 5), fallbackMode: 'bst' };
}
