import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getPokemonCardSources, getPokemonSizeComparisonSources } from '../../../src/utils/pokemonSprites.js';
import { POKEMON_SLUGS, repositoryRoot } from './routes.js';
import { loadPokemon } from './pokemonData.js';

let cache;

export function moveLearnerFacts() {
  if (cache) return cache;
  cache = Object.fromEntries(POKEMON_SLUGS.map(slug => {
    const { p, name, total, artwork, spriteBounds, corrections } = loadPokemon(slug);
    const localSprite = getPokemonSizeComparisonSources(p).find(source => source?.startsWith('/') && existsSync(join(repositoryRoot, 'public', source)));
    const cardSources = getPokemonCardSources(p);
    const cardSprite = cardSources.find(source => source?.startsWith('/') && existsSync(join(repositoryRoot, 'public', source)))
      ?? cardSources.find(source => /^https:\/\//.test(source));
    return [slug, {
      id: p.id,
      name: slug,
      displayName: name,
      sprite: localSprite ?? (artwork?.startsWith('/') ? artwork : null),
      cardSprite,
      types: p.types,
      height: Number.isFinite(p.height) && p.height > 0 ? p.height : null,
      weight: Number.isFinite(p.weight) && p.weight > 0 ? p.weight : null,
      bounds: spriteBounds?.[p.id] ?? null,
      correctionFactor: Number(corrections?.sprites?.[p.id]?.factor ?? corrections?.sprites?.[p.id] ?? 1) || 1,
      baseStatTotal: total,
      stats: p.stats
    }];
  }));
  return cache;
}

export function moveLearnerFactsJson() {
  return JSON.stringify(moveLearnerFacts());
}
