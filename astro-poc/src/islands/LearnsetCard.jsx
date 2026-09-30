import { useEffect, useMemo, useState } from 'react';
import TypeBadge from './TypeBadge';
import { Anchor as Link } from './Anchor.jsx';
import physicalBadge from '../../../src/assets/Physical Badge.png?url';
import specialBadge from '../../../src/assets/Special Badge.png?url';
import statusBadge from '../../../src/assets/Status Badge.png?url';
import { getLearnsetMoveDisplay, usesTypeBasedCategories } from '../lib/moveCategory.js';
import {
  LEARNSET_METHOD_ORDER, formatLearnsetLabel, formatMoveDisplayName,
  formatVersionGroupName, getLearnsetMovesForVersion,
  getSortedCondensedLearnsetMoves, groupLearnsetMovesByMethod
} from '../../../src/utils/learnsetDisplay.js';

const STORAGE_KEY = 'pokelore:learnset-version';
const DISPLAY_METHOD_ORDER = [...LEARNSET_METHOD_ORDER, 'form-change'];
const categoryBadges = { physical: physicalBadge, special: specialBadge, status: statusBadge };

function MoveGroup({ method, rows, movesData, version }) {
  return <div className="learnsetCard">
    <h3>{formatLearnsetLabel(method)}</h3>
    <div className="learnset-grid learnset-grid-head" aria-hidden="true">
      <span>Lvl</span><span>Move</span><span>Type</span><span>Pwr</span><span>Acc</span><span>Cat.</span>
    </div>
    {getSortedCondensedLearnsetMoves(rows).map((move, index) => {
      const detail = movesData[move.move];
      const display = getLearnsetMoveDisplay(detail, version);
      const badge = categoryBadges[display.category];
      return <div className="learnset-grid learnset-row" key={`${move.move}-${move.level}-${index}`}>
        <span>{move.level > 0 ? move.level : '-'}</span>
        <Link to={`/move/${move.move}`}>{formatMoveDisplayName(move.move, movesData)}</Link>
        <Link to={`/type/${display.type}`}><TypeBadge height="1.25rem" type={display.type} /></Link>
        <span>{detail?.power || '---'}</span>
        <span>{detail?.accuracy || '---'}</span>
        <span>{badge
          ? <img src={badge} alt={`${display.category} move`} className="category-badge" />
          : display.category === 'variable'
            ? <span title={display.categoryNote} aria-label={display.categoryNote}>Varies</span>
            : display.category || '---'}</span>
      </div>;
    })}
  </div>;
}

export default function LearnsetCard({ payloadUrl, versionGroups, defaultVersion, staticContentId }) {
  const [selectedVersion, setSelectedVersion] = useState(defaultVersion);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (versionGroups.includes(saved)) setSelectedVersion(saved);
    } catch {}
  }, [versionGroups]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedVersion)); } catch {}
    const staticContent = document.getElementById(staticContentId);
    // The server-rendered preview is intentionally limited to level-up moves.
    // Load the full payload even for the default/latest game so TM, tutor, egg,
    // and every other available method are represented consistently.
    if (staticContent) staticContent.hidden = Boolean(payload) || selectedVersion !== defaultVersion;
    if (payload || error) return;
    let cancelled = false;
    fetch(payloadUrl).then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }).then(value => { if (!cancelled) setPayload(value); })
      .catch(() => { if (!cancelled) setError('This learnset could not be loaded. The latest level-up learnset remains available.'); });
    return () => { cancelled = true; };
  }, [selectedVersion, defaultVersion, payload, payloadUrl, staticContentId, error]);

  const grouped = useMemo(() => payload
    ? groupLearnsetMovesByMethod(getLearnsetMovesForVersion(payload.pokemonData, selectedVersion))
    : null, [payload, selectedVersion, defaultVersion]);
  const count = grouped ? Object.values(grouped).flat().length : 0;

  return <div className="learnset-controls">
    <label>Game or generation{' '}
      <select aria-label="Learnset version" value={selectedVersion} onChange={event => setSelectedVersion(event.target.value)}>
        {versionGroups.map(version => <option value={version} key={version}>{formatVersionGroupName(version)}</option>)}
      </select>
    </label>
    {selectedVersion !== defaultVersion && !payload && !error && <p role="status">Loading selected learnset…</p>}
    {error && <p role="alert">{error}</p>}
    {grouped && <>
      {usesTypeBasedCategories(selectedVersion) && <p className="learnset-category-note">
        In Generations I–III, damaging moves use type-based categories. Status moves remain Status. “Varies” depends on the move's actual type.
      </p>}
      <p className="sr-only" role="status">{count} moves loaded for {formatVersionGroupName(selectedVersion)}.</p>
      <div className="learnset-methods">
        {DISPLAY_METHOD_ORDER.map(method => grouped[method]
          ? <MoveGroup key={method} method={method} rows={grouped[method]} movesData={payload.movesData} version={selectedVersion} />
          : null)}
      </div>
    </>}
  </div>;
}
