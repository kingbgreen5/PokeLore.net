import {
  sortVersionGroups
} from "../constants/versionOrder.js";

export const LEARNSET_METHOD_ORDER = [
  "level-up",
  "machine",
  "tutor",
  "egg"
];

export function formatLearnsetLabel(text) {
  return String(text ?? "")
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export function formatVersionGroupName(
  versionGroup
) {
  return versionGroup === "all"
    ? "All Generations"
    : formatLearnsetLabel(versionGroup);
}

export function getLearnsetVersionGroups(
  learnset
) {
  return [
    "all",
    ...sortVersionGroups(
      new Set(
        (learnset?.moves ?? []).map(
          move => move.versionGroup
        )
      )
    )
  ];
}

export function getSelectedLearnsetVersionGroup(
  learnset,
  preferredVersion = "all"
) {
  const versionGroups =
    getLearnsetVersionGroups(learnset);

  return versionGroups.includes(
    preferredVersion
  )
    ? preferredVersion
    : "all";
}

export function getLearnsetMovesForVersion(
  learnset,
  selectedVersion = "all"
) {
  const moves = learnset?.moves ?? [];

  return selectedVersion === "all"
    ? moves
    : moves.filter(
        move =>
          move.versionGroup ===
          selectedVersion
      );
}

export function hasLearnsetMoves(learnset) {
  return Boolean(learnset?.moves?.length);
}

export function groupLearnsetMovesByMethod(
  moves = []
) {
  return moves.reduce((acc, move) => {
    if (!acc[move.method]) {
      acc[move.method] = [];
    }

    acc[move.method].push(move);
    return acc;
  }, {});
}

export function condenseDuplicateLearnsetMoves(
  moves = []
) {
  const condensedMap = {};

  for (const move of moves) {
    const key = `${move.move}-${move.level}`;

    if (!condensedMap[key]) {
      condensedMap[key] = move;
    }
  }

  return Object.values(condensedMap);
}

export function sortLearnsetMovesByLevel(
  moves = []
) {
  return [...moves].sort(
    (a, b) =>
      Number(a.level ?? 0) -
      Number(b.level ?? 0)
  );
}

export function getSortedCondensedLearnsetMoves(
  moves = []
) {
  return sortLearnsetMovesByLevel(
    condenseDuplicateLearnsetMoves(moves)
  );
}

export function getLearnsetMovesForMethod(
  learnset,
  {
    versionGroup = "all",
    method
  } = {}
) {
  return getSortedCondensedLearnsetMoves(
    getLearnsetMovesForVersion(
      learnset,
      versionGroup
    ).filter(
      move => move.method === method
    )
  );
}

export function getLatestAvailableVersionGroup(
  learnset
) {
  return (
    sortVersionGroups(
      new Set(
        (learnset?.moves ?? [])
          .map(move => move.versionGroup)
          .filter(Boolean)
      )
    ).at(-1) ?? null
  );
}

export function formatLearnsetLevel(level) {
  return Number(level) > 0
    ? String(level)
    : "-";
}

export function formatMoveDisplayName(
  moveName,
  movesData = null
) {
  return (
    movesData?.[moveName]?.displayName ??
    formatLearnsetLabel(moveName)
  );
}

export function getLatestLevelUpLearnsetPreview(
  learnset,
  movesData = null,
  {
    pokemonId = learnset?.id ?? null,
    pokemon = learnset?.pokemon ?? null
  } = {}
) {
  const versionGroup =
    getLatestAvailableVersionGroup(learnset);
  const rows = versionGroup
    ? getLearnsetMovesForMethod(
        learnset,
        {
          versionGroup,
          method: "level-up"
        }
      )
    : [];

  return {
    pokemonId,
    pokemon,
    summaryMoveCount:
      getLearnsetMovesForVersion(
        learnset,
        "all"
      ).length,
    versionGroup,
    versionLabel: versionGroup
      ? formatVersionGroupName(
          versionGroup
        )
      : null,
    rows: rows.map(move => ({
      level: Number(move.level ?? 0),
      levelLabel:
        formatLearnsetLevel(move.level),
      move: move.move,
      moveLabel:
        formatMoveDisplayName(
          move.move,
          movesData
        )
    }))
  };
}

export function getLearnsetCandidateIds(
  pokemon
) {
  const ids = [];

  if (pokemon?.id) {
    ids.push(pokemon.id);
  }

  const defaultVariety =
    pokemon?.varieties?.find(
      variety =>
        variety.isDefault ||
        variety.name === pokemon.species
    );

  if (defaultVariety?.id) {
    ids.push(defaultVariety.id);
  }

  return [
    ...new Set(
      ids.map(Number).filter(Boolean)
    )
  ];
}
