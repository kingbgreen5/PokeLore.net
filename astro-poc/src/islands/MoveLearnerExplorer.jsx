import { useMemo, useState } from 'react';
import { STAT_OPTIONS, filterAndSortGroups, formatHeight, sizeChartLearners, statValue, uniqueLearners } from '../lib/moveLearnerTools.js';

const labels = { 'level-up': 'Level Up', machine: 'TMs, HMs, and TRs', egg: 'Via Breeding', tutor: 'Move Tutor', 'xd-purification': 'XD Purification', 'form-change': 'Form Change' };
const title = value => String(value).split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

function SizeChart({ pokemon }) {
  const [zoom, setZoom] = useState(1);
  if (!pokemon.length) return null;
  const maximum = pokemon[0].height;
  return <section className="move-size-chart" aria-labelledby="move-size-heading">
    <div className="move-size-heading"><div><h3 id="move-size-heading">Learner Height Comparison</h3><p>Largest to smallest for the learners currently shown.</p></div>
      <div className="move-size-zoom" aria-label="Chart zoom"><button type="button" onClick={() => setZoom(value => Math.max(.65, value - .15))} aria-label="Zoom out">−</button><button type="button" onClick={() => setZoom(1)}>Reset</button><button type="button" onClick={() => setZoom(value => Math.min(1.8, value + .15))} aria-label="Zoom in">+</button></div>
    </div>
    <div className="move-size-scroll"><div className="move-size-track" style={{ '--chart-zoom': zoom }}>
      {pokemon.map(item => <a key={item.name} href={`/pokemon/${item.name}`} className="move-size-pokemon" title={`${item.displayName}: ${formatHeight(item.height)}`}>
        <div className="move-size-stage">{item.sprite && <img src={item.sprite} alt="" loading="lazy" style={{ height: `${Math.max(34, 190 * item.height / maximum)}px` }} />}</div>
        <strong>{item.displayName}</strong><span>{formatHeight(item.height)}</span>
      </a>)}
    </div></div>
  </section>;
}

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

  const sourceGroups = version === initialVersion && !showAll ? null : data?.payload.groupsByVersion?.[version] ?? [];
  const methods = sourceGroups?.map(group => group.method) ?? [];
  const groups = useMemo(() => sourceGroups && data ? filterAndSortGroups(sourceGroups, data.facts, { method, stat, direction, minimum, maximum }) : null,
    [sourceGroups, data, method, stat, direction, minimum, maximum]);
  const unique = groups ? uniqueLearners(groups) : [];
  const chart = groups ? sizeChartLearners(groups) : [];

  return <div className="move-learner-explorer">
    <div className="move-learner-primary"><label>Game generation<select value={version} onChange={event => selectVersion(event.target.value)}>{versions.map(item => <option key={item} value={item}>{title(item)}</option>)}</select></label></div>
    {version === initialVersion && !showAll && <><p className="move-filter-note">Showing the latest available learner preview below.</p><button type="button" onClick={browseAll}>Explore every {title(initialVersion)} learner</button></>}
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
        <ul>{group.pokemon.map(pokemon => <li key={pokemon.name}><a href={`/pokemon/${pokemon.name}`}>{pokemon.displayName}</a>{stat && <span>{STAT_OPTIONS.find(([value]) => value === stat)?.[1]}: {statValue(pokemon, stat)}</span>}</li>)}</ul>
      </section>) : <p>No learners match these filters.</p>}</div>
      <SizeChart pokemon={chart} />
    </>}
    <span className="sr-only" aria-describedby={staticId}>Latest learners are present in the static document.</span>
  </div>;
}
