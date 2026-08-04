import {
  DPPT_GREAT_MARSH_GAME_TABLES,
  DPPT_GREAT_MARSH_VALUE_COUNT
} from "../data/feebas/dpptGreatMarshPokemon";

function toUint32(value) {
  return value >>> 0;
}

function assertGreatMarshTablesComplete() {
  for (const [game, table] of Object.entries(
    DPPT_GREAT_MARSH_GAME_TABLES
  )) {
    if (
      !Array.isArray(table.pokemonIds) ||
      table.pokemonIds.length !== DPPT_GREAT_MARSH_VALUE_COUNT
    ) {
      throw new Error(
        `Great Marsh ${game} table must contain 32 values.`
      );
    }
  }
}

export function getDpptGreatMarshAreaValues(groupSeed) {
  const unsignedSeed = toUint32(groupSeed);

  return [
    (unsignedSeed >>> 0) & 0x1f,
    (unsignedSeed >>> 5) & 0x1f,
    (unsignedSeed >>> 10) & 0x1f,
    (unsignedSeed >>> 15) & 0x1f,
    (unsignedSeed >>> 20) & 0x1f,
    (unsignedSeed >>> 25) & 0x1f
  ];
}

function calculateVersionResults(areaValues, game) {
  const table = DPPT_GREAT_MARSH_GAME_TABLES[game];

  if (!table) {
    throw new Error(`Unknown Great Marsh game table: ${game}.`);
  }

  return areaValues.map((value, index) => ({
    area: index + 1,
    value,
    pokemonId: table.pokemonIds[value]
  }));
}

export function calculateDpptGreatMarshResults(groupSeed) {
  assertGreatMarshTablesComplete();

  const normalizedSeed = toUint32(groupSeed);
  const areaValues =
    getDpptGreatMarshAreaValues(normalizedSeed);

  return {
    groupSeed: normalizedSeed,
    areaValues,
    platinum: calculateVersionResults(areaValues, "platinum"),
    diamondPearl: calculateVersionResults(
      areaValues,
      "diamondPearl"
    )
  };
}

export function calculateDpptGreatMarshCandidateResults(
  candidates = []
) {
  return candidates.map((candidate, index) => ({
    candidateNumber: candidate.candidateNumber ?? index + 1,
    groupSeedUnsigned: candidate.groupSeedUnsigned,
    colorRole: index === 0 ? "primary" : "secondary",
    results: calculateDpptGreatMarshResults(
      candidate.groupSeedUnsigned
    )
  }));
}

export { DPPT_GREAT_MARSH_GAME_TABLES };
