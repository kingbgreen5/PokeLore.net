import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { POKEMON_SLUGS, repositoryRoot, routes } from './routes.js';
import { getPokemonCardSources } from '../../../src/utils/pokemonSprites.js';

let navigationCache;

function sourceRecord(id) {
  return JSON.parse(readFileSync(join(repositoryRoot, 'public', 'data', 'pokemonData', `${id}.json`), 'utf8'));
}

export function getPokemonNavigation() {
  if (navigationCache) return navigationCache;

  const records = new Map();
  navigationCache = POKEMON_SLUGS.map(name => {
    const sourceId = routes.byName[name];
    if (!records.has(sourceId)) records.set(sourceId, sourceRecord(sourceId));
    const source = records.get(sourceId);
    const variety = source.varieties?.find(entry => entry.name === name);
    if (!variety) throw new Error(`[${name}] Missing canonical variety for navigation`);
    const entry = {
      id: sourceId,
      name,
      sprite: variety.spriteFallback ?? variety.sprite ?? source.sprite
    };
    const localSprite = getPokemonCardSources(entry)
      .find(path => path?.startsWith('/') && existsSync(join(repositoryRoot, 'public', path)));
    if (localSprite) entry.sprite = localSprite;
    return entry;
  }).sort((a, b) => a.id - b.id || a.name.localeCompare(b.name));

  if (new Set(navigationCache.map(entry => entry.name)).size !== POKEMON_SLUGS.length) {
    throw new Error('Canonical Pokémon navigation contains duplicate or missing names');
  }
  return navigationCache;
}

export function getPokemonNavigationContext(name, windowSize = 9) {
  const navigation = getPokemonNavigation();
  const currentIndex = navigation.findIndex(entry => entry.name === name);
  if (currentIndex < 0) throw new Error(`[${name}] Missing from canonical Pokémon navigation`);
  const size = Math.min(windowSize, navigation.length);
  const start = Math.max(0, Math.min(currentIndex - Math.floor(size / 2), navigation.length - size));
  return {
    currentIndex,
    initialWindow: navigation.slice(start, start + size),
    previous: navigation[currentIndex - 1] ?? null,
    next: navigation[currentIndex + 1] ?? null,
    total: navigation.length
  };
}

export function pokemonNavigationJson() {
  return JSON.stringify(getPokemonNavigation());
}
