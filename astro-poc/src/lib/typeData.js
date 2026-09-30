import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import typeChart from '../../../src/constants/Types.js';
import typeColors from '../../../src/constants/typeColors.js';
import { formatPokemonDisplayName } from '../../../src/utils/pokemonNames.js';
import { formatTypeName, POKEMON_TYPES } from '../../../src/utils/typeEffectiveness.js';
import { repositoryRoot, routes } from './routes.js';

export const TYPE_SLUGS = Object.freeze(Object.keys(typeColors));
export const TYPE_STRESS_SLUGS = Object.freeze(['normal', 'fire', 'water', 'electric', 'psychic', 'ghost', 'dragon', 'steel', 'fairy', 'ground']);
const dataPath = name => join(repositoryRoot, 'public', 'data', name);
const read = name => JSON.parse(readFileSync(dataPath(name), 'utf8'));
const moveIndex = read('movesIndex.json');
const typeAbilities = read('typeAbilities.json');
const pokemonCache = new Map();

function matchupGroups(type, offensive) {
  const values = POKEMON_TYPES.map(other => ({ type: other, multiplier: offensive ? (typeChart[type]?.[other] ?? 1) : (typeChart[other]?.[type] ?? 1) }));
  return {
    strong: values.filter(row => row.multiplier === 2),
    resisted: values.filter(row => row.multiplier === 0.5),
    immune: values.filter(row => row.multiplier === 0)
  };
}

function canonicalPokemon(slug) {
  if (pokemonCache.has(slug)) return pokemonCache.get(slug);
  const id = routes.byName[slug];
  const source = read(`pokemonData/${id}.json`);
  const variety = source.varieties?.find(row => row.name === slug);
  if (!variety) return null;
  const pokemon = { ...source, ...variety, name: slug, id, types: variety.types ?? source.types, stats: source.stats };
  const result = {
    slug,
    displayName: formatPokemonDisplayName(pokemon),
    dexNumber: source.varieties?.find(row => row.isDefault)?.id ?? source.id,
    sprite: variety.spriteFallback ?? variety.sprite ?? source.sprite,
    height: pokemon.height,
    types: pokemon.types,
    stats: pokemon.stats,
    bst: Object.values(pokemon.stats ?? {}).reduce((sum, value) => sum + Number(value || 0), 0)
  };
  pokemonCache.set(slug, result);
  return result;
}

function sortPokemon(rows) { return rows.sort((a, b) => a.dexNumber - b.dexNumber || a.slug.localeCompare(b.slug)); }

export function typeModel(slug) {
  if (!TYPE_SLUGS.includes(slug)) return null;
  const name = formatTypeName(slug);
  const pokemon = sortPokemon(Object.keys(routes.byName).map(canonicalPokemon).filter(row => row?.types?.includes(slug)));
  const moves = moveIndex.filter(move => move.type === slug).map(move => ({ slug: move.name, name: move.displayName ?? formatTypeName(move.name), category: move.category, power: move.power, accuracy: move.accuracy, pp: move.pp, generation: move.generation }));
  const abilities = (typeAbilities[slug] ?? []).map(ability => ({ slug: ability.name, name: ability.displayName ?? formatTypeName(ability.name), shortEffect: ability.shortEffect ?? '', pokemonCount: ability.pokemonCount ?? 0 }));
  const canonical = `https://pokelore.net/type/${slug}`;
  const description = `Explore ${name}-type Pokémon, moves, strengths, weaknesses, and type matchups.`;
  const structuredData = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'WebPage', '@id': canonical, url: canonical, name: `${name} Type Pokémon`, description },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'PokéLore', item: 'https://pokelore.net/' },
      { '@type': 'ListItem', position: 2, name: 'Types', item: 'https://pokelore.net/types' },
      { '@type': 'ListItem', position: 3, name: `${name} Type`, item: canonical }
    ] }
  ] };
  return { slug, name, summary: `Learn which Pokémon, moves, and abilities belong to the ${name} type, plus its offensive strengths and defensive weaknesses.`, pokemon, moves, abilities, offense: matchupGroups(slug, true), defense: matchupGroups(slug, false), canonical, seo: { title: `${name} Type Pokémon, Moves, Strengths & Weaknesses | PokéLore`, description, canonical, robots: 'noindex', structuredData } };
}

export function allTypeModels() { return TYPE_SLUGS.map(typeModel); }
