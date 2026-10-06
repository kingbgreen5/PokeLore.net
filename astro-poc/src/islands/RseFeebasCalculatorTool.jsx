import { useMemo, useRef, useState } from 'react';
import RseRoute119FeebasMap from '../../../src/components/feebas/RseRoute119FeebasMap.jsx';
import { EMERALD_EASY_CHAT_CONDITIONS, EMERALD_EASY_CHAT_SECOND_GROUPS } from '../../../src/data/feebas/emeraldEasyChatWords.js';
import { parseEmeraldSave, parseRubySapphireSave } from '../../../src/utils/emeraldSaveParser.js';
import { findEmeraldFeebasValueCandidates, getDewfordPhraseSignature, normalizeTrainerId } from '../../../src/utils/emeraldFeebasRecovery.js';
import { buildPossibleTileSetResult, buildPublicPriorityResult, buildPublicTileSet } from '../../../src/utils/rseFeebasPublicCalculator.js';
import { findRsDeadBatteryCandidates, findRsWorkingBatteryCandidates } from '../../../src/utils/rsFeebasRecovery.js';
import { route119FeebasTiles } from '../../../src/utils/rseFeebasCalculator.js';
import './RseFeebasCalculatorTool.css';

const GAMES = [{ id: 'emerald', label: 'Emerald' }, { id: 'ruby-sapphire', label: 'Ruby/Sapphire' }];
const PRIORITY_FILTERS = [['all', 'All possible tiles'], ['top10', 'Top 10'], ['top25', 'Top 25'], ['top50', 'Top 50'], ['high', 'High priority only']];
const words = Object.entries(EMERALD_EASY_CHAT_SECOND_GROUPS).flatMap(([group, values]) => values.map(entry => ({ ...entry, group })));

function coordinateKey(tile) { return `${tile.x}:${tile.y}`; }

function buildHintAreas(locations, seed) {
  const fishable = route119FeebasTiles.filter(tile => tile.feebasSelectable !== false);
  return locations.map((location, index) => ({
    areaNumber: location.resultNumbers?.[0] ?? index + 1,
    sourceSpotId: location.sourceSpotId ?? location.spotIds?.[0],
    tiles: [...fishable, location].sort((left, right) => {
      const distance = tile => Math.max(Math.abs(tile.x - location.x), Math.abs(tile.y - location.y));
      return distance(left) - distance(right) || Math.abs(left.x - location.x) + Math.abs(left.y - location.y) - (Math.abs(right.x - location.x) + Math.abs(right.y - location.y)) || left.y - right.y || left.x - right.x;
    }).slice(0, 16)
  }));
}

function buildSetCoverage(tileSets) {
  const byCoordinate = new Map();
  tileSets.forEach(tileSet => tileSet.reachableTiles.forEach(tile => {
    const key = coordinateKey(tile);
    const entry = byCoordinate.get(key) ?? { ...tile, count: 0, setNumbers: [], candidateValues: [] };
    if (!entry.setNumbers.includes(tileSet.setNumber)) { entry.count += 1; entry.setNumbers.push(tileSet.setNumber); entry.candidateValues.push(tileSet.value); }
    byCoordinate.set(key, entry);
  }));
  const entries = [...byCoordinate.values()];
  const max = Math.max(1, ...entries.map(tile => tile.count));
  return entries.map(tile => ({ ...tile, displayIntensity: tile.count / max, displayLabel: tile.setNumbers.slice(0, 4).join(',') + (tile.setNumbers.length > 4 ? '+' : '') }));
}

export default function RseFeebasCalculatorTool() {
  const [game, setGame] = useState('emerald');
  const [method, setMethod] = useState('save');
  const [battery, setBattery] = useState('working');
  const [trainerId, setTrainerId] = useState('');
  const [firstWord, setFirstWord] = useState('');
  const [secondWord, setSecondWord] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [mapMode, setMapMode] = useState('exact');
  const [priorityMode, setPriorityMode] = useState('tiered');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [hiddenSets, setHiddenSets] = useState(() => new Set());
  const [zoom, setZoom] = useState(.56);
  const [working, setWorking] = useState(false);
  const input = useRef(null);
  const phrase = useMemo(() => {
    const first = EMERALD_EASY_CHAT_CONDITIONS.find(word => String(word.index) === firstWord);
    const second = words.find(word => `${word.group}:${word.index}` === secondWord);
    const tid = normalizeTrainerId(trainerId);
    if (!tid.valid || !first || !second) return null;
    return { trainerId: tid.trainerId, phraseSignature: getDewfordPhraseSignature({ firstWordIndex: first.index, secondWordGroup: second.group, secondWordIndex: second.index }) };
  }, [firstWord, secondWord, trainerId]);
  const reset = () => { if (input.current) input.current.value = ''; setGame('emerald'); setMethod('save'); setBattery('working'); setTrainerId(''); setFirstWord(''); setSecondWord(''); setResult(null); setStatus({ type: 'idle', message: '' }); setMapMode('exact'); setPriorityMode('tiered'); setPriorityFilter('all'); setHiddenSets(new Set()); setZoom(.56); };
  const exactLocations = result?.type === 'exact' ? result.tileSet.reachableTiles : [];
  const setResultFromSave = parsed => { setResult({ type: 'exact', game, tileSet: buildPublicTileSet(parsed.feebasValue.value), parseResult: parsed }); setStatus({ type: 'success', message: 'Save read successfully. Your save stays on your device.' }); };
  async function readSave(event) {
    const file = event.target.files?.[0]; setResult(null);
    if (!file) return;
    setStatus({ type: 'pending', message: 'Reading save file locally...' });
    try { const parsed = game === 'emerald' ? parseEmeraldSave(await file.arrayBuffer()) : parseRubySapphireSave(await file.arrayBuffer()); if (!parsed.valid) { setResult({ type: 'error', errors: parsed.errors }); setStatus({ type: 'error', message: 'This save does not match the selected game profile. Check the game and choose a raw .sav file.' }); return; } setResultFromSave(parsed); }
    catch { setResult({ type: 'error', errors: ['Unable to read save file.'] }); setStatus({ type: 'error', message: "We couldn't read this save file. Make sure you selected a raw .sav file." }); }
    finally { event.target.value = ''; }
  }
  function calculate() {
    setResult(null);
    if (!phrase) { setStatus({ type: 'error', message: 'Enter a valid five-digit Trainer ID and choose both words from the current Dewford trendy phrase.' }); return; }
    if (game === 'emerald') { const calculation = findEmeraldFeebasValueCandidates(phrase); const values = calculation.candidates.map(entry => entry.value); setResult({ type: 'sets', calculation, sets: buildPossibleTileSetResult(values) }); setStatus({ type: 'success', message: 'Possible tile sets calculated.' }); return; }
    if (battery === 'unsure') { setStatus({ type: 'error', message: 'Choose whether the internal battery was working when the save was first created, or upload a save for exact results.' }); return; }
    if (battery === 'dead') { const calculation = findRsDeadBatteryCandidates(phrase); setResult({ type: 'sets', calculation, sets: buildPossibleTileSetResult(calculation.uniqueValues.map(entry => entry.value)) }); setStatus({ type: 'success', message: 'Possible tile sets calculated.' }); return; }
    setWorking(true); setStatus({ type: 'pending', message: 'Calculating possible Feebas patterns...' });
    const finish = calculation => { const values = calculation.uniqueValues.map(entry => entry.value); if (!values.length) { setResult({ type: 'error', errors: ['No possible Feebas patterns matched that Trainer ID and Dewford Trend.'] }); setStatus({ type: 'error', message: 'No matching possible patterns.' }); } else { setResult({ type: 'priority', calculation, priority: buildPublicPriorityResult(values, 'all') }); setStatus({ type: 'success', message: 'Working-battery priority map calculated.' }); } setWorking(false); };
    if (typeof Worker === 'undefined') { window.setTimeout(() => { try { finish(findRsWorkingBatteryCandidates(phrase)); } catch (error) { setResult({ type: 'error', errors: [error.message] }); setStatus({ type: 'error', message: 'Working-battery calculation failed.' }); setWorking(false); } }, 0); return; }
    const worker = new Worker(new URL('../../../src/workers/rsWorkingBatteryFeebasWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = event => { event.data.ok ? finish(event.data.result) : (setResult({ type: 'error', errors: [event.data.error] }), setStatus({ type: 'error', message: 'Working-battery calculation failed.' }), setWorking(false)); worker.terminate(); };
    worker.onerror = () => { try { worker.terminate(); finish(findRsWorkingBatteryCandidates(phrase)); } catch { setStatus({ type: 'error', message: 'Working-battery calculation failed.' }); setWorking(false); } };
    worker.postMessage(phrase);
  }
  const visibleSets = result?.type === 'sets' ? result.sets.tileSets.filter(tileSet => !hiddenSets.has(tileSet.setNumber)) : [];
  const setCoverage = result?.type === 'sets' ? buildSetCoverage(visibleSets) : [];
  const priority = result?.type === 'priority' ? buildPublicPriorityResult(result.calculation.uniqueValues.map(entry => entry.value), priorityFilter) : null;
  const mapLocations = result?.type === 'exact' && mapMode === 'exact' ? exactLocations : [];
  const hintAreas = result?.type === 'exact' && mapMode === 'hint' ? buildHintAreas(exactLocations, result.tileSet.value) : [];
  return <div className="rse-feebas-public-tool" data-rse-calculator>
    <div className="rse-feebas-public-controls"><section><h2>Game</h2><div className="rse-feebas-game-grid">{GAMES.map(option => <button className={`rse-feebas-game-button rse-feebas-game-button--${option.id}`} type="button" key={option.id} aria-pressed={game === option.id} onClick={() => { setGame(option.id); setResult(null); setStatus({ type: 'idle', message: '' }); }}>{option.label}</button>)}</div></section>
      <section><h2>Input Method</h2><div className="rse-feebas-tabs" role="tablist"><button type="button" aria-selected={method === 'save'} onClick={() => setMethod('save')}>Upload Save File</button><button type="button" aria-selected={method === 'info'} onClick={() => setMethod('info')}>Game Information</button></div>
      {method === 'save' ? <div className="rse-feebas-panel"><label><span>{game === 'emerald' ? 'Pokemon Emerald' : 'Pokemon Ruby or Sapphire'} .sav file</span><input ref={input} type="file" accept=".sav" onChange={readSave} /></label><p>Your save file is processed locally in your browser. It is never uploaded or stored.</p></div> : <div className="rse-feebas-panel"><div className="rse-feebas-public-inputs"><label><span>Trainer ID</span><input value={trainerId} inputMode="numeric" maxLength="5" onChange={event => setTrainerId(event.target.value)} /></label><label><span>First Dewford word</span><select value={firstWord} onChange={event => setFirstWord(event.target.value)}><option value="">Choose a word</option>{EMERALD_EASY_CHAT_CONDITIONS.map(word => <option key={word.index} value={word.index}>{word.text}</option>)}</select></label><label><span>Second Dewford word</span><select value={secondWord} onChange={event => setSecondWord(event.target.value)}><option value="">Choose a word</option>{words.map(word => <option key={`${word.group}:${word.index}`} value={`${word.group}:${word.index}`}>{word.text}</option>)}</select></label></div>{game === 'ruby-sapphire' && <fieldset className="rse-feebas-battery"><legend>Battery / RTC when this save was created</legend>{[['working','Working'],['dead','Dead'],['unsure','Unsure']].map(([value,label]) => <label key={value}><input type="radio" checked={battery === value} onChange={() => setBattery(value)} />{label}</label>)}</fieldset>}<button type="button" disabled={working} onClick={calculate}>{working ? 'Calculating…' : 'Calculate'}</button></div>}</section>
      {status.message && <p className={`rse-feebas-status ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}<button className="rse-feebas-start-over" type="button" onClick={reset}>Reset calculator</button></div>
    <div className="rse-feebas-public-map-stack">{result?.type === 'error' && <section className="rse-feebas-result-card rse-feebas-error" role="alert">{result.errors.map(error => <p key={error}>{error}</p>)}</section>}<section className="rse-feebas-result-card">{result?.type === 'exact' && <><div className="rse-feebas-section-heading"><div><h2>Your Feebas Tiles</h2><p>We found the exact Feebas value stored in your save. Fish on any highlighted location below.</p></div></div><div className="rse-feebas-map-mode"><div className="rse-feebas-segmented" role="group" aria-label="Map mode"><button type="button" aria-pressed={mapMode === 'hint'} onClick={() => setMapMode('hint')}>Hint</button><button type="button" aria-pressed={mapMode === 'exact'} onClick={() => setMapMode('exact')}>Exact</button></div><p className="rse-feebas-mode-help">{mapMode === 'exact' ? 'Show the exact fishing locations.' : 'Show a 16 tile approximate location for each possible Feebas spot.'}</p></div></>} {result?.type === 'priority' && <><div className="rse-feebas-section-heading"><div><h2>Priority Map</h2><p>Your save has many possible Feebas patterns. Start with the tiles showing the highest overlap counts.</p></div><strong>{priority.summary.totalCandidateValues} possible Feebas patterns</strong></div><div className="rse-feebas-priority-controls"><div className="rse-feebas-segmented" role="group" aria-label="Priority display mode"><button type="button" aria-pressed={priorityMode === 'tiered'} onClick={() => setPriorityMode('tiered')}>Priority Tiers</button><button type="button" aria-pressed={priorityMode === 'heatmap'} onClick={() => setPriorityMode('heatmap')}>Heatmap</button></div><label><span>Show</span><select aria-label="Show priority tiles" value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)}>{PRIORITY_FILTERS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div></>} {result?.type === 'sets' && <div className="rse-feebas-section-heading"><div><h2>Possible Feebas Tile Layouts</h2><p>All tiles within a set have the same number on the map below.</p></div></div>}<RseRoute119FeebasMap displayLocations={mapLocations} highlightedAreas={hintAreas} priorityTiles={result?.type === 'priority' ? priority.visibleTiles : setCoverage} priorityDisplayMode={priorityMode === 'heatmap' || result?.type === 'sets' ? 'heatmap' : 'tiered'} showGrid showMapImage zoom={zoom} fitHeightToMapImage showHighlightLabels={false} /></section>{result?.type === 'sets' && <section className="rse-feebas-result-card"><h2>Possible Feebas tile sets</h2><div className="rse-feebas-set-grid">{result.sets.tileSets.map(set => <article className={`rse-feebas-set-card ${hiddenSets.has(set.setNumber) ? 'is-hidden' : ''}`} key={set.value}><h3>Possible Tile Set {set.setNumber}</h3><label><input type="checkbox" checked={hiddenSets.has(set.setNumber)} onChange={() => setHiddenSets(current => { const next = new Set(current); next.has(set.setNumber) ? next.delete(set.setNumber) : next.add(set.setNumber); return next; })} /><span>Hide Set</span></label></article>)}</div></section>}</div>
  </div>;
}
