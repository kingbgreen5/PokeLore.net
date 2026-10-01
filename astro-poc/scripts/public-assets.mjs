import { mkdirSync, copyFileSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createSearchRecords } from '../src/lib/searchRecords.js';
import { loadPokemon, readData } from '../src/lib/pokemonData.js';
import { POKEMON_SLUGS, repositoryRoot } from '../src/lib/routes.js';
import { pokemonNavigationJson } from '../src/lib/pokemonNavigation.js';
import { MOVE_SLUGS, loadMove, moveLearnerPayload } from '../src/lib/moveData.js';
import { moveLearnerFactsJson } from '../src/lib/moveLearnerFacts.js';
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

// Keep the homepage's full Pokédex browser on the same generated data source as
// production, in both `astro dev` and the static deployment.
export function pokemonIndexJson() {
  return JSON.stringify(readData('pokemonIndex.json'));
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

export function moveLearnerJson(slug) {
  return moveLearnerPayload(slug);
}

export function learnerFactsJson() { return moveLearnerFactsJson(); }

export function writeLearnerFacts(output) {
  const directory = join(output, 'data', 'pokemon');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'learner-facts.json'), learnerFactsJson());
}

export function copyMoveLearnerPayloads(output) {
  const directory = join(output, 'data', 'move-learners');
  mkdirSync(directory, { recursive: true });
  for (const slug of MOVE_SLUGS) {
    if (loadMove(slug).versions.length > 0) writeFileSync(join(directory, `${slug}.json`), moveLearnerJson(slug));
  }
}

export function copyPublicAssets(output) {
  for (const [asset, source] of publicAssets()) {
    const target = join(output, asset);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
}

// Coverage tools load one game file on demand. Keep the files as static assets
// instead of serializing any portion of the corpus into HTML or island props.
export function copyTeamCoveragePayloads(output) {
  const sourceDirectory = join(repositoryRoot, 'public', 'data', 'teamCoverage');
  const targetDirectory = join(output, 'data', 'teamCoverage');
  mkdirSync(targetDirectory, { recursive: true });
  for (const file of readdirSync(sourceDirectory)) {
    if (!file.endsWith('.json')) continue;
    copyFileSync(join(sourceDirectory, file), join(targetDirectory, file));
  }
}

export function writePokemonIndexPayload(output) {
  const directory = join(output, 'data');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'pokemonIndex.json'), pokemonIndexJson());
}
