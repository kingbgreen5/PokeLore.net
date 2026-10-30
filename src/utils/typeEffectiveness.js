import typeChart from "../constants/Types.js";
import typeColors from "../constants/typeColors.js";

export const POKEMON_TYPES = Object.keys(
  typeColors
);

const multiplierLabels = new Map([
  [0, "0×"],
  [0.25, "¼×"],
  [0.5, "½×"],
  [1, "1×"],
  [2, "2×"],
  [4, "4×"]
]);

export function formatTypeName(type) {
  return String(type ?? "")
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export function formatDamageMultiplier(
  multiplier
) {
  return (
    multiplierLabels.get(multiplier) ??
    `${multiplier}×`
  );
}

export function getDefensiveDamageMultiplier({
  abilityEffects = [],
  attackType,
  types
}) {
  const normalizedAttackType = String(
    attackType ?? ""
  ).toLowerCase();
  const defendingTypes = (types ?? []).filter(
    type => POKEMON_TYPES.includes(type)
  );
  let multiplier = defendingTypes.reduce(
    (total, defenseType) =>
      total *
      (typeChart[normalizedAttackType]?.[
        defenseType
      ] ?? 1),
    1
  );

  for (const effect of abilityEffects) {
    if (
      effect.condition !== "always" ||
      (effect.attackTypes &&
        !effect.attackTypes.includes(
          normalizedAttackType
        ))
    ) {
      continue;
    }

    if (effect.effectType === "set-damage-multiplier") {
      multiplier = Number(effect.multiplier);
    }

    if (effect.effectType === "multiply-damage") {
      multiplier *= Number(effect.multiplier);
    }
  }

  return multiplier;
}

export function getDefensiveMatchups(
  types,
  {
    abilityEffects = [],
    includeNeutral = false
  } = {}
) {
  return POKEMON_TYPES.map(attackType => {
    const multiplier = getDefensiveDamageMultiplier({
      abilityEffects,
      attackType,
      types
    });

    return {
      type: attackType,
      typeName: formatTypeName(attackType),
      multiplier,
      multiplierLabel:
        formatDamageMultiplier(multiplier)
    };
  })
    .filter(
      matchup =>
        includeNeutral ||
        matchup.multiplier !== 1
    )
    .sort(
      (a, b) =>
        b.multiplier - a.multiplier ||
        a.type.localeCompare(b.type)
    );
}

export function getDefensiveMatchupGroups(
  types,
  options
) {
  const matchups =
    getDefensiveMatchups(types, options);
  const neutralMatchups =
    getDefensiveMatchups(types, {
      ...options,
      includeNeutral: true
    }).filter(
      matchup => matchup.multiplier === 1
    );

  const fourTimesWeaknesses =
    matchups.filter(
      matchup => matchup.multiplier === 4
    );
  const twoTimesWeaknesses =
    matchups.filter(
      matchup => matchup.multiplier === 2
    );
  const halfResistances =
    matchups.filter(
      matchup => matchup.multiplier === 0.5
    );
  const quarterResistances =
    matchups.filter(
      matchup => matchup.multiplier === 0.25
    );
  const immunities =
    matchups.filter(
      matchup => matchup.multiplier === 0
    );

  return {
    fourTimesWeaknesses,
    twoTimesWeaknesses,
    weaknesses: matchups.filter(
      matchup => matchup.multiplier > 1
    ),
    neutralMatchups,
    halfResistances,
    quarterResistances,
    resistances: [
      ...quarterResistances,
      ...halfResistances
    ],
    immunities
  };
}
