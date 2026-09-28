import { useEffect, useMemo, useRef, useState } from 'react';
import { allMoveLearners, formatHeight } from '../lib/moveLearnerTools.js';

const clampZoom = value => Math.min(4, Math.max(.08, value));
const visualHeight = pokemon => Number(pokemon.height) * Number(pokemon.correctionFactor ?? 1);

function spriteSizing(bounds, visibleHeightPx) {
  if (bounds?.visibleBounds?.height && bounds?.height) {
    const scale = visibleHeightPx / bounds.visibleBounds.height;
    return {
      renderedHeight: bounds.height * scale,
      floorOffset: (bounds.transparentPadding?.bottom ?? 0) * scale,
      stageWidth: Math.max(96, (bounds.visibleBounds.width ?? 80) * scale + 24)
    };
  }
  return { renderedHeight: visibleHeightPx * 1.2, floorOffset: 0, stageWidth: 110 };
}

export default function MoveLearnerSizeChart({ payloadUrl, factsUrl, moveName }) {
  const [data, setData] = useState(null);
  const [zoom, setZoom] = useState(null);
  const scrollRef = useRef(null);
  useEffect(() => {
    let active = true;
    Promise.all([fetch(payloadUrl), fetch(factsUrl)])
      .then(async ([payload, facts]) => {
        if (!payload.ok || !facts.ok) throw new Error('Size chart data unavailable');
        const result = { payload: await payload.json(), facts: await facts.json() };
        if (active) setData(result);
      }).catch(() => { if (active) setData({ error: true }); });
    return () => { active = false; };
  }, [payloadUrl, factsUrl]);

  const pokemon = useMemo(() => data?.payload ? allMoveLearners(data.payload.groupsByVersion, data.facts)
    .filter(item => Number.isFinite(Number(item.height)) && Number(item.height) > 0)
    .sort((a, b) => visualHeight(b) - visualHeight(a) || Number(b.height) - Number(a.height) || Number(a.id) - Number(b.id) || a.name.localeCompare(b.name)) : [], [data]);

  if (!data) return <section className="move-size-chart-original"><h2>{moveName} Learners by Size</h2><p>Loading size chart...</p></section>;
  if (data.error || !pokemon.length) return null;

  const chartHeight = 320, labelHeight = 54, imageHeight = chartHeight - labelHeight;
  const tallest = Math.max(...pokemon.map(visualHeight), 1);
  const shortest = Math.min(...pokemon.map(visualHeight).filter(value => value > 0));
  const basePixels = 44 / shortest;
  const fittedZoom = clampZoom(260 / tallest / basePixels);
  const activeZoom = zoom ?? fittedZoom;
  const pixelsPerUnit = basePixels * activeZoom;

  return <section className="move-size-chart-original" aria-labelledby="move-size-chart-heading">
    <h2 id="move-size-chart-heading">{moveName} Learners by Size</h2>
    <p>Largest Pokémon that can learn this move are on the left. Smallest Pokémon are on the right.</p>
    <div className="move-size-controls" aria-label="Size chart zoom controls">
      <button type="button" onClick={() => setZoom(clampZoom(activeZoom / 1.25))}>Zoom out</button>
      <button type="button" onClick={() => setZoom(clampZoom(activeZoom * 1.25))}>Zoom in</button>
      <button type="button" onClick={() => setZoom(null)}>Reset</button>
      <span>One true scale at current zoom</span>
    </div>
    <div className="move-size-scroll-original" ref={scrollRef}>
      <div className="move-size-track-original" style={{ height: `${chartHeight}px` }}>
        {pokemon.map(item => {
          const sizing = spriteSizing(item.bounds, visualHeight(item) * pixelsPerUnit);
          return <a key={item.name} href={`/pokemon/${item.name}`} className="move-size-entry" style={{ height: `${chartHeight}px`, width: `${sizing.stageWidth}px` }} title={`${item.displayName}: ${formatHeight(item.height)}`}>
            <div className="move-size-image" style={{ flexBasis: `${imageHeight}px`, height: `${imageHeight}px` }}>
              {item.sprite && <img src={item.sprite} alt={item.displayName} loading="lazy" decoding="async" style={{ height: `${sizing.renderedHeight}px`, transform: `translateY(${sizing.floorOffset}px)` }} />}
            </div>
            <strong>{item.displayName}</strong><span>{formatHeight(item.height)}</span>
          </a>;
        })}
      </div>
    </div>
  </section>;
}
