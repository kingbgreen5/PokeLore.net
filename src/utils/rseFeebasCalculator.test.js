import {
  describe,
  expect,
  it
} from "vitest";
import {
  RSE_FEEBAS_RNG_SELF_TEST_FIXTURES,
  advanceFeebasRng,
  calculateRseFeebasFromValue,
  generateFeebasSpotIds,
  normalizeFeebasValue,
  getRoute119FeebasCoordinateForSpotId,
  resolveFeebasSpotCoordinates,
  route119FeebasAudit,
  route119FeebasTiles,
  runRseFeebasRngSelfTest
} from "./rseFeebasCalculator";

describe("rseFeebasCalculator", () => {
  it("accepts and normalizes valid 16-bit hexadecimal values", () => {
    expect(normalizeFeebasValue("0000")).toMatchObject({
      valid: true,
      value: "0000",
      decimalSeed: 0
    });
    expect(normalizeFeebasValue("ffff")).toMatchObject({
      valid: true,
      value: "FFFF",
      decimalSeed: 65535
    });
    expect(normalizeFeebasValue("abcd")).toMatchObject({
      valid: true,
      value: "ABCD",
      decimalSeed: 43981
    });
  });

  it("rejects invalid Feebas value text", () => {
    expect(normalizeFeebasValue("123")).toMatchObject({
      valid: false
    });
    expect(normalizeFeebasValue("12345")).toMatchObject({
      valid: false
    });
    expect(normalizeFeebasValue("12G4")).toMatchObject({
      valid: false
    });
  });

  it("advances the RNG against independent fixtures", () => {
    for (const fixture of RSE_FEEBAS_RNG_SELF_TEST_FIXTURES) {
      expect(
        advanceFeebasRng(fixture.stateBefore)
      ).toMatchObject({
        stateAfter: fixture.stateAfter,
        stateAfterHex: fixture.stateAfterHex,
        upper16: fixture.upper16,
        moduloResult: fixture.moduloResult,
        spotId: fixture.spotId
      });
    }

    expect(runRseFeebasRngSelfTest().valid).toBe(true);
  });

  it("returns exactly six accepted spot IDs from each calculation", () => {
    ["0000", "0001", "1234", "ABCD", "FFFF"].forEach(
      value => {
        const result = generateFeebasSpotIds(value);

        expect(result.generatedSpotIds).toHaveLength(6);
        result.generatedSpotIds.forEach(spotId => {
          expect(spotId).toBeGreaterThanOrEqual(4);
          expect(spotId).toBeLessThanOrEqual(447);
        });
        expect(result.generatedSpotIds).not.toContain(0);
        expect(result.generatedSpotIds).not.toContain(1);
        expect(result.generatedSpotIds).not.toContain(2);
        expect(result.generatedSpotIds).not.toContain(3);
      }
    );
  });

  it("records rejected spot IDs and keeps advancing", () => {
    const result = generateFeebasSpotIds("0022");
    const rejected = result.rngAdvances.find(
      advance => !advance.accepted
    );

    expect(rejected).toMatchObject({
      spotId: 3,
      accepted: false
    });
    expect(result.generatedSpotIds).toHaveLength(6);
  });

  it("preserves duplicate accepted spot IDs", () => {
    const result = generateFeebasSpotIds("0070");

    expect(result.generatedSpotIds).toEqual([
      371,
      334,
      69,
      330,
      334,
      262
    ]);
    expect(result.uniqueSpotIds).toHaveLength(5);
    expect(result.duplicateSpotIds).toEqual([334]);
  });

  it("resolves every accepted spot ID to a Route 119 coordinate", () => {
    const result = calculateRseFeebasFromValue("ABCD");
    const coordinates = resolveFeebasSpotCoordinates(
      result.generatedSpotIds
    );

    expect(result.coordinates).toEqual(coordinates);
    expect(coordinates).toHaveLength(6);
    coordinates.forEach(coordinate => {
      expect(coordinate.x).toBeGreaterThanOrEqual(0);
      expect(coordinate.x).toBeLessThan(40);
      expect(coordinate.y).toBeGreaterThanOrEqual(0);
      expect(coordinate.y).toBeLessThan(140);
    });
  });

  it("uses the repaired raw Route 119 coordinate dataset for known seeds", () => {
    const seed0010 = calculateRseFeebasFromValue("0010");
    const seed007f = calculateRseFeebasFromValue("007F");

    expect(seed0010.coordinates).toMatchObject([
      { spotId: 117, x: 31, y: 28 },
      { spotId: 214, x: 32, y: 44 },
      { spotId: 67, x: 22, y: 23 },
      { spotId: 309, x: 15, y: 85 },
      { spotId: 177, x: 35, y: 37 },
      { spotId: 246, x: 22, y: 50 }
    ]);

    expect(seed007f.coordinates).toMatchObject([
      { spotId: 189, x: 31, y: 41 },
      { spotId: 190, x: 32, y: 41 },
      { spotId: 30, x: 17, y: 15 },
      { spotId: 420, x: 15, y: 93 },
      { spotId: 439, x: 18, y: 94 },
      { spotId: 108, x: 22, y: 28 }
    ]);
  });

  it("keeps internal-only IDs 1-3 unmapped", () => {
    expect(getRoute119FeebasCoordinateForSpotId(1)).toBeNull();
    expect(getRoute119FeebasCoordinateForSpotId(2)).toBeNull();
    expect(getRoute119FeebasCoordinateForSpotId(3)).toBeNull();
    expect(getRoute119FeebasCoordinateForSpotId(4)).toMatchObject({
      spotId: 4
    });
    expect(getRoute119FeebasCoordinateForSpotId(447)).toMatchObject({
      spotId: 447
    });
  });

  it("matches repaired Route 119 spot-ID coordinate regressions", () => {
    const expected = new Map([
      [119, [20, 29]],
      [132, [23, 30]],
      [144, [27, 31]],
      [152, [30, 32]],
      [296, [21, 67]],
      [297, [22, 67]],
      [298, [23, 67]],
      [309, [15, 85]],
      [326, [21, 86]],
      [402, [14, 92]],
      [403, [15, 92]],
      [416, [11, 93]],
      [420, [15, 93]],
      [439, [18, 94]],
      [440, [19, 94]]
    ]);

    for (const [spotId, [x, y]] of expected) {
      expect(
        getRoute119FeebasCoordinateForSpotId(spotId)
      ).toMatchObject({ spotId, x, y });
    }
  });

  it("keeps mapped Route 119 spot IDs in row-major sequence", () => {
    const sorted = route119FeebasTiles
      .slice()
      .sort((a, b) => a.y - b.y || a.x - b.x);

    expect(sorted).toHaveLength(444);
    sorted.forEach((tile, index) => {
      expect(tile.spotId).toBe(index + 4);
      if (index === 0) return;

      const previous = sorted[index - 1];
      expect(
        previous.y < tile.y ||
          (previous.y === tile.y && previous.x <= tile.x)
      ).toBe(true);
    });
  });

  it("validates the Route 119 coordinate dataset", () => {
    expect(route119FeebasAudit).toMatchObject({
      valid: true,
      internalFishingSpotCount: 447,
      mappedCoordinateEntries: 444,
      coordinateEntries: 444,
      uniqueSpotIds: 444,
      uniqueCoordinates: 444,
      missingSpotIds: [],
      unexpectedUnmappedSpotIds: [],
      duplicateSpotIds: [],
      duplicateCoordinates: [],
      outOfBoundsCoordinates: [],
      sectionCounts: {
        1: 128,
        2: 167,
        3: 149
      }
    });
  });
});
