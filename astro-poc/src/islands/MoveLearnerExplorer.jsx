import { useState } from 'react';

const labels = { 'level-up': 'Level Up', machine: 'TMs, HMs, and TRs', egg: 'Via Breeding', tutor: 'Move Tutor', 'xd-purification': 'XD Purification', 'form-change': 'Form Change' };
const title = value => String(value).split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');

export default function MoveLearnerExplorer({ payloadUrl, versions, initialVersion, staticId }) {
  const [version, setVersion] = useState(initialVersion ?? '');
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  async function loadPayload() {
    if (payload) return payload;
    setLoading(true); setError('');
    try {
      const response = await fetch(payloadUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      setPayload(result);
      return result;
    } catch { setError('Learner data could not be loaded.'); return null; }
    finally { setLoading(false); }
  }

  async function selectVersion(next) {
    setVersion(next);
    if (next === initialVersion && !showAll) {
      document.getElementById(staticId)?.removeAttribute('hidden');
      return;
    }
    if (await loadPayload()) document.getElementById(staticId)?.setAttribute('hidden', '');
  }

  async function browseAll() {
    if (await loadPayload()) {
      setShowAll(true);
      document.getElementById(staticId)?.setAttribute('hidden', '');
    }
  }

  const groups = version === initialVersion && !showAll ? null : payload?.groupsByVersion?.[version];
  return <div className="move-learner-explorer">
    <label>Game generation
      <select value={version} onChange={event => selectVersion(event.target.value)}>
        {versions.map(item => <option key={item} value={item}>{title(item)}</option>)}
      </select>
    </label>
    {version === initialVersion && <p className="move-filter-note">Showing the latest available learner data below.</p>}
    {version === initialVersion && !showAll && <button type="button" onClick={browseAll}>Show every {title(initialVersion)} learner</button>}
    {loading && <p>Loading historical learners…</p>}
    {error && <p role="alert">{error} <button type="button" onClick={() => version === initialVersion ? browseAll() : selectVersion(version)}>Retry</button></p>}
    {groups && <div className="move-historical-learners">
      {groups.length ? groups.map(group => <section key={group.method}>
        <h3>{labels[group.method] ?? title(group.method)} <small>{group.pokemon.length} Pokémon</small></h3>
        <ul>{group.pokemon.map(pokemon => <li key={pokemon.name}><a href={`/pokemon/${pokemon.name}`}>{pokemon.displayName}</a></li>)}</ul>
      </section>) : <p>No learners are recorded for this game group.</p>}
    </div>}
    <span className="sr-only" aria-describedby={staticId}>Latest learners are present in the static document.</span>
  </div>;
}
