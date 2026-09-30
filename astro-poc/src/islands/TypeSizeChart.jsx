import { useEffect, useMemo, useState } from 'react';

const clampZoom = value => Math.min(4, Math.max(.08, value));
const formatHeight = height => { const inches = Math.round(Number(height) / 10 * 39.3701); return `${Math.floor(inches / 12)}' ${inches % 12}"`; };
const visualHeight = (pokemon, corrections) => Number(pokemon.height) * Number(corrections[pokemon.id]?.factor ?? corrections[pokemon.id] ?? 1);
function sizing(bounds, visibleHeight) {
  if (bounds?.visibleBounds?.height && bounds?.height) { const scale = visibleHeight / bounds.visibleBounds.height; return { height: bounds.height * scale, bottom: (bounds.transparentPadding?.bottom ?? 0) * scale, width: Math.max(96, (bounds.visibleBounds.width ?? 80) * scale + 24) }; }
  return { height: visibleHeight * 1.2, bottom: 0, width: 110 };
}
export default function TypeSizeChart({ pokemon, typeName }) {
  const [zoom, setZoom] = useState(null); const [bounds, setBounds] = useState({}); const [corrections, setCorrections] = useState({});
  useEffect(() => { Promise.all([fetch('/data/pokemonSpriteBounds.json'), fetch('/data/pokemonSpriteCorrections.json')]).then(async ([a,b]) => { setBounds((a.ok ? await a.json() : {}).sprites ?? {}); setCorrections((b.ok ? await b.json() : {}).sprites ?? {}); }).catch(() => {}); }, []);
  const rows = useMemo(() => [...pokemon].filter(p => Number(p.height)>0).sort((a,b) => visualHeight(b, corrections)-visualHeight(a, corrections) || Number(b.height)-Number(a.height) || a.id-b.id), [pokemon, corrections]);
  if (!rows.length) return null;
  const tallest = Math.max(...rows.map(p => visualHeight(p, corrections)), 1), shortest = Math.min(...rows.map(p => visualHeight(p, corrections)).filter(Boolean));
  const activeZoom = zoom ?? clampZoom(260 / tallest / (44 / shortest)), px = (44 / shortest) * activeZoom;
  return <section className="type-size-chart" aria-labelledby="type-size-heading"><h2 id="type-size-heading">{typeName} Pokémon by Size</h2><p>Largest Pokémon are on the left. Smallest Pokémon are on the right.</p><div className="type-size-controls"><button type="button" onClick={() => setZoom(clampZoom(activeZoom / 1.25))}>Zoom out</button><button type="button" onClick={() => setZoom(clampZoom(activeZoom * 1.25))}>Zoom in</button><button type="button" onClick={() => setZoom(null)}>Reset</button><span>One true scale at current zoom</span></div><div className="type-size-scroll"><div className="type-size-track">{rows.map(p => { const s=sizing(bounds[p.id], visualHeight(p, corrections)*px); return <a href={`/pokemon/${p.slug}`} className="type-size-entry" style={{width:s.width}} key={p.slug}><div className="type-size-image">{p.sprite && <img src={p.sprite} alt={p.displayName} loading="lazy" decoding="async" style={{height:s.height,transform:`translateY(${s.bottom}px)`}} />}</div><strong>{p.displayName}</strong><span>{formatHeight(p.height)}</span></a>; })}</div></div></section>;
}
