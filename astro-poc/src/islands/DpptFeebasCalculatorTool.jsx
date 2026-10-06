import { useEffect, useMemo, useRef, useState } from 'react';
import DpptFeebasMap from '../../../src/components/feebas/DpptFeebasMap.jsx';
import CollapsibleSection from '../../../src/components/CollapsibleSection.jsx';
import {
  calculateDpptFeebasResults,
  calculateDpptFeebasResultsFromSeed,
  validateLotteryNumber
} from '../../../src/utils/dpptFeebasCalculator.js';
import { parseDpptSaveFile } from '../../../src/utils/dpptSaveParser.js';
import { calculateDpptGreatMarshCandidateResults } from '../../../src/utils/dpptGreatMarsh.js';
import { dpptFeebasAudit, getFeebasOffsetSearchArea } from '../../../src/utils/dpptFeebasTiles.js';
import './DpptFeebasCalculatorTool.css';
import '../../../src/components/feebas/DpptGreatMarshResults.css';

const EMPTY_FORM = { yesterdayLottery: '', todayLottery: '' };
const HINT_SIZE = 16;

const fieldError = value => value === '' ? null : validateLotteryNumber(value).error;
const areasFor = (candidates, seedRole) => candidates.flatMap(candidate => candidate.indexes.map((index, areaIndex) => ({
  areaNumber: areaIndex + 1,
  indexes: getFeebasOffsetSearchArea(index, { size: HINT_SIZE, seed: [seedRole, candidate.yesterdaySeedUnsigned, candidate.groupSeedUnsigned, areaIndex, index].join(':') }).indexes
})));

const displayName = pokemon => String(pokemon?.displayName ?? pokemon?.name ?? `Pokémon #${pokemon?.id ?? ''}`).split('-').map(word => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word).join(' ');

function BackgroundImageSwitch({ checked, onChange }) {
  return <label className="dppt-feebas-map-switch"><span>Show background image</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><span aria-hidden="true" className="dppt-feebas-switch-track"><span className="dppt-feebas-switch-thumb" /></span></label>;
}

function GreatMarshResults({ candidates, preferredGame }) {
  const [expanded, setExpanded] = useState(false);
  const [pokemonIndex, setPokemonIndex] = useState([]);
  const results = useMemo(() => calculateDpptGreatMarshCandidateResults(candidates), [candidates]);
  const pokemonById = useMemo(() => new Map(pokemonIndex.map(pokemon => [pokemon.id, pokemon])), [pokemonIndex]);
  useEffect(() => { let active = true; fetch('/data/pokemonIndex.json').then(response => response.ok ? response.json() : []).then(data => { if (active) setPokemonIndex(Array.isArray(data) ? data : []); }).catch(() => {}); return () => { active = false; }; }, []);
  if (!results.length) return null;
  const order = preferredGame === 'platinum' ? ['platinum', 'diamondPearl'] : preferredGame === 'diamond-pearl' ? ['diamondPearl', 'platinum'] : ['platinum', 'diamondPearl'];
  const labels = { platinum: 'Pokemon Platinum', diamondPearl: 'Pokemon Diamond & Pearl' };
  return <CollapsibleSection className="dppt-great-marsh-results dppt-marsh" title="Today&apos;s Great Marsh Pokemon" summary="Post-National Dex daily Pokemon" expanded={expanded} onToggle={() => setExpanded(value => !value)} titleChevron titleColor="#bae6fd" summaryColor="#7dd3fc" contentStyle={{ marginTop: '0.8rem' }} style={{ background: 'rgba(14, 165, 233, 0.12)', border: '1px solid rgba(125, 211, 252, 0.58)', borderRadius: '8px', boxShadow: 'inset 0 0 0 1px rgba(14, 165, 233, 0.08)' }}><div className="dppt-great-marsh-body"><p>Each day, one special Pokemon is assigned to each of the Great Marsh&apos;s six areas.</p><p>Use the binoculars upstairs in the Great Marsh entrance to preview Pokemon and identify their areas. A daily Pokemon is not guaranteed in every encounter, so search the grass in the listed area until it appears.</p><p className="dppt-great-marsh-note">Before obtaining the National Dex, some Pokemon are replaced by species from the Sinnoh Pokedex.</p><div className="dppt-great-marsh-candidates">{results.map(candidate => <section className={`dppt-great-marsh-candidate ${candidate.colorRole}`} key={candidate.groupSeedUnsigned}>{results.length > 1 && <h3>Possible Result {candidate.candidateNumber}</h3>}{order.map(game => <section className="dppt-great-marsh-version" key={game}><h4>{labels[game]}</h4><div className="dppt-great-marsh-grid">{candidate.results[game].map(entry => { const pokemon = pokemonById.get(entry.pokemonId); const name = displayName(pokemon ?? { id: entry.pokemonId }); return <a className="dppt-great-marsh-card" href={pokemon?.name ? `/pokemon/${pokemon.name}` : '#'} key={entry.area}><span className="dppt-great-marsh-area">Area {entry.area}</span>{pokemon?.sprite ? <img alt={name} loading="lazy" src={pokemon.sprite} /> : <span aria-hidden="true" className="dppt-great-marsh-fallback-sprite" />}<strong>{name}</strong></a>; })}</div></section>)}</section>)}</div></div></CollapsibleSection>;
}

export default function DpptFeebasCalculatorTool() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [inputMethod, setInputMethod] = useState('lottery');
  const [mode, setMode] = useState('exact');
  const [showMapImage, setShowMapImage] = useState(true);
  const [result, setResult] = useState(null);
  const [detectedSaveGame, setDetectedSaveGame] = useState(null);
  const [saveStatus, setSaveStatus] = useState({ type: 'idle', message: '' });
  const fileInput = useRef(null);
  const errors = useMemo(() => ({ yesterdayLottery: fieldError(form.yesterdayLottery), todayLottery: fieldError(form.todayLottery) }), [form]);
  const canCalculate = dpptFeebasAudit.valid && !errors.yesterdayLottery && !errors.todayLottery && form.yesterdayLottery.length === 5 && form.todayLottery.length === 5;
  const candidates = result?.candidates ?? [];
  const [primary, ...secondary] = candidates;
  const exact = mode === 'exact';
  const clear = () => { setForm(EMPTY_FORM); setResult(null); setDetectedSaveGame(null); };
  const clearSave = () => { if (fileInput.current) fileInput.current.value = ''; setSaveStatus({ type: 'idle', message: '' }); setResult(null); setDetectedSaveGame(null); };
  const update = (name, value) => setForm(current => ({ ...current, [name]: value.slice(0, 5) }));
  async function chooseSave(event) {
    const file = event.target.files?.[0];
    if (!file) { setSaveStatus({ type: 'error', message: 'Choose a .sav file first.' }); setResult(null); setDetectedSaveGame(null); return; }
    setSaveStatus({ type: 'pending', message: 'Reading save file locally...' }); setResult(null); setDetectedSaveGame(null);
    const parsed = await parseDpptSaveFile(file);
    if (!parsed.valid) { setSaveStatus({ type: 'error', message: parsed.message }); return; }
    setResult(calculateDpptFeebasResultsFromSeed(parsed.feebasSeed));
    setDetectedSaveGame(parsed.game);
    setSaveStatus({ type: 'success', message: `${parsed.gameLabel} Version detected.` });
  }
  return <div className="dppt-tool" data-dppt-calculator>
    <div className="dppt-feebas-public-controls"><section><h2>Map Mode</h2><div className="dppt-feebas-segmented" role="group" aria-label="Map mode"><button type="button" aria-pressed={!exact} onClick={() => setMode('hint')}>Hint</button><button type="button" aria-pressed={exact} onClick={() => setMode('exact')}>Exact</button></div><p className="dppt-feebas-mode-help">{exact ? 'Show the exact tile' : 'Show a 16 tile approximate location'}</p></section>
    <section><h2>Input Method</h2><div className="dppt-feebas-tabs" role="tablist" aria-label="Input method"><button type="button" role="tab" aria-selected={inputMethod === 'save'} onClick={() => setInputMethod('save')}>Upload Save File</button><button type="button" role="tab" aria-selected={inputMethod === 'lottery'} onClick={() => setInputMethod('lottery')}>Lottery Numbers</button></div>
    {inputMethod === 'save' ? <div className="dppt-feebas-save-panel" role="tabpanel"><label><span>Diamond, Pearl, or Platinum .sav</span><input ref={fileInput} type="file" accept=".sav" onChange={chooseSave} /></label><p>Your save file is processed locally in your browser. It is never uploaded or stored.</p>{saveStatus.message && <p className={`dppt-feebas-save-status ${saveStatus.type}`} role={saveStatus.type === 'error' ? 'alert' : 'status'}>{saveStatus.message}</p>}<button type="button" onClick={clearSave}>Remove Save File</button></div> : <div className="dppt-feebas-input-panel" role="tabpanel"><div className="dppt-feebas-public-inputs"><label><span>Yesterday</span><input aria-label="Yesterday" type="text" inputMode="numeric" maxLength="5" placeholder="01234" value={form.yesterdayLottery} onChange={event => update('yesterdayLottery', event.target.value)} />{errors.yesterdayLottery && <small>{errors.yesterdayLottery}</small>}</label><label><span>Today</span><input aria-label="Today" type="text" inputMode="numeric" maxLength="5" placeholder="65432" value={form.todayLottery} onChange={event => update('todayLottery', event.target.value)} />{errors.todayLottery && <small>{errors.todayLottery}</small>}</label></div><div className="dppt-feebas-public-actions"><button type="button" disabled={!canCalculate} onClick={() => { setDetectedSaveGame(null); setResult(calculateDpptFeebasResults(form.yesterdayLottery, form.todayLottery)); }}>Calculate</button><button type="button" onClick={clear}>Reset</button></div></div>}</section></div>
    <div className="dppt-feebas-public-map-stack">{result?.errors?.length > 0 && <section className="dppt-feebas-public-message" role="alert">{result.errors.map(error => <p key={error}>{error}</p>)}</section>}{!result && <section className="dppt-feebas-public-result"><DpptFeebasMap showGroupBoundaries={false} showMapImage={showMapImage} blockedTileOpacity={showMapImage ? 0 : 1} /><BackgroundImageSwitch checked={showMapImage} onChange={setShowMapImage} /></section>}{primary && <section className="dppt-feebas-public-result">{secondary.length > 0 && <p className="dppt-feebas-ambiguous-note">Occasionally, two different tile sets are possible options. Check both.</p>}<DpptFeebasMap showGroupBoundaries={false} showMapImage={showMapImage} blockedTileOpacity={showMapImage ? 0 : 1} highlightedIndexes={exact ? primary.indexes : []} highlightedAreas={exact ? [] : areasFor([primary], 'primary')} secondaryHighlightedIndexes={exact ? secondary.flatMap(candidate => candidate.indexes) : []} secondaryHighlightedAreas={exact ? [] : areasFor(secondary, 'secondary')} /><BackgroundImageSwitch checked={showMapImage} onChange={setShowMapImage} /></section>}</div>
    {result?.valid && candidates.length > 0 && <GreatMarshResults candidates={candidates} preferredGame={detectedSaveGame} />}
  </div>;
}
