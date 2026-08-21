import {
  calculateRseFeebasFromValue
} from "./rseFeebasCalculator";
import {
  buildTileOverlapSummary,
  filterPriorityTiles
} from "./feebasPriorityMap";
import { getPlayerFacingLocationsForSpotId } from "./rseFeebasDisplayRules";

function coordinateKey(tile) {
  return `${tile.x}:${tile.y}`;
}

export function getUniqueReachableTiles(result) {
  const byCoordinate = new Map();
  const inaccessible = [];
  const underBridge = [];

  result.generatedSpotIds.forEach((spotId, index) => {
    const locations =
      getPlayerFacingLocationsForSpotId(spotId);

    if (locations.length === 0) {
      inaccessible.push({
        resultNumber: index + 1,
        spotId
      });
      return;
    }

    if (
      locations.some(
        location => location.displayRule === "underBridge"
      )
    ) {
      underBridge.push({
        resultNumber: index + 1,
        spotId,
        locationCount: locations.length
      });
    }

    locations.forEach(location => {
      const key = coordinateKey(location);
      const entry = byCoordinate.get(key) ?? {
        ...location,
        resultNumbers: [],
        spotIds: []
      };

      entry.resultNumbers.push(index + 1);
      entry.spotIds.push(spotId);
      byCoordinate.set(key, entry);
    });
  });

  return {
    tiles: [...byCoordinate.values()],
    inaccessible,
    underBridge
  };
}

export function buildPublicTileSet(value, index = 0) {
  const result = calculateRseFeebasFromValue(value);
  const reachable = getUniqueReachableTiles(result);

  return {
    setNumber: index + 1,
    value: result.feebasValue,
    result,
    reachableTiles: reachable.tiles,
    inaccessible: reachable.inaccessible,
    underBridge: reachable.underBridge
  };
}

function getDistance(left, right) {
  if (!left || !right) return 0;

  return (
    Math.abs(left.x - right.x) +
    Math.abs(left.y - right.y)
  );
}

export function buildRecommendedTileSequence(tileSets) {
  const overlapSummary = buildTileOverlapSummary(
    tileSets.map(tileSet => tileSet.value)
  );
  const overlapByCoordinate = new Map(
    overlapSummary.tiles.map(tile => [
      coordinateKey(tile),
      tile.count
    ])
  );
  const recommendationsByCoordinate = new Map();
  let previousTile = null;

  tileSets.forEach(tileSet => {
    const [bestTile] = [...tileSet.reachableTiles].sort(
      (left, right) => {
        const leftOverlap =
          overlapByCoordinate.get(coordinateKey(left)) ?? 1;
        const rightOverlap =
          overlapByCoordinate.get(coordinateKey(right)) ?? 1;

        if (rightOverlap !== leftOverlap) {
          return rightOverlap - leftOverlap;
        }

        const leftDistance = getDistance(left, previousTile);
        const rightDistance = getDistance(right, previousTile);

        if (leftDistance !== rightDistance) {
          return leftDistance - rightDistance;
        }

        if (left.y !== right.y) return left.y - right.y;
        return left.x - right.x;
      }
    );

    if (!bestTile) return;

    const key = coordinateKey(bestTile);
    const existing =
      recommendationsByCoordinate.get(key) ?? {
        ...bestTile,
        setNumbers: [],
        values: [],
        overlapCount:
          overlapByCoordinate.get(key) ?? 1
      };

    existing.setNumbers.push(tileSet.setNumber);
    existing.values.push(tileSet.value);
    recommendationsByCoordinate.set(key, existing);
    previousTile = bestTile;
  });

  return [...recommendationsByCoordinate.values()].map(
    (tile, index) => ({
      ...tile,
      rank: index + 1,
      label: String(index + 1),
      title: [
        `Recommended tile ${index + 1}`,
        `Covers possible set${tile.setNumbers.length === 1 ? "" : "s"} ${tile.setNumbers.join(", ")}`,
        `Appears in ${tile.overlapCount} possible pattern${tile.overlapCount === 1 ? "" : "s"}`
      ].join("\n")
    })
  );
}

export function buildPossibleTileSetResult(values) {
  const uniqueValues = [...new Set(values)];
  const tileSets = uniqueValues.map(buildPublicTileSet);
  const prioritySummary =
    buildTileOverlapSummary(uniqueValues);

  return {
    values: uniqueValues,
    tileSets,
    priorityTiles: prioritySummary.tiles,
    recommendedTiles:
      buildRecommendedTileSequence(tileSets)
  };
}

export function buildPublicPriorityResult(values, showMode) {
  const summary = buildTileOverlapSummary(values);
  const visibleTiles = filterPriorityTiles(summary.tiles, {
    showMode
  });
  const recommendedTiles = filterPriorityTiles(
    summary.tiles,
    {
      showMode: "top10"
    }
  ).map(tile => ({
    ...tile,
    label: String(tile.rank),
    title: [
      `Recommended tile ${tile.rank}`,
      `Appears in ${tile.count} possible Feebas pattern${tile.count === 1 ? "" : "s"}`
    ].join("\n")
  }));

  return {
    summary,
    visibleTiles,
    recommendedTiles
  };
}
