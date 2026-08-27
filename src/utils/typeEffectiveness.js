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

export function getDefensiveMatchups(
  types,
  {
    includeNeutral = false
  } = {}
) {
  const defendingTypes = (
    types ?? []
  ).filter(type =>
    POKEMON_TYPES.includes(type)
  );

  return POKEMON_TYPES.map(attackType => {
    const multiplier =
      defendingTypes.reduce(
        (total, defenseType) =>
          total *
          (typeChart[attackType]?.[
            defenseType
          ] ?? 1),
        1
      );

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
  types
) {
  const matchups =
    getDefensiveMatchups(types);
  const neutralMatchups =
    getDefensiveMatchups(types, {
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
    weaknesses: [
      ...fourTimesWeaknesses,
      ...twoTimesWeaknesses
    ],
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
