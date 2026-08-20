import route119FeebasData from "../data/feebas/rseRoute119FeebasFishingSpots.draft.json";

export const RSE_FEEBAS_VALUE_PATTERN =
  /^[0-9A-F]{4}$/;
export const RSE_FEEBAS_SPOT_COUNT = 447;
export const RSE_FEEBAS_MAPPED_SPOT_COUNT = 444;
export const RSE_FEEBAS_FIRST_MAPPED_SPOT_ID = 4;
export const RSE_FEEBAS_ACCEPTED_RESULT_COUNT = 6;
export const RSE_FEEBAS_GRID_WIDTH = 40;
export const RSE_FEEBAS_GRID_HEIGHT = 140;
export const RSE_FEEBAS_REJECTED_SPOT_IDS = [
  1,
  2,
  3
];
export const RSE_FEEBAS_RNG_MULTIPLIER = 1103515245;
export const RSE_FEEBAS_RNG_INCREMENT = 12345;

export const RSE_FEEBAS_RNG_SELF_TEST_FIXTURES = [
  {
    seed: "0000",
    stateBefore: 0,
    stateAfter: 0x00003039,
    stateAfterHex: "0x00003039",
    upper16: 0x0000,
    moduloResult: 0,
    spotId: 447
  },
  {
    seed: "0001",
    stateBefore: 1,
    stateAfter: 0x41c67ea6,
    stateAfterHex: "0x41C67EA6",
    upper16: 0x41c6,
    moduloResult: 299,
    spotId: 299
  },
  {
    seed: "1234",
    stateBefore: 0x1234,
    stateAfter: 0x4dcbc85d,
    stateAfterHex: "0x4DCBC85D",
    upper16: 0x4dcb,
    moduloResult: 247,
    spotId: 247
  },
  {
    seed: "ABCD",
    stateBefore: 0xabcd,
    stateAfter: 0x222fcc82,
    stateAfterHex: "0x222FCC82",
    upper16: 0x222f,
    moduloResult: 258,
    spotId: 258
  },
  {
    seed: "FFFF",
    stateBefore: 0xffff,
    stateAfter: 0x0ca6e1cc,
    stateAfterHex: "0x0CA6E1CC",
    upper16: 0x0ca6,
    moduloResult: 109,
    spotId: 109
  }
];

function toUint32(value) {
  return Number(value) >>> 0;
}

export function formatUint32Hex(value) {
  return `0x${toUint32(value)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")}`;
}

export function formatUint16Hex(value) {
  return `0x${(Number(value) & 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")}`;
}

export function normalizeFeebasValue(value) {
  const displayValue = String(value ?? "")
    .trim()
    .toUpperCase();

  if (displayValue.length === 0) {
    return {
      valid: false,
      value: displayValue,
      decimalSeed: null,
      error: "Feebas value is required."
    };
  }

  if (displayValue.length !== 4) {
    return {
      valid: false,
      value: displayValue,
      decimalSeed: null,
      error:
        "Feebas value must be exactly 4 hexadecimal characters."
    };
  }

  if (!RSE_FEEBAS_VALUE_PATTERN.test(displayValue)) {
    return {
      valid: false,
      value: displayValue,
      decimalSeed: null,
      error:
        "Feebas value must contain only hexadecimal characters 0-9 and A-F."
    };
  }

  return {
    valid: true,
    value: displayValue,
    decimalSeed: Number.parseInt(displayValue, 16),
    error: null
  };
}

function parseFeebasValue(value) {
  const normalized = normalizeFeebasValue(value);

  if (!normalized.valid) {
    throw new Error(normalized.error);
  }

  return normalized;
}

export function advanceFeebasRng(state) {
  const stateBefore = toUint32(state);
  const stateAfter =
    (Math.imul(
      stateBefore,
      RSE_FEEBAS_RNG_MULTIPLIER
    ) +
      RSE_FEEBAS_RNG_INCREMENT) >>>
    0;
  const upper16 = stateAfter >>> 16;
  const moduloResult =
    upper16 % RSE_FEEBAS_SPOT_COUNT;
  const spotId =
    moduloResult === 0
      ? RSE_FEEBAS_SPOT_COUNT
      : moduloResult;
  const accepted =
    !RSE_FEEBAS_REJECTED_SPOT_IDS.includes(spotId);

  return {
    stateBefore,
    stateAfter,
    stateBeforeHex: formatUint32Hex(stateBefore),
    stateAfterHex: formatUint32Hex(stateAfter),
    upper16,
    upper16Hex: formatUint16Hex(upper16),
    moduloResult,
    spotId,
    accepted,
    rejectionReason: accepted
      ? null
      : "Spot IDs 1-3 cannot become Feebas locations."
  };
}

export function generateFeebasSpotIds(value) {
  const normalized = parseFeebasValue(value);
  let state = normalized.decimalSeed >>> 0;
  const spotIds = [];
  const advances = [];

  while (
    spotIds.length < RSE_FEEBAS_ACCEPTED_RESULT_COUNT
  ) {
    const advance = advanceFeebasRng(state);
    state = advance.stateAfter;

    const diagnostic = {
      advanceNumber: advances.length + 1,
      resultNumber: advance.accepted
        ? spotIds.length + 1
        : null,
      ...advance
    };

    advances.push(diagnostic);

    if (advance.accepted) {
      spotIds.push(advance.spotId);
    }
  }

  return {
    feebasValue: normalized.value,
    decimalSeed: normalized.decimalSeed,
    generatedSpotIds: spotIds,
    rngAdvances: advances,
    generatedResults: spotIds.length,
    uniqueSpotIds: [...new Set(spotIds)],
    duplicateSpotIds: findDuplicateValues(spotIds)
  };
}

function findDuplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach(value => {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  });

  return [...duplicates];
}

function coordinateKey(tile) {
  return `${tile.x}:${tile.y}`;
}

export function validateRoute119FeebasDataset(
  data = route119FeebasData
) {
  const errors = [];
  const tiles = Array.isArray(data?.tiles)
    ? data.tiles
    : [];
  const seenSpotIds = new Set();
  const seenCoordinates = new Set();
  const duplicateSpotIds = [];
  const duplicateCoordinates = [];
  const outOfBoundsCoordinates = [];
  const missingSpotIds = [];
  const unexpectedUnmappedSpotIds = [];
  const sectionCounts = { 1: 0, 2: 0, 3: 0 };

  if (data?.gridWidth !== RSE_FEEBAS_GRID_WIDTH) {
    errors.push("Route 119 grid width must be 40.");
  }

  if (data?.gridHeight !== RSE_FEEBAS_GRID_HEIGHT) {
    errors.push("Route 119 grid height must be 140.");
  }

  if (
    data?.internalFishingSpotCount !==
    RSE_FEEBAS_SPOT_COUNT
  ) {
    errors.push(
      "Route 119 internal fishing spot count must be 447."
    );
  }

  if (
    data?.mappedFishingSpotCount !==
    RSE_FEEBAS_MAPPED_SPOT_COUNT
  ) {
    errors.push(
      "Route 119 mapped fishing spot count must be 444."
    );
  }

  if (
    data?.firstMappedSpotId !==
      RSE_FEEBAS_FIRST_MAPPED_SPOT_ID ||
    data?.lastMappedSpotId !== RSE_FEEBAS_SPOT_COUNT
  ) {
    errors.push(
      "Route 119 mapped spot IDs must cover 4-447."
    );
  }

  if (tiles.length !== RSE_FEEBAS_MAPPED_SPOT_COUNT) {
    errors.push(
      "Route 119 mapped coordinate entries must equal 444."
    );
  }

  for (const tile of tiles) {
    if (
      !Number.isInteger(tile?.spotId) ||
      tile.spotId < RSE_FEEBAS_FIRST_MAPPED_SPOT_ID ||
      tile.spotId > RSE_FEEBAS_SPOT_COUNT
    ) {
      errors.push(
        `Invalid mapped spot ID ${tile?.spotId}; expected 4-447.`
      );
    } else if (seenSpotIds.has(tile.spotId)) {
      duplicateSpotIds.push(tile.spotId);
    } else {
      seenSpotIds.add(tile.spotId);
      if (tile.spotId <= 131) {
        sectionCounts[1] += 1;
      } else if (tile.spotId <= 298) {
        sectionCounts[2] += 1;
      } else {
        sectionCounts[3] += 1;
      }
    }

    if (
      !Number.isInteger(tile?.x) ||
      !Number.isInteger(tile?.y) ||
      tile.x < 0 ||
      tile.x >= RSE_FEEBAS_GRID_WIDTH ||
      tile.y < 0 ||
      tile.y >= RSE_FEEBAS_GRID_HEIGHT
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
  }

  for (const spotId of RSE_FEEBAS_REJECTED_SPOT_IDS) {
    if (seenSpotIds.has(spotId)) {
      unexpectedUnmappedSpotIds.push(spotId);
    }
  }

  for (
    let spotId = RSE_FEEBAS_FIRST_MAPPED_SPOT_ID;
    spotId <= RSE_FEEBAS_SPOT_COUNT;
    spotId += 1
  ) {
    if (!seenSpotIds.has(spotId)) {
      missingSpotIds.push(spotId);
    }
  }

  if (duplicateSpotIds.length > 0) {
    errors.push(
      `Duplicate spot IDs: ${duplicateSpotIds.join(", ")}.`
    );
  }

  if (missingSpotIds.length > 0) {
    errors.push(
      `Missing mapped spot IDs: ${missingSpotIds.join(", ")}.`
    );
  }

  if (unexpectedUnmappedSpotIds.length > 0) {
    errors.push(
      `Spot IDs 1-3 must not have mapped coordinates: ${unexpectedUnmappedSpotIds.join(", ")}.`
    );
  }

  if (duplicateCoordinates.length > 0) {
    errors.push(
      `Duplicate coordinates: ${duplicateCoordinates.join(", ")}.`
    );
  }

  if (outOfBoundsCoordinates.length > 0) {
    errors.push(
      `${outOfBoundsCoordinates.length} Route 119 coordinates are out of bounds.`
    );
  }

  if (
    sectionCounts[1] !== 128 ||
    sectionCounts[2] !== 167 ||
    sectionCounts[3] !== 149
  ) {
    errors.push(
      `Mapped section counts must be 128 / 167 / 149; got ${sectionCounts[1]} / ${sectionCounts[2]} / ${sectionCounts[3]}.`
    );
  }

  return {
    internalFishingSpotCount: data?.internalFishingSpotCount,
    mappedCoordinateEntries: tiles.length,
    coordinateEntries: tiles.length,
    uniqueSpotIds: seenSpotIds.size,
    uniqueCoordinates: seenCoordinates.size,
    missingSpotIds,
    unexpectedUnmappedSpotIds,
    duplicateSpotIds,
    duplicateCoordinates,
    outOfBoundsCoordinates,
    sectionCounts,
    errors,
    valid: errors.length === 0
  };
}

export const route119FeebasAudit =
  validateRoute119FeebasDataset(
    route119FeebasData
  );

export const route119FeebasTiles =
  route119FeebasData.tiles;

export const route119FeebasTilesBySpotId = new Map(
  route119FeebasTiles.map(tile => [tile.spotId, tile])
);

export function getRoute119FeebasTileBySpotId(
  spotId
) {
  if (
    !Number.isInteger(spotId) ||
    spotId < 1 ||
    spotId > RSE_FEEBAS_SPOT_COUNT
  ) {
    throw new RangeError(
      `Invalid Route 119 Feebas spot ID ${spotId}; expected 1-447.`
    );
  }

  const tile = route119FeebasTilesBySpotId.get(spotId);
  if (!tile) {
    throw new Error(
      `No Route 119 coordinate exists for spot ID ${spotId}.`
    );
  }

  return tile;
}

export function getRoute119FeebasCoordinateForSpotId(
  spotId
) {
  if (
    !Number.isInteger(spotId) ||
    spotId < 1 ||
    spotId > RSE_FEEBAS_SPOT_COUNT
  ) {
    throw new RangeError(
      `Invalid Route 119 Feebas spot ID ${spotId}; expected 1-447.`
    );
  }

  return route119FeebasTilesBySpotId.get(spotId) ?? null;
}

export function resolveFeebasSpotCoordinates(
  spotIds
) {
  return spotIds.map((spotId, index) => {
    const tile =
      getRoute119FeebasTileBySpotId(spotId);

    return {
      resultNumber: index + 1,
      spotId,
      x: tile.x,
      y: tile.y,
      feebasSelectable: tile.feebasSelectable
    };
  });
}

export function calculateRseFeebasFromValue(value) {
  const generated = generateFeebasSpotIds(value);
  const coordinates = resolveFeebasSpotCoordinates(
    generated.generatedSpotIds
  );

  return {
    ...generated,
    coordinates
  };
}

export function runRseFeebasRngSelfTest() {
  const failures =
    RSE_FEEBAS_RNG_SELF_TEST_FIXTURES.filter(
      fixture => {
        const advance = advanceFeebasRng(
          fixture.stateBefore
        );

        return (
          advance.stateAfter !== fixture.stateAfter ||
          advance.stateAfterHex !==
            fixture.stateAfterHex ||
          advance.upper16 !== fixture.upper16 ||
          advance.moduloResult !==
            fixture.moduloResult ||
          advance.spotId !== fixture.spotId
        );
      }
    );

  return {
    valid: failures.length === 0,
    failures
  };
}
