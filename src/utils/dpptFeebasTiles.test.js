import {
  describe,
  expect,
  it
} from "vitest";
import {
  DPPT_FEEBAS_GRID_HEIGHT,
  DPPT_FEEBAS_GRID_WIDTH,
  DPPT_FEEBAS_TILE_COUNT,
  dpptFeebasAudit,
  dpptFeebasExcludedGridCells,
  dpptFeebasTiles,
  getFeebasGroup,
  getFeebasIndexWithinGroup,
  getFeebasMapImageStyle,
  getFeebasOffsetSearchArea,
  getFeebasSearchArea,
  getFeebasTileByIndex,
  validateFeebasTileDataset
} from "./dpptFeebasTiles";
import dpptFeebasTileData from "../data/feebas/dpptFeebasFishableTiles.json";

describe("dpptFeebasTiles", () => {
  it("resolves index 0 to the first coordinate", () => {
    expect(getFeebasTileByIndex(0)).toEqual(
      dpptFeebasTiles[0]
    );
  });

  it("resolves index 527 to the final coordinate", () => {
    expect(getFeebasTileByIndex(527)).toEqual(
      dpptFeebasTiles.at(-1)
    );
  });

  it("resolves every index from 0-527 exactly once", () => {
    const indexes = new Set(
      dpptFeebasTiles.map(tile => tile.index)
    );

    expect(indexes.size).toBe(DPPT_FEEBAS_TILE_COUNT);
    for (
      let index = 0;
      index < DPPT_FEEBAS_TILE_COUNT;
      index += 1
    ) {
      expect(getFeebasTileByIndex(index).index).toBe(
        index
      );
    }
  });

  it("rejects invalid indexes", () => {
    expect(() => getFeebasTileByIndex(-1)).toThrow(
      "0 to 527"
    );
    expect(() => getFeebasTileByIndex(528)).toThrow(
      "0 to 527"
    );
  });

  it("has 528 unique coordinates", () => {
    const coordinates = new Set(
      dpptFeebasTiles.map(
        tile => `${tile.x}:${tile.y}`
      )
    );

    expect(coordinates.size).toBe(DPPT_FEEBAS_TILE_COUNT);
  });

  it("keeps every coordinate within the 18 x 34 grid", () => {
    expect(
      dpptFeebasTiles.every(
        tile =>
          tile.x >= 0 &&
          tile.x < DPPT_FEEBAS_GRID_WIDTH &&
          tile.y >= 0 &&
          tile.y < DPPT_FEEBAS_GRID_HEIGHT
      )
    ).toBe(true);
  });

  it.each([
    [0, 1, 0],
    [131, 1, 131],
    [132, 2, 0],
    [263, 2, 131],
    [264, 3, 0],
    [395, 3, 131],
    [396, 4, 0],
    [527, 4, 131]
  ])(
    "calculates group and in-group position for index %i",
    (index, group, position) => {
      expect(getFeebasGroup(index)).toBe(group);
      expect(getFeebasIndexWithinGroup(index)).toBe(
        position
      );
    }
  );

  it("passes dataset structural validation", () => {
    const audit =
      validateFeebasTileDataset(dpptFeebasTileData);

    expect(audit).toMatchObject({
      coordinateEntries: 528,
      excludedGridCells: 84,
      uniqueIndexes: 528,
      uniqueCoordinates: 528,
      lowestIndex: 0,
      highestIndex: 527,
      missingIndexes: [],
      valid: true
    });
    expect(dpptFeebasAudit.valid).toBe(true);
    expect(dpptFeebasExcludedGridCells).toHaveLength(84);
  });

  it("converts saved editor image alignment into responsive percentages", () => {
    expect(getFeebasMapImageStyle()).toMatchObject({
      left: "-52.33870967741936%",
      top: "-64.43453510436433%",
      width: "186%",
      height: "188%",
      opacity: 1
    });
  });

  it("builds stable 9-tile and 12-tile fishable search areas", () => {
    const nineTileArea = getFeebasSearchArea(31, {
      size: 9
    });
    const twelveTileArea = getFeebasSearchArea(31, {
      size: 12
    });

    expect(nineTileArea.indexes).toHaveLength(9);
    expect(twelveTileArea.indexes).toHaveLength(12);
    expect(nineTileArea.indexes).toContain(31);
    expect(twelveTileArea.indexes).toEqual(
      expect.arrayContaining(nineTileArea.indexes)
    );
    expect(new Set(twelveTileArea.indexes).size).toBe(12);
    for (const index of twelveTileArea.indexes) {
      expect(getFeebasTileByIndex(index).index).toBe(index);
    }
  });

  it("builds offset search areas that still cover the exact Feebas tile", () => {
    const nineTileArea = getFeebasOffsetSearchArea(31, {
      size: 9,
      seed: "public-area-test-9"
    });
    const twelveTileArea = getFeebasOffsetSearchArea(31, {
      size: 12,
      seed: "public-area-test-12"
    });

    expect(nineTileArea.indexes).toHaveLength(9);
    expect(twelveTileArea.indexes).toHaveLength(12);
    expect(nineTileArea.indexes).toContain(31);
    expect(twelveTileArea.indexes).toContain(31);
    expect(nineTileArea.displayCenterIndex).not.toBe(31);
    expect(twelveTileArea.displayCenterIndex).not.toBe(31);
  });

  it("rejects unsupported Feebas search area sizes", () => {
    expect(() =>
      getFeebasSearchArea(31, {
        size: 10
      })
    ).toThrow("9 or 12");
  });
});
