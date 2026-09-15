import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Seo from '../seo/Seo';
import { tcgChallengeSeo } from '../seo/seoConfig';
import TypeBadge from '../components/TypeBadge';
import { formatVersionGroupName, getLearnsetMovesForVersion, formatMoveDisplayName } from '../utils/learnsetDisplay';
import { formatPokemonDisplayName } from '../utils/pokemonNames';
import { getPokemonUrl } from '../utils/pokemonUrls';
import { isRevealed, canReveal, revealCard } from '../tcg/reveal';
import { generatePack } from '../tcg/engine';
import { arrangePack, boosterArtwork, OPENING_ORDERS, ORDER_LABELS, selectableOrder, PACK_PRESENTATION } from '../tcg/packPresentation';
import { challengePokemonTypes } from '../tcg/gameIntegration';
import { energyRewardTypes } from '../tcg/energyRules';
import { GAMES, readSetup, challengeUrl, newChallenge, loadChallenges, saveChallenges } from '../tcg/storage';
import './TcgChallengePage.css';

const jsonCache = new Map();
function loadJson(url) {
  if (!jsonCache.has(url)) jsonCache.set(url, fetch(url).then(r => {
    if (!r.ok) throw new Error('Data could not be loaded. Please try again.');
    return r.json();
  }).catch(error => { jsonCache.delete(url); throw error; }));
  return jsonCache.get(url);
}
function CardImage({ card }) {
  const [failed, setFailed] = useState(false);
  const [fallback, setFallback] = useState(!card.image);
  const [loaded, setLoaded] = useState(false);
  const element = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!element.current?.naturalWidth) {
        if (!fallback && card.imageFallback) setFallback(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [fallback, card.imageFallback]);
  return !failed && (card.image || card.imageFallback) ? <div className="tcg-image-wrap">{!loaded && <span className="tcg-image-loading">Loading card artwork…</span>}<img ref={element} className="tcg-art" src={fallback ? card.imageFallback : card.image} alt={`${card.name}, card ${card.number}`} loading="lazy" onLoad={() => setLoaded(true)} onError={() => {
    if (!fallback && card.imageFallback) setFallback(true); else setFailed(true);
  }} /></div> :
    <div className="tcg-art tcg-image-fallback">{card.name}<small>Card artwork unavailable</small></div>;
}
function PokemonInfo({ pokemon, game, onClose }) {
  const [result, setResult] = useState(null);
  const panel = useRef(null);
  useEffect(() => { panel.current?.focus(); }, []);
  useEffect(() => {
    let cancelled = false;
    loadJson(`/data/pokemonLearnsets/${pokemon.id}.json`).then(data => {
      if (!cancelled) setResult({ moves: getLearnsetMovesForVersion(data, game) });
    }).catch(() => { if (!cancelled) setResult({ error: true }); });
    return () => { cancelled = true; };
  }, [pokemon.id, game]);
  const moves = result?.moves ?? [];
  return <section ref={panel} tabIndex={-1} className="tcg-panel tcg-info" aria-label="Pokémon game information">
    <div className="tcg-row"><h3>{formatPokemonDisplayName(pokemon.name)} · {formatVersionGroupName(game)}</h3><button onClick={onClose}>Close details</button></div>
    <Link to={getPokemonUrl(pokemon)}>Stats, evolution & full Pokémon details →</Link>
    {!result ? <p role="status">Loading learnset…</p> : result.error ? <p>Learnset unavailable. You can still use this Pokémon.</p> : !moves.length ? <p>No learnset is recorded for this game. This does not prevent you from selecting this Pokémon.</p> :
      <div className="tcg-info-columns">{[['level-up', 'Level-up moves'], ['machine', 'TM / HM moves']].map(([method, title]) =>
        <div key={method}><h4>{title}</h4><ul>{moves.filter(m => m.method === method).map((m, i) => <li key={`${m.move}-${i}`}>
          {method === 'level-up' && `Lv. ${m.level} · `}<Link to={`/move/${m.move}`}>{formatMoveDisplayName(m.move)}</Link>
        </li>)}</ul>{!moves.some(m => m.method === method) && <p>None recorded.</p>}</div>)}</div>}
  </section>;
}

function EnergyMoves({ types, game }) {
  const [result, setResult] = useState(null);
  return <details onToggle={e => {
    if (e.currentTarget.open && !result) loadJson(`/data/tcg/rewards/${game}.json`).then(moves => setResult({ moves })).catch(() => setResult({ error: true }));
  }}><summary>Eligible TMs</summary>{!result ? <p>Loading TMs…</p> : result.error ? <p>TM list unavailable. Choose a matching TM using your game's move pages.</p> : <>
    {!result.moves.some(m => types.includes(m.type)) && <p>No matching TMs are recorded for this game.</p>}
    <ul className="tcg-tm-list">{result.moves.filter(m => types.includes(m.type)).map(m => <li key={`${m.tm}-${m.name}`}><Link to={`/move/${m.name}`}>{m.tm} · {formatMoveDisplayName(m.name)}</Link></li>)}</ul>
  </>}</details>;
}

export default function TcgChallengePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const shared = readSetup(location.search);
  const [game, setGame] = useState(shared?.game ?? 'emerald');
  const [set, setSet] = useState(shared?.set ?? 'base1');
  const [seed, setSeed] = useState(shared?.seed ?? '');
  const [order, setOrder] = useState(selectableOrder(shared?.order));
  const [sets, setSets] = useState([]);
  const [artwork, setArtwork] = useState(null);
  const [initial] = useState(() => { try { return loadChallenges(localStorage); } catch { return { challenges: [], error: 'Browser saves are unavailable.' }; } });
  const [saves, setSaves] = useState(initial.challenges);
  const [storageError, setStorageError] = useState(initial.error);
  const [active, setActive] = useState(null);
  const [data, setData] = useState(null);
  const [pokemon, setPokemon] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [info, setInfo] = useState(null);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    loadJson('/data/tcg/v1/sets.json').then(value => { if (!cancelled) setSets(value); }).catch(e => { if (!cancelled) setError(e.message); });
    loadJson('/data/tcg/artwork.json').then(value => { if (!cancelled) setArtwork(value); }).catch(() => { /* The opener remains usable without decorative artwork. */ });
    return () => { cancelled = true; };
  }, [retry]);
  const cardMap = useMemo(() => new Map(data?.cards.map(c => [c.id, c]) ?? []), [data]);
  const dexMap = useMemo(() => new Map(pokemon.map(p => [p.id, p])), [pokemon]);
  const latest = active?.packs.at(-1);
  const wrapper = boosterArtwork(artwork, active?.set ?? set, active?.seed ?? seed, active?.packs.length ?? 0);
  const revealed = active?.packs.flatMap(p => p.cards.filter((_, i) => isRevealed(p, i))) ?? [];
  const availableDex = new Set(revealed.flatMap(p => cardMap.get(p.id)?.dexIds ?? []));
  const collection = [...new Map(revealed.map(p => [p.id, p])).values()].filter(p => filter === 'All' || cardMap.get(p.id)?.category === filter);
  const pageCount = Math.max(1, Math.ceil(collection.length / 24));
  const currentPage = Math.min(page, pageCount);

  function persist(next) {
    setSaves(next);
    // Don't overwrite unreadable saves. The user can recover the original storage manually.
    if (initial.error) return;
    try { setStorageError(saveChallenges(localStorage, next)); }
    catch { setStorageError('Browser saves are unavailable. Progress remains in this tab.'); }
  }
  function update(next) {
    setActive(next);
    persist([next, ...saves.filter(s => s.id !== next.id)]);
  }
  async function begin(savedChallenge) {
    const challenge = { ...savedChallenge, order: selectableOrder(savedChallenge.order) };
    setBusy(true); setError(''); setInfo(null);
    try {
      const [selected, species] = await Promise.all([loadJson(`/data/tcg/${challenge.modelVersion}/${challenge.set}.json`), loadJson('/data/pokemonIndex.json')]);
      if (challenge.packs.some(p => p.cards.some(c => !selected.cards.some(card => card.id === c.id)))) throw new Error('This save references unavailable card data.');
      setData(selected); setPokemon(species); update(challenge);
      setGame(challenge.game); setSet(challenge.set); setSeed(challenge.seed);
      setOrder(challenge.order);
      navigate(challengeUrl(challenge), { replace: true });
      setMessage('Challenge ready. Open a pack whenever your run calls for one.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  function start(event) {
    event.preventDefault();
    const generatedSeed = seed.trim() || crypto.getRandomValues(new Uint32Array(1))[0].toString(16).padStart(8, '0').toUpperCase();
    begin(newChallenge({ game, set, seed: generatedSeed, modelVersion: 'v1', order }));
  }
  function openPack() {
    try {
      const openingOrder = selectableOrder(active.order);
      update({ ...active, packs: [...active.packs, { cards: arrangePack(generatePack(data, active, active.packs.length), active.set, openingOrder, data), revealed: 0, order: openingOrder }] });
      setMessage('Pack opened. Reveal your cards.');
    } catch (e) { setError(e.message); }
  }
  async function copy(challenge) {
    const url = new URL(challengeUrl(challenge), window.location.origin).href;
    try { await navigator.clipboard.writeText(url); setMessage('Challenge URL copied. It reproduces the pack sequence from the beginning.'); }
    catch { setMessage(`Copy this challenge URL: ${url}`); }
  }
  function add(id) {
    if (!availableDex.has(id) || active.team.includes(id)) return;
    update({ ...active, team: [...active.team, id] });
    setMessage(`${formatPokemonDisplayName(dexMap.get(id)?.name ?? String(id))} added to your team.`);
  }
  function renderCard(pull, key) {
    const card = cardMap.get(pull.id);
    if (!card) return null;
    const special = ['holo', 'secret', 'shining'].includes(pull.pool);
    const types = card.category === 'Energy' ? energyRewardTypes(card, data.rules.energyEra, active.game) : [];
    return <article className={`tcg-card ${special ? 'tcg-special' : ''}`} key={key}>
      <CardImage key={card.id} card={card} />
      <details className="tcg-card-details"><summary>{card.name}</summary><div className="tcg-card-body"><small>{pull.pool === 'shining' ? '✦ Shining' : pull.pool === 'secret' ? '✦ Secret rare' : pull.pool === 'holo' ? '✦ Holo rare' : card.rarity} · #{card.number}</small><h3>{card.name}</h3>
        <span className="tcg-category">{card.category === 'Pokemon' ? 'Pokémon' : card.category}</span>
        {card.category === 'Pokemon' && card.dexIds.map(id => <div className="tcg-card-actions" key={id}>
          <button disabled={active.team.includes(id)} onClick={() => add(id)}>{active.team.includes(id) ? 'On your team' : `Add ${formatPokemonDisplayName(dexMap.get(id)?.name ?? `#${id}`)}`}</button>
          {dexMap.has(id) && <button className="tcg-text-button" onClick={() => setInfo(id)}>Game info</button>}
        </div>)}
        {card.category === 'Pokemon' && !card.dexIds.length && <p>Species mapping unavailable.</p>}
        {card.category === 'Energy' && <p className="tcg-reward"><strong>Suggested reward</strong><br />{types.length ? `Choose one ${types.join(' / ')}-type TM available in ${formatVersionGroupName(active.game)}.` : 'No matching videogame type exists in this game.'}</p>}
        {card.category === 'Energy' && types.length > 0 && <EnergyMoves types={types} game={active.game} />}
        {card.category === 'Trainer' && <p className="tcg-reward">Suggested Trainer Effect: Coming Soon</p>}
      </div></details>
    </article>;
  }
  return <main className="tcg-page">
    <Seo {...tcgChallengeSeo(Boolean(location.search))} />
    <header className="tcg-header"><span className="tcg-eyebrow">VINTAGE CARDS · A NEW ADVENTURE</span><h1>One Pack Challenge</h1><p>Open a little history. Find your next team.</p></header>
    <div role="status" className="tcg-status">{message}</div>
    {storageError && <p role="alert" className="tcg-error">{storageError}</p>}
    {error && <p role="alert" className="tcg-error">{error} <button onClick={() => { setError(''); setRetry(r => r + 1); }}>Retry loading</button></p>}
    {!active ? <section className="tcg-panel">
      {location.search && !shared && <p role="alert">This challenge link is invalid or uses an unsupported model. Choose settings below to start a new run.</p>}
      {shared && <p>A shared challenge is ready. Start to reproduce its packs, or resume your saved copy below.</p>}
      <form className="tcg-setup" onSubmit={start}>
        <label>Choose game<select value={game} onChange={e => setGame(e.target.value)}>{GAMES.map(g => <option key={g} value={g}>{formatVersionGroupName(g)}</option>)}</select></label>
        <label>Choose card set<select value={set} onChange={e => setSet(e.target.value)} disabled={!sets.length}>{sets.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>Seed <input value={seed} onChange={e => setSeed(e.target.value)} maxLength={64} pattern="[A-Za-z0-9_\-]{1,64}" placeholder="A surprise, or your own seed" /></label>
        <div><label>Reveal order<select aria-describedby="setup-order-description" value={order} onChange={e => setOrder(e.target.value)}>{Object.entries(OPENING_ORDERS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p id="setup-order-description" className="tcg-order-description tcg-muted">{order === 'suggested-v1' ? 'Two Pokémon first. Rare last.' : 'The reconstructed historical order'}</p></div>
        <button className="tcg-primary" disabled={busy || !sets.length}>{busy ? 'Preparing…' : 'Start Challenge'}</button>
      </form>
    </section> : <>
      <section className="tcg-panel tcg-run-header">
        <div><label>Challenge name<input aria-label="Challenge name" maxLength={80} value={active.name} onChange={e => update({ ...active, name: e.target.value })} /></label><p>{formatVersionGroupName(active.game)} · {data.rules.name} · Seed <code>{active.seed}</code></p></div>
        <div className="tcg-actions"><button onClick={() => copy(active)}>Copy challenge URL</button><button onClick={() => { setActive(null); setInfo(null); navigate('/tcg-challenge'); }}>Saved challenges / New run</button></div>
      </section>
      <section className="tcg-panel tcg-opening" aria-label="Pack opening">
        <div className="tcg-order-controls"><div><label>Reveal order for next pack<select aria-describedby="active-order-description" value={selectableOrder(active.order)} onChange={e => {
          const next = { ...active, order: e.target.value }; update(next); setOrder(e.target.value); navigate(challengeUrl(next), { replace: true });
        }}>{Object.entries(OPENING_ORDERS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p id="active-order-description" className="tcg-order-description tcg-muted">{selectableOrder(active.order) === 'suggested-v1' ? 'Two Pokémon first. Rare last.' : 'the reconstructed historical order.'}</p></div>
          <details><summary>About pack order</summary><p>Suggested reveals two Pokémon first and the rare last. If a pack has fewer than two non-rare Pokémon, missing Pokémon are drawn from the same rarity pools; the rare stays unchanged.</p><p>Typical original order: {PACK_PRESENTATION[active.set].summary}.</p><p>Reconstructed from pack openings; print runs can vary. {PACK_PRESENTATION[active.set].note} Trainers share their rarity's slots with Pokémon, so a Trainer can appear first when the first slot is common or uncommon. Exact printing-sheet sequences are not simulated.</p><p>Changing this setting applies to new packs. Already-opened packs keep their saved reveal order.</p><a href="https://pokemonboosterpack.com/archive/pages/about">Pack-opening reconstruction source</a></details>
        </div>
        <div className="tcg-row"><div><span className="tcg-eyebrow">{data.rules.name}</span><h2>{latest ? `Pack ${active.packs.length}` : 'Your first pack awaits'}</h2><p>{latest ? `${latest.revealed} / ${latest.cards.length} cards revealed` : `${data.rules.cardsPerPack} cards. Who will join your adventure?`}</p></div>
          <button className="tcg-primary" disabled={busy || (latest && latest.revealed < latest.cards.length)} onClick={openPack}>{latest ? 'Open next pack' : 'Open Pack'}</button></div>
        {!latest && wrapper && <figure className="tcg-sealed-pack"><button className="tcg-wrapper-button" aria-label="Open sealed booster" disabled={busy} onClick={openPack}><img src={wrapper.image} alt={wrapper.name} width="220" height="390" /></button><figcaption>Tap the pack to open · {wrapper.name.replace(/ Booster /, ' · ')}<br /><small>Wrapper art does not affect pulls.</small></figcaption></figure>}
        {latest && <p className="tcg-muted">This pack: {ORDER_LABELS[latest.order ?? 'legacy-v1']}</p>}
        {latest && <div className="tcg-card-grid tcg-pack-grid">{latest.cards.map((pull, index) => <div className="tcg-pack-slot" key={`${active.packs.length}-${index}`}>
          {isRevealed(latest, index) ? renderCard(pull, index) : <button className="tcg-card-back" disabled={!canReveal(latest, index)} aria-label={`Reveal card ${index + 1} of ${latest.cards.length}`} onClick={() => {
            if (!canReveal(latest, index)) return;
            update({ ...active, packs: active.packs.map((p, i) => i === active.packs.length - 1 ? revealCard(p, index) : p) });
            setMessage(`Revealed ${cardMap.get(pull.id)?.name}.`);
          }}><img src={artwork?.cardBack.image ?? '/images/tcg/card-back.webp'} alt="English Pokémon card back" width="220" height="307" /><span className="tcg-reveal-label">{canReveal(latest, index) ? `Flip card ${index + 1}` : `Card ${index + 1} · Locked`}</span></button>}
        </div>)}</div>}
        {latest && latest.revealed === latest.cards.length && <p className="tcg-summary">Pack complete · {latest.cards.filter(c => cardMap.get(c.id)?.category === 'Pokemon').length} Pokémon cards · {latest.cards.filter(c => cardMap.get(c.id)?.category === 'Energy').length} Energy rewards. Pick your team below.</p>}
      </section>
      <section className="tcg-panel"><div className="tcg-row"><div><h2>Challenge team</h2><p>Six party slots, with room for your own rules.</p></div>{active.team.length > 0 && <Link to={`/team-coverage?version=${active.game}&team=${active.team.slice(0, 6).join('-')}`}>Analyze this team →</Link>}</div>
        <div className="tcg-team">{Array.from({ length: Math.max(6, active.team.length) }, (_, i) => {
          const id = active.team[i]; const p = dexMap.get(id);
          return <div className="tcg-team-slot" key={i}>{p ? <><img src={p.sprite} alt="" loading="lazy" width="80" height="80" /><h3>{formatPokemonDisplayName(p.name)}</h3><small>#{id}{i >= 6 ? ' · Reserve' : ''}</small><div className="tcg-types">{challengePokemonTypes(p, active.game).map(t => <TypeBadge key={t} type={t} height="1rem" />)}</div><small>{formatVersionGroupName(active.game)} types</small><button onClick={() => setInfo(id)}>Learnset & game info</button><Link to={getPokemonUrl(p)}>Stats & evolution</Link>{i >= 6 && <button onClick={() => update({ ...active, team: [id, ...active.team.filter(x => x !== id)] })}>Move to party</button>}<button className="tcg-text-button" onClick={() => update({ ...active, team: active.team.filter(x => x !== id) })}>Remove</button></> : <><span className="tcg-empty-slot">{i + 1}</span><small>Choose a pulled Pokémon</small></>}</div>;
        })}</div>{active.team.length > 6 && <p className="tcg-muted">Team analysis uses the first six. Your reserves stay here.</p>}
      </section>
      {info && dexMap.has(info) && <PokemonInfo key={`${info}-${active.game}`} pokemon={dexMap.get(info)} game={active.game} onClose={() => setInfo(null)} />}
      {/* <section className="tcg-panel"><h2>Run journal</h2><label>Badges, milestones & your house rules<textarea value={active.progress} maxLength={4000} onChange={e => update({ ...active, progress: e.target.value })} placeholder="Suggested: one starting pack, then one after each badge. Open packs manually whenever you choose." /></label></section> */}
      {/* <section className="tcg-panel"><div className="tcg-row"><div><h2>Your pulled cards</h2><p>{revealed.length} revealed cards · {availableDex.size} Pokémon species · {active.packs.length} packs</p></div><label>Show<select value={filter} onChange={e => { setFilter(e.target.value); setPage(1); }}>{['All', 'Pokemon', 'Energy', 'Trainer'].map(v => <option key={v} value={v}>{v === 'Pokemon' ? 'Pokémon' : v}</option>)}</select></label></div>
        <div className="tcg-card-grid">{collection.slice((currentPage - 1) * 24, currentPage * 24).map(p => renderCard(p, p.id))}</div>
        {!collection.length && <p>Revealed cards will appear here. Repeated pulls are kept in your pack history.</p>}
        {pageCount > 1 && <div className="tcg-actions"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {pageCount}</span><button disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button></div>}
      </section> */}
    </>}
    {!active && <section className="tcg-panel"><h2>Saved challenges</h2><p className="tcg-muted">Challenges are saved in your browser. Save your URL or write down your Seed to restore your pack if browser data is cleared</p>{!saves.length && <p>No saved Challenges yet.</p>}{saves.map(s => <div className="tcg-saved" key={s.id}><div><strong>{s.name || 'Untitled challenge'}</strong><p>{formatVersionGroupName(s.game)} · {s.packs.length} packs · {s.seed}</p></div><div className="tcg-actions"><button disabled={busy} onClick={() => begin(s)}>Resume</button><button onClick={() => copy(s)}>Copy URL</button><button onClick={() => { const name = window.prompt('Challenge name', s.name); if (name !== null) persist(saves.map(c => c.id === s.id ? { ...c, name: name.slice(0, 80) } : c)); }}>Rename</button><button onClick={() => { if (window.confirm(`Delete “${s.name}” from this browser?`)) persist(saves.filter(c => c.id !== s.id)); }}>Delete</button></div></div>)}</section>}
    <section className="tcg-help"><h2>A vintage pack. A different playthrough.</h2><p>Choose a Pokémon videogame and an English TCG set from Base Set through Neo Destiny. Virtually open booster packs and use the Pokémon you reveal in your challenge run—no physical vintage packs required. A card grants the depicted Pokémon; pulling its earlier evolutions is optional.</p><h3>Make the challenge your own</h3><p>Try a starting pack, then another after each gym badge. Energy offers a suggested TM reward, while Trainer effects are coming later. You choose the pace and rules. The game selection guides learnsets; it never filters the card pulls. Pokémon absent from a game's software may require a compatible modified game.</p><h3>Historical model</h3><p>Historical pull rates are modeled from known pack composition and collector-documented box collation. Exact odds may vary by print run and were not always officially published.</p><p>Individual packs are simulated independently. Error print runs and guaranteed box totals are not modeled. Card data and artwork: <a href="https://tcgdex.net">TCGdex</a>. Backup artwork: <a href="https://pokemontcg.io">Pokémon TCG API</a>.</p>{data && <details><summary>Pack composition, estimated odds & sources</summary><ul>{data.rules.slots.map(slot => <li key={slot.type}>{slot.count} {slot.type}{slot.distribution && `: ${slot.distribution.map(d => `${d.pool} ${(d.probability * 100).toFixed(2)}%`).join(', ')}`}</li>)}</ul>{data.rules.sources.map(s => <p key={s.url}><a href={s.url}>{s.name}</a></p>)}</details>}</section>
    <details className="tcg-help"><summary>Artwork credits</summary><p>Original Pokémon packaging and English card-back artwork, archived by Bulbagarden. These are reference scans; wrapper edition does not select a different odds model.</p>{wrapper && <p><a href={wrapper.source}>{wrapper.name}</a></p>}<p><a href="https://archives.bulbagarden.net/wiki/File:Cardback.jpg">English card-back source</a></p></details>
  </main>;
}
