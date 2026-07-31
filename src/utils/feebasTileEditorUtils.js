export const FEEBAS_GRID_WIDTH = 18;
export const FEEBAS_GRID_HEIGHT = 34;
export const FEEBAS_TOTAL_SQUARES =
  FEEBAS_GRID_WIDTH * FEEBAS_GRID_HEIGHT;
export const FEEBAS_EXPECTED_TILE_COUNT = 528;
export const FEEBAS_GROUP_SIZE = 132;
export const FEEBAS_DEFAULT_IMAGE_ALIGNMENT = {
  offsetX: 0,
  offsetY: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1
};

export function tileKey(x, y) {
  return `${x}:${y}`;
}

export function parseTileKey(key) {
  const [x, y] = String(key)
    .split(":")
    .map(value => Number(value));

  return { x, y };
}

export function isCoordinateInBounds({ x, y }) {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x < FEEBAS_GRID_WIDTH &&
    y >= 0 &&
    y < FEEBAS_GRID_HEIGHT
  );
}

export function compareCoordinates(a, b) {
  if (a.y !== b.y) return a.y - b.y;
  return a.x - b.x;
}

export function groupForIndex(index) {
  return Math.floor(index / FEEBAS_GROUP_SIZE) + 1;
}

export function selectedSetToTiles(selectedKeys) {
  return Array.from(selectedKeys)
    .map(parseTileKey)
    .filter(isCoordinateInBounds)
    .sort(compareCoordinates)
    .map((tile, index) => ({
      index,
      x: tile.x,
      y: tile.y,
      group: groupForIndex(index)
    }));
}

export function createTileSetFromCoordinates(coordinates) {
  return new Set(
    coordinates
      .filter(isCoordinateInBounds)
      .map(({ x, y }) => tileKey(x, y))
  );
}

export function createFeebasExportData({
  selectedKeys,
  imageAlignment
}) {
  return {
    map: "mt-coronet-feebas-lake",
    games: ["diamond", "pearl", "platinum"],
    gridWidth: FEEBAS_GRID_WIDTH,
    gridHeight: FEEBAS_GRID_HEIGHT,
    totalGridSquares: FEEBAS_TOTAL_SQUARES,
    expectedFishableTileCount:
      FEEBAS_EXPECTED_TILE_COUNT,
    coordinateSystem: "zero-based",
    sortOrder: "top-to-bottom-left-to-right",
    imageAlignment: {
      ...FEEBAS_DEFAULT_IMAGE_ALIGNMENT,
      ...(imageAlignment ?? {})
    },
    tiles: selectedSetToTiles(selectedKeys)
  };
}

export function countGroups(tiles) {
  return tiles.reduce((counts, tile) => {
    counts[tile.group] =
      (counts[tile.group] ?? 0) + 1;
    return counts;
  }, {});
}

export function createValidationSummary(selectedKeys) {
  const tiles = selectedSetToTiles(selectedKeys);
  const groupCounts = countGroups(tiles);
  const indexesValid = tiles.every(
    (tile, index) => tile.index === index
  );
  const groupsValid = [1, 2, 3, 4].every(
    group => groupCounts[group] === FEEBAS_GROUP_SIZE
  );
  const ready =
    FEEBAS_GRID_WIDTH === 18 &&
    FEEBAS_GRID_HEIGHT === 34 &&
    tiles.length === FEEBAS_EXPECTED_TILE_COUNT &&
    indexesValid &&
    groupsValid;

  return {
    gridDimensionsValid: true,
    coordinatesInBounds: true,
    duplicateCoordinates: 0,
    selectedCount: tiles.length,
    groupCounts,
    indexesValid,
    ready
  };
}

function normalizeNumber(value, fallback) {
  return Number.isFinite(Number(value))
    ? Number(value)
    : fallback;
}

export function normalizeImageAlignment(value) {
  if (!value || typeof value !== "object") {
    return FEEBAS_DEFAULT_IMAGE_ALIGNMENT;
  }

  return {
    offsetX: normalizeNumber(
      value.offsetX,
      FEEBAS_DEFAULT_IMAGE_ALIGNMENT.offsetX
    ),
    offsetY: normalizeNumber(
      value.offsetY,
      FEEBAS_DEFAULT_IMAGE_ALIGNMENT.offsetY
    ),
    scaleX: normalizeNumber(
      value.scaleX,
      FEEBAS_DEFAULT_IMAGE_ALIGNMENT.scaleX
    ),
    scaleY: normalizeNumber(
      value.scaleY,
      FEEBAS_DEFAULT_IMAGE_ALIGNMENT.scaleY
    ),
    opacity: Math.min(
      1,
      Math.max(
        0,
        normalizeNumber(
          value.opacity,
          FEEBAS_DEFAULT_IMAGE_ALIGNMENT.opacity
        )
      )
    )
  };
}

export function validateFeebasImportText(text) {
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    return {
      ok: false,
      errors: ["Invalid JSON."],
      warnings: []
    };
  }

  const errors = [];
  const warnings = [];

  if (
    data.gridWidth !== undefined &&
    data.gridWidth !== FEEBAS_GRID_WIDTH
  ) {
    errors.push("Grid width must be 18.");
  }

  if (
    data.gridHeight !== undefined &&
    data.gridHeight !== FEEBAS_GRID_HEIGHT
  ) {
    errors.push("Grid height must be 34.");
  }

  if (!Array.isArray(data.tiles)) {
    errors.push("Imported JSON must include a tiles array.");
  }

  const seen = new Set();
  const coordinates = [];
  const tiles = Array.isArray(data.tiles)
    ? data.tiles
    : [];

  if (tiles.length > FEEBAS_TOTAL_SQUARES) {
    errors.push("Imported JSON contains more than 612 coordinates.");
  }

  tiles.forEach((tile, sourceIndex) => {
    const coordinate = {
      x: Number(tile?.x),
      y: Number(tile?.y)
    };
    const key = tileKey(coordinate.x, coordinate.y);

    if (!isCoordinateInBounds(coordinate)) {
      errors.push(
        `Coordinate at source row ${sourceIndex + 1} is outside x 0-17 or y 0-33.`
      );
      return;
    }

    if (seen.has(key)) {
      errors.push(
        `Duplicate coordinate ${coordinate.x},${coordinate.y}.`
      );
      return;
    }

    seen.add(key);
    coordinates.push(coordinate);
  });

  const derivedTiles = coordinates
    .slice()
    .sort(compareCoordinates)
    .map((tile, index) => ({
      ...tile,
      index,
      group: groupForIndex(index)
    }));
  const derivedByKey = new Map(
    derivedTiles.map(tile => [
      tileKey(tile.x, tile.y),
      tile
    ])
  );

  tiles.forEach(tile => {
    const key = tileKey(Number(tile?.x), Number(tile?.y));
    const derived = derivedByKey.get(key);
    if (!derived) return;

    if (
      tile.index !== undefined &&
      tile.index !== derived.index
    ) {
      warnings.push(
        `Stored index for ${derived.x},${derived.y} does not match derived row-major index ${derived.index}.`
      );
    }

    if (
      tile.group !== undefined &&
      tile.group !== derived.group
    ) {
      warnings.push(
        `Stored group for ${derived.x},${derived.y} does not match derived group ${derived.group}.`
      );
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    data,
    selectedKeys: createTileSetFromCoordinates(coordinates),
    imageAlignment: normalizeImageAlignment(
      data.imageAlignment
    )
  };
}
