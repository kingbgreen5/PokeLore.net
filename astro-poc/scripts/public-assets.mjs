import { mkdirSync, copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createSearchRecords } from '../src/lib/searchRecords.js';
import { loadPokemon, readData } from '../src/lib/pokemonData.js';
import { POKEMON_SLUGS, repositoryRoot } from '../src/lib/routes.js';
import { pokemonNavigationJson } from '../src/lib/pokemonNavigation.js';
import { getPokemonCardSources, getPokemonDetailSources, getPokemonSizeComparisonSources } from '../../src/utils/pokemonSprites.js';

// One allowlist for development serving and production copying.
export function publicAssets() {
  const paths = new Set(['/images/etsy/Viridian Forest Two Gildans.jpg']);
  function addPokemon(p) {
    const entries = readData('pokemonArtworkManifest.json').artwork?.[p.id];
    if (entries) Object.values(entries).forEach(src => paths.add(src));
    for (const src of [...getPokemonCardSources(p), ...getPokemonDetailSources(p), ...getPokemonSizeComparisonSources(p)]) {
      if (src?.startsWith('/') && existsSync(join(repositoryRoot, 'public', src))) paths.add(src);
    }
  }
  function addEvolution(model) { addPokemon(model.pokemon); model.children.forEach(addEvolution); }
  for (const slug of POKEMON_SLUGS) {
    const data = loadPokemon(slug);
    addPokemon(data.p);
    addEvolution(data.evolution);
    data.p.varieties?.forEach(addPokemon);
  }
  return new Map([...paths].map(asset => {
    const source = join(repositoryRoot, 'public', asset);
    if (!existsSync(source)) throw new Error(`Missing parity asset: ${asset}`);
    return [asset, source];
  }));
}

export function searchJson() {
  return JSON.stringify(createSearchRecords({ pokemonIndex: readData('pokemonIndex.json'),
    moves: Object.fromEntries(readData('movesIndex.json').map(m => [m.name, m])),
    abilities: readData('abilities.json'), items: readData('itemsIndex.json'),
    locations: readData('locationsIndex.json'), tmMaterialDetails: readData('tmMaterialDetails.json') }));
}

export function learnsetJson(slug) {
  const data = loadPokemon(slug);
  return JSON.stringify({ pokemonData: data.learnset, movesData: data.moves });
}

export function navigationJson() {
  return pokemonNavigationJson();
}

export function copyLearnsetPayloads(output) {
  const directory = join(output, 'data', 'learnsets');
  mkdirSync(directory, { recursive: true });
  for (const slug of POKEMON_SLUGS) writeFileSync(join(directory, `${slug}.json`), learnsetJson(slug));
}

export function writeNavigationPayload(output) {
  const directory = join(output, 'data', 'navigation');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'pokemon-navigation.json'), navigationJson());
}

export function copyPublicAssets(output) {
  for (const [asset, source] of publicAssets()) {
    const target = join(output, asset);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
}
