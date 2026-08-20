import { calculateRseFeebasFromValue } from "./rseFeebasCalculator";

export const PRIORITY_TIER_HIGH = "high";
export const PRIORITY_TIER_MEDIUM = "medium";
export const PRIORITY_TIER_LOW = "low";
export const PRIORITY_TIER_LABELS = {
  [PRIORITY_TIER_HIGH]: "High Priority",
  [PRIORITY_TIER_MEDIUM]: "Medium Priority",
  [PRIORITY_TIER_LOW]: "Low Priority"
};

function normalizeFeebasValue(value) {
  if (typeof value === "number") {
    return (value & 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, "0");
  }

  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^0X/, "")
    .padStart(4, "0");
}

function coordinateKey(tile) {
  return `${tile.x}:${tile.y}`;
}

function summarizeTiles(tilesByCoordinate, values) {
  const tiles = [...tilesByCoordinate.values()].map(tile => ({
    ...tile,
    overlapCount: tile.count,
    coverageFraction:
      values.length === 0 ? 0 : tile.count / values.length
  }));

  const maxOverlapCount = tiles.reduce(
    (max, tile) => Math.max(max, tile.count),
    0
  );
  const totalOverlapCount = tiles.reduce(
    (sum, tile) => sum + tile.count,
    0
  );
  const averageOverlap =
    tiles.length === 0 ? 0 : totalOverlapCount / tiles.length;

  return {
    totalCandidateValues: values.length,
    candidateValues: values,
    totalUniqueTiles: tiles.length,
    maxOverlapCount,
    averageOverlap,
    tiles
  };
}

export function buildPriorityTiers(summary) {
  const maxOverlapCount =
    summary?.maxOverlapCount ?? 0;

  if (maxOverlapCount <= 0) {
    return {
      highThreshold: 0,
      mediumThreshold: 0,
      method:
        "relative max overlap thresholds: high >= ceil(max * 0.67), medium >= ceil(max * 0.34)"
    };
  }

  return {
    highThreshold: Math.max(
      1,
      Math.ceil(maxOverlapCount * 0.67)
    ),
    mediumThreshold: Math.max(
      1,
      Math.ceil(maxOverlapCount * 0.34)
    ),
    method:
      "relative max overlap thresholds: high >= ceil(max * 0.67), medium >= ceil(max * 0.34)"
  };
}

function getPriorityTier(count, tiers) {
  if (count >= tiers.highThreshold) {
    return PRIORITY_TIER_HIGH;
  }

  if (count >= tiers.mediumThreshold) {
    return PRIORITY_TIER_MEDIUM;
  }

  return PRIORITY_TIER_LOW;
}

export function rankPriorityTiles(tiles) {
  return [...tiles]
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      if (left.y !== right.y) {
        return left.y - right.y;
      }

      return left.x - right.x;
    })
    .map((tile, index) => ({
      ...tile,
      rank: index + 1
    }));
}

export function buildPriorityLegend(summary) {
  const tiers = buildPriorityTiers(summary);
  const tierCounts = {
    [PRIORITY_TIER_HIGH]: 0,
    [PRIORITY_TIER_MEDIUM]: 0,
    [PRIORITY_TIER_LOW]: 0
  };

  summary.tiles.forEach(tile => {
    tierCounts[tile.priorityTier] += 1;
  });

  return {
    method: tiers.method,
    maxOverlapCount: summary.maxOverlapCount,
    high: {
      label: PRIORITY_TIER_LABELS[PRIORITY_TIER_HIGH],
      threshold: tiers.highThreshold,
      tileCount: tierCounts[PRIORITY_TIER_HIGH]
    },
    medium: {
      label: PRIORITY_TIER_LABELS[PRIORITY_TIER_MEDIUM],
      threshold: tiers.mediumThreshold,
      tileCount: tierCounts[PRIORITY_TIER_MEDIUM]
    },
    low: {
      label: PRIORITY_TIER_LABELS[PRIORITY_TIER_LOW],
      threshold: 1,
      tileCount: tierCounts[PRIORITY_TIER_LOW]
    }
  };
}

export function buildTileOverlapSummary(candidateValues) {
  const uniqueValues = [
    ...new Set(
      candidateValues
        .map(normalizeFeebasValue)
        .filter(value => /^[0-9A-F]{4}$/.test(value))
    )
  ];
  const tilesByCoordinate = new Map();

  uniqueValues.forEach((value, candidateIndex) => {
    const result = calculateRseFeebasFromValue(value);

    result.coordinates.forEach(tile => {
      const key = coordinateKey(tile);
      const existing = tilesByCoordinate.get(key) ?? {
        x: tile.x,
        y: tile.y,
        count: 0,
        candidateIndexes: [],
        candidateValues: [],
        spotIds: []
      };

      existing.count += 1;
      existing.candidateIndexes.push(candidateIndex);
      existing.candidateValues.push(value);
      existing.spotIds.push(tile.spotId);
      tilesByCoordinate.set(key, existing);
    });
  });

  const summary = summarizeTiles(
    tilesByCoordinate,
    uniqueValues
  );
  const tiers = buildPriorityTiers(summary);
  const rankedTiles = rankPriorityTiles(
    summary.tiles.map(tile => ({
      ...tile,
      priorityTier: getPriorityTier(tile.count, tiers),
      displayIntensity:
        summary.maxOverlapCount === 0
          ? 0
          : tile.count / summary.maxOverlapCount
    }))
  );
  const tierCounts = rankedTiles.reduce(
    (counts, tile) => ({
      ...counts,
      [tile.priorityTier]:
        counts[tile.priorityTier] + 1
    }),
    {
      [PRIORITY_TIER_HIGH]: 0,
      [PRIORITY_TIER_MEDIUM]: 0,
      [PRIORITY_TIER_LOW]: 0
    }
  );

  return {
    ...summary,
    tiles: rankedTiles,
    tiers,
    tierCounts,
    legend: buildPriorityLegend({
      ...summary,
      tiles: rankedTiles
    })
  };
}

export function filterPriorityTiles(
  tiles,
  {
    showMode = "all",
    minimumOverlap = 1
  } = {}
) {
  const min = Math.max(1, Number(minimumOverlap) || 1);
  let filtered = tiles.filter(tile => tile.count >= min);

  if (showMode === "top10") {
    filtered = filtered.slice(0, 10);
  } else if (showMode === "top25") {
    filtered = filtered.slice(0, 25);
  } else if (showMode === "top50") {
    filtered = filtered.slice(0, 50);
  } else if (showMode === "high") {
    filtered = filtered.filter(
      tile => tile.priorityTier === PRIORITY_TIER_HIGH
    );
  }

  return filtered;
}
