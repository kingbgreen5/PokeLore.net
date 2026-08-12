import { VERSION_GROUP_ORDER } from "../constants/versionOrder.js";

export const ALL_POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy"
];

export const LEVEL_UP_MOVE_LEVEL_THRESHOLDS = [
  10,
  15,
  20,
  25,
  30,
  35,
  40,
  45,
  50,
  55,
  60,
  65,
  70,
  75,
  80,
  85,
  90,
  95,
  100
];

export const DEFAULT_TEAM_RECOMMENDATION_WEIGHTS = {
  coverageType: 0.2,
  normalTypeQualifier: 0.4,
  stabIceTypeBonus: 0.3,
  regionalDex: 0.5,
  notRegionalDex: -0.5,
  tradeEvolution: -0.5,
  sTier: 0.3,
  aTier: 0.2,
  lowBst: -0.3,
  highBst: 0.3
};
export const TEAM_RECOMMENDATION_WEIGHTS_STORAGE_KEY =
  "pokelore:team-coverage-recommendation-score-weights:v1";

const FAIRY_INTRO_VERSION_GROUP = "x-y";
const LEARNSET_VERSION_GROUP_ALIASES = {
  "the-isle-of-armor": "sword-shield",
  "the-crown-tundra": "sword-shield",
  "the-teal-mask": "scarlet-violet",
  "the-indigo-disk": "scarlet-violet",
  "brilliant-diamond-and-shining-pearl":
    "brilliant-diamond-shining-pearl"
};

export function getTypesForVersionGroup(
  versionGroup
) {
  const selectedIndex =
    VERSION_GROUP_ORDER.indexOf(versionGroup);
  const fairyIntroIndex =
    VERSION_GROUP_ORDER.indexOf(
      FAIRY_INTRO_VERSION_GROUP
    );
  const includesFairy =
    selectedIndex === -1 ||
    fairyIntroIndex === -1 ||
    selectedIndex >= fairyIntroIndex;

  return includesFairy
    ? ALL_POKEMON_TYPES
    : ALL_POKEMON_TYPES.filter(
        type => type !== "fairy"
      );
}

export function formatVersionGroupName(value = "") {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" / ");
}

export function isDamagingMove(move) {
  const category = String(
    move?.category ?? ""
  ).toLowerCase();

  return category === "physical" || category === "special";
}

export function getLevelUpAttackTypes({
  consideredTypes = ALL_POKEMON_TYPES,
  includeMachineMoves = false,
  learnset,
  maxMoveLevel = 0,
  minMovePower = 0,
  movesByName,
  versionGroup
}) {
  const attackTypePowers =
    getLevelUpAttackTypePowers({
      consideredTypes,
      includeMachineMoves,
      learnset,
      maxMoveLevel,
      minMovePower,
      movesByName,
      versionGroup
    });

  return consideredTypes.filter(type =>
    Object.hasOwn(attackTypePowers, type)
  );
}

export function getLevelUpAttackTypePowers({
  consideredTypes = ALL_POKEMON_TYPES,
  includeMachineMoves = false,
  learnset,
  maxMoveLevel = 0,
  minMovePower = 0,
  movesByName,
  versionGroup
}) {
  const attackTypePowers = {};
  const attackTypePowerLevels =
    getLevelUpAttackTypePowerLevels({
      consideredTypes,
      includeMachineMoves,
      learnset,
      minMovePower,
      movesByName,
      versionGroup
    });
  const levelCap =
    Number(maxMoveLevel) || 0;

  for (const [
    attackType,
    powerLevels
  ] of Object.entries(attackTypePowerLevels)) {
    const availablePowerLevels =
      levelCap > 0
        ? powerLevels.filter(
            entry => entry.level <= levelCap
          )
        : powerLevels;
    const strongestEntry =
      availablePowerLevels[
        availablePowerLevels.length - 1
      ];

    if (strongestEntry) {
      attackTypePowers[attackType] =
        strongestEntry.power;
    }
  }

  return attackTypePowers;
}

export function getLevelUpAttackTypePowerLevels({
  consideredTypes = ALL_POKEMON_TYPES,
  includeMachineMoves = false,
  learnset,
  minMovePower = 0,
  movesByName,
  versionGroup
}) {
  const attackTypeLevels = {};
  const consideredTypeSet =
    new Set(consideredTypes);
  const learnsetVersionGroup =
    LEARNSET_VERSION_GROUP_ALIASES[
      versionGroup
    ] ?? versionGroup;

  for (const learnsetMove of learnset?.moves ?? []) {
    const isIncludedMethod =
      learnsetMove.method === "level-up" ||
      (includeMachineMoves &&
        learnsetMove.method === "machine");

    if (
      !isIncludedMethod ||
      learnsetMove.versionGroup !== learnsetVersionGroup
    ) {
      continue;
    }

    const learnedLevel =
      Number(learnsetMove.level) || 0;

    const move = movesByName?.[learnsetMove.move];
    const movePower =
      Number(move?.power) || 0;

    const moveType = String(
      move?.type ?? ""
    ).toLowerCase();

    if (
      !isDamagingMove(move) ||
      movePower < minMovePower ||
      !moveType ||
      !consideredTypeSet.has(moveType)
    ) {
      continue;
    }

    attackTypeLevels[moveType] ??= {};
    attackTypeLevels[moveType][learnedLevel] =
      Math.max(
        attackTypeLevels[moveType][
          learnedLevel
        ] ?? 0,
        movePower
      );
  }

  return Object.fromEntries(
    Object.entries(attackTypeLevels).map(
      ([attackType, levelPowers]) => {
        let strongestPower = 0;
        const powerLevels = Object.entries(
          levelPowers
        )
          .map(([level, power]) => ({
            level: Number(level),
            power
          }))
          .sort((a, b) => a.level - b.level)
          .reduce((entries, entry) => {
            strongestPower = Math.max(
              strongestPower,
              entry.power
            );

            if (
              !entries.length ||
              strongestPower >
                entries[entries.length - 1]
                  .power
            ) {
              entries.push({
                level: entry.level,
                power: strongestPower
              });
            }

            return entries;
          }, []);

        return [attackType, powerLevels];
      }
    )
  );
}

export function getCoveredDefenseTypes({
  attackTypes,
  consideredTypes = ALL_POKEMON_TYPES,
  typeChart
}) {
  const coveredTypes = new Set();

  for (const attackType of attackTypes ?? []) {
    const matchups =
      typeChart?.[attackType] ?? {};

    for (const defenseType of consideredTypes) {
      if (matchups[defenseType] === 2) {
        coveredTypes.add(defenseType);
      }
    }
  }

  return consideredTypes.filter(type =>
    coveredTypes.has(type)
  );
}

export function getMissingDefenseTypes({
  consideredTypes = ALL_POKEMON_TYPES,
  coveredTypes
}) {
  const covered = new Set(coveredTypes);

  return consideredTypes.filter(
    type => !covered.has(type)
  );
}

export function getDefensiveCoverageTypes({
  consideredTypes = ALL_POKEMON_TYPES,
  defenseTypes,
  typeChart
}) {
  const breakdown =
    getDefensiveCoverageBreakdown({
      consideredTypes,
      defenseTypes,
      typeChart
    });

  return [
    ...breakdown.immunities,
    ...breakdown.fourTimesResistances,
    ...breakdown.twoTimesResistances
  ];
}

export function getDefensiveCoverageBreakdown({
  consideredTypes = ALL_POKEMON_TYPES,
  defenseTypes,
  typeChart
}) {
  const defendingTypes = (
    defenseTypes ?? []
  ).filter(type =>
    consideredTypes.includes(type)
  );

  if (!defendingTypes.length) {
    return {
      immunities: [],
      fourTimesResistances: [],
      twoTimesResistances: []
    };
  }

  return consideredTypes.reduce(
    (groups, attackType) => {
      const multiplier = defendingTypes.reduce(
        (total, defenseType) =>
          total *
          (typeChart?.[attackType]?.[
            defenseType
          ] ?? 1),
        1
      );

      if (multiplier === 0) {
        groups.immunities.push(attackType);
      } else if (multiplier <= 0.25) {
        groups.fourTimesResistances.push(
          attackType
        );
      } else if (multiplier < 1) {
        groups.twoTimesResistances.push(
          attackType
        );
      }

      return groups;
    },
    {
      immunities: [],
      fourTimesResistances: [],
      twoTimesResistances: []
    }
  );
}

export function getTeamDefensiveCoverageTypes({
  consideredTypes = ALL_POKEMON_TYPES,
  teamTypeSets,
  typeChart
}) {
  const coveredTypes = new Set();

  for (const defenseTypes of teamTypeSets ?? []) {
    for (const attackType of getDefensiveCoverageTypes({
      consideredTypes,
      defenseTypes,
      typeChart
    })) {
      coveredTypes.add(attackType);
    }
  }

  return consideredTypes.filter(type =>
    coveredTypes.has(type)
  );
}

export function normalizeRecommendationWeights(
  value = {}
) {
  return Object.fromEntries(
    Object.entries(
      DEFAULT_TEAM_RECOMMENDATION_WEIGHTS
    ).map(([key, defaultValue]) => {
      const parsed = Number(value?.[key]);

      return [
        key,
        Number.isFinite(parsed)
          ? parsed
          : defaultValue
      ];
    })
  );
}

export function getBstScore({
  baseStatTotal,
  weights
}) {
  const bst = Number(baseStatTotal) || 0;

  if (bst < 410) {
    return weights.lowBst;
  }

  if (bst > 490) {
    return weights.highBst;
  }

  return 0;
}

export function getTierScore({
  tier,
  weights
}) {
  const normalizedTier = String(
    tier ?? ""
  ).toUpperCase();

  if (normalizedTier === "S") {
    return weights.sTier;
  }

  if (normalizedTier === "A") {
    return weights.aTier;
  }

  return 0;
}

export function getTeamRecommendationScore({
  includeTradeEvolutionPenalty = true,
  pokemon,
  weights: rawWeights
}) {
  const weights =
    normalizeRecommendationWeights(rawWeights);
  const selectedCoverageScore =
    Number(pokemon?.coverageScore);
  const offensiveCoverageCount =
    pokemon?.missingHits?.length ?? 0;
  const defensiveCoverageCount =
    pokemon?.missingDefensiveHits?.length ?? 0;
  const coverageContribution =
    (Number.isFinite(selectedCoverageScore)
      ? selectedCoverageScore
      : offensiveCoverageCount +
        defensiveCoverageCount) *
    weights.coverageType;
  const generatedPlaythroughScore =
    pokemon?.playthroughScore;
  const generatedFlags =
    generatedPlaythroughScore?.flags ?? {};
  const rawFlags =
    pokemon?.playthroughFlags ?? {};
  const playthroughFlags = {
    inRegionalDex:
      typeof rawFlags.inRegionalDex ===
      "boolean"
        ? rawFlags.inRegionalDex
        : generatedFlags.inRegionalDex ===
          true,
    tier:
      rawFlags.tier ??
      generatedFlags.tier ??
      null,
    tradeEvolution:
      typeof rawFlags.tradeEvolution ===
      "boolean"
        ? rawFlags.tradeEvolution
        : generatedFlags.tradeEvolution ===
          true
  };
  const regionalDexContribution =
    playthroughFlags.inRegionalDex
      ? weights.regionalDex
      : 0;
  const notRegionalDexContribution =
    playthroughFlags.inRegionalDex
      ? 0
      : weights.notRegionalDex;
  const tradeEvolutionContribution =
    includeTradeEvolutionPenalty &&
    playthroughFlags.tradeEvolution
      ? weights.tradeEvolution
      : 0;
  const normalTypeQualifierContribution =
    pokemon?.normalTypeQualifierEligible
      ? weights.normalTypeQualifier
      : 0;
  const stabIceTypeBonusContribution =
    pokemon?.stabIceTypeBonusEligible
      ? weights.stabIceTypeBonus
      : 0;
  const tierContribution = getTierScore({
    tier: playthroughFlags.tier,
    weights
  });
  const bstContribution = getBstScore({
    baseStatTotal: pokemon?.baseStatTotal,
    weights
  });
  const playthroughContribution =
    regionalDexContribution +
    notRegionalDexContribution +
    tradeEvolutionContribution +
    normalTypeQualifierContribution +
    stabIceTypeBonusContribution +
    tierContribution +
    bstContribution;
  const total =
    coverageContribution +
    playthroughContribution;

  return {
    total,
    parts: {
      coverage: coverageContribution,
      playthrough: playthroughContribution,
      regionalDex: regionalDexContribution,
      notRegionalDex:
        notRegionalDexContribution,
      tradeEvolution:
        tradeEvolutionContribution,
      normalTypeQualifier:
        normalTypeQualifierContribution,
      stabIceTypeBonus:
        stabIceTypeBonusContribution,
      tier: tierContribution,
      bst: bstContribution
    },
    flags: playthroughFlags
  };
}
