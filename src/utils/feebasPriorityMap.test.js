import {
  describe,
  expect,
  it
} from "vitest";
import { calculateRseFeebasFromValue } from "./rseFeebasCalculator";
import {
  buildPriorityTiers,
  buildTileOverlapSummary,
  filterPriorityTiles,
  rankPriorityTiles
} from "./feebasPriorityMap";

describe("feebasPriorityMap", () => {
  it("returns a valid empty summary", () => {
    const summary = buildTileOverlapSummary([]);

    expect(summary).toMatchObject({
      totalCandidateValues: 0,
      totalUniqueTiles: 0,
      maxOverlapCount: 0,
      averageOverlap: 0
    });
    expect(summary.tiles).toEqual([]);
  });

  it("builds six count-1 tiles for a single candidate value", () => {
    const summary = buildTileOverlapSummary(["88DE"]);

    expect(summary.totalCandidateValues).toBe(1);
    expect(summary.totalUniqueTiles).toBe(6);
    expect(summary.maxOverlapCount).toBe(1);
    expect(summary.tiles.every(tile => tile.count === 1)).toBe(true);
    expect(
      summary.tiles.every(
        tile => tile.priorityTier === "high"
      )
    ).toBe(true);
  });

  it("increments overlap counts for physical tile collisions", () => {
    const first = calculateRseFeebasFromValue("88DE");
    const second = calculateRseFeebasFromValue("88DE");
    const summary = buildTileOverlapSummary([
      "88DE",
      "ABCD"
    ]);
    const duplicateSummary = buildTileOverlapSummary([
      "88DE",
      "88DE",
      "ABCD"
    ]);

    expect(first.generatedSpotIds).toEqual(
      second.generatedSpotIds
    );
    expect(summary.totalCandidateValues).toBe(2);
    expect(duplicateSummary.totalCandidateValues).toBe(2);
    expect(duplicateSummary.tiles).toEqual(summary.tiles);
  });

  it("deduplicates unique tiles by coordinate", () => {
    const summary = buildTileOverlapSummary([
      "0000",
      "0001",
      "0002",
      "0003"
    ]);
    const coordinateKeys = new Set(
      summary.tiles.map(tile => `${tile.x}:${tile.y}`)
    );

    expect(coordinateKeys.size).toBe(
      summary.totalUniqueTiles
    );
    expect(summary.tiles.length).toBe(
      summary.totalUniqueTiles
    );
  });

  it("ranks by overlap descending then y/x coordinates", () => {
    const ranked = rankPriorityTiles([
      {
        x: 5,
        y: 2,
        count: 1
      },
      {
        x: 4,
        y: 1,
        count: 3
      },
      {
        x: 2,
        y: 1,
        count: 3
      },
      {
        x: 1,
        y: 9,
        count: 2
      }
    ]);

    expect(
      ranked.map(tile => [tile.x, tile.y, tile.count])
    ).toEqual([
      [2, 1, 3],
      [4, 1, 3],
      [1, 9, 2],
      [5, 2, 1]
    ]);
    expect(ranked.map(tile => tile.rank)).toEqual([
      1,
      2,
      3,
      4
    ]);
  });

  it("assigns deterministic relative priority tiers", () => {
    const tiers = buildPriorityTiers({
      maxOverlapCount: 5
    });

    expect(tiers).toMatchObject({
      highThreshold: 4,
      mediumThreshold: 2
    });

    const summary = buildTileOverlapSummary([
      "0000",
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
      "0006",
      "0007",
      "0008",
      "0009"
    ]);

    expect(summary.legend.method).toContain(
      "relative max overlap"
    );
    expect(
      summary.tierCounts.high +
        summary.tierCounts.medium +
        summary.tierCounts.low
    ).toBe(summary.totalUniqueTiles);
  });

  it("filters by top counts, high tier, and minimum overlap", () => {
    const summary = buildTileOverlapSummary([
      "0000",
      "0001",
      "0002",
      "0003",
      "0004",
      "0005",
      "0006",
      "0007",
      "0008",
      "0009"
    ]);

    expect(
      filterPriorityTiles(summary.tiles, {
        showMode: "top10"
      })
    ).toHaveLength(Math.min(10, summary.tiles.length));
    expect(
      filterPriorityTiles(summary.tiles, {
        showMode: "high"
      }).every(tile => tile.priorityTier === "high")
    ).toBe(true);
    expect(
      filterPriorityTiles(summary.tiles, {
        minimumOverlap: summary.maxOverlapCount + 1
      })
    ).toEqual([]);
  });

  it("uses shared downstream RSE calculation for candidate tile output", () => {
    const summary = buildTileOverlapSummary(["88DE"]);
    const downstream =
      calculateRseFeebasFromValue("88DE");

    expect(
      summary.tiles.map(tile => tile.spotIds[0]).sort(
        (left, right) => left - right
      )
    ).toEqual(
      downstream.coordinates
        .map(tile => tile.spotId)
        .sort((left, right) => left - right)
    );
  });
});
