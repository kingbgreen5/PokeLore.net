import { useEffect, useMemo, useRef, useState } from 'react';
import TypeBadge from './TypeBadge.jsx';
import { publicHref } from '../lib/links.js';

const PAGE_SIZE = 150;
const intro = {
  heading: 'Pokémon Pokédex, Tools & Game Guides',
  description: 'PokéLore.net is a game-focused Pokémon reference with stats, moves, weaknesses, evolutions, encounter locations, Pokédex lore, and original playthrough, competitive, and Nuzlocke analysis, plus practical tools for playing across generations.'
};
const tools = [
  ['Pokémon Team Builder', '/team-coverage', 'Find the best Pokémon to complete a team.'],
  ['EV Training Routes', '/ev-training-routes', 'Find efficient EV training locations by game.'],
  ['DPPt Feebas Calculator', '/dppt-feebas-calculator', 'Calculate possible Feebas tiles in Diamond, Pearl, and Platinum.'],
  ['RSE Feebas Calculator', '/rse-feebas-calculator', 'Find Route 119 Feebas tiles in Ruby, Sapphire, and Emerald.']
];

const titleCase = value => value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
const displayName = pokemon => pokemon.name.split('-').map(titleCase).join(' ');

function HomePokemonCard({ pokemon, desktop }) {
  const size = desktop
    ? { width: undefined, minHeight: '320px', maxHeight: '320px', maxWidth: '320px', padding: '1rem', sprite: '170px', name: '1.2rem', typeGap: '.075rem', badge: '1.45rem' }
    : { width: '135px', minHeight: '135px', maxHeight: '200px', maxWidth: '200px', padding: '.2rem', sprite: '90px', name: '.8rem', typeGap: '.5rem', badge: '1.15rem' };
  const [source, setSource] = useState(pokemon.sprite);
  const fallback = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
  return <a href={`/pokemon/${pokemon.name}`} className="homepage-pokemon-card" style={{ width: size.width, minHeight: size.minHeight, maxHeight: size.maxHeight, maxWidth: size.maxWidth, padding: size.padding }}>
    <span style={{ width: '100%', textAlign: 'left', opacity: .6, fontSize: '.85rem', marginBottom: desktop ? '0' : '-.7rem' }}>#{String(pokemon.id).padStart(4, '0')}</span>
    <img src={source} alt={displayName(pokemon)} loading="lazy" onError={() => source !== fallback && setSource(fallback)} style={{ width: size.sprite, height: size.sprite, objectFit: 'contain' }} />
    <h3 style={{ color: 'var(--text-h)', fontSize: size.name, lineHeight: 1.1, margin: '0 0 .5rem', overflowWrap: 'anywhere', textAlign: 'center' }}>{displayName(pokemon)}</h3>
    <span style={{ display: 'flex', flexWrap: 'wrap', gap: size.typeGap, justifyContent: 'center' }}>{pokemon.types.map(type => <TypeBadge key={type} type={type} height={size.badge} />)}</span>
  </a>;
}

export default function Homepage() {
  const gridRef = useRef(null);
  const [pokemon, setPokemon] = useState([]);
  const [desktop, setDesktop] = useState(false);
  // Astro renders the island once on the server before it hydrates in the
  // browser, so query-string state must tolerate the server pass.
  const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);
  const [type, setType] = useState(params.get('type') ?? 'all');
  const [sort, setSort] = useState(params.get('sort') ?? 'dex-asc');
  const [page, setPage] = useState(Number(params.get('page')) || 1);

  useEffect(() => {
    fetch('/data/pokemonIndex.json').then(response => response.json()).then(setPokemon).catch(error => console.error('Failed to load Pokémon index:', error));
    const query = window.matchMedia('(min-width: 768px)');
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  const allTypes = useMemo(() => ['all', ...new Set(pokemon.flatMap(entry => entry.types))], [pokemon]);
  const results = useMemo(() => {
    const next = type === 'all' ? [...pokemon] : pokemon.filter(entry => entry.types.includes(type));
    if (sort === 'dex-desc') next.sort((a, b) => b.id - a.id);
    else if (sort === 'name-asc') next.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') next.sort((a, b) => b.name.localeCompare(a.name));
    else next.sort((a, b) => a.id - b.id);
    return next;
  }, [pokemon, type, sort]);
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visible = results.slice(start, start + PAGE_SIZE);

  function updateUrl(nextType, nextSort, nextPage) {
    const next = new URLSearchParams();
    if (nextType !== 'all') next.set('type', nextType);
    if (nextSort !== 'dex-asc') next.set('sort', nextSort);
    if (nextPage !== 1) next.set('page', String(nextPage));
    history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
  }
  function changeType(value) { setType(value); setPage(1); updateUrl(value, sort, 1); }
  function changeSort(value) { setSort(value); setPage(1); updateUrl(type, value, 1); }
  function changePage(value) { setPage(value); updateUrl(type, sort, value); requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }

  return <div className="homepage-shell">
    <section className="homepage-intro"><h1>{intro.heading}</h1><p className="homepage-intro-description">{intro.description}</p></section>
    <section className="homepage-tools" aria-labelledby="homepage-tools-heading"><h2 id="homepage-tools-heading">Pokémon Tools &amp; Resources</h2><div className="homepage-tool-grid">{tools.map(([title, path, description]) => <a className="homepage-tool-card" key={path} href={publicHref(path)}><span className="homepage-tool-card-title">{title}</span><span className="homepage-tool-card-description">{description}</span></a>)}</div></section>
    <section className="homepage-pokedex-heading" aria-labelledby="homepage-pokedex-heading"><h2 id="homepage-pokedex-heading">Explore the National Pokédex</h2><p>Browse Pokémon in National Pokédex order or use the filters to find a specific Pokémon.</p></section>
    {!pokemon.length ? <p className="homepage-loading">Booting up Pokédex...</p> : <>
      <div className="homepage-controls"><select aria-label="Filter by type" value={type} onChange={event => changeType(event.target.value)} style={{ backgroundColor: type === 'all' ? '#2c2c2c' : undefined }}>{allTypes.map(value => <option key={value} value={value}>{value === 'all' ? 'All Types' : titleCase(value)}</option>)}</select><select aria-label="Sort Pokémon" value={sort} onChange={event => changeSort(event.target.value)}><option value="dex-asc">Dex Number ↑</option><option value="dex-desc">Dex Number ↓</option><option value="name-asc">Name A-Z</option><option value="name-desc">Name Z-A</option></select></div>
      <div className="homepage-results">Showing {results.length ? start + 1 : 0} - {start + visible.length} of {results.length} Pokémon</div>
      <div className="homepage-pokemon-grid" ref={gridRef} style={{ gridTemplateColumns: desktop ? 'repeat(auto-fill, minmax(240px, 320px))' : 'repeat(auto-fill, minmax(140px, 140px))' }}>{visible.map(entry => <HomePokemonCard key={entry.name} pokemon={entry} desktop={desktop} />)}</div>
      {totalPages > 1 && <div className="homepage-pagination"><button type="button" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>Next</button></div>}
    </>}
  </div>;
}
