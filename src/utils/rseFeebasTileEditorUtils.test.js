import {
  describe,
  expect,
  it
} from "vitest";
import {
  RSE_FEEBAS_DEFAULT_GRID_WIDTH,
  RSE_FEEBAS_EXPECTED_SPOT_COUNT,
  RSE_FEEBAS_GRID_HEIGHT,
  createRseFeebasExportData,
  createValidationSummary,
  selectedSetToSpotTiles,
  tileKey,
  validateRseFeebasImportText
} from "./rseFeebasTileEditorUtils";

function makeFullRowMajorSet() {
  const keys = new Set();
  let remaining = RSE_FEEBAS_EXPECTED_SPOT_COUNT;

  for (
    let y = 0;
    y < RSE_FEEBAS_GRID_HEIGHT && remaining > 0;
    y += 1
  ) {
    for (
      let x = 0;
      x < RSE_FEEBAS_DEFAULT_GRID_WIDTH &&
      remaining > 0;
      x += 1
    ) {
      keys.add(tileKey(x, y));
      remaining -= 1;
    }
  }

  return keys;
}

describe("rseFeebasTileEditorUtils", () => {
  it("derives mapped spot IDs from 4 in row-major order", () => {
    const selectedKeys = new Set([
      tileKey(18, 18),
      tileKey(9, 7),
      tileKey(15, 16),
      tileKey(7, 13)
    ]);

    expect(selectedSetToSpotTiles(selectedKeys)).toEqual([
      {
        spotId: 4,
        x: 9,
        y: 7,
        section: 1,
        feebasSelectable: true
      },
      {
        spotId: 5,
        x: 7,
        y: 13,
        section: 1,
        feebasSelectable: true
      },
      {
        spotId: 6,
        x: 15,
        y: 16,
        section: 1,
        feebasSelectable: true
      },
      {
        spotId: 7,
        x: 18,
        y: 18,
        section: 1,
        feebasSelectable: true
      }
    ]);
  });

  it("validates Route 119 sections by spot ID ranges, not visual Y", () => {
    const validation = createValidationSummary(
      makeFullRowMajorSet()
    );
    const tiles = selectedSetToSpotTiles(
      makeFullRowMajorSet()
    );

    expect(validation.selectedCount).toBe(
      RSE_FEEBAS_EXPECTED_SPOT_COUNT
    );
    expect(validation.sectionCounts).toEqual({
      1: 128,
      2: 167,
      3: 149
    });
    expect(validation.spotIdsCoverRange).toBe(true);
    expect(validation.ready).toBe(true);
    expect(tiles[130]).toMatchObject({
      spotId: 134,
      section: 2
    });
    expect(tiles[128]).toMatchObject({
      spotId: 132,
      section: 2
    });
    expect(tiles[294]).toMatchObject({
      spotId: 298,
      section: 2
    });
    expect(tiles[295]).toMatchObject({
      spotId: 299,
      section: 3
    });
  });

  it("exports the RSE Route 119 JSON contract", () => {
    const data = createRseFeebasExportData({
      selectedKeys: new Set([tileKey(1, 2)]),
      gridWidth: 30,
      imageAlignment: {
        offsetX: 3,
        opacity: 0.5
      }
    });

    expect(data).toMatchObject({
      map: "route-119",
      games: ["ruby", "sapphire", "emerald"],
      gridWidth: 30,
      gridHeight: RSE_FEEBAS_GRID_HEIGHT,
      coordinateSystem: "zero-based",
      spotIdSystem: "one-based",
      sortOrder: "top-to-bottom-left-to-right",
      internalFishingSpotCount: 447,
      mappedFishingSpotCount:
        RSE_FEEBAS_EXPECTED_SPOT_COUNT,
      firstInternalSpotId: 1,
      lastInternalSpotId: 447,
      firstMappedSpotId: 4,
      lastMappedSpotId: 447,
      rejectedGeneratedFeebasSpotIds: [1, 2, 3],
      imageAlignment: {
        offsetX: 3,
        offsetY: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 0.5
      },
      tiles: [
        {
          spotId: 4,
          x: 1,
          y: 2,
          feebasSelectable: true
        }
      ]
    });
  });

  it("imports coordinates but warns when stored spot IDs differ", () => {
    const result = validateRseFeebasImportText(
      JSON.stringify({
        gridWidth: 30,
        gridHeight: 140,
        tiles: [
          {
            spotId: 99,
            x: 2,
            y: 0
          },
          {
            spotId: 1,
            x: 1,
            y: 0
          }
        ]
      }),
      30
    );

    expect(result.ok).toBe(true);
    expect(result.warnings.join(" ")).toContain(
      "does not match derived row-major spot ID"
    );
    expect(
      selectedSetToSpotTiles(result.selectedKeys, 30)
    ).toMatchObject([
      {
        spotId: 4,
        x: 1,
        y: 0
      },
      {
        spotId: 5,
        x: 2,
        y: 0
      }
    ]);
  });

  it("rejects invalid imported coordinates for the current width", () => {
    const result = validateRseFeebasImportText(
      JSON.stringify({
        gridHeight: 140,
        tiles: [
          {
            x: 30,
            y: 0
          }
        ]
      }),
      30
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("x 0-29");
  });
});
