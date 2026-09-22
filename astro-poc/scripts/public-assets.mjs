import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createSearchRecords } from '../src/lib/searchRecords.js';
import { loadPokemon, readData } from '../src/lib/pokemonData.js';
import { POC_SLUGS, repositoryRoot } from '../src/lib/routes.js';

// One allowlist for development serving and production copying.
export function publicAssets() {
  const paths = new Set(['/images/etsy/Viridian Forest Two Gildans.jpg']);
  function addPokemon(p) {
    const entries = readData('pokemonArtworkManifest.json').artwork?.[p.id];
    if (entries) Object.values(entries).forEach(src => paths.add(src));
  }
  function addEvolution(model) { addPokemon(model.pokemon); model.children.forEach(addEvolution); }
  for (const slug of POC_SLUGS) {
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

export function copyPublicAssets(output) {
  for (const [asset, source] of publicAssets()) {
    const target = join(output, asset);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
}
