export const STAT_FILTER_FIELDS = [
  {
    key: "baseStatTotal",
    label: "BST"
  },
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

function getPokemonStat(pokemon, key) {
  if (key === "baseStatTotal") {
    return Number(pokemon?.baseStatTotal) || 0;
  }

  return Number(pokemon?.stats?.[key]) || 0;
}

export function normalizeStatFilters(filters = {}) {
  return Object.fromEntries(
    STAT_FILTER_FIELDS.map(field => [
      field.key,
      String(filters?.[field.key] ?? "")
    ])
  );
}

export function hasActiveStatFilters(filters = {}) {
  return STAT_FILTER_FIELDS.some(field => {
    const value = Number(filters?.[field.key]);

    return Number.isFinite(value) && value > 0;
  });
}

export function pokemonPassesStatFilters(
  pokemon,
  filters = {}
) {
  return STAT_FILTER_FIELDS.every(field => {
    const minimum = Number(filters?.[field.key]);

    if (
      !Number.isFinite(minimum) ||
      minimum <= 0
    ) {
      return true;
    }

    return getPokemonStat(pokemon, field.key) >= minimum;
  });
}
