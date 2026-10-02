import { useMemo, useRef, useState } from 'react';
import DpptFeebasMap from '../../../src/components/feebas/DpptFeebasMap.jsx';
import {
  calculateDpptFeebasResults,
  calculateDpptFeebasResultsFromSeed,
  validateLotteryNumber
} from '../../../src/utils/dpptFeebasCalculator.js';
import { parseDpptSaveFile } from '../../../src/utils/dpptSaveParser.js';
import { calculateDpptGreatMarshCandidateResults } from '../../../src/utils/dpptGreatMarsh.js';
import { dpptFeebasAudit, getFeebasOffsetSearchArea } from '../../../src/utils/dpptFeebasTiles.js';
import './DpptFeebasCalculatorTool.css';

const EMPTY_FORM = { yesterdayLottery: '', todayLottery: '' };
const HINT_SIZE = 16;

const fieldError = value => value === '' ? null : validateLotteryNumber(value).error;
const areasFor = (candidates, seedRole) => candidates.flatMap(candidate => candidate.indexes.map((index, areaIndex) => ({
  areaNumber: areaIndex + 1,
  indexes: getFeebasOffsetSearchArea(index, { size: HINT_SIZE, seed: [seedRole, candidate.yesterdaySeedUnsigned, candidate.groupSeedUnsigned, areaIndex, index].join(':') }).indexes
})));

function GreatMarshResults({ candidates, preferredGame }) {
  const [expanded, setExpanded] = useState(false);
  const results = useMemo(() => calculateDpptGreatMarshCandidateResults(candidates), [candidates]);
  if (!results.length) return null;
  const order = preferredGame === 'platinum' ? ['platinum', 'diamondPearl'] : preferredGame === 'diamond-pearl' ? ['diamondPearl', 'platinum'] : ['platinum', 'diamondPearl'];
  const labels = { platinum: 'Pokemon Platinum', diamondPearl: 'Pokemon Diamond & Pearl' };
  return <section className="dppt-marsh"><button type="button" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>Today&apos;s Great Marsh Pokemon</button>{expanded && <div>{results.map(candidate => <section key={candidate.groupSeedUnsigned}>{results.length > 1 && <h3>Possible Result {candidate.candidateNumber}</h3>}{order.map(game => <section key={game}><h4>{labels[game]}</h4><ol>{candidate.results[game].map(entry => <li key={entry.area}>Area {entry.area}: Pokémon #{entry.pokemonId}</li>)}</ol></section>)}</section>)}</div>}</section>;
}

export default function DpptFeebasCalculatorTool() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [inputMethod, setInputMethod] = useState('lottery');
  const [mode, setMode] = useState('hint');
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
    <div className="dppt-controls"><section><h2>Map Mode</h2><div role="group" aria-label="Map mode"><button type="button" aria-pressed={!exact} onClick={() => setMode('hint')}>Hint</button><button type="button" aria-pressed={exact} onClick={() => setMode('exact')}>Exact</button></div><p>{exact ? 'Show the exact tile' : 'Show a 16 tile approximate location'}</p></section>
    <section><h2>Input Method</h2><div role="tablist" aria-label="Input method"><button type="button" role="tab" aria-selected={inputMethod === 'save'} onClick={() => setInputMethod('save')}>Upload Save File</button><button type="button" role="tab" aria-selected={inputMethod === 'lottery'} onClick={() => setInputMethod('lottery')}>Lottery Numbers</button></div>
    {inputMethod === 'save' ? <div role="tabpanel"><label>Diamond, Pearl, or Platinum .sav <input ref={fileInput} type="file" accept=".sav" onChange={chooseSave} /></label><p>Your save file is processed locally in your browser. It is never uploaded or stored.</p>{saveStatus.message && <p role={saveStatus.type === 'error' ? 'alert' : 'status'}>{saveStatus.message}</p>}<button type="button" onClick={clearSave}>Remove Save File</button></div> : <div role="tabpanel"><label>Yesterday<input aria-label="Yesterday" type="text" inputMode="numeric" maxLength="5" value={form.yesterdayLottery} onChange={event => update('yesterdayLottery', event.target.value)} />{errors.yesterdayLottery && <small>{errors.yesterdayLottery}</small>}</label><label>Today<input aria-label="Today" type="text" inputMode="numeric" maxLength="5" value={form.todayLottery} onChange={event => update('todayLottery', event.target.value)} />{errors.todayLottery && <small>{errors.todayLottery}</small>}</label><button type="button" disabled={!canCalculate} onClick={() => { setDetectedSaveGame(null); setResult(calculateDpptFeebasResults(form.yesterdayLottery, form.todayLottery)); }}>Calculate</button><button type="button" onClick={clear}>Reset</button></div>}</section></div>
    <div className="dppt-map-stack">{result?.errors?.length > 0 && <section role="alert">{result.errors.map(error => <p key={error}>{error}</p>)}</section>}{!result && <DpptFeebasMap showGroupBoundaries={false} showMapImage={showMapImage} blockedTileOpacity={showMapImage ? 0 : 1} />}{primary && <section>{secondary.length > 0 && <p>Occasionally, two different tile sets are possible options. Check both.</p>}<DpptFeebasMap showGroupBoundaries={false} showMapImage={showMapImage} blockedTileOpacity={showMapImage ? 0 : 1} highlightedIndexes={exact ? primary.indexes : []} highlightedAreas={exact ? [] : areasFor([primary], 'primary')} secondaryHighlightedIndexes={exact ? secondary.flatMap(candidate => candidate.indexes) : []} secondaryHighlightedAreas={exact ? [] : areasFor(secondary, 'secondary')} /></section>}<label><input type="checkbox" checked={showMapImage} onChange={event => setShowMapImage(event.target.checked)} /> Show background image</label></div>
    {result?.valid && candidates.length > 0 && <GreatMarshResults candidates={candidates} preferredGame={detectedSaveGame} />}
  </div>;
}
