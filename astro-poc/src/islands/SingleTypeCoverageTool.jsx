import { useEffect, useMemo, useState } from 'react';
import TypeBadge from './TypeBadge.jsx';
import PokemonSummaryCard from './PokemonSummaryCard.jsx';
import typeChart from '../../../src/constants/Types.js';
import { VERSION_GROUP_ORDER } from '../../../src/constants/versionOrder.js';
import {
  getDefensiveCoverageTypes,
  formatVersionGroupName,
  getCoveredDefenseTypes,
  getTeamRecommendationScore,
  getTypesForVersionGroup
} from '../../../src/utils/teamCoverage.js';
import { formatPokemonDisplayName } from '../../../src/utils/pokemonNames.js';
import {
  DEFAULT_SINGLE_TYPE_RECOMMENDATION_WEIGHTS,
  SINGLE_TYPE_RECOMMENDATION_WEIGHTS_STORAGE_KEY,
  normalizeSingleTypeRecommendationWeights
} from '../lib/singleTypeCoverageScoring.js';
import './SingleTypeCoverageTool.css';

// These values, storage keys, defaults, filtering, and sort tie-breakers are
// deliberately retained from the production SingleTypeCoveragePage.
const DEFAULT_VERSION_GROUP = 'scarlet-violet';
const DEFAULT_TYPE = 'water';
const VERSION_STORAGE_KEY = 'pokelore:learnset-version';
const TYPE_STORAGE_KEY = 'pokelore:single-type-coverage-type';
const SORT_STORAGE_KEY = 'pokelore:single-type-coverage-sort:v2';
const MOVE_POWER_THRESHOLD_STORAGE_KEY = 'pokelore:single-type-coverage-move-power-threshold:v2';
const SHOW_TRADE_EVOLUTIONS_STORAGE_KEY = 'pokelore:single-type-coverage-show-trade-evolutions:v1';
const RECOMMENDATIONS_PER_PAGE = 25;
const MOVE_POWER_THRESHOLD_OPTIONS = [{ value: 0, label: 'Any Power' }, { value: 40, label: '40+' }, { value: 50, label: '50+' }, { value: 60, label: '60+' }, { value: 70, label: '70+' }, { value: 80, label: '80+' }, { value: 90, label: '90+' }, { value: 100, label: '100+' }];
const DEFAULT_MOVE_POWER_THRESHOLD = 50;
const STAT_SORT_MODES = [
  { value: 'highest-bst', label: 'Highest BST', stat: 'baseStatTotal' }, { value: 'highest-hp', label: 'Highest HP', stat: 'hp' }, { value: 'highest-attack', label: 'Highest Attack', stat: 'attack' }, { value: 'highest-defense', label: 'Highest Defense', stat: 'defense' }, { value: 'highest-special-attack', label: 'Highest Sp. Atk', stat: 'specialAttack' }, { value: 'highest-special-defense', label: 'Highest Sp. Def', stat: 'specialDefense' }, { value: 'highest-speed', label: 'Highest Speed', stat: 'speed' }
];
const SORT_MODES = [{ value: 'custom-score', label: 'PokeLore Suggested' }, { value: 'national-dex', label: 'National Dex' }, { value: 'most-coverage', label: 'Most Coverage' }, { value: 'selected-type-first', label: 'Selected Type First' }, ...STAT_SORT_MODES.map(({ value, label }) => ({ value, label }))];

const normalizeTypeParam = value => String(value ?? '').trim().toLowerCase();
const getValidVersionGroup = value => VERSION_GROUP_ORDER.includes(value) ? value : null;
const getValidType = (value, types) => types.includes(value) ? value : null;
const getValidSortMode = value => SORT_MODES.some(option => option.value === value) ? value : SORT_MODES[0].value;
const getValidMovePowerThreshold = value => MOVE_POWER_THRESHOLD_OPTIONS.some(option => option.value === Number(value)) ? Number(value) : MOVE_POWER_THRESHOLD_OPTIONS[0].value;
const compareByNationalDex = (a, b) => a.id - b.id;
const compareByMostCoverage = (a, b) => b.coveredTypes.length - a.coveredTypes.length || b.attackTypes.length - a.attackTypes.length || compareByNationalDex(a, b);
const getStatSortMode = value => STAT_SORT_MODES.find(option => option.value === value);
const getPokemonStatValue = (pokemon, stat) => stat === 'baseStatTotal' ? Number(pokemon?.baseStatTotal) || 0 : Number(pokemon?.stats?.[stat]) || 0;
const compareByStat = sortMode => (a, b) => {
  const mode = getStatSortMode(sortMode);
  return !mode ? compareByNationalDex(a, b) : getPokemonStatValue(b, mode.stat) - getPokemonStatValue(a, mode.stat) || compareByNationalDex(a, b);
};
const compareBySelectedTypeFirst = (a, b) => {
  const aHasStab = a.selectedTypeAttackTypes.some(type => a.types.includes(type));
  const bHasStab = b.selectedTypeAttackTypes.some(type => b.types.includes(type));
  return Number(bHasStab) - Number(aHasStab) || b.selectedTypeAttackTypes.length - a.selectedTypeAttackTypes.length || compareByMostCoverage(a, b);
};
const compareBySuggestedScore = (a, b) =>
  (b.recommendationScore?.total ?? 0) - (a.recommendationScore?.total ?? 0) ||
  getPokemonStatValue(b, 'baseStatTotal') - getPokemonStatValue(a, 'baseStatTotal') ||
  compareByMostCoverage(a, b);
const getThresholdedAttackTypes = ({ consideredTypes, minMovePower, pokemon }) => minMovePower <= 0 ? consideredTypes.filter(type => pokemon.attackTypes?.includes(type)) : consideredTypes.filter(type => Number(pokemon.attackTypePowers?.[type]) >= minMovePower);

function getSingleTypeRecommendationScore({ pokemon, showTradeEvolutions, weights }) {
  // This deliberately supplies no coverage, Normal, or Ice bonus inputs from
  // Team Coverage. Single Type Coverage adds its own defensive-resistance and
  // selected-type STAB signals below.
  const playthroughScore = getTeamRecommendationScore({
    includeTradeEvolutionPenalty: !showTradeEvolutions,
    pokemon: {
      baseStatTotal: pokemon.baseStatTotal,
      playthroughFlags: pokemon.playthroughFlags,
      playthroughScore: pokemon.playthroughScore
    },
    weights
  });
  const defensiveCoverage =
    (pokemon.defensiveCoverageTypes?.length ?? 0) *
    weights.defensiveResistance;
  const selectedTypeResistance =
    pokemon.defensiveCoverageTypes?.includes(
      pokemon.selectedType
    )
      ? weights.selectedTypeResistance
      : 0;
  const stabCoverage = pokemon.hasStabSelectedTypeAttack
    ? weights.stabCoverage
    : 0;

  return {
    ...playthroughScore,
    total:
      playthroughScore.total +
      defensiveCoverage +
      selectedTypeResistance +
      stabCoverage,
    parts: {
      ...playthroughScore.parts,
      defensiveCoverage,
      selectedTypeResistance,
      stabCoverage
    }
  };
}

function readLocalValue(key, defaultValue) {
  try { const value = window.localStorage.getItem(key); return value === null ? defaultValue : JSON.parse(value); } catch { return defaultValue; }
}
function useLocalStorageState(key, defaultValue) {
  // Static HTML always renders these defaults. Reading browser-only preferences
  // during the first client render made query/local-storage visits disagree
  // with the server markup, forcing React to abandon hydration (#418).
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);
  useEffect(() => { setValue(readLocalValue(key, defaultValue)); setReady(true); }, [defaultValue, key]);
  useEffect(() => { if (ready) try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, ready, value]);
  useEffect(() => {
    const handleStorage = event => {
      if (event.storageArea !== window.localStorage || event.key !== key) return;
      try { setValue(event.newValue === null ? defaultValue : JSON.parse(event.newValue)); } catch { setValue(defaultValue); }
    };
    window.addEventListener('storage', handleStorage); return () => window.removeEventListener('storage', handleStorage);
  }, [defaultValue, key]);
  return [value, setValue];
}
function useAstroSearchParams(initialSearch) {
  // Static Astro documents are generated without request query strings. On the
  // browser, initialize from the real URL so direct shared calculator links
  // retain the production route's version/type behavior.
  const [searchParams, setParams] = useState(() => new URLSearchParams(initialSearch));
  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
    const onPopState = () => setParams(new URLSearchParams(window.location.search));
    window.addEventListener('popstate', onPopState); return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const setSearchParams = (next, { replace = false } = {}) => {
    const params = next instanceof URLSearchParams ? next : new URLSearchParams(next);
    const query = params.toString(); const href = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history[replace ? 'replaceState' : 'pushState']({}, '', href); setParams(params);
  };
  return [searchParams, setSearchParams];
}

function TypeBadgeList({ emptyLabel, height = '1.35rem', types }) {
  return !types.length ? <span className="single-type-muted">{emptyLabel}</span> : <div className="single-type-badges">{types.map(type => <TypeBadge key={type} type={type} height={height} />)}</div>;
}
function PokemonCard({ pokemon }) {
  return <PokemonSummaryCard pokemon={{ ...pokemon, cardSprite: pokemon.cardSprite ?? pokemon.sprite, displayName: formatPokemonDisplayName(pokemon) }} />;
}
function RecommendationCard({ minMovePower, recommendation }) {
  return <div className="single-type-recommendation"><PokemonCard pokemon={recommendation} /><div><p>Helps Cover</p><TypeBadgeList emptyLabel="None" height="1.05rem" types={recommendation.coverageHits} /></div><div><p className="single-type-muted">Level-up attack types{minMovePower > 0 ? ` (${minMovePower}+ power)` : ''}</p><TypeBadgeList emptyLabel="None" height=".95rem" types={recommendation.attackTypes} /></div></div>;
}

export default function SingleTypeCoverageTool({ initialSearch = '' }) {
  const [searchParams, setSearchParams] = useAstroSearchParams(initialSearch);
  const [preferredVersion, setPreferredVersion] = useLocalStorageState(VERSION_STORAGE_KEY, DEFAULT_VERSION_GROUP);
  const [preferredType, setPreferredType] = useLocalStorageState(TYPE_STORAGE_KEY, DEFAULT_TYPE);
  const [preferredSortMode, setPreferredSortMode] = useLocalStorageState(SORT_STORAGE_KEY, SORT_MODES[0].value);
  const [preferredMovePowerThreshold, setPreferredMovePowerThreshold] = useLocalStorageState(MOVE_POWER_THRESHOLD_STORAGE_KEY, DEFAULT_MOVE_POWER_THRESHOLD);
  const [showTradeEvolutions, setShowTradeEvolutions] = useLocalStorageState(SHOW_TRADE_EVOLUTIONS_STORAGE_KEY, false);
  const [preferredRecommendationWeights] = useLocalStorageState(SINGLE_TYPE_RECOMMENDATION_WEIGHTS_STORAGE_KEY, DEFAULT_SINGLE_TYPE_RECOMMENDATION_WEIGHTS);
  const urlVersion = searchParams.get('version') ?? searchParams.get('game');
  const selectedVersion = getValidVersionGroup(urlVersion) ?? getValidVersionGroup(preferredVersion) ?? DEFAULT_VERSION_GROUP;
  const consideredTypes = useMemo(() => getTypesForVersionGroup(selectedVersion), [selectedVersion]);
  const selectedType = getValidType(normalizeTypeParam(searchParams.get('type')), consideredTypes) ?? getValidType(preferredType, consideredTypes) ?? consideredTypes[0];
  const selectedSortMode = getValidSortMode(preferredSortMode);
  const selectedMovePowerThreshold = getValidMovePowerThreshold(preferredMovePowerThreshold);
  const selectedRecommendationWeights = useMemo(() => normalizeSingleTypeRecommendationWeights(preferredRecommendationWeights), [preferredRecommendationWeights]);
  const [teamCoverageData, setTeamCoverageData] = useState(null);
  const [recommendationPageState, setRecommendationPageState] = useState({ key: '', page: 1 });
  const recommendationPageKey = `${selectedVersion}:${selectedType}`;
  const recommendationPage = recommendationPageState.key === recommendationPageKey ? recommendationPageState.page : 1;

  useEffect(() => { if (selectedVersion !== preferredVersion) setPreferredVersion(selectedVersion); }, [preferredVersion, selectedVersion]);
  useEffect(() => { if (selectedType !== preferredType) setPreferredType(selectedType); }, [preferredType, selectedType]);
  useEffect(() => {
    let mounted = true; setTeamCoverageData(null);
    fetch(`/data/teamCoverage/${selectedVersion}.json`).then(response => response.ok ? response.json() : null).then(data => { if (mounted) setTeamCoverageData(data); }).catch(() => { if (mounted) setTeamCoverageData(null); });
    return () => { mounted = false; };
  }, [selectedVersion]);
  useEffect(() => {
    const hasVersion = searchParams.get('version') === selectedVersion; const hasType = normalizeTypeParam(searchParams.get('type')) === selectedType;
    if (hasVersion && hasType && !searchParams.has('game')) return;
    const next = new URLSearchParams(searchParams); next.set('version', selectedVersion); next.set('type', selectedType); next.delete('game'); setSearchParams(next, { replace: true });
  }, [searchParams, selectedType, selectedVersion]);
  const loaded = teamCoverageData?.versionGroup === selectedVersion;
  const candidates = useMemo(() => {
    if (!loaded) return [];
    return (teamCoverageData?.pokemon ?? []).map(pokemon => {
      const attackTypes = getThresholdedAttackTypes({ consideredTypes, minMovePower: selectedMovePowerThreshold, pokemon });
      const coveredTypes = getCoveredDefenseTypes({ attackTypes, consideredTypes, typeChart });
      const defensiveCoverageTypes = getDefensiveCoverageTypes({ consideredTypes, defenseTypes: pokemon.types, typeChart });
      const selectedTypeAttackTypes = attackTypes.filter(attackType => typeChart?.[attackType]?.[selectedType] === 2);
      const hasStabSelectedTypeAttack = selectedTypeAttackTypes.some(attackType => pokemon.types.includes(attackType));
      const recommendation = { ...pokemon, attackTypes, coveredTypes, coverageHits: [selectedType], defensiveCoverageTypes, hasStabSelectedTypeAttack, selectedType, selectedTypeAttackTypes };
      return { ...recommendation, recommendationScore: getSingleTypeRecommendationScore({ pokemon: recommendation, showTradeEvolutions, weights: selectedRecommendationWeights }) };
    }).filter(pokemon => pokemon.coveredTypes.includes(selectedType)).sort((a, b) => selectedSortMode === 'custom-score' ? compareBySuggestedScore(a, b) : selectedSortMode === 'most-coverage' ? compareByMostCoverage(a, b) : selectedSortMode === 'selected-type-first' ? compareBySelectedTypeFirst(a, b) : getStatSortMode(selectedSortMode) ? compareByStat(selectedSortMode)(a, b) : compareByNationalDex(a, b));
  }, [consideredTypes, loaded, selectedMovePowerThreshold, selectedRecommendationWeights, selectedSortMode, selectedType, showTradeEvolutions, teamCoverageData]);
  const pageCount = Math.max(1, Math.ceil(candidates.length / RECOMMENDATIONS_PER_PAGE)); const currentPage = Math.min(recommendationPage, pageCount); const start = (currentPage - 1) * RECOMMENDATIONS_PER_PAGE; const visible = candidates.slice(start, start + RECOMMENDATIONS_PER_PAGE);
  const setPage = page => setRecommendationPageState(state => ({ key: recommendationPageKey, page: typeof page === 'function' ? page(state.key === recommendationPageKey ? state.page : 1) : page }));
  const updateShareableParams = ({ type = selectedType, version = selectedVersion }) => { const next = new URLSearchParams(searchParams); next.set('version', version); next.set('type', type); next.delete('game'); setSearchParams(next); };
  return <div className="single-type-tool" id="single-type-coverage-calculator">
    <div className="single-type-controls"><label htmlFor="single-type-coverage-version">Game</label><select id="single-type-coverage-version" value={selectedVersion} onChange={event => updateShareableParams({ version: event.target.value })}>{VERSION_GROUP_ORDER.map(version => <option key={version} value={version}>{formatVersionGroupName(version)}</option>)}</select><label htmlFor="single-type-coverage-type">Type</label><select id="single-type-coverage-type" value={selectedType} onChange={event => updateShareableParams({ type: event.target.value })}>{consideredTypes.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}</select></div>
    <section><p className="single-type-muted">These Pokémon are technically available in the game. That does not necessarily mean they are available for a playthrough. It is meant to be overly broad, and also includes Pokémon that must be traded for.</p><h2>Suggested Pokémon</h2><p className="single-type-muted">These available Pokémon have level-up attacking moves that can hit <strong>{selectedType}</strong> for super-effective damage.</p><p className="single-type-muted">PokeLore Suggested combines regional dex, trade evolution, tier, BST, defensive resistances, and a same-type attack bonus. Other sorts remain available for comparison.</p>
      <div className="single-type-controls"><label htmlFor="single-type-coverage-sort">Sort</label><select id="single-type-coverage-sort" value={selectedSortMode} onChange={event => { setPage(1); setPreferredSortMode(event.target.value); }}>{SORT_MODES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><label htmlFor="single-type-coverage-move-power-threshold">Move Power</label><select id="single-type-coverage-move-power-threshold" value={selectedMovePowerThreshold} onChange={event => { setPage(1); setPreferredMovePowerThreshold(Number(event.target.value)); }}>{MOVE_POWER_THRESHOLD_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select><label className="single-type-checkbox" htmlFor="single-type-coverage-trade-evolutions"><input id="single-type-coverage-trade-evolutions" type="checkbox" checked={showTradeEvolutions} onChange={event => { setPage(1); setShowTradeEvolutions(event.target.checked); }} />Show Trade Evolutions</label></div>
      {!loaded ? <p>Loading recommendations...</p> : !(teamCoverageData?.availablePokemonCount > 0) ? <p className="single-type-muted">Availability data is not ready for {formatVersionGroupName(selectedVersion)} yet.</p> : visible.length === 0 ? <p className="single-type-muted">No available Pokémon have level-up coverage for this type.</p> : <><p className="single-type-muted">Showing {start + 1}-{start + visible.length} of {candidates.length} matches.</p><div className="single-type-grid">{visible.map(recommendation => <RecommendationCard key={recommendation.id} minMovePower={selectedMovePowerThreshold} recommendation={recommendation} />)}</div>{pageCount > 1 && <div className="single-type-pagination"><button type="button" disabled={currentPage === 1} onClick={() => setPage(page => Math.max(1, page - 1))}>Previous</button><span>Page {currentPage} of {pageCount}</span><button type="button" disabled={currentPage === pageCount} onClick={() => setPage(page => Math.min(pageCount, page + 1))}>Next</button></div>}</>}
    </section>
  </div>;
}
