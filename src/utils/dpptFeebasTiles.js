import dpptFeebasTileData from "../data/feebas/dpptFeebasFishableTiles.json";

export const DPPT_FEEBAS_GRID_WIDTH = 18;
export const DPPT_FEEBAS_GRID_HEIGHT = 34;
export const DPPT_FEEBAS_TOTAL_GRID_SQUARES =
  DPPT_FEEBAS_GRID_WIDTH * DPPT_FEEBAS_GRID_HEIGHT;
export const DPPT_FEEBAS_TILE_COUNT = 528;
export const DPPT_FEEBAS_GROUP_SIZE = 132;
export const DPPT_FEEBAS_MAP_IMAGE_SRC =
  "/images/maps/mt-coronet-feebas-lake.png";
export const DPPT_FEEBAS_ALIGNMENT_BASE_WIDTH = 620;
export const DPPT_FEEBAS_ALIGNMENT_BASE_HEIGHT =
  DPPT_FEEBAS_ALIGNMENT_BASE_WIDTH *
  (DPPT_FEEBAS_GRID_HEIGHT / DPPT_FEEBAS_GRID_WIDTH);
export const dpptFeebasMapImageAlignment =
  dpptFeebasTileData.imageAlignment ?? {
    offsetX: 0,
    offsetY: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1
  };

export const DPPT_FEEBAS_GROUP_RANGES = [
  {
    result: 1,
    min: 0,
    max: 131
  },
  {
    result: 2,
    min: 132,
    max: 263
  },
  {
    result: 3,
    min: 264,
    max: 395
  },
  {
    result: 4,
    min: 396,
    max: 527
  }
];

export const DPPT_FEEBAS_BOUNDARY_INDEXES = [
  0,
  131,
  132,
  263,
  264,
  395,
  396,
  527
];

function coordinateKey(tile) {
  return `${tile.x}:${tile.y}`;
}

function isIntegerInRange(value, min, max) {
  return (
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

export function getFeebasGroup(index) {
  if (
    !isIntegerInRange(
      index,
      0,
      DPPT_FEEBAS_TILE_COUNT - 1
    )
  ) {
    throw new RangeError(
      `Feebas index must be an integer from 0 to 527; received ${index}.`
    );
  }

  return (
    Math.floor(index / DPPT_FEEBAS_GROUP_SIZE) + 1
  );
}

export function getFeebasIndexWithinGroup(index) {
  if (
    !isIntegerInRange(
      index,
      0,
      DPPT_FEEBAS_TILE_COUNT - 1
    )
  ) {
    throw new RangeError(
      `Feebas index must be an integer from 0 to 527; received ${index}.`
    );
  }

  return index % DPPT_FEEBAS_GROUP_SIZE;
}

export function getFeebasTileStyle(tile) {
  return {
    left: `${(tile.x / DPPT_FEEBAS_GRID_WIDTH) * 100}%`,
    top: `${(tile.y / DPPT_FEEBAS_GRID_HEIGHT) * 100}%`,
    width: `${100 / DPPT_FEEBAS_GRID_WIDTH}%`,
    height: `${100 / DPPT_FEEBAS_GRID_HEIGHT}%`
  };
}

export function getFeebasMapImageStyle(
  alignment = dpptFeebasMapImageAlignment
) {
  return {
    left: `${(alignment.offsetX / DPPT_FEEBAS_ALIGNMENT_BASE_WIDTH) * 100}%`,
    top: `${(alignment.offsetY / DPPT_FEEBAS_ALIGNMENT_BASE_HEIGHT) * 100}%`,
    width: `${alignment.scaleX * 100}%`,
    height: `${alignment.scaleY * 100}%`,
    opacity: alignment.opacity
  };
}

export function getExcludedFeebasGridCells(
  tiles = dpptFeebasTiles
) {
  const fishableCoordinates = new Set(
    tiles.map(tile => coordinateKey(tile))
  );
  const excludedCells = [];

  for (
    let y = 0;
    y < DPPT_FEEBAS_GRID_HEIGHT;
    y += 1
  ) {
    for (
      let x = 0;
      x < DPPT_FEEBAS_GRID_WIDTH;
      x += 1
    ) {
      const cell = {
        x,
        y
      };

      if (!fishableCoordinates.has(coordinateKey(cell))) {
        excludedCells.push(cell);
      }
    }
  }

  return excludedCells;
}

export const dpptFeebasExcludedGridCells =
  getExcludedFeebasGridCells(dpptFeebasTileData.tiles);

function getTileDistanceScore(tile, origin) {
  const dx = Math.abs(tile.x - origin.x);
  const dy = Math.abs(tile.y - origin.y);

  return {
    chebyshev: Math.max(dx, dy),
    manhattan: dx + dy,
    squared: dx * dx + dy * dy
  };
}

export function getFeebasSearchArea(
  index,
  {
    size = 9
  } = {}
) {
  if (![9, 12, 16].includes(size)) {
    throw new RangeError(
      `Feebas search area size must be 9, 12, or 16; received ${size}.`
    );
  }

  const exactTile = getFeebasTileByIndex(index);
  const areaTiles = [...dpptFeebasTiles]
    .sort((first, second) => {
      const firstScore = getTileDistanceScore(
        first,
        exactTile
      );
      const secondScore = getTileDistanceScore(
        second,
        exactTile
      );

      return (
        firstScore.chebyshev - secondScore.chebyshev ||
        firstScore.manhattan - secondScore.manhattan ||
        firstScore.squared - secondScore.squared ||
        first.y - second.y ||
        first.x - second.x ||
        first.index - second.index
      );
    })
    .slice(0, size);

  return {
    exactIndex: exactTile.index,
    exactCoordinate: {
      x: exactTile.x,
      y: exactTile.y
    },
    size,
    indexes: areaTiles.map(tile => tile.index),
    tiles: areaTiles
  };
}

function hashSearchAreaSeed(seed) {
  const seedText = String(seed ?? "");
  let hash = 0x811c9dc5;

  for (let index = 0; index < seedText.length; index += 1) {
    hash ^= seedText.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash;
}

export function getFeebasOffsetSearchArea(
  index,
  {
    size = 9,
    seed = ""
  } = {}
) {
  if (![9, 12, 16].includes(size)) {
    throw new RangeError(
      `Feebas search area size must be 9, 12, or 16; received ${size}.`
    );
  }

  const exactTile = getFeebasTileByIndex(index);
  const centerCandidates = [...dpptFeebasTiles]
    .filter(tile => {
      const score = getTileDistanceScore(tile, exactTile);

      return (
        tile.index !== exactTile.index &&
        score.chebyshev <= 2 &&
        score.manhattan <= 3
      );
    })
    .map(tile => ({
      center: tile,
      area: getFeebasSearchArea(tile.index, {
        size
      })
    }))
    .filter(candidate =>
      candidate.area.indexes.includes(exactTile.index)
    )
    .sort((first, second) => {
      const firstScore = getTileDistanceScore(
        first.center,
        exactTile
      );
      const secondScore = getTileDistanceScore(
        second.center,
        exactTile
      );

      return (
        firstScore.chebyshev - secondScore.chebyshev ||
        firstScore.manhattan - secondScore.manhattan ||
        firstScore.squared - secondScore.squared ||
        first.center.y - second.center.y ||
        first.center.x - second.center.x ||
        first.center.index - second.center.index
      );
    });

  if (centerCandidates.length === 0) {
    return getFeebasSearchArea(index, {
      size
    });
  }

  const selectedIndex =
    hashSearchAreaSeed(seed) % centerCandidates.length;

  return {
    ...centerCandidates[selectedIndex].area,
    exactIndex: exactTile.index,
    exactCoordinate: {
      x: exactTile.x,
      y: exactTile.y
    },
    displayCenterIndex:
      centerCandidates[selectedIndex].center.index,
    displayCenterCoordinate: {
      x: centerCandidates[selectedIndex].center.x,
      y: centerCandidates[selectedIndex].center.y
    }
  };
}

export function validateFeebasTileDataset(data) {
  const errors = [];
  const tiles = Array.isArray(data?.tiles)
    ? data.tiles
    : [];
  const seenIndexes = new Set();
  const seenCoordinates = new Set();
  const missingIndexes = [];
  const duplicateIndexes = [];
  const duplicateCoordinates = [];
  const outOfBoundsCoordinates = [];
  const excludedGridCells =
    DPPT_FEEBAS_TOTAL_GRID_SQUARES - tiles.length;

  if (data?.gridWidth !== DPPT_FEEBAS_GRID_WIDTH) {
    errors.push("Grid width must be 18.");
  }

  if (data?.gridHeight !== DPPT_FEEBAS_GRID_HEIGHT) {
    errors.push("Grid height must be 34.");
  }

  if (
    data?.totalGridSquares !==
    DPPT_FEEBAS_TOTAL_GRID_SQUARES
  ) {
    errors.push("Total grid squares must be 612.");
  }

  if (tiles.length !== DPPT_FEEBAS_TILE_COUNT) {
    errors.push("Coordinate entries must equal 528.");
  }

  for (const tile of tiles) {
    if (
      !isIntegerInRange(
        tile.index,
        0,
        DPPT_FEEBAS_TILE_COUNT - 1
      )
    ) {
      errors.push(
        `Invalid index ${tile.index}; expected 0-527.`
      );
    } else if (seenIndexes.has(tile.index)) {
      duplicateIndexes.push(tile.index);
    } else {
      seenIndexes.add(tile.index);
    }

    if (
      !isIntegerInRange(
        tile.x,
        0,
        DPPT_FEEBAS_GRID_WIDTH - 1
      ) ||
      !isIntegerInRange(
        tile.y,
        0,
        DPPT_FEEBAS_GRID_HEIGHT - 1
      )
    ) {
      outOfBoundsCoordinates.push(tile);
    } else {
      const key = coordinateKey(tile);
      if (seenCoordinates.has(key)) {
        duplicateCoordinates.push(key);
      } else {
        seenCoordinates.add(key);
      }
    }

    if (
      isIntegerInRange(
        tile.index,
        0,
        DPPT_FEEBAS_TILE_COUNT - 1
      )
    ) {
      const expectedGroup = getFeebasGroup(tile.index);
      if (
        tile.group !== undefined &&
        tile.group !== expectedGroup
      ) {
        errors.push(
          `Index ${tile.index} has group ${tile.group}; expected ${expectedGroup}.`
        );
      }
    }
  }

  for (
    let index = 0;
    index < DPPT_FEEBAS_TILE_COUNT;
    index += 1
  ) {
    if (!seenIndexes.has(index)) {
      missingIndexes.push(index);
    }
  }

  if (duplicateIndexes.length > 0) {
    errors.push(
      `Duplicate indexes: ${duplicateIndexes.join(", ")}.`
    );
  }

  if (duplicateCoordinates.length > 0) {
    errors.push(
      `Duplicate coordinates: ${duplicateCoordinates.join(", ")}.`
    );
  }

  if (outOfBoundsCoordinates.length > 0) {
    errors.push(
      `${outOfBoundsCoordinates.length} coordinates are out of bounds.`
    );
  }

  if (missingIndexes.length > 0) {
    errors.push(
      `Missing indexes: ${missingIndexes.join(", ")}.`
    );
  }

  if (excludedGridCells !== 84) {
    errors.push(
      `Excluded grid cells must equal 84; received ${excludedGridCells}.`
    );
  }

  return {
    coordinateEntries: tiles.length,
    excludedGridCells,
    uniqueIndexes: seenIndexes.size,
    uniqueCoordinates: seenCoordinates.size,
    lowestIndex:
      seenIndexes.size > 0
        ? Math.min(...seenIndexes)
        : null,
    highestIndex:
      seenIndexes.size > 0
        ? Math.max(...seenIndexes)
        : null,
    missingIndexes,
    duplicateIndexes,
    duplicateCoordinates,
    outOfBoundsCoordinates,
    errors,
    valid: errors.length === 0
  };
}

export const dpptFeebasTiles = dpptFeebasTileData.tiles;
export const dpptFeebasAudit =
  validateFeebasTileDataset(dpptFeebasTileData);

const dpptFeebasTilesByIndex = new Map(
  dpptFeebasTiles.map(tile => [tile.index, tile])
);

export function getFeebasTileByIndex(index) {
  if (
    !isIntegerInRange(
      index,
      0,
      DPPT_FEEBAS_TILE_COUNT - 1
    )
  ) {
    throw new RangeError(
      `Feebas index must be an integer from 0 to 527; received ${index}.`
    );
  }

  const tile = dpptFeebasTilesByIndex.get(index);
  if (!tile) {
    throw new Error(
      `No Feebas tile exists for index ${index}.`
    );
  }

  return tile;
}

export function getFirstTileOnPreviousRow(index) {
  const tile = getFeebasTileByIndex(index);
  const rows = [
    ...new Set(dpptFeebasTiles.map(entry => entry.y))
  ].sort((a, b) => a - b);
  const previousRow = rows
    .filter(row => row < tile.y)
    .at(-1);

  if (previousRow === undefined) return tile;

  return dpptFeebasTiles.find(
    entry => entry.y === previousRow
  );
}

export function getFirstTileOnNextRow(index) {
  const tile = getFeebasTileByIndex(index);
  const rows = [
    ...new Set(dpptFeebasTiles.map(entry => entry.y))
  ].sort((a, b) => a - b);
  const nextRow = rows.find(row => row > tile.y);

  if (nextRow === undefined) return tile;

  return dpptFeebasTiles.find(
    entry => entry.y === nextRow
  );
}
