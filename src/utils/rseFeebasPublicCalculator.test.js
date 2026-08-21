import {
  describe,
  expect,
  it
} from "vitest";
import {
  buildPossibleTileSetResult,
  buildPublicPriorityResult,
  getUniqueReachableTiles
} from "./rseFeebasPublicCalculator";
import { calculateRseFeebasFromValue } from "./rseFeebasCalculator";

describe("rseFeebasPublicCalculator", () => {
  it("deduplicates duplicate physical Feebas locations for public exact results", () => {
    const result = calculateRseFeebasFromValue("0070");
    const reachable = getUniqueReachableTiles(result);

    expect(result.generatedSpotIds).toHaveLength(6);
    expect(result.uniqueSpotIds).toHaveLength(5);
    expect(reachable.tiles).toHaveLength(5);
    expect(reachable.inaccessible).toEqual([]);
  });

  it("builds deterministic recommended tiles for small possible sets", () => {
    const result = buildPossibleTileSetResult([
      "88DE",
      "B9E3",
      "728E",
      "D33B",
      "FF02"
    ]);

    expect(result.tileSets).toHaveLength(5);
    expect(result.recommendedTiles.length).toBeGreaterThan(0);
    expect(
      result.recommendedTiles.map(tile => tile.rank)
    ).toEqual(
      result.recommendedTiles.map((_, index) => index + 1)
    );
    expect(
      result.recommendedTiles.every(
        tile => tile.feebasSelectable !== false
      )
    ).toBe(true);
  });

  it("builds priority results from all unique values without truncating the summary", () => {
    const values = [
      "0000",
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
      "0006",
      "0007",
      "0008",
      "0009",
      "000A",
      "000A"
    ];
    const result = buildPublicPriorityResult(
      values,
      "top10"
    );

    expect(result.summary.totalCandidateValues).toBe(11);
    expect(result.visibleTiles.length).toBeLessThanOrEqual(10);
    expect(result.recommendedTiles.length).toBeLessThanOrEqual(10);
    expect(result.summary.totalUniqueTiles).toBeGreaterThan(
      result.visibleTiles.length
    );
  });

  it("resolves special internal IDs before public exact display", () => {
    const underBridge = buildPossibleTileSetResult(["0062"]);
    const inaccessible = buildPossibleTileSetResult(["0150"]);

    expect(
      underBridge.tileSets[0].reachableTiles.filter(
        tile => tile.sourceSpotId === 132
      )
    ).toHaveLength(10);
    expect(
      underBridge.tileSets[0].reachableTiles.some(
        tile => tile.x === 23 && tile.y === 30
      )
    ).toBe(false);
    expect(
      inaccessible.tileSets[0].reachableTiles.some(
        tile => tile.sourceSpotId === 119
      )
    ).toBe(false);
    expect(inaccessible.tileSets[0].inaccessible).toContainEqual(
      expect.objectContaining({ spotId: 119 })
    );
  });
});
