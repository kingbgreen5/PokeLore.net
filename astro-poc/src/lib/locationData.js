import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { POKEMON_SLUG_SET } from './routes.js';
import { ITEM_SLUG_SET } from './itemData.js';
import { MOVE_SLUG_SET } from './moveData.js';
import { sortVersions } from '../../../src/constants/versionOrder.js';

const root = resolve(process.cwd(), '..');
const dataDir = join(root, 'public', 'data');
const read = file => JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
const optional = file => existsSync(join(dataDir, file)) ? read(file) : null;
const source = read('locationsIndex.json');
export const LOCATION_SLUGS = Object.freeze(source.map(row => row.name).sort((a,b) => a.localeCompare(b)));
export const LOCATION_SLUG_SET = new Set(LOCATION_SLUGS);
export const LOCATION_REGISTRY = Object.freeze(source.map(row => ({ slug: row.name, id: row.id, displayName: row.displayName, region: row.regionDisplayName ?? row.region ?? null })));
export const LOCATION_STRESS_SLUGS = Object.freeze(['great-marsh','friend-safari','mt-coronet','mt-silver','cerulean-cave','poke-pelago','seafoam-islands','reversal-mountain','johto-safari-zone','pokemon-mansion','celadon-city','kanto-route-2','ultra-space-wilds','lost-cave','pokeathlon-dome','akala-meadow','aether-paradise','unova-victory-road','battle-frontier','hoenn-safari-zone']);
const bySlug = new Map(LOCATION_SLUGS.map(slug => [slug, read(`locations/${slug}.json`)]));
const display = value => String(value ?? '').split('-').filter(Boolean).map(word => word[0]?.toUpperCase() + word.slice(1)).join(' ');
const linkPokemon = pokemon => pokemon?.name && POKEMON_SLUG_SET.has(pokemon.name) ? { ...pokemon, displayName: display(pokemon.name) } : null;
export function locationModel(slug) {
  const location = bySlug.get(slug); if (!location) return null;
  const locationItems = optional(`locationItems/${slug}.json`);
  const items = (locationItems?.items ?? []).flatMap(entry => ITEM_SLUG_SET.has(entry.item?.name) ? [{ ...entry.item, displayName: entry.item.displayName ?? display(entry.item.name), versions: entry.versions ?? [] }] : []);
  const areas = (location.areas ?? []).map(area => ({ ...area, pokemonEncounters: (area.pokemonEncounters ?? []).map(entry => ({ ...entry, pokemon: linkPokemon(entry.pokemon) })).filter(entry => entry.pokemon) }));
  const encounterRows = areas.flatMap(area => area.pokemonEncounters.flatMap(entry => entry.versions.flatMap(version => version.encounters.map(encounter => ({ ...encounter, version: version.version, pokemon: entry.pokemon, area: area.displayName })) )));
  // The game filter belongs to the encounters table, so only expose versions
  // that have encounter rows. Item availability can use different display
  // labels and must not add duplicate or non-filterable options here.
  const versions = sortVersions([...new Set(encounterRows.map(row => row.version))]);
  const hasEncounters = encounterRows.length > 0;
  const hasItems = items.length > 0;
  const content = [hasItems && 'Items', hasEncounters && 'Pokémon'].filter(Boolean);
  const context = [hasItems && 'item locations and acquisition details', hasEncounters && 'Pokémon encounters by area, version, method and level'].filter(Boolean);
  const name = location.displayName ?? display(slug), region = location.region?.displayName;
  const canonical = `https://pokelore.net/location/${slug}`;
  const description = `${name}${region ? ` in ${region}` : ''}. ${context.length ? `Explore ${context.join(' and ')}.` : 'View available location and game data.'}${versions.length > 0 && versions.length <= 4 ? ` Games: ${versions.map(display).join(', ')}.` : ''}`;
  return { ...location, slug, items, areas, encounterRows, versions, locationItems, oaksNotes: optional(`oaksNotes/locations/${slug}.json`), hasEncounters, hasItems, canonical, seo: { title: `${name} Guide${content.length ? `, ${content.join(' & ')}` : ''} | PokéLore`, description, canonical } };
}
export function allLocationModels() { return LOCATION_SLUGS.map(locationModel); }
