export const RSE_FEEBAS_GRID_MIN_WIDTH = 20;
export const RSE_FEEBAS_GRID_MAX_WIDTH = 50;
export const RSE_FEEBAS_DEFAULT_GRID_WIDTH = 30;
export const RSE_FEEBAS_GRID_HEIGHT = 140;
export const RSE_FEEBAS_INTERNAL_SPOT_COUNT = 447;
export const RSE_FEEBAS_MAPPED_SPOT_COUNT = 444;
export const RSE_FEEBAS_FIRST_MAPPED_SPOT_ID = 4;
export const RSE_FEEBAS_LAST_MAPPED_SPOT_ID = 447;
export const RSE_FEEBAS_EXPECTED_SPOT_COUNT =
  RSE_FEEBAS_MAPPED_SPOT_COUNT;
export const RSE_FEEBAS_REJECTED_GENERATED_SPOT_IDS = [
  1,
  2,
  3
];
export const RSE_FEEBAS_SECTIONS = [
  {
    id: 1,
    label: "Section 1",
    nativeYStart: 0,
    nativeYEnd: 45,
    spotIdStart: 1,
    spotIdEnd: 131,
    internalExpectedSpotCount: 131,
    mappedSpotIdStart: 4,
    mappedSpotIdEnd: 131,
    mappedExpectedSpotCount: 128
  },
  {
    id: 2,
    label: "Section 2",
    nativeYStart: 46,
    nativeYEnd: 91,
    spotIdStart: 132,
    spotIdEnd: 298,
    internalExpectedSpotCount: 167,
    mappedSpotIdStart: 132,
    mappedSpotIdEnd: 298,
    mappedExpectedSpotCount: 167
  },
  {
    id: 3,
    label: "Section 3",
    nativeYStart: 92,
    nativeYEnd: 139,
    spotIdStart: 299,
    spotIdEnd: 447,
    internalExpectedSpotCount: 149,
    mappedSpotIdStart: 299,
    mappedSpotIdEnd: 447,
    mappedExpectedSpotCount: 149
  }
];
export const RSE_FEEBAS_DEFAULT_IMAGE_ALIGNMENT = {
  offsetX: 0,
  offsetY: 0,
  scaleX: 1,
  scaleY: 1,
  opacity: 1
};

export function clampGridWidth(value) {
  const width = Number(value);
  if (!Number.isFinite(width)) {
    return RSE_FEEBAS_DEFAULT_GRID_WIDTH;
  }

  return Math.min(
    RSE_FEEBAS_GRID_MAX_WIDTH,
    Math.max(
      RSE_FEEBAS_GRID_MIN_WIDTH,
      Math.round(width)
    )
  );
}

export function tileKey(x, y) {
  return `${x}:${y}`;
}

export function parseTileKey(key) {
  const [x, y] = String(key)
    .split(":")
    .map(value => Number(value));

  return { x, y };
}

export function compareCoordinates(a, b) {
  if (a.y !== b.y) return a.y - b.y;
  return a.x - b.x;
}

export function sectionForSpotId(spotId) {
  return (
    RSE_FEEBAS_SECTIONS.find(
      section =>
        spotId >= section.spotIdStart &&
        spotId <= section.spotIdEnd
    ) ?? null
  );
}

export function isCoordinateInBounds(
  coordinate,
  gridWidth = RSE_FEEBAS_DEFAULT_GRID_WIDTH
) {
  const width = clampGridWidth(gridWidth);

  return (
    Number.isInteger(coordinate?.x) &&
    Number.isInteger(coordinate?.y) &&
    coordinate.x >= 0 &&
    coordinate.x < width &&
    coordinate.y >= 0 &&
    coordinate.y < RSE_FEEBAS_GRID_HEIGHT
  );
}

export function makeAllTileKeys(gridWidth) {
  const width = clampGridWidth(gridWidth);
  const keys = [];

  for (let y = 0; y < RSE_FEEBAS_GRID_HEIGHT; y += 1) {
    for (let x = 0; x < width; x += 1) {
      keys.push(tileKey(x, y));
    }
  }

  return keys;
}

export function selectedSetToSpotTiles(
  selectedKeys,
  gridWidth = RSE_FEEBAS_DEFAULT_GRID_WIDTH
) {
  return Array.from(selectedKeys)
    .map(parseTileKey)
    .filter(coordinate =>
      isCoordinateInBounds(coordinate, gridWidth)
    )
    .sort(compareCoordinates)
    .map((tile, index) => {
      const spotId =
        index + RSE_FEEBAS_FIRST_MAPPED_SPOT_ID;
      const section = sectionForSpotId(spotId);

      return {
        spotId,
        x: tile.x,
        y: tile.y,
        section: section?.id ?? null,
        feebasSelectable: true
      };
    });
}

export function createTileSetFromCoordinates(
  coordinates,
  gridWidth = RSE_FEEBAS_DEFAULT_GRID_WIDTH
) {
  return new Set(
    coordinates
      .filter(coordinate =>
        isCoordinateInBounds(coordinate, gridWidth)
      )
      .map(({ x, y }) => tileKey(x, y))
  );
}

export function countSections(tiles) {
  return RSE_FEEBAS_SECTIONS.reduce((counts, section) => {
    counts[section.id] = tiles.filter(
      tile => tile.section === section.id
    ).length;
    return counts;
  }, {});
}

export function normalizeImageAlignment(value) {
  if (!value || typeof value !== "object") {
    return RSE_FEEBAS_DEFAULT_IMAGE_ALIGNMENT;
  }

  function normalizeNumber(nextValue, fallback) {
    return Number.isFinite(Number(nextValue))
      ? Number(nextValue)
      : fallback;
  }

  return {
    offsetX: normalizeNumber(
      value.offsetX,
      RSE_FEEBAS_DEFAULT_IMAGE_ALIGNMENT.offsetX
    ),
    offsetY: normalizeNumber(
      value.offsetY,
      RSE_FEEBAS_DEFAULT_IMAGE_ALIGNMENT.offsetY
    ),
    scaleX: normalizeNumber(
      value.scaleX,
      RSE_FEEBAS_DEFAULT_IMAGE_ALIGNMENT.scaleX
    ),
    scaleY: normalizeNumber(
      value.scaleY,
      RSE_FEEBAS_DEFAULT_IMAGE_ALIGNMENT.scaleY
    ),
    opacity: Math.min(
      1,
      Math.max(
        0,
        normalizeNumber(
          value.opacity,
          RSE_FEEBAS_DEFAULT_IMAGE_ALIGNMENT.opacity
        )
      )
    )
  };
}

export function createRseFeebasExportData({
  selectedKeys,
  gridWidth = RSE_FEEBAS_DEFAULT_GRID_WIDTH,
  imageAlignment
}) {
  const width = clampGridWidth(gridWidth);

  return {
    map: "route-119",
    games: ["ruby", "sapphire", "emerald"],
    gridWidth: width,
    gridHeight: RSE_FEEBAS_GRID_HEIGHT,
    coordinateSystem: "zero-based",
    spotIdSystem: "one-based",
    sortOrder: "top-to-bottom-left-to-right",
    internalFishingSpotCount:
      RSE_FEEBAS_INTERNAL_SPOT_COUNT,
    mappedFishingSpotCount:
      RSE_FEEBAS_MAPPED_SPOT_COUNT,
    firstInternalSpotId: 1,
    lastInternalSpotId: RSE_FEEBAS_LAST_MAPPED_SPOT_ID,
    firstMappedSpotId: RSE_FEEBAS_FIRST_MAPPED_SPOT_ID,
    lastMappedSpotId: RSE_FEEBAS_LAST_MAPPED_SPOT_ID,
    rejectedGeneratedFeebasSpotIds:
      RSE_FEEBAS_REJECTED_GENERATED_SPOT_IDS,
    sections: RSE_FEEBAS_SECTIONS.map(
      ({
        nativeYStart,
        nativeYEnd,
        spotIdStart,
        spotIdEnd,
        internalExpectedSpotCount,
        mappedSpotIdStart,
        mappedSpotIdEnd,
        mappedExpectedSpotCount
      }) => ({
        nativeYStart,
        nativeYEnd,
        spotIdStart,
        spotIdEnd,
        internalExpectedSpotCount,
        mappedSpotIdStart,
        mappedSpotIdEnd,
        mappedExpectedSpotCount
      })
    ),
    imageAlignment: normalizeImageAlignment(
      imageAlignment
    ),
    tiles: selectedSetToSpotTiles(selectedKeys, width).map(
      ({ spotId, x, y, feebasSelectable }) => ({
        spotId,
        x,
        y,
        feebasSelectable
      })
    )
  };
}

export function createValidationSummary(
  selectedKeys,
  gridWidth = RSE_FEEBAS_DEFAULT_GRID_WIDTH
) {
  const width = clampGridWidth(gridWidth);
  const parsedCoordinates = Array.from(selectedKeys).map(
    parseTileKey
  );
  const invalidCoordinates = parsedCoordinates.filter(
    coordinate => !isCoordinateInBounds(coordinate, width)
  );
  const tiles = selectedSetToSpotTiles(selectedKeys, width);
  const sectionCounts = countSections(tiles);
  const sectionsValid = RSE_FEEBAS_SECTIONS.every(
    section =>
      sectionCounts[section.id] ===
      section.mappedExpectedSpotCount
  );
  const spotIdsCoverRange =
    tiles.length === RSE_FEEBAS_EXPECTED_SPOT_COUNT &&
    tiles.every(
      (tile, index) =>
        tile.spotId ===
        index + RSE_FEEBAS_FIRST_MAPPED_SPOT_ID
    );
  const ready =
    width >= RSE_FEEBAS_GRID_MIN_WIDTH &&
    width <= RSE_FEEBAS_GRID_MAX_WIDTH &&
    RSE_FEEBAS_GRID_HEIGHT === 140 &&
    selectedKeys.size === tiles.length &&
    invalidCoordinates.length === 0 &&
    tiles.length === RSE_FEEBAS_EXPECTED_SPOT_COUNT &&
    sectionsValid &&
    spotIdsCoverRange;

  return {
    gridHeightValid: RSE_FEEBAS_GRID_HEIGHT === 140,
    gridWidthValid:
      width >= RSE_FEEBAS_GRID_MIN_WIDTH &&
      width <= RSE_FEEBAS_GRID_MAX_WIDTH,
    coordinatesInBounds: invalidCoordinates.length === 0,
    selectedCount: tiles.length,
    internalSpotCount: RSE_FEEBAS_INTERNAL_SPOT_COUNT,
    mappedSpotCount: RSE_FEEBAS_MAPPED_SPOT_COUNT,
    firstMappedSpotId: RSE_FEEBAS_FIRST_MAPPED_SPOT_ID,
    lastMappedSpotId: RSE_FEEBAS_LAST_MAPPED_SPOT_ID,
    uniqueCoordinateCount: selectedKeys.size,
    duplicateCoordinates: 0,
    invalidCoordinates,
    sectionCounts,
    sectionsValid,
    spotIdsCoverRange,
    rejectedGeneratedSpotIds:
      RSE_FEEBAS_REJECTED_GENERATED_SPOT_IDS,
    ready
  };
}

export function validateRseFeebasImportText(
  text,
  currentGridWidth = RSE_FEEBAS_DEFAULT_GRID_WIDTH
) {
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
  const width = clampGridWidth(currentGridWidth);

  if (
    data.gridHeight !== undefined &&
    data.gridHeight !== RSE_FEEBAS_GRID_HEIGHT
  ) {
    errors.push("Grid height must be 140.");
  }

  if (
    data.gridWidth !== undefined &&
    (data.gridWidth < RSE_FEEBAS_GRID_MIN_WIDTH ||
      data.gridWidth > RSE_FEEBAS_GRID_MAX_WIDTH)
  ) {
    errors.push("Grid width must be from 20 to 50.");
  }

  if (
    data.gridWidth !== undefined &&
    data.gridWidth !== width
  ) {
    warnings.push(
      `Imported grid width ${data.gridWidth} differs from the current editor width ${width}. Coordinates were validated against the current width.`
    );
  }

  if (!Array.isArray(data.tiles)) {
    errors.push("Imported JSON must include a tiles array.");
  }

  const tiles = Array.isArray(data.tiles)
    ? data.tiles
    : [];
  const seenCoordinates = new Set();
  const seenSourceSpotIds = new Set();
  const duplicateSourceSpotIds = new Set();
  const coordinates = [];

  tiles.forEach((tile, sourceIndex) => {
    const coordinate = {
      x: Number(tile?.x),
      y: Number(tile?.y)
    };
    const key = tileKey(coordinate.x, coordinate.y);

    if (!isCoordinateInBounds(coordinate, width)) {
      errors.push(
        `Coordinate at source row ${sourceIndex + 1} is outside x 0-${width - 1} or y 0-139.`
      );
      return;
    }

    if (seenCoordinates.has(key)) {
      errors.push(
        `Duplicate coordinate ${coordinate.x},${coordinate.y}.`
      );
      return;
    }

    if (tile?.spotId !== undefined) {
      const sourceSpotId = Number(tile.spotId);
      if (seenSourceSpotIds.has(sourceSpotId)) {
        duplicateSourceSpotIds.add(sourceSpotId);
      }
      seenSourceSpotIds.add(sourceSpotId);
    }

    seenCoordinates.add(key);
    coordinates.push(coordinate);
  });

  if (duplicateSourceSpotIds.size > 0) {
    warnings.push(
      `Imported JSON contains duplicate stored spot IDs: ${Array.from(
        duplicateSourceSpotIds
      ).join(", ")}. Derived spot IDs will replace them.`
    );
  }

  const derivedTiles = coordinates
    .slice()
    .sort(compareCoordinates)
    .map((tile, index) => ({
      ...tile,
      spotId: index + RSE_FEEBAS_FIRST_MAPPED_SPOT_ID
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
      tile.spotId !== undefined &&
      Number(tile.spotId) !== derived.spotId
    ) {
      warnings.push(
        `Stored spot ID for ${derived.x},${derived.y} does not match derived row-major spot ID ${derived.spotId}.`
      );
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    data,
    selectedKeys: createTileSetFromCoordinates(
      coordinates,
      width
    ),
    imageAlignment: normalizeImageAlignment(
      data.imageAlignment
    )
  };
}
