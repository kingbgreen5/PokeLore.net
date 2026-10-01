import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { routes, POKEMON_SLUG_SET, repositoryRoot, pokemonPath } from './routes.js';
import { resolvePokeloreAnalysis } from '../../../src/utils/pokeloreAnalysis.js';
import { formatPokemonDisplayName, getRegionalFormKey } from '../../../src/utils/pokemonNames.js';
import { getDefensiveMatchupGroups, formatTypeName, POKEMON_TYPES } from '../../../src/utils/typeEffectiveness.js';
import { buildEvolutionDisplayModel, getEvolutionSummaryText } from '../../../src/utils/evolutionDisplay.js';
import { getLearnsetCandidateIds, hasLearnsetMoves, getLatestLevelUpLearnsetPreview, getLearnsetMovesForVersion, groupLearnsetMovesByMethod } from '../../../src/utils/learnsetDisplay.js';
import { linkifyPokeloreText, getPokeloreLinePokemonLabels } from '../../../src/utils/pokeloreTextLinks.js';
import { getPokemonDetailSources } from '../../../src/utils/pokemonSprites.js';
import { getFormSemantics, getEvolutionIdentity, getEvolutionClarification } from './formSemantics.js';
import { getPokemonNavigationContext } from './pokemonNavigation.js';

const jsonCache = new Map();
export function readData(name, optional = false) {
  const path = join(repositoryRoot, 'public/data', name);
  if (optional && !existsSync(path)) return null;
  if (!jsonCache.has(path)) jsonCache.set(path, JSON.parse(readFileSync(path, 'utf8')));
  return jsonCache.get(path);
}
const read = readData;
function normalizeEvolutionText(value) {
  return String(value ?? '')
    .replace(/(friendship|affection)(?=during|knowing)/g, '$1 ')
    .replace(/(\d)(?=Attack|Defense)/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}
function normalizeEvolutionModel(model) {
  model.methodParts = model.methodParts.map(part => ({
    ...part,
    text: normalizeEvolutionText(part.text)
  }));
  model.methodText = normalizeEvolutionText(model.methodText);
  if (!model.methodText && model.node.trigger) {
    model.methodText = formatTypeName(model.node.trigger);
    model.methodParts = [{ text: model.methodText }];
  }
  model.children.forEach(normalizeEvolutionModel);
  return model;
}
function requireData(condition, slug, field) {
  if (!condition) throw new Error(`[${slug}] Missing or invalid required data: ${field}`);
}
const cache = new Map();
export function loadPokemon(slug) {
  if (cache.has(slug)) return cache.get(slug);
  requireData(POKEMON_SLUG_SET.has(slug), slug, 'canonical route registry');
  pokemonPath(slug);
  const sourcePokemon = read(`pokemonData/${routes.byName[slug]}.json`);
  const routedVariety = sourcePokemon.varieties?.find(variety => variety.name === slug);
  requireData(sourcePokemon.id === routes.byName[slug] && routedVariety, slug, 'registry/data identity');
  const sharedIdVariety = sourcePokemon.name !== slug;
  const p = sharedIdVariety ? {
    ...sourcePokemon,
    name: slug,
    isDefaultForm: Boolean(routedVariety.isDefault),
    sprite: routedVariety.spriteFallback ?? routedVariety.sprite,
    types: routedVariety.types ?? sourcePokemon.types
  } : sourcePokemon;
  const name = formatPokemonDisplayName(p);
  const formSemantics = getFormSemantics(slug, p);
  requireData(formSemantics, slug, 'resolved form semantics');
  for (const key of ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed']) {
    requireData(Number.isFinite(p.stats?.[key]) && p.stats[key] > 0, slug, `stats.${key}`);
  }
  requireData(p.types?.length && p.types.every(t => POKEMON_TYPES.includes(t)), slug, 'types');
  requireData(Array.isArray(p.abilities) && p.genus && p.height > 0, slug, 'basic facts');
  const abilityData = read('abilities.json');
  const abilities = p.abilities.map(a => {
    const key = a.name.toLowerCase().replaceAll(' ', '-');
    const description = abilityData[key]?.shortEffect;
    requireData(typeof description === 'string' && description.trim(), slug, `ability ${key} in-game description`);
    return { ...a, slug: key, description };
  });
  const resolvedAnalysis = resolvePokeloreAnalysis(read('PokeloreAnalysis.json'), p) ?? {};
  const sharedSpeciesAnalysis = Boolean(resolvedAnalysis.description) && !p.isDefaultForm && !resolvedAnalysis.form;
  const analysisSourceName = resolvedAnalysis.name;
  const analysis = sharedSpeciesAnalysis ? {} : resolvedAnalysis;
  const analysisKeys = ['description', 'playthrough', 'competitive', 'nuzlocke', 'biologyAndBehavior'];
  const missingAnalysis = analysisKeys.filter(key => typeof analysis[key] !== 'string' || !analysis[key].trim());
  const warnings = [];
  if (!abilities.length) warnings.push('Ability data is unavailable for this routed form; no base-form ability was inherited.');
  if (!(p.weight > 0)) warnings.push('Weight is unavailable for this routed form and is omitted.');
  if (!Number.isFinite(p.baseExperience)) warnings.push('Base experience is unavailable for this routed form and is omitted.');
  if (missingAnalysis.length) warnings.push(`Optional analysis omitted: ${missingAnalysis.join(', ')}.`);
  if (sharedSpeciesAnalysis) warnings.push('Species-level analysis was not reused because form-specific inheritance is not explicit.');
  const chain = read(`evolutionChains/${p.evolutionChainId}.json`);
  requireData(chain?.root?.pokemon, slug, 'evolution chain');
  const evolutionIdentity = getEvolutionIdentity(formSemantics, p);
  const evolutionOptions = {
    currentPokemonName: evolutionIdentity.currentPokemonName,
    activeFormKey: evolutionIdentity.activeFormKey ?? getRegionalFormKey(p),
    evolutionMethodOverrides: read('evolutionMethodOverrides.json')
  };
  const evolution = normalizeEvolutionModel(buildEvolutionDisplayModel(chain.root, evolutionOptions));
  function validateEvolution(model) {
    pokemonPath(model.pokemon.name);
    model.children.forEach(validateEvolution);
  }
  validateEvolution(evolution);
  let learnset;
  let learnsetSourceId;
  for (const id of getLearnsetCandidateIds(p)) {
    learnset = read(`pokemonLearnsets/${id}.json`, true);
    if (hasLearnsetMoves(learnset)) {
      learnsetSourceId = id;
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
  const staticLearnsetGroups = preview.versionGroup === 'scarlet-violet'
    ? groupLearnsetMovesByMethod(getLearnsetMovesForVersion(learnset, preview.versionGroup))
    : null;
  const encounters = read(`pokemonEncounters/${p.id}.json`, true);
  if (!encounters?.locations?.length) warnings.push('No optional encounter locations available; this is not proof the Pokémon is unobtainable.');
  for (const location of encounters?.locations ?? []) {
    requireData(existsSync(join(repositoryRoot, 'public/data/locations', `${location.location.name}.json`)), slug, 'encounter location route');
  }
  const defaultVariety = p.varieties?.find(variety => variety.isDefault) ?? p;
  const manifestArtwork = sharedIdVariety ? null : read('pokemonArtworkManifest.json').artwork?.[p.id]?.detail;
  const localArtwork = [manifestArtwork, ...getPokemonDetailSources(p)]
    .find(source => source?.startsWith('/') && existsSync(join(repositoryRoot, 'public', source)));
  const artwork = localArtwork && existsSync(join(repositoryRoot, 'public', localArtwork))
    ? localArtwork
    : p.sprite ?? defaultVariety.sprite;
  requireData(typeof artwork === 'string' && (artwork.startsWith('/') || /^https:\/\//.test(artwork)), slug, 'artwork or sprite fallback');
  if (!localArtwork) warnings.push(p.sprite
    ? 'Local detail artwork is unavailable; using the routed form sprite fallback.'
    : 'Routed form artwork is unavailable; using the explicitly marked default-variety artwork as a labeled fallback.');
  const total = Object.values(p.stats).reduce((a, b) => a + b, 0);
  const summary = sharedSpeciesAnalysis || !analysis.description
    ? `${name} is ${p.types.map(formatTypeName).join('/')} type, the ${p.genus}, with a base stat total of ${total}.`
    : analysis.description;
  const targets = read('pokeloreLinkTargets.json');
  const linkedText = text => linkifyPokeloreText(text, targets, p, {
    excludedPokemonLabels: getPokeloreLinePokemonLabels(analysis)
  });
  const nationalDexNumber = p.varieties?.find(variety => variety.isDefault)?.id ?? p.id;
  const baseDisplayName = formatPokemonDisplayName(defaultVariety);
  const spriteBound = read('pokemonSpriteBounds.json').sprites?.[p.id];
  const navigation = getPokemonNavigationContext(slug);
  const result = { p, name, abilities, analysis, analysisSourceName, sharedSpeciesAnalysis, warnings, evolution,
    evolutionSummary: normalizeEvolutionText(getEvolutionSummaryText(chain.root, evolutionOptions)),
    evolutionClarification: getEvolutionClarification(formSemantics, name, baseDisplayName),
    formSemantics, preview, staticLearnsetGroups, learnset, learnsetSourceId,
    learnsetPayloadUrl: `/data/learnsets/${slug}.json`,
    moves: Object.fromEntries([...new Set(learnset.moves.map(m => m.move))].map(key => {
      const detail = read(`moves/${key}.json`, true);
      const pastTypes = (detail?.pastValues ?? [])
        .filter(entry => entry.type)
        .map(({ type, versionGroup }) => ({ type, versionGroup }));
      return [key, { ...moves[key], pastTypes }];
    })),
    encounters, hasEncounters: Boolean(encounters?.locations?.length), artwork, total, summary,
    nationalDexNumber, matchups: getDefensiveMatchupGroups(p.types), linkedText,
    hasSizeComparison: Boolean(spriteBound), spriteBounds: { [p.id]: spriteBound },
    corrections: { sprites: { [p.id]: read('pokemonSpriteCorrections.json').sprites?.[p.id] }, comparisonCharacters: read('pokemonSpriteCorrections.json').comparisonCharacters ?? {} },
    navigation,
    heldItems: read(`pokemonHeldItems/${p.id}.json`, true),
    oaksNote: read(`oaksNotes/pokemon/${p.name}.json`, true), goNote: read(`pokemonGo/pokemon/${p.name}.json`, true)
  };
  for (const warning of warnings) console.warn(`[${slug}] ${warning}`);
  cache.set(slug, result);
  return result;
}
