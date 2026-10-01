import { useEffect, useMemo, useState } from 'react';
import './EvTrainingRoutesTool.css';

const DEFAULT_STAT = 'hp';
const DEFAULT_VERSION = 'platinum';
const ENABLED_VALUE = 'enabled';
const DISABLED_VALUE = 'disabled';
const DEFAULT_STATS = [{ key: 'hp', label: 'HP' }, { key: 'attack', label: 'Attack' }, { key: 'defense', label: 'Defense' }, { key: 'specialAttack', label: 'Sp. Atk' }, { key: 'specialDefense', label: 'Sp. Def' }, { key: 'speed', label: 'Speed' }];

const formatName = value => String(value ?? '').split('-').filter(Boolean).map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
const formatChance = value => Number.isFinite(Number(value)) ? `${Number.isInteger(Number(value)) ? Number(value) : Number(value).toFixed(1)}%` : '0%';
const formatExpectedEv = value => Number.isFinite(Number(value)) ? Number(value).toFixed(Number(value) >= 1 ? 2 : 3) : '0';
const formatEncounterCount = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Math.ceil(Number(value)).toLocaleString() : '-';
const formatYield = entries => (entries ?? []).map(entry => `${entry.value} ${entry.label}`).join(', ');
const formatLevelRange = pokemon => pokemon.minLevel === null && pokemon.maxLevel === null ? null : pokemon.minLevel === pokemon.maxLevel ? `Lv. ${pokemon.minLevel}` : `Lv. ${pokemon.minLevel}-${pokemon.maxLevel}`;
const routeSubtitle = route => {
  const clean = value => String(value ?? '').toLowerCase().replace(/\broad\b/g, 'route').replace(/[^a-z0-9]+/g, ' ').trim();
  return [route.regionDisplayName, clean(route.areaDisplayName) && clean(route.areaDisplayName) !== clean(route.locationDisplayName) ? route.areaDisplayName : null].filter(Boolean).join(' - ');
};

function getInitialSearch(initialSearch) { return new URLSearchParams(typeof window === 'undefined' ? initialSearch : window.location.search); }
function updateSearch(name, value, defaultValue) {
  const params = new URLSearchParams(window.location.search);
  if (!value || value === defaultValue) params.delete(name); else params.set(name, value);
  window.history.replaceState(null, '', `${window.location.pathname}${params.size ? `?${params}` : ''}${window.location.hash}`);
}

function RouteCard({ route, statLabel, multiplier }) {
  const expected = route.expectedEvPerEncounter * multiplier;
  return <article className="ev-route-card">
    <div className="ev-route-top"><div className="ev-route-heading"><span className="ev-rank" aria-label={`Rank ${route.rank}`}>{route.rank}</span><div><h2><a href={`/location/${route.locationName}`}>{route.locationDisplayName}</a></h2><p>{routeSubtitle(route)}</p><p className="ev-method">{formatName(route.method)}{route.encounterRate === null ? '' : ` - ${formatChance(route.encounterRate)} encounter rate`}{route.conditions?.length ? ` - ${route.conditions.map(formatName).join(', ')}` : ''}</p></div></div><aside className="ev-stats" aria-label={`${route.locationDisplayName} encounter stats`}><span>+{statLabel} Chance <strong>{formatChance(route.targetChance)}</strong></span><span>+{statLabel} Purity <strong>{formatChance(route.cleanTargetChance)}</strong></span><span>EV/Encounter <strong>{formatExpectedEv(expected)}</strong></span><span>Encounters To 252 <strong>{formatEncounterCount(252 / expected)}</strong></span></aside></div>
    <div>{route.pokemon.map(pokemon => { const levels = formatLevelRange(pokemon); return <a className="ev-pokemon" href={`/pokemon/${pokemon.name}`} key={pokemon.id}><img src={pokemon.sprite || undefined} alt="" width="42" height="42" loading="lazy" /><span><strong>{pokemon.displayName}</strong><small>{formatYield(pokemon.evYieldBreakdown)}{levels ? ` - ${levels}` : ''}</small></span><strong>{formatChance(pokemon.chance)}</strong></a>; })}</div>
  </article>;
}

export default function EvTrainingRoutesTool({ initialSearch = '' }) {
  const initial = useMemo(() => getInitialSearch(initialSearch), [initialSearch]);
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [selectedStat, setSelectedStat] = useState(() => initial.get('stat') ?? DEFAULT_STAT);
  const [selectedVersion, setSelectedVersion] = useState(() => initial.get('version') ?? DEFAULT_VERSION);
  const [machoBrace, setMachoBrace] = useState(() => initial.get('machoBrace') ?? DISABLED_VALUE);
  const [pokerus, setPokerus] = useState(() => initial.get('pokerus') ?? DISABLED_VALUE);
  useEffect(() => { fetch('/data/evTrainingRoutes.json').then(response => { if (!response.ok) throw new Error(String(response.status)); return response.json(); }).then(value => { if (!value || !Array.isArray(value.stats) || !value.routesByVersion) throw new Error('Malformed EV training data'); setData(value); }).catch(() => setError(true)); }, []);
  const stats = data?.stats?.length ? data.stats : DEFAULT_STATS;
  const versions = data?.versions?.length ? data.versions : [{ version: DEFAULT_VERSION, displayName: 'Platinum' }];
  const stat = stats.some(item => item.key === selectedStat) ? selectedStat : stats[0]?.key ?? DEFAULT_STAT;
  const version = versions.some(item => item.version === selectedVersion) ? selectedVersion : versions.find(item => item.version === DEFAULT_VERSION)?.version ?? versions[0]?.version ?? DEFAULT_VERSION;
  const activeMachoBrace = machoBrace === ENABLED_VALUE ? ENABLED_VALUE : DISABLED_VALUE;
  const activePokerus = pokerus === ENABLED_VALUE ? ENABLED_VALUE : DISABLED_VALUE;
  const multiplier = (activeMachoBrace === ENABLED_VALUE ? 2 : 1) * (activePokerus === ENABLED_VALUE ? 2 : 1);
  const routes = data?.routesByVersion?.[version]?.[stat] ?? [];
  const change = (setter, name, defaultValue) => event => { const value = event.target.value; setter(value); updateSearch(name, value, defaultValue); };
  if (error) return <p className="ev-status" role="alert">EV training data is unavailable.</p>;
  if (!data) return <p className="ev-status" aria-live="polite">Loading EV training locations...</p>;
  const statLabel = stats.find(item => item.key === stat)?.label ?? formatName(stat);
  return <div className="ev-tool" id="ev-training-routes-tool"><section className="ev-controls" aria-label="EV training filters"><label>Stat<select value={stat} onChange={change(setSelectedStat, 'stat', DEFAULT_STAT)}>{stats.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label><label>Game<select value={version} onChange={change(setSelectedVersion, 'version', DEFAULT_VERSION)}>{versions.map(item => <option key={item.version} value={item.version}>{item.displayName}</option>)}</select></label><label><a href="/item/macho-brace">Macho Brace</a><select value={activeMachoBrace} onChange={change(setMachoBrace, 'machoBrace', DISABLED_VALUE)}><option value={DISABLED_VALUE}>Disabled</option><option value={ENABLED_VALUE}>Enabled</option></select></label><label>Pokerus<select value={activePokerus} onChange={change(setPokerus, 'pokerus', DISABLED_VALUE)}><option value={DISABLED_VALUE}>Disabled</option><option value={ENABLED_VALUE}>Enabled</option></select></label></section><section className="ev-results" aria-live="polite">{routes.length ? routes.map(route => <RouteCard key={`${route.locationName}-${route.areaName}-${route.method}-${route.conditions.join('-')}`} route={route} statLabel={statLabel} multiplier={multiplier} />) : <p className="ev-status">No EV training routes found for this selection.</p>}</section></div>;
}
