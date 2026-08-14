import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  VERSION_GROUP_ORDER
} from "../src/constants/versionOrder.js";
import {
  DEFAULT_TEAM_RECOMMENDATION_WEIGHTS,
  getBstScore,
  getTierScore
} from "../src/utils/teamCoverage.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const scoringDir = path.join(
  dataDir,
  "teamCoverageScoring"
);
const pokemonDataDir = path.join(
  dataDir,
  "pokemonData"
);

const SCORING_VERSION_GROUP_ALIASES = {
  "black2-white2": "black-2-white-2",
  "brilliant-diamond-and-shining-pearl":
    "brilliant-diamond-shining-pearl"
};
const SCORING_VERSION_GROUP_MEMBERS = {
  "black-white": ["black", "white"],
  "black-2-white-2": [
    "black2",
    "white2",
    "black-2",
    "white-2"
  ],
  "x-y": ["x", "y"]
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

function delay(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function writeJson(filePath, value) {
  const contents = `${JSON.stringify(value, null, 2)}\n`;
  const retryableCodes = new Set([
    "EBUSY",
    "EACCES",
    "EPERM",
    "UNKNOWN"
  ]);

  await fs.mkdir(path.dirname(filePath), {
    recursive: true
  });

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    try {
      await fs.writeFile(filePath, contents);
      return;
    } catch (error) {
      if (
        attempt === 8 ||
        !retryableCodes.has(error?.code)
      ) {
        throw error;
      }

      await delay(150 * attempt);
    }
  }
}

function getScoringVersionGroup(versionGroup) {
  return (
    SCORING_VERSION_GROUP_ALIASES[
      versionGroup
    ] ?? versionGroup
  );
}

function normalizeCuratedIdSet(value) {
  if (Array.isArray(value)) {
    return new Set(
      value
        .map(Number)
        .filter(Number.isFinite)
    );
  }

  if (value && typeof value === "object") {
    return new Set(
      Object.entries(value)
        .filter(([, enabled]) => enabled)
        .map(([id]) => Number(id))
        .filter(Number.isFinite)
    );
  }

  return new Set();
}

function getCuratedSetForVersion({
  collection,
  versionGroup
}) {
  const scoringVersionGroup =
    getScoringVersionGroup(versionGroup);
  const sets = [
    collection?.global,
    collection?.[scoringVersionGroup],
    ...(
      SCORING_VERSION_GROUP_MEMBERS[
        scoringVersionGroup
      ] ?? []
    ).map(member => collection?.[member])
  ].map(normalizeCuratedIdSet);

  return new Set(
    sets.flatMap(set => [...set])
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

function getTierForPokemon({
  pokemonId,
  tierLists,
  versionGroup
}) {
  for (const tier of ["S", "A"]) {
    const tierSet =
      getCuratedSetForVersion({
        collection: tierLists?.[tier],
        versionGroup
      });

    if (tierSet.has(pokemonId)) {
      return tier;
    }
  }

  return null;
}

function getPlaythroughScore({
  baseStatTotal,
  inRegionalDex,
  tier,
  tradeEvolution,
  weights
}) {
  const regionalDex = inRegionalDex
    ? weights.regionalDex
    : 0;
  const notRegionalDex = inRegionalDex
    ? 0
    : weights.notRegionalDex;
  const tradeEvolutionScore = tradeEvolution
    ? weights.tradeEvolution
    : 0;
  const tierScore = getTierScore({
    tier,
    weights
  });
  const bst = getBstScore({
    baseStatTotal,
    weights
  });
  const total =
    regionalDex +
    notRegionalDex +
    tradeEvolutionScore +
    tierScore +
    bst;

  return {
    total,
    parts: {
      regionalDex,
      notRegionalDex,
      tradeEvolution: tradeEvolutionScore,
      tier: tierScore,
      bst
    }
  };
}

async function readPokemonBaseStats() {
  const files = (
    await fs.readdir(pokemonDataDir)
  ).filter(file => file.endsWith(".json"));
  const pokemon = [];
  const bstByPokemon = {};

  for (const file of files) {
    const data = await readJson(
      path.join(pokemonDataDir, file)
    );

    if (data?.isMythical) {
      continue;
    }

    const id = Number(data?.id);

    if (!Number.isFinite(id)) {
      continue;
    }

    const baseStatTotal = getBaseStatTotal(
      data.stats
    );

    pokemon.push({
      baseStatTotal,
      id,
      isLegendary:
        data.isLegendary === true,
      isMythical:
        data.isMythical === true,
      name: data.name
    });
    bstByPokemon[id] = baseStatTotal;
  }

  return {
    bstByPokemon,
    pokemon
  };
}

async function main() {
  const [
    regionalDexes,
    tradeEvolutions,
    tierLists,
    pokemonStats
  ] = await Promise.all([
    readJsonIfExists(
      path.join(scoringDir, "regionalDexes.json")
    ),
    readJsonIfExists(
      path.join(scoringDir, "tradeEvolutions.json")
    ),
    readJsonIfExists(
      path.join(scoringDir, "playthroughTierLists.json")
    ),
    readPokemonBaseStats()
  ]);
  const generatedAt = new Date().toISOString();
  const weights = {
    regionalDex:
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS.regionalDex,
    notRegionalDex:
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS.notRegionalDex,
    tradeEvolution:
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS.tradeEvolution,
    stabIceTypeBonus:
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS.stabIceTypeBonus,
    sTier:
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS.sTier,
    aTier:
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS.aTier,
    veryLowBst:
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS.veryLowBst,
    lowBst:
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS.lowBst,
    highBst:
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS.highBst
  };
  const playthroughScores = {
    schemaVersion: 1,
    generatedAt,
    weights,
    versionGroups: {}
  };

  await writeJson(
    path.join(scoringDir, "bst.json"),
    {
      schemaVersion: 1,
      generatedAt,
      pokemon: pokemonStats.bstByPokemon
    }
  );

  for (const versionGroup of VERSION_GROUP_ORDER) {
    const regionalDexIds =
      getCuratedSetForVersion({
        collection: regionalDexes,
        versionGroup
      });
    const tradePenaltyIds =
      getCuratedSetForVersion({
        collection: tradeEvolutions?.pokemon,
        versionGroup
      });
    const tradeExceptionIds =
      getCuratedSetForVersion({
        collection:
          tradeEvolutions?.exceptions,
        versionGroup
      });
    const entries = {};

    for (const pokemon of pokemonStats.pokemon) {
      const inRegionalDex =
        regionalDexIds.has(pokemon.id);
      const tier = getTierForPokemon({
        pokemonId: pokemon.id,
        tierLists,
        versionGroup
      });
      const tradeEvolution =
        tradePenaltyIds.has(pokemon.id) &&
        !tradeExceptionIds.has(pokemon.id);
      const score = getPlaythroughScore({
        baseStatTotal:
          pokemon.baseStatTotal,
        inRegionalDex,
        tier,
        tradeEvolution,
        weights
      });

      entries[pokemon.id] = {
        ...score,
        flags: {
          inRegionalDex,
          tier,
          tradeEvolution
        }
      };
    }

    playthroughScores.versionGroups[
      versionGroup
    ] = {
      pokemon: entries,
      pokemonCount:
        Object.keys(entries).length
    };
  }

  await writeJson(
    path.join(
      scoringDir,
      "playthroughScores.json"
    ),
    playthroughScores
  );

  console.log(
    `Generated playthrough scores at ${path.join(
      scoringDir,
      "playthroughScores.json"
    )}`
  );
}

main().catch(error => {
  console.error(
    "Failed to generate playthrough scores:",
    error
  );
  throw error;
});
