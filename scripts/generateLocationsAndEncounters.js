import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = "https://pokeapi.co/api/v2";
const REQUEST_DELAY_MS = 75;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const pokemonDataDir = path.join(dataDir, "pokemonData");
const locationsDir = path.join(dataDir, "locations");
const regionsDir = path.join(dataDir, "regions");
const pokemonEncountersDir = path.join(
  dataDir,
  "pokemonEncounters"
);

const cache = new Map();
const failures = {
  locations: [],
  areas: [],
  regions: []
};

const stats = {
  locations: 0,
  areas: 0,
  areasWithEncounters: 0,
  pokemonEncounterFiles: 0,
  skippedLocationsWithNoAreas: 0
};

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

async function fetchJson(url) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  await sleep(REQUEST_DELAY_MS);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText} for ${url}`
    );
  }

  const data = await response.json();
  cache.set(url, data);

  return data;
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text);
}

async function ensureOutputDirs() {
  await Promise.all([
    fs.mkdir(locationsDir, {
      recursive: true
    }),
    fs.mkdir(regionsDir, {
      recursive: true
    }),
    fs.mkdir(pokemonEncountersDir, {
      recursive: true
    })
  ]);
}

function cleanText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function formatName(value = "") {
  return cleanText(value)
    .split("-")
    .filter(Boolean)
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

function englishName(names, fallback) {
  const name = names?.find(
    entry => entry.language?.name === "en"
  )?.name;

  return cleanText(name || formatName(fallback));
}

function resourceId(url) {
  const match = String(url).match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function officialSprite(id) {
  return id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
    : null;
}

async function loadLocalPokemon() {
  const pokemonById = new Map();
  const pokemonByName = new Map();

  try {
    const index = await readJson(
      path.join(dataDir, "pokemonIndex.json")
    );

    for (const pokemon of index) {
      pokemonById.set(pokemon.id, pokemon);
      pokemonByName.set(pokemon.name, pokemon);
    }
  } catch (error) {
    console.warn(
      "Could not load pokemonIndex.json:",
      error.message
    );
  }

  try {
    const files = await fs.readdir(pokemonDataDir);

    await Promise.all(
      files
        .filter(file => file.endsWith(".json"))
        .map(async file => {
          try {
            const pokemon = await readJson(
              path.join(pokemonDataDir, file)
            );

            const summary = {
              id: pokemon.id,
              name: pokemon.name,
              sprite: pokemon.sprite,
              types: pokemon.types ?? []
            };

            pokemonById.set(summary.id, summary);
            pokemonByName.set(summary.name, summary);
          } catch (error) {
            console.warn(
              `Could not read local Pokémon file ${file}:`,
              error.message
            );
          }
        })
    );
  } catch (error) {
    console.warn(
      "Could not scan pokemonData directory:",
      error.message
    );
  }

  return {
    pokemonById,
    pokemonByName
  };
}

function enrichPokemon(resource, localPokemon) {
  const id = resourceId(resource.url);
  const local =
    localPokemon.pokemonById.get(id) ??
    localPokemon.pokemonByName.get(resource.name);

  if (local) {
    return {
      id: local.id,
      name: local.name,
      sprite: local.sprite ?? officialSprite(local.id),
      types: local.types ?? []
    };
  }

  return {
    id,
    name: resource.name,
    sprite: officialSprite(id),
    types: []
  };
}

function buildEncounterDetails(details = []) {
  const seen = new Set();

  return details
    .map(detail => ({
      method:
        detail.method?.name ?? "unknown",
      minLevel:
        detail.min_level ?? null,
      maxLevel:
        detail.max_level ?? null,
      chance: detail.chance ?? 0,
      conditions:
        detail.condition_values?.map(
          condition => condition.name
        ) ?? []
    }))
    .filter(detail => {
      const key = JSON.stringify(detail);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .sort(compareEncounterDetails);
}

function compareEncounterDetails(a, b) {
  return (
    a.method.localeCompare(b.method) ||
    (a.minLevel ?? 0) - (b.minLevel ?? 0) ||
    (a.maxLevel ?? 0) - (b.maxLevel ?? 0) ||
    b.chance - a.chance ||
    a.conditions.join(",").localeCompare(
      b.conditions.join(",")
    )
  );
}

function compareVersions(a, b) {
  return a.version.localeCompare(b.version);
}

function compareByDisplayName(a, b) {
  return (
    (a.region ?? "").localeCompare(b.region ?? "") ||
    a.displayName.localeCompare(b.displayName) ||
    a.name.localeCompare(b.name)
  );
}

function buildArea(area, localPokemon) {
  const pokemonEncounters =
    area.pokemon_encounters
      ?.map(entry => {
        const versions =
          entry.version_details
            ?.map(versionDetail => ({
              version:
                versionDetail.version?.name,
              maxChance:
                versionDetail.max_chance ?? 0,
              encounters: buildEncounterDetails(
                versionDetail.encounter_details
              )
            }))
            .filter(version => version.version)
            .sort(compareVersions) ?? [];

        return {
          pokemon: enrichPokemon(
            entry.pokemon,
            localPokemon
          ),
          versions
        };
      })
      .filter(entry => entry.versions.length > 0)
      .sort(
        (a, b) =>
          a.pokemon.id - b.pokemon.id ||
          a.pokemon.name.localeCompare(
            b.pokemon.name
          )
      ) ?? [];

  return {
    id: area.id,
    name: area.name,
    displayName: englishName(
      area.names,
      area.name
    ),
    gameIndex: area.game_index ?? null,
    encounterMethodRates:
      area.encounter_method_rates
        ?.map(rate => ({
          method:
            rate.encounter_method?.name ??
            "unknown",
          versionDetails:
            rate.version_details
              ?.map(detail => ({
                version:
                  detail.version?.name,
                rate: detail.rate ?? 0
              }))
              .filter(detail => detail.version)
              .sort(compareVersions) ?? []
        }))
        .sort((a, b) =>
          a.method.localeCompare(b.method)
        ) ?? [],
    pokemonEncounters
  };
}

function addReverseEncounter(
  reverseMap,
  pokemon,
  locationSummary,
  area,
  version
) {
  if (!pokemon.id) return;

  if (!reverseMap.has(pokemon.id)) {
    reverseMap.set(pokemon.id, {
      pokemon: {
        id: pokemon.id,
        name: pokemon.name
      },
      locations: new Map()
    });
  }

  const pokemonEntry = reverseMap.get(pokemon.id);

  if (
    !pokemonEntry.locations.has(
      locationSummary.name
    )
  ) {
    pokemonEntry.locations.set(
      locationSummary.name,
      {
        location: {
          id: locationSummary.id,
          name: locationSummary.name,
          displayName:
            locationSummary.displayName,
          region: locationSummary.region
        },
        areas: new Map()
      }
    );
  }

  const locationEntry =
    pokemonEntry.locations.get(
      locationSummary.name
    );

  if (!locationEntry.areas.has(area.name)) {
    locationEntry.areas.set(area.name, {
      id: area.id,
      name: area.name,
      displayName: area.displayName,
      versions: new Map()
    });
  }

  const areaEntry =
    locationEntry.areas.get(area.name);

  if (
    !areaEntry.versions.has(version.version)
  ) {
    areaEntry.versions.set(version.version, {
      version: version.version,
      maxChance: version.maxChance,
      encounters: []
    });
  }

  const versionEntry =
    areaEntry.versions.get(version.version);

  versionEntry.maxChance = Math.max(
    versionEntry.maxChance,
    version.maxChance
  );

  for (const encounter of version.encounters) {
    const key = JSON.stringify(encounter);
    const exists =
      versionEntry.encounters.some(
        existing =>
          JSON.stringify(existing) === key
      );

    if (!exists) {
      versionEntry.encounters.push(encounter);
    }
  }
}

function serializeReverseEntry(entry) {
  const locations = [
    ...entry.locations.values()
  ]
    .map(locationEntry => ({
      location: locationEntry.location,
      areas: [
        ...locationEntry.areas.values()
      ]
        .map(areaEntry => ({
          id: areaEntry.id,
          name: areaEntry.name,
          displayName: areaEntry.displayName,
          versions: [
            ...areaEntry.versions.values()
          ]
            .map(version => ({
              ...version,
              encounters:
                version.encounters.sort(
                  compareEncounterDetails
                )
            }))
            .sort(compareVersions)
        }))
        .sort(
          (a, b) =>
            a.displayName.localeCompare(
              b.displayName
            ) ||
            a.name.localeCompare(b.name)
        )
    }))
    .sort(
      (a, b) =>
        a.location.region.localeCompare(
          b.location.region
        ) ||
        a.location.displayName.localeCompare(
          b.location.displayName
        ) ||
        a.location.name.localeCompare(
          b.location.name
        )
    );

  return {
    pokemon: entry.pokemon,
    locations
  };
}

function normalizeAlias(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^\w.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutPunctuation(value) {
  return normalizeAlias(value)
    .replace(/[.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function aliasVariants(location) {
  const variants = new Set();
  const slugWords = location.name.replace(
    /-/g,
    " "
  );
  const display =
    location.displayName;
  const region =
    location.region?.name;
  const regionDisplay =
    location.region?.displayName;

  for (const value of [
    location.name,
    slugWords,
    display,
    withoutPunctuation(display),
    withoutPunctuation(slugWords)
  ]) {
    const alias = normalizeAlias(value);

    if (alias) {
      variants.add(alias);
      variants.add(withoutPunctuation(alias));
    }
  }

  for (const prefix of [
    region,
    regionDisplay
  ].filter(Boolean)) {
    for (const value of [
      display,
      withoutPunctuation(display),
      slugWords,
      withoutPunctuation(slugWords)
    ]) {
      const alias = normalizeAlias(
        `${prefix} ${value}`
      );

      if (alias) {
        variants.add(alias);
        variants.add(withoutPunctuation(alias));
      }
    }
  }

  return [...variants].filter(Boolean);
}

function buildAliases(locations) {
  const regionAliases = {};
  const globalAliases = new Map();

  for (const location of locations) {
    const region =
      location.region?.name ?? "unknown";

    regionAliases[region] ??= {};

    for (const alias of aliasVariants(location)) {
      if (!regionAliases[region][alias]) {
        regionAliases[region][alias] =
          location.name;
      }

      if (!globalAliases.has(alias)) {
        globalAliases.set(alias, new Set());
      }

      globalAliases.get(alias).add(location.name);
    }
  }

  const conflicts = {};

  for (const [
    alias,
    locationNames
  ] of globalAliases.entries()) {
    if (locationNames.size > 1) {
      conflicts[alias] = [
        ...locationNames
      ].sort();
    }
  }

  return {
    aliases: Object.fromEntries(
      Object.entries(regionAliases).sort(
        ([a], [b]) => a.localeCompare(b)
      )
    ),
    conflicts: Object.fromEntries(
      Object.entries(conflicts).sort(
        ([a], [b]) => a.localeCompare(b)
      )
    )
  };
}

async function fetchRegion(regionRef) {
  if (!regionRef?.url) {
    return null;
  }

  try {
    return await fetchJson(regionRef.url);
  } catch (error) {
    failures.regions.push({
      region: regionRef.name,
      error: error.message
    });

    return null;
  }
}

function buildRegionSummary(region) {
  if (!region) {
    return {
      name: "unknown",
      displayName: "Unknown"
    };
  }

  return {
    id: region.id,
    name: region.name,
    displayName: englishName(
      region.names,
      region.name
    ),
    mainGeneration:
      region.main_generation?.name ?? null,
    pokedexes:
      region.pokedexes?.map(
        pokedex => pokedex.name
      ) ?? [],
    versionGroups:
      region.version_groups?.map(
        versionGroup => versionGroup.name
      ) ?? []
  };
}

async function processLocation(
  locationRef,
  localPokemon,
  reverseMap,
  regionMap
) {
  try {
    const location = await fetchJson(
      locationRef.url
    );
    const region = await fetchRegion(
      location.region
    );
    const regionSummary =
      buildRegionSummary(region);
    const areas = [];

    if (!location.areas?.length) {
      stats.skippedLocationsWithNoAreas++;
    }

    for (const areaRef of location.areas ?? []) {
      try {
        const areaData = await fetchJson(
          areaRef.url
        );
        const area = buildArea(
          areaData,
          localPokemon
        );

        stats.areas++;

        if (
          area.pokemonEncounters.length > 0
        ) {
          stats.areasWithEncounters++;
        }

        areas.push(area);
      } catch (error) {
        failures.areas.push({
          location: location.name,
          area: areaRef.name,
          error: error.message
        });
      }
    }

    areas.sort(
      (a, b) =>
        a.displayName.localeCompare(
          b.displayName
        ) ||
        a.name.localeCompare(b.name)
    );

    const locationFile = {
      id: location.id,
      name: location.name,
      displayName: englishName(
        location.names,
        location.name
      ),
      region: {
        name: regionSummary.name,
        displayName:
          regionSummary.displayName
      },
      gameIndices:
        location.game_indices
          ?.map(index => ({
            gameIndex:
              index.game_index ?? null,
            generation:
              index.generation?.name ?? null
          }))
          .sort(
            (a, b) =>
              (a.generation ?? "").localeCompare(
                b.generation ?? ""
              ) ||
              (a.gameIndex ?? 0) -
                (b.gameIndex ?? 0)
          ) ?? [],
      areas
    };

    const locationSummary = {
      id: locationFile.id,
      name: locationFile.name,
      displayName: locationFile.displayName,
      region: locationFile.region.name,
      regionDisplayName:
        locationFile.region.displayName,
      areaCount: areas.length,
      hasEncounters: areas.some(
        area =>
          area.pokemonEncounters.length > 0
      )
    };

    for (const area of areas) {
      for (const encounter of area.pokemonEncounters) {
        for (const version of encounter.versions) {
          addReverseEncounter(
            reverseMap,
            encounter.pokemon,
            locationSummary,
            area,
            version
          );
        }
      }
    }

    if (!regionMap.has(regionSummary.name)) {
      regionMap.set(regionSummary.name, {
        id: regionSummary.id,
        name: regionSummary.name,
        displayName:
          regionSummary.displayName,
        mainGeneration:
          regionSummary.mainGeneration,
        pokedexes:
          regionSummary.pokedexes ?? [],
        versionGroups:
          regionSummary.versionGroups ?? [],
        locations: []
      });
    }

    regionMap
      .get(regionSummary.name)
      .locations.push({
        id: locationSummary.id,
        name: locationSummary.name,
        displayName:
          locationSummary.displayName,
        hasEncounters:
          locationSummary.hasEncounters
      });

    await fs.writeFile(
      path.join(
        locationsDir,
        `${location.name}.json`
      ),
      JSON.stringify(locationFile, null, 2),
      "utf8"
    );

    stats.locations++;

    return {
      locationFile,
      locationSummary
    };
  } catch (error) {
    failures.locations.push({
      location: locationRef.name,
      error: error.message
    });

    return null;
  }
}

async function writeReverseFiles(reverseMap) {
  const entries = [
    ...reverseMap.values()
  ].sort(
    (a, b) => a.pokemon.id - b.pokemon.id
  );

  for (const entry of entries) {
    const serialized =
      serializeReverseEntry(entry);

    await fs.writeFile(
      path.join(
        pokemonEncountersDir,
        `${entry.pokemon.id}.json`
      ),
      JSON.stringify(serialized, null, 2),
      "utf8"
    );
  }

  stats.pokemonEncounterFiles = entries.length;
}

async function writeRegionFiles(regionMap) {
  const regions = [...regionMap.values()].sort(
    (a, b) =>
      a.displayName.localeCompare(b.displayName)
  );

  for (const region of regions) {
    region.locations.sort(
      (a, b) =>
        a.displayName.localeCompare(
          b.displayName
        ) ||
        a.name.localeCompare(b.name)
    );

    await fs.writeFile(
      path.join(
        regionsDir,
        `${region.name}.json`
      ),
      JSON.stringify(region, null, 2),
      "utf8"
    );
  }
}

async function main() {
  await ensureOutputDirs();

  const localPokemon =
    await loadLocalPokemon();
  const reverseMap = new Map();
  const regionMap = new Map();

  const locationList = await fetchJson(
    `${API_BASE}/location?limit=100000`
  );

  const results = [];

  for (const [
    index,
    locationRef
  ] of locationList.results.entries()) {
    console.log(
      `Processing ${index + 1}/${locationList.results.length}: ${locationRef.name}`
    );

    const result = await processLocation(
      locationRef,
      localPokemon,
      reverseMap,
      regionMap
    );

    if (result) {
      results.push(result);
    }
  }

  const locationFiles = results
    .map(result => result.locationFile)
    .sort(
      (a, b) =>
        (a.region?.name ?? "").localeCompare(
          b.region?.name ?? ""
        ) ||
        a.displayName.localeCompare(
          b.displayName
        ) ||
        a.name.localeCompare(b.name)
    );

  const locationIndex = results
    .map(result => result.locationSummary)
    .sort(compareByDisplayName);

  const {
    aliases,
    conflicts
  } = buildAliases(locationFiles);

  await Promise.all([
    fs.writeFile(
      path.join(dataDir, "locationsIndex.json"),
      JSON.stringify(locationIndex, null, 2),
      "utf8"
    ),
    fs.writeFile(
      path.join(dataDir, "locationAliases.json"),
      JSON.stringify(aliases, null, 2),
      "utf8"
    ),
    fs.writeFile(
      path.join(
        dataDir,
        "locationAliasConflicts.json"
      ),
      JSON.stringify(conflicts, null, 2),
      "utf8"
    ),
    writeReverseFiles(reverseMap),
    writeRegionFiles(regionMap)
  ]);

  console.log("");
  console.log("Location generation complete.");
  console.log(
    `Generated ${stats.locations} locations.`
  );
  console.log(
    `Generated ${stats.areas} location areas.`
  );
  console.log(
    `Areas with encounters: ${stats.areasWithEncounters}.`
  );
  console.log(
    `Generated encounter files for ${stats.pokemonEncounterFiles} Pokémon.`
  );
  console.log(
    `Skipped ${stats.skippedLocationsWithNoAreas} locations with no areas.`
  );
  console.log(
    `Failed ${failures.locations.length} location requests.`
  );
  console.log(
    `Failed ${failures.areas.length} area requests.`
  );
  console.log(
    `Failed ${failures.regions.length} region requests.`
  );

  if (
    failures.locations.length ||
    failures.areas.length ||
    failures.regions.length
  ) {
    await fs.writeFile(
      path.join(
        dataDir,
        "locationGenerationFailures.json"
      ),
      JSON.stringify(failures, null, 2),
      "utf8"
    );
    console.log(
      "Wrote locationGenerationFailures.json."
    );
  }
}

main().catch(error => {
  console.error(
    "Location generation failed:",
    error
  );
  throw error;
});
