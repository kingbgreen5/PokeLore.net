import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getPokemonSizeComparisonSources } from '../../../src/utils/pokemonSprites.js';
import { POKEMON_SLUGS, repositoryRoot } from './routes.js';
import { loadPokemon } from './pokemonData.js';

let cache;

export function moveLearnerFacts() {
  if (cache) return cache;
  cache = Object.fromEntries(POKEMON_SLUGS.map(slug => {
    const { p, name, total, artwork } = loadPokemon(slug);
    const localSprite = getPokemonSizeComparisonSources(p).find(source => source?.startsWith('/') && existsSync(join(repositoryRoot, 'public', source)));
    return [slug, {
      id: p.id,
      name: slug,
      displayName: name,
      sprite: localSprite ?? (artwork?.startsWith('/') ? artwork : null),
      height: Number.isFinite(p.height) && p.height > 0 ? p.height : null,
      weight: Number.isFinite(p.weight) && p.weight > 0 ? p.weight : null,
      baseStatTotal: total,
      stats: p.stats
    }];
  }));
  return cache;
}

export function moveLearnerFactsJson() {
  return JSON.stringify(moveLearnerFacts());
}
