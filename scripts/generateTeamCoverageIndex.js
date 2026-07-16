import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import typeChart from "../src/constants/Types.js";
import {
  VERSION_GROUP_ORDER
} from "../src/constants/versionOrder.js";
import {
  getCoveredDefenseTypes,
  getLevelUpAttackTypes,
  getTypesForVersionGroup
} from "../src/utils/teamCoverage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const outputDir = path.join(
  dataDir,
  "teamCoverage"
);
const versionAvailabilityDir = path.join(
  dataDir,
  "versionAvailability"
);

const VERSION_TO_GROUP = {
  "red-japan": "red-green-japan",
  "green-japan": "red-green-japan",
  "blue-japan": "blue-japan",
  red: "red-blue",
  blue: "red-blue",
  yellow: "yellow",
  gold: "gold-silver",
  silver: "gold-silver",
  crystal: "crystal",
  ruby: "ruby-sapphire",
  sapphire: "ruby-sapphire",
  colosseum: "colosseum",
  firered: "firered-leafgreen",
  leafgreen: "firered-leafgreen",
  emerald: "emerald",
  xd: "xd",
  diamond: "diamond-pearl",
  pearl: "diamond-pearl",
  platinum: "platinum",
  heartgold: "heartgold-soulsilver",
  soulsilver: "heartgold-soulsilver",
  black: "black-white",
  white: "black-white",
  "black-2": "black-2-white-2",
  "white-2": "black-2-white-2",
  x: "x-y",
  y: "x-y",
  "omega-ruby": "omega-ruby-alpha-sapphire",
  "alpha-sapphire": "omega-ruby-alpha-sapphire",
  sun: "sun-moon",
  moon: "sun-moon",
  "ultra-sun": "ultra-sun-ultra-moon",
  "ultra-moon": "ultra-sun-ultra-moon",
  "lets-go-pikachu": "lets-go-pikachu-lets-go-eevee",
  "lets-go-eevee": "lets-go-pikachu-lets-go-eevee",
  sword: "sword-shield",
  shield: "sword-shield",
  "brilliant-diamond":
    "brilliant-diamond-shining-pearl",
  "shining-pearl":
    "brilliant-diamond-shining-pearl",
  "legends-arceus": "legends-arceus",
  scarlet: "scarlet-violet",
  violet: "scarlet-violet"
};

async function readJson(filePath) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

async function readJsonIfExists(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function readVersionAvailability() {
  const availabilityByVersionGroup = new Map();

  let files = [];

  try {
    files = await fs.readdir(versionAvailabilityDir);
  } catch (error) {
    if (error.code === "ENOENT") {
      return availabilityByVersionGroup;
    }

    throw error;
  }

  for (const file of files.filter(file =>
    file.endsWith(".json")
  )) {
    const availability = await readJson(
      path.join(versionAvailabilityDir, file)
    );
    const versionGroup =
      availability.versionGroup ??
      path.basename(file, ".json");
    const ids = new Set(
      (availability.pokemonIds ?? [])
        .map(Number)
        .filter(Number.isFinite)
    );

    if (!ids.size) {
      continue;
    }

    if (!availabilityByVersionGroup.has(versionGroup)) {
      availabilityByVersionGroup.set(
        versionGroup,
        new Set()
      );
    }

    const target =
      availabilityByVersionGroup.get(versionGroup);

    for (const id of ids) {
      target.add(id);
    }
  }

  return availabilityByVersionGroup;
}

function isCosmeticPokemonName(name = "") {
  const normalizedName = String(name);

  return (
    normalizedName.includes("-mega") ||
    normalizedName.includes("-gmax") ||
    normalizedName.startsWith("pikachu-") ||
    normalizedName.includes("-totem")
  );
}

function collectVersionsFromEncounterData(data) {
  const versions = new Set();

  for (const location of data?.locations ?? []) {
    for (const area of location.areas ?? []) {
      for (const version of area.versions ?? []) {
        if (version.version) {
          versions.add(version.version);
        }
      }
    }
  }

  return versions;
}

function collectEvolutionDescendantIds(node) {
  const descendants = [];

  for (const child of node?.evolvesTo ?? []) {
    if (
      child.pokemon?.id &&
      !isCosmeticPokemonName(child.pokemon.name)
    ) {
      descendants.push(child.pokemon.id);
    }

    descendants.push(
      ...collectEvolutionDescendantIds(child)
    );
  }

  return descendants;
}

function findEvolutionNode(node, pokemonId) {
  if (node?.pokemon?.id === pokemonId) {
    return node;
  }

  for (const variety of node?.varieties ?? []) {
    if (variety.id === pokemonId) {
      return node;
    }
  }

  for (const child of node?.evolvesTo ?? []) {
    const match = findEvolutionNode(
      child,
      pokemonId
    );

    if (match) {
      return match;
    }
  }

  return null;
}

async function getEvolutionDescendantIds(
  pokemon,
  cache
) {
  const chainId = pokemon?.evolutionChainId;

  if (!chainId) {
    return [];
  }

  if (!cache.has(chainId)) {
    cache.set(
      chainId,
      await readJsonIfExists(
        path.join(
          dataDir,
          "evolutionChains",
          `${chainId}.json`
        )
      )
    );
  }

  const chain = cache.get(chainId);
  const node = findEvolutionNode(
    chain?.root,
    pokemon.id
  );

  return collectEvolutionDescendantIds(node);
}

function buildMoveMap(movesIndex) {
  return Object.fromEntries(
    movesIndex.map(move => [
      move.name,
      move
    ])
  );
}

function getBaseStatTotal(stats = {}) {
  return [
    "hp",
    "attack",
    "defense",
    "specialAttack",
    "specialDefense",
    "speed"
  ].reduce(
    (total, statName) =>
      total + (Number(stats[statName]) || 0),
    0
  );
}

async function main() {
  const movesIndex = await readJson(
    path.join(dataDir, "movesIndex.json")
  );
  const movesByName =
    buildMoveMap(movesIndex);
  const encounterDir = path.join(
    dataDir,
    "pokemonEncounters"
  );
  const pokemonDataDir = path.join(
    dataDir,
    "pokemonData"
  );
  const learnsetDir = path.join(
    dataDir,
    "pokemonLearnsets"
  );
  const encounterFiles = (
    await fs.readdir(encounterDir)
  ).filter(file => file.endsWith(".json"));
  const directIdsByVersionGroup =
    Object.fromEntries(
      VERSION_GROUP_ORDER.map(versionGroup => [
        versionGroup,
        new Set()
      ])
    );
  const curatedIdsByVersionGroup =
    await readVersionAvailability();
  const pokemonCache = new Map();
  const evolutionCache = new Map();

  for (const file of encounterFiles) {
    const id = Number(path.basename(file, ".json"));
    const encounterData = await readJson(
      path.join(encounterDir, file)
    );

    for (const version of collectVersionsFromEncounterData(
      encounterData
    )) {
      const versionGroup =
        VERSION_TO_GROUP[version];

      if (versionGroup) {
        directIdsByVersionGroup[
          versionGroup
        ].add(id);
      }
    }
  }

  async function loadPokemon(id) {
    if (!pokemonCache.has(id)) {
      pokemonCache.set(
        id,
        await readJsonIfExists(
          path.join(
            pokemonDataDir,
            `${id}.json`
          )
        )
      );
    }

    return pokemonCache.get(id);
  }

  await fs.mkdir(outputDir, {
    recursive: true
  });

  const availabilityNote =
    "These Pokemon are technically available in the game. That does not necessarily mean they are available for a playthrough. It is meant to be overly broad, and also includes Pokemon that must be traded for.";

  const manifest = {
    generatedAt: new Date().toISOString(),
    availabilityNote,
    versionGroups: {}
  };

  for (const versionGroup of VERSION_GROUP_ORDER) {
    const consideredTypes =
      getTypesForVersionGroup(versionGroup);
    const availableIds = new Set(
      [
        ...directIdsByVersionGroup[versionGroup],
        ...(
          curatedIdsByVersionGroup.get(
            versionGroup
          ) ?? []
        )
      ]
    );

    for (const id of [
      ...directIdsByVersionGroup[versionGroup]
    ]) {
      const pokemon = await loadPokemon(id);

      if (
        !pokemon ||
        isCosmeticPokemonName(pokemon.name)
      ) {
        continue;
      }

      const descendantIds =
        await getEvolutionDescendantIds(
          pokemon,
          evolutionCache
        );

      for (const descendantId of descendantIds) {
        availableIds.add(descendantId);
      }
    }

    const pokemonEntries = [];

    for (const id of [...availableIds].sort(
      (a, b) => a - b
    )) {
      const pokemon = await loadPokemon(id);

      if (
        !pokemon ||
        isCosmeticPokemonName(pokemon.name)
      ) {
        continue;
      }

      const learnset =
        await readJsonIfExists(
          path.join(
            learnsetDir,
            `${id}.json`
          )
        );

      if (!learnset) {
        continue;
      }

      const attackTypes =
        getLevelUpAttackTypes({
          consideredTypes,
          learnset,
          movesByName,
          versionGroup
        });
      const coveredTypes =
        getCoveredDefenseTypes({
          attackTypes,
          consideredTypes,
          typeChart
        });

      if (!attackTypes.length) {
        continue;
      }

      pokemonEntries.push({
        id: pokemon.id,
        name: pokemon.name,
        species: pokemon.species,
        sprite: pokemon.sprite,
        spriteFallback:
          pokemon.spriteFallback,
        types: pokemon.types ?? [],
        stats: pokemon.stats ?? {},
        baseStatTotal: getBaseStatTotal(
          pokemon.stats
        ),
        attackTypes,
        coveredTypes
      });
    }

    const versionGroupIndex = {
      generatedAt: manifest.generatedAt,
      availabilityNote,
      versionGroup,
      availablePokemonCount:
        availableIds.size,
      recommendationCount:
        pokemonEntries.length,
      pokemon: pokemonEntries
    };

    manifest.versionGroups[versionGroup] = {
      availablePokemonCount:
        availableIds.size,
      recommendationCount:
        pokemonEntries.length,
      path: `/data/teamCoverage/${versionGroup}.json`
    };

    await fs.writeFile(
      path.join(
        outputDir,
        `${versionGroup}.json`
      ),
      `${JSON.stringify(versionGroupIndex, null, 2)}\n`
    );
  }

  await fs.writeFile(
    path.join(outputDir, "index.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  console.log(
    `Generated team coverage indexes at ${outputDir}`
  );
}

main().catch(error => {
  console.error(
    "Failed to generate team coverage index:",
    error
  );
  throw error;
});
