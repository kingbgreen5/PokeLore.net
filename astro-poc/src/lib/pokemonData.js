import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { routes, POC_SLUGS, repositoryRoot, pokemonPath } from './routes.js';
import { resolvePokeloreAnalysis } from '../../../src/utils/pokeloreAnalysis.js';
import { formatPokemonDisplayName, getRegionalFormKey } from '../../../src/utils/pokemonNames.js';
import { getDefensiveMatchupGroups, formatTypeName, POKEMON_TYPES } from '../../../src/utils/typeEffectiveness.js';
import { buildEvolutionDisplayModel, getEvolutionSummaryText } from '../../../src/utils/evolutionDisplay.js';
import { getLearnsetCandidateIds, hasLearnsetMoves, getLatestLevelUpLearnsetPreview } from '../../../src/utils/learnsetDisplay.js';
import { linkifyPokeloreText, getPokeloreLinePokemonLabels } from '../../../src/utils/pokeloreTextLinks.js';

const jsonCache = new Map();
export function readData(name, optional = false) {
  const path = join(repositoryRoot, 'public/data', name);
  if (optional && !existsSync(path)) return null;
  if (!jsonCache.has(path)) jsonCache.set(path, JSON.parse(readFileSync(path, 'utf8')));
  return jsonCache.get(path);
}
const read = readData;
function requireData(condition, slug, field) {
  if (!condition) throw new Error(`[${slug}] Missing or invalid required data: ${field}`);
}
const cache = new Map();
export function loadPokemon(slug) {
  if (cache.has(slug)) return cache.get(slug);
  requireData(POC_SLUGS.includes(slug), slug, 'POC route allowlist');
  pokemonPath(slug);
  const p = read(`pokemonData/${routes.byName[slug]}.json`);
  requireData(p.name === slug && p.id === routes.byName[slug], slug, 'registry/data identity');
  const name = formatPokemonDisplayName(p);
  for (const key of ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']) {
    requireData(Number.isFinite(p.stats?.[key]) && p.stats[key] > 0, slug, `stats.${key}`);
  }
  requireData(p.types?.length && p.types.every(t => POKEMON_TYPES.includes(t)), slug, 'types');
  requireData(p.abilities?.length && p.genus && p.height > 0 && p.weight > 0, slug, 'basic facts');
  const abilityData = read('abilities.json');
  const abilities = p.abilities.map(a => {
    const key = a.name.toLowerCase().replaceAll(' ', '-');
    const description = abilityData[key]?.shortEffect;
    requireData(typeof description === 'string' && description.trim(), slug, `ability ${key} in-game description`);
    return { ...a, slug: key, description };
  });
  const analysis = resolvePokeloreAnalysis(read('PokeloreAnalysis.json'), p);
  for (const key of ['description', 'playthrough', 'competitive', 'nuzlocke', 'biologyAndBehavior']) {
    requireData(typeof analysis?.[key] === 'string' && analysis[key].trim(), slug, `analysis.${key}`);
  }
  const warnings = [];
  const sharedSpeciesAnalysis = !p.isDefaultForm && !analysis.form;
  if (sharedSpeciesAnalysis) warnings.push('Analysis/biology resolver supplies species prose, not form-specific prose; explicitly labeled on page.');
  const chain = read(`evolutionChains/${p.evolutionChainId}.json`);
  requireData(chain?.root?.pokemon, slug, 'evolution chain');
  const evolutionOptions = {
    currentPokemonName: p.name,
    activeFormKey: getRegionalFormKey(p),
    evolutionMethodOverrides: read('evolutionMethodOverrides.json')
  };
  const evolution = buildEvolutionDisplayModel(chain.root, evolutionOptions);
  function validateEvolution(model) {
    pokemonPath(model.pokemon.name);
    model.children.forEach(validateEvolution);
  }
  validateEvolution(evolution);
  let learnset;
  for (const id of getLearnsetCandidateIds(p)) {
    learnset = read(`pokemonLearnsets/${id}.json`, true);
    if (hasLearnsetMoves(learnset)) {
      if (id !== p.id) warnings.push(`Learnset uses existing species fallback ${id}.`);
      break;
    }
  }
  requireData(hasLearnsetMoves(learnset), slug, 'learnset');
  const moveIndex = read('movesIndex.json');
  const moves = Array.isArray(moveIndex) ? Object.fromEntries(moveIndex.map(m => [m.name, m])) : moveIndex;
  const preview = getLatestLevelUpLearnsetPreview(learnset, moves, { pokemonId: p.id, pokemon: p.name });
  requireData(preview.versionGroup && preview.rows.length, slug, 'latest level-up learnset');
  preview.rows.forEach(row => requireData(moves[row.move], slug, `move ${row.move}`));
  const encounters = read(`pokemonEncounters/${p.id}.json`, true);
  if (!encounters?.locations?.length) warnings.push('No optional encounter locations available; this is not proof the Pokémon is unobtainable.');
  for (const location of encounters?.locations ?? []) {
    requireData(existsSync(join(repositoryRoot, 'public/data/locations', `${location.location.name}.json`)), slug, 'encounter location route');
  }
  const artwork = read('pokemonArtworkManifest.json').artwork?.[p.id]?.detail;
  requireData(artwork && existsSync(join(repositoryRoot, 'public', artwork)), slug, 'local artwork');
  const total = Object.values(p.stats).reduce((a, b) => a + b, 0);
  const summary = sharedSpeciesAnalysis
    ? `${name} is ${p.types.map(formatTypeName).join('/')} type, the ${p.genus}, with a base stat total of ${total}.`
    : analysis.description;
  const targets = read('pokeloreLinkTargets.json');
  const linkedText = text => linkifyPokeloreText(text, targets, p, {
    excludedPokemonLabels: getPokeloreLinePokemonLabels(analysis)
  });
  const result = { p, name, abilities, analysis, sharedSpeciesAnalysis, warnings, evolution,
    evolutionSummary: getEvolutionSummaryText(chain.root, evolutionOptions),
    preview, learnset,
    moves: Object.fromEntries([...new Set(learnset.moves.map(m => m.move))].map(key => {
      const detail = read(`moves/${key}.json`, true);
      const pastTypes = (detail?.pastValues ?? [])
        .filter(entry => entry.type)
        .map(({ type, versionGroup }) => ({ type, versionGroup }));
      return [key, { ...moves[key], pastTypes }];
    })),
    encounters, artwork, total, summary, matchups: getDefensiveMatchupGroups(p.types), linkedText,
    spriteBounds: { [p.id]: read('pokemonSpriteBounds.json').sprites?.[p.id] },
    corrections: { sprites: { [p.id]: read('pokemonSpriteCorrections.json').sprites?.[p.id] }, comparisonCharacters: read('pokemonSpriteCorrections.json').comparisonCharacters ?? {} },
    navigation: read('pokemonIndex.json').filter(entry => routes.byName[entry.name]).map(({id,name,species,sprite,types}) => ({id,name,species,sprite,types})).sort((a,b)=>a.id-b.id),
    heldItems: read(`pokemonHeldItems/${p.id}.json`, true),
    oaksNote: read(`oaksNotes/pokemon/${p.name}.json`, true), goNote: read(`pokemonGo/pokemon/${p.name}.json`, true)
  };
  for (const warning of warnings) console.warn(`[${slug}] ${warning}`);
  cache.set(slug, result);
  return result;
}
