import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_TEAM_RECOMMENDATION_WEIGHTS,
  TEAM_RECOMMENDATION_WEIGHTS_STORAGE_KEY,
  normalizeRecommendationWeights
} from '../../../src/utils/teamCoverage.js';
import {
  DEFAULT_SINGLE_TYPE_RECOMMENDATION_WEIGHTS,
  SINGLE_TYPE_RECOMMENDATION_WEIGHTS_STORAGE_KEY,
  SINGLE_TYPE_SCORE_WEIGHT_CONTROLS,
  normalizeSingleTypeRecommendationWeights
} from '../lib/singleTypeCoverageScoring.js';
import './RecommendationScoringEditor.css';

const TEAM_SCORE_WEIGHT_CONTROLS = [
  ['coverageType', 'Coverage Type'],
  ['normalTypeQualifier', 'Normal Type Qualifier'],
  ['stabIceTypeBonus', 'STAB Ice Type Bonus'],
  ['regionalDex', 'Regional Dex'],
  ['notRegionalDex', 'Not Regional Dex'],
  ['tradeEvolution', 'Trade Evolution'],
  ['sTier', 'S Tier'],
  ['aTier', 'A Tier'],
  ['veryLowBst', 'BST < 380'],
  ['lowBst', 'BST < 410'],
  ['highBst', 'BST > 490']
].map(([key, label]) => ({ key, label }));

function readLocalValue(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function useLocalStorageState(key, fallback) {
  const [value, setValue] = useState(() => readLocalValue(key, fallback));

  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);

  useEffect(() => {
    const onStorage = event => {
      if (event.storageArea !== window.localStorage || event.key !== key) return;
      try { setValue(event.newValue === null ? fallback : JSON.parse(event.newValue)); } catch { setValue(fallback); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [fallback, key]);

  return [value, setValue];
}

export default function RecommendationScoringEditor({ kind }) {
  const isSingleType = kind === 'single-type';
  const defaults = isSingleType
    ? DEFAULT_SINGLE_TYPE_RECOMMENDATION_WEIGHTS
    : DEFAULT_TEAM_RECOMMENDATION_WEIGHTS;
  const controls = isSingleType
    ? SINGLE_TYPE_SCORE_WEIGHT_CONTROLS
    : TEAM_SCORE_WEIGHT_CONTROLS;
  const storageKey = isSingleType
    ? SINGLE_TYPE_RECOMMENDATION_WEIGHTS_STORAGE_KEY
    : TEAM_RECOMMENDATION_WEIGHTS_STORAGE_KEY;
  const normalize = isSingleType
    ? normalizeSingleTypeRecommendationWeights
    : normalizeRecommendationWeights;
  const [savedWeights, setSavedWeights] = useLocalStorageState(storageKey, defaults);
  const weights = useMemo(() => normalize(savedWeights), [normalize, savedWeights]);
  const title = isSingleType ? 'Single Type Coverage Scoring' : 'Team Coverage Scoring';
  const description = isSingleType
    ? 'Tune the PokeLore Suggested values used by Single Type Coverage recommendations.'
    : 'Tune the Custom Score values used by suggested teammates in the Team Coverage calculator.';

  function updateWeight(key, value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setSavedWeights(current => ({ ...normalize(current), [key]: parsed }));
  }

  return <article className="recommendation-score-editor">
    <a href="/dev">← Back to Developer Tools</a>
    <h1>{title}</h1>
    <p className="recommendation-score-intro">{description}</p>
    <section className="recommendation-score-panel">
      <div className="recommendation-score-panel-head">
        <div>
          <h2>Suggested Recommendation Weights</h2>
          <p>{isSingleType
            ? 'The selected type is a required match. These values decide which matching Pokémon rise to the top.'
            : 'Coverage should explain the recommendation; these playthrough values decide which useful candidates rise.'}</p>
        </div>
        <button type="button" onClick={() => setSavedWeights(defaults)}>Reset</button>
      </div>
      <div className="recommendation-score-controls">
        {controls.map(control => <label key={control.key}>
          <span>{control.label}</span>
          <input type="number" step="0.05" value={weights[control.key]} onChange={event => updateWeight(control.key, event.target.value)} />
        </label>)}
      </div>
    </section>
    <section className="recommendation-score-inputs">
      <h2>Scoring Inputs</h2>
      {isSingleType ? <p>Regional dex, trade evolution, tier, and BST data come from the generated Team Coverage indexes. Each resistance or immunity adds the configured defensive value. Resisting the selected type adds its extra value, and a same-type super-effective level-up move adds the STAB value.</p> : <p>Regional dex, trade evolution, exception, and tier data are precomputed into the generated Team Coverage indexes. Weight changes are instant; data changes require regenerating Team Coverage.</p>}
    </section>
  </article>;
}
