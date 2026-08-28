import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sortVersions } from "../src/constants/versionOrder.js";
import { formatVersionName } from "../src/utils/formatVersionName.js";
import { formatPokemonDisplayName } from "../src/utils/pokemonNames.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const pokemonDataDir = path.join(dataDir, "pokemonData");
const locationsDir = path.join(dataDir, "locations");
const outputPath = path.join(dataDir, "evTrainingRoutes.json");

const STATS = [
  {
    key: "hp",
    label: "HP"
  },
  {
    key: "attack",
    label: "Attack"
  },
  {
    key: "defense",
    label: "Defense"
  },
  {
    key: "specialAttack",
    label: "Sp. Atk"
  },
  {
    key: "specialDefense",
    label: "Sp. Def"
  },
  {
    key: "speed",
    label: "Speed"
  }
];

const TRAINING_METHODS = new Set([
  "berry-trees",
  "bridge-spots",
  "bubbling-spots",
  "cave-spots",
  "dark-grass",
  "feebas-tile-fishing",
  "good-rod",
  "grass-spots",
  "headbutt",
  "headbutt-high",
  "headbutt-low",
  "headbutt-normal",
  "horde",
  "old-rod",
  "overworld",
  "overworld-flying",
  "overworld-water",
  "purple-flowers",
  "red-flowers",
  "rock-smash",
  "rough-terrain",
  "seaweed",
  "sos-encounter",
  "sos-from-bubbling-spot",
  "super-rod",
  "super-rod-spots",
  "surf",
  "surf-spots",
  "walk",
  "yellow-flowers"
]);

const GEN_THREE_AND_NEWER_VERSIONS = new Set([
  "ruby",
  "sapphire",
  "colosseum",
  "firered",
  "leafgreen",
  "emerald",
  "xd",
  "diamond",
  "pearl",
  "platinum",
  "heartgold",
  "soulsilver",
  "black",
  "white",
  "black-2",
  "white-2",
  "x",
  "y",
  "omega-ruby",
  "alpha-sapphire",
  "sun",
  "moon",
  "ultra-sun",
  "ultra-moon",
  "sword",
  "shield",
  "brilliant-diamond",
  "shining-pearl",
  "legends-arceus",
  "scarlet",
  "violet"
]);

const CATCH_ONLY_LOCATION_PATTERNS = [
  /(^|-)safari-zone($|-)/,
  /^great-marsh$/
];
const FRIEND_SAFARI_LOCATION_NAME = "friend-safari";
const FRIEND_SAFARI_SLOT_PREFIX =
  "friend-safari-slot-";

function cleanNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatName(value = "") {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function normalizeEvYield(evYield = {}) {
  return Object.fromEntries(
    STATS.map(stat => [
      stat.key,
      Math.max(
        0,
        Math.trunc(cleanNumber(evYield[stat.key]))
      )
    ])
  );
}

function targetEv(evYield, statKey) {
  return cleanNumber(evYield?.[statKey]);
}

function isCleanTargetYield(evYield, statKey) {
  return (
    targetEv(evYield, statKey) > 0 &&
    STATS.every(
      stat =>
        stat.key === statKey ||
        targetEv(evYield, stat.key) === 0
    )
  );
}

function statBreakdown(evYield) {
  return STATS
    .filter(stat => targetEv(evYield, stat.key) > 0)
    .map(stat => ({
      stat: stat.key,
      label: stat.label,
      value: targetEv(evYield, stat.key)
    }));
}

function isCatchOnlyLocation(location) {
  return CATCH_ONLY_LOCATION_PATTERNS.some(
    pattern => pattern.test(location.name ?? "")
  );
}

function sortedConditions(encounter) {
  return [...(encounter.conditions ?? [])].sort();
}

function hasFriendSafariSlot(conditions) {
  return conditions.some(condition =>
    condition.startsWith(FRIEND_SAFARI_SLOT_PREFIX)
  );
}

function friendSafariEncounterKey({
  conditions,
  method,
  version
}) {
  return [
    version,
    method,
    conditions.join("|")
  ].join("\u0000");
}

function buildFriendSafariChanceDivisors(
  location,
  area
) {
  const divisors = new Map();

  if (location.name !== FRIEND_SAFARI_LOCATION_NAME) {
    return divisors;
  }

  for (const encounterEntry of area.pokemonEncounters ?? []) {
    for (const versionEntry of encounterEntry.versions ?? []) {
      if (
        !GEN_THREE_AND_NEWER_VERSIONS.has(
          versionEntry.version
        )
      ) {
        continue;
      }

      for (const encounter of versionEntry.encounters ?? []) {
        const chance = cleanNumber(encounter.chance);
        const method = encounter.method ?? "unknown";
        const conditions =
          sortedConditions(encounter);

        if (
          chance <= 0 ||
          !TRAINING_METHODS.has(method) ||
          !hasFriendSafariSlot(conditions)
        ) {
          continue;
        }

        const key = friendSafariEncounterKey({
          conditions,
          method,
          version: versionEntry.version
        });

        divisors.set(
          key,
          (divisors.get(key) ?? 0) + 1
        );
      }
    }
  }

  return divisors;
}

async function readJson(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text);
}

async function readPokemon() {
  const pokemonById = new Map();
  const files = (
    await fs.readdir(pokemonDataDir)
  )
    .filter(file => file.endsWith(".json"))
    .sort(
      (first, second) =>
        Number.parseInt(first, 10) -
        Number.parseInt(second, 10)
    );

  await Promise.all(
    files.map(async file => {
      const pokemon = await readJson(
        path.join(pokemonDataDir, file)
      );
      const evYield = normalizeEvYield(
        pokemon.evYield
      );

      pokemonById.set(pokemon.id, {
        id: pokemon.id,
        name: pokemon.name,
        displayName:
          formatPokemonDisplayName(pokemon),
        sprite: pokemon.sprite,
        evYield
      });
    })
  );

  return pokemonById;
}

async function readLocations() {
  const files = (
    await fs.readdir(locationsDir)
  )
    .filter(file => file.endsWith(".json"))
    .sort((first, second) =>
      first.localeCompare(second)
    );

  return Promise.all(
    files.map(file =>
      readJson(path.join(locationsDir, file))
    )
  );
}

function getMethodEncounterRate(
  area,
  version,
  method
) {
  const methodRate =
    area.encounterMethodRates?.find(
      rate => rate.method === method
    );

  return (
    methodRate?.versionDetails?.find(
      detail => detail.version === version
    )?.rate ?? null
  );
}

function encounterKey({
  area,
  conditions,
  location,
  method,
  statKey,
  version
}) {
  return [
    version,
    statKey,
    location.name,
    area.name,
    method,
    conditions.join("|")
  ].join("\u0000");
}

function ensureSegment(segments, data) {
  const key = encounterKey(data);

  if (!segments.has(key)) {
    segments.set(key, {
      version: data.version,
      stat: data.statKey,
      locationName: data.location.name,
      locationDisplayName:
        data.location.displayName ??
        formatName(data.location.name),
      regionName:
        data.location.region?.name ??
        data.location.region ??
        "",
      regionDisplayName:
        data.location.region?.displayName ??
        formatName(
          data.location.region?.name ??
            data.location.region
        ),
      areaName: data.area.name,
      areaDisplayName:
        data.area.displayName ??
        formatName(data.area.name),
      method: data.method,
      conditions: data.conditions,
      encounterRate:
        getMethodEncounterRate(
          data.area,
          data.version,
          data.method
        ),
      targetChance: 0,
      cleanTargetChance: 0,
      expectedEvPerEncounter: 0,
      pokemon: new Map()
    });
  }

  return segments.get(key);
}

function addPokemonToSegment({
  chance,
  cleanChance,
  encounter,
  pokemon,
  segment,
  statKey,
  targetEvAmount
}) {
  const existing =
    segment.pokemon.get(pokemon.id) ?? {
      id: pokemon.id,
      name: pokemon.name,
      displayName: pokemon.displayName,
      sprite: pokemon.sprite,
      targetEv: targetEvAmount,
      evYield: pokemon.evYield,
      evYieldBreakdown: statBreakdown(
        pokemon.evYield
      ),
      chance: 0,
      cleanChance: 0,
      minLevel: null,
      maxLevel: null
    };

  existing.chance += chance;
  existing.cleanChance += cleanChance;
  existing.targetEv = Math.max(
    existing.targetEv,
    targetEvAmount
  );

  if (encounter.minLevel !== null) {
    existing.minLevel =
      existing.minLevel === null
        ? encounter.minLevel
        : Math.min(
            existing.minLevel,
            encounter.minLevel
          );
  }

  if (encounter.maxLevel !== null) {
    existing.maxLevel =
      existing.maxLevel === null
        ? encounter.maxLevel
        : Math.max(
            existing.maxLevel,
            encounter.maxLevel
          );
  }

  segment.pokemon.set(
    existing.id,
    existing
  );

  if (targetEvAmount !== targetEv(pokemon.evYield, statKey)) {
    throw new Error(
      `Unexpected EV mismatch for ${pokemon.name}`
    );
  }
}

function buildSegments(locations, pokemonById) {
  const segments = new Map();

  for (const location of locations) {
    if (isCatchOnlyLocation(location)) {
      continue;
    }

    for (const area of location.areas ?? []) {
      const friendSafariChanceDivisors =
        buildFriendSafariChanceDivisors(
          location,
          area
        );

      for (const encounterEntry of area.pokemonEncounters ?? []) {
        const pokemon = pokemonById.get(
          encounterEntry.pokemon?.id
        );

        if (!pokemon) {
          continue;
        }

        for (const versionEntry of encounterEntry.versions ?? []) {
          if (
            !GEN_THREE_AND_NEWER_VERSIONS.has(
              versionEntry.version
            )
          ) {
            continue;
          }

          for (const encounter of versionEntry.encounters ?? []) {
            const rawChance = cleanNumber(
              encounter.chance
            );

            if (rawChance <= 0) {
              continue;
            }

            const method =
              encounter.method ?? "unknown";

            if (!TRAINING_METHODS.has(method)) {
              continue;
            }

            const conditions =
              sortedConditions(encounter);
            const friendSafariChanceDivisor =
              friendSafariChanceDivisors.get(
                friendSafariEncounterKey({
                  conditions,
                  method,
                  version: versionEntry.version
                })
              ) ?? 1;
            const chance =
              rawChance / friendSafariChanceDivisor;

            for (const stat of STATS) {
              const targetEvAmount = targetEv(
                pokemon.evYield,
                stat.key
              );

              if (targetEvAmount <= 0) {
                continue;
              }

              const cleanChance =
                isCleanTargetYield(
                  pokemon.evYield,
                  stat.key
                )
                  ? chance
                  : 0;
              const segment = ensureSegment(
                segments,
                {
                  area,
                  conditions,
                  location,
                  method,
                  statKey: stat.key,
                  version: versionEntry.version
                }
              );

              segment.targetChance += chance;
              segment.cleanTargetChance += cleanChance;
              segment.expectedEvPerEncounter +=
                (chance * targetEvAmount) / 100;

              addPokemonToSegment({
                chance,
                cleanChance,
                encounter,
                pokemon,
                segment,
                statKey: stat.key,
                targetEvAmount
              });
            }
          }
        }
      }
    }
  }

  return [...segments.values()].map(segment => {
    const targetChance = Math.min(
      100,
      segment.targetChance
    );
    const cleanTargetChance = Math.min(
      100,
      segment.cleanTargetChance
    );

    return {
      ...segment,
      targetChance,
      cleanTargetChance,
      expectedEvPerEncounter: Number(
        segment.expectedEvPerEncounter.toFixed(3)
      ),
      pokemon: [...segment.pokemon.values()]
        .map(pokemon => ({
          ...pokemon,
          chance: Number(
            Math.min(100, pokemon.chance).toFixed(3)
          ),
          cleanChance: Number(
            Math.min(
              100,
              pokemon.cleanChance
            ).toFixed(3)
          )
        }))
        .sort((first, second) => {
          if (second.chance !== first.chance) {
            return second.chance - first.chance;
          }

          return first.id - second.id;
        })
    };
  });
}

function compareSegments(first, second) {
  if (
    second.targetChance !== first.targetChance
  ) {
    return second.targetChance - first.targetChance;
  }

  if (
    second.expectedEvPerEncounter !==
    first.expectedEvPerEncounter
  ) {
    return (
      second.expectedEvPerEncounter -
      first.expectedEvPerEncounter
    );
  }

  if (
    second.cleanTargetChance !==
    first.cleanTargetChance
  ) {
    return (
      second.cleanTargetChance -
      first.cleanTargetChance
    );
  }

  const locationCompare =
    first.locationDisplayName.localeCompare(
      second.locationDisplayName
    );

  if (locationCompare !== 0) {
    return locationCompare;
  }

  return first.areaDisplayName.localeCompare(
    second.areaDisplayName
  );
}

function bestSegmentsByLocation(segments) {
  const bestByLocation = new Map();

  for (const segment of segments) {
    const key = [
      segment.version,
      segment.stat,
      segment.locationName
    ].join("\u0000");
    const current = bestByLocation.get(key);

    if (
      !current ||
      compareSegments(segment, current) < 0
    ) {
      bestByLocation.set(key, segment);
    }
  }

  return [...bestByLocation.values()];
}

function encountersForMaxEv(expectedEvPerEncounter) {
  if (expectedEvPerEncounter <= 0) {
    return null;
  }

  return Math.ceil(252 / expectedEvPerEncounter);
}

function buildRoutesByVersion(segments) {
  const routesByVersion = {};
  const versions = sortVersions(
    new Set(segments.map(segment => segment.version))
  );

  for (const version of versions) {
    routesByVersion[version] = {};

    for (const stat of STATS) {
      routesByVersion[version][stat.key] = segments
        .filter(
          segment =>
            segment.version === version &&
            segment.stat === stat.key
        )
        .sort(compareSegments)
        .slice(0, 10)
        .map((segment, index) => ({
          rank: index + 1,
          encountersForMaxEv: encountersForMaxEv(
            segment.expectedEvPerEncounter
          ),
          ...segment
        }));
    }
  }

  return {
    versions,
    routesByVersion
  };
}

async function generateEvTrainingRoutes() {
  const [pokemonById, locations] =
    await Promise.all([
      readPokemon(),
      readLocations()
    ]);
  const allSegments = buildSegments(
    locations,
    pokemonById
  );
  const bestSegments =
    bestSegmentsByLocation(allSegments);
  const { versions, routesByVersion } =
    buildRoutesByVersion(bestSegments);

  await fs.writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ranking:
          "Top ten unique repeatable wild locations per game and stat, ranked by matching encounter chance, expected EV per encounter, then clean target-only chance.",
        stats: STATS,
        versions: versions.map(version => ({
          version,
          displayName: formatVersionName(version)
        })),
        routesByVersion
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `Generated EV training routes for ${versions.length} versions at ${outputPath}`
  );
}

generateEvTrainingRoutes().catch(error => {
  console.error(
    "Failed to generate EV training routes:",
    error
  );
  process.exitCode = 1;
});
