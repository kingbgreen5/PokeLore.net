import { readJsonFile } from "./readJsonFile.js";
import locationsIndex from "../../public/data/locationsIndex.json";

export function resolveLocation(slug) {
  return locationsIndex.find(location => location.name === slug) ?? null;
}

export function validateLocation(location, slug) {
  if (location?.name !== slug || !location.displayName || !Array.isArray(location.areas) ||
      location.areas.some(area => !Array.isArray(area.pokemonEncounters))) {
    throw new Error(`Invalid location data for ${slug}`);
  }
  return location;
}

export async function loadLocationData(slug) {
  if (!resolveLocation(slug)) return null;
  const location = validateLocation(await readJsonFile(`/data/locations/${slug}.json`, { required: true }), slug);
  const [locationItems, oaksNotes, pokemonGoNotes] = await Promise.all([
    readJsonFile(`/data/locationItems/${slug}.json`),
    readJsonFile(`/data/oaksNotes/locations/${slug}.json`),
    readJsonFile(`/data/pokemonGo/locations/${slug}.json`)
  ]);
  let pokemonDetailsById = {};
  if (slug === "friend-safari") {
    const ids = [...new Set(location.areas.flatMap(area => area.pokemonEncounters.map(entry => entry.pokemon.id)))];
    pokemonDetailsById = Object.fromEntries((await Promise.all(ids.map(async id =>
      [id, await readJsonFile(`/data/pokemonData/${id}.json`)]
    ))).filter(([, pokemon]) => pokemon));
  }
  return { location, locationItems, oaksNotes, pokemonGoNotes, pokemonDetailsById };
}
