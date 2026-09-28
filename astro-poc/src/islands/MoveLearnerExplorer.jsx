import { useEffect, useMemo, useState } from 'react';
import { STAT_OPTIONS, filterAndSortGroups, statValue, uniqueLearners } from '../lib/moveLearnerTools.js';
import PokemonSummaryCard from './PokemonSummaryCard.jsx';

const labels = { 'level-up': 'Level Up', machine: 'TMs, HMs, and TRs', egg: 'Via Breeding', tutor: 'Move Tutor', 'xd-purification': 'XD Purification', 'form-change': 'Form Change' };
const title = value => String(value).split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

export default function MoveLearnerExplorer({ payloadUrl, factsUrl, versions, initialVersion, staticId }) {
  const [version, setVersion] = useState(initialVersion ?? '');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [method, setMethod] = useState('');
  const [stat, setStat] = useState('');
  const [direction, setDirection] = useState('desc');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');

  async function loadData() {
    if (data) return data;
    setLoading(true); setError('');
    try {
      const [payloadResponse, factsResponse] = await Promise.all([fetch(payloadUrl), fetch(factsUrl)]);
      if (!payloadResponse.ok || !factsResponse.ok) throw new Error('Learner tools unavailable');
      const result = { payload: await payloadResponse.json(), facts: await factsResponse.json() };
      setData(result); return result;
    } catch { setError('Learner tools could not be loaded.'); return null; }
    finally { setLoading(false); }
  }

  async function selectVersion(next) {
    setVersion(next); setMethod('');
    if (next === initialVersion && !showAll) { document.getElementById(staticId)?.removeAttribute('hidden'); return; }
    if (await loadData()) document.getElementById(staticId)?.setAttribute('hidden', '');
  }
  async function browseAll() { if (await loadData()) { setShowAll(true); document.getElementById(staticId)?.setAttribute('hidden', ''); } }
  function reset() { setMethod(''); setStat(''); setDirection('desc'); setMinimum(''); setMaximum(''); }

  useEffect(() => { browseAll(); }, []);

  const sourceGroups = version === initialVersion && !showAll ? null : data?.payload.groupsByVersion?.[version] ?? [];
  const methods = sourceGroups?.map(group => group.method) ?? [];
  const groups = useMemo(() => sourceGroups && data ? filterAndSortGroups(sourceGroups, data.facts, { method, stat, direction, minimum, maximum }) : null,
    [sourceGroups, data, method, stat, direction, minimum, maximum]);
  const unique = groups ? uniqueLearners(groups) : [];

  return <div className="move-learner-explorer">
    <div className="move-learner-primary"><label>Game generation<select value={version} onChange={event => selectVersion(event.target.value)}>{versions.map(item => <option key={item} value={item}>{title(item)}</option>)}</select></label></div>
    {version === initialVersion && !showAll && !loading && !error && <p className="move-filter-note">Preparing learner sorting and size comparison…</p>}
    {loading && <p>Loading learner tools…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={browseAll}>Retry</button></p>}
    {sourceGroups && <>
      <div className="move-learner-tools" aria-label="Learner filters and sorting">
        <label>Method<select value={method} onChange={event => setMethod(event.target.value)}><option value="">All methods</option>{methods.map(value => <option key={value} value={value}>{labels[value] ?? title(value)}</option>)}</select></label>
        <label>Sort by<select value={stat} onChange={event => { setStat(event.target.value); setMinimum(''); setMaximum(''); }}><option value="">National Dex number</option>{STAT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Direction<select value={direction} disabled={!stat} onChange={event => setDirection(event.target.value)}><option value="desc">Highest first</option><option value="asc">Lowest first</option></select></label>
        <label>Minimum<input type="number" min="0" value={minimum} disabled={!stat} onChange={event => setMinimum(event.target.value)} /></label>
        <label>Maximum<input type="number" min="0" value={maximum} disabled={!stat} onChange={event => setMaximum(event.target.value)} /></label>
        <button type="button" onClick={reset}>Reset</button>
      </div>
      <p className="move-results-count" aria-live="polite">{unique.length} Pokémon shown</p>
      <div className="move-historical-learners">{groups.length ? groups.map(group => <section key={group.method}>
        <h3>{labels[group.method] ?? title(group.method)} <small>{group.pokemon.length} Pokémon</small></h3>
        <ul>{group.pokemon.map(pokemon => <li key={pokemon.name}><PokemonSummaryCard pokemon={pokemon} />{stat && <span>{STAT_OPTIONS.find(([value]) => value === stat)?.[1]}: {statValue(pokemon, stat)}</span>}</li>)}</ul>
      </section>) : <p>No learners match these filters.</p>}</div>
    </>}
    <span className="sr-only" aria-describedby={staticId}>Latest learners are present in the static document.</span>
  </div>;
}
