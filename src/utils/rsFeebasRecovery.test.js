import {
  describe,
  expect,
  it
} from "vitest";
import {
  calculateRseFeebasFromValue
} from "./rseFeebasCalculator";
import {
  getDewfordPhraseSignature
} from "./emeraldFeebasRecovery";
import {
  buildTileOverlapSummary,
  filterPriorityTiles
} from "./feebasPriorityMap";
import {
  RS_DEAD_RTC_BOOT_SEED,
  RS_TID_TO_TREND_GAP_CANDIDATES,
  calculateSharedRseTilesForGame,
  enumerateRsTidStateCandidates,
  findRsDeadBatteryCandidates,
  findRsWorkingBatteryCandidates,
  getRubySapphireBootSeedForDeadRtc,
  simulateRsInitialDewfordTrends
} from "./rsFeebasRecovery";

describe("rsFeebasRecovery", () => {
  it("derives the dead/invalid RTC boot seed from dummy date assumptions", () => {
    expect(
      getRubySapphireBootSeedForDeadRtc({
        dayCount: 1,
        hours: 0,
        minutes: 0
      })
    ).toBe(0x05a0);
    expect(RS_DEAD_RTC_BOOT_SEED).toBe(0x05a0);
  });

  it("retains timing-gap candidates 2 and 3", () => {
    expect(RS_TID_TO_TREND_GAP_CANDIDATES).toEqual([
      2,
      3
    ]);
  });

  it("simulates five initial Dewford trends with stored rand values", () => {
    const result = simulateRsInitialDewfordTrends(
      0x05a0
    );

    expect(result.trends).toHaveLength(5);
    for (const trend of result.trends) {
      expect(trend.firstWordIndex).toBeGreaterThanOrEqual(0);
      expect(trend.firstWordIndex).toBeLessThan(69);
      expect(["lifestyle", "hobbies"]).toContain(
        trend.secondWordGroup
      );
      expect(trend.value).toMatch(/^[0-9A-F]{4}$/);
      expect([6, 7, 8]).toContain(
        trend.trendRandOffset
      );
    }
  });

  it("enumerates working-battery low16 TID states", () => {
    const states =
      enumerateRsTidStateCandidates(22279);

    expect(states).toHaveLength(65536);
    expect(states[0]).toBe(0x57070000);
    expect(states[0xffff]).toBe(0x5707ffff);
  });

  it("finds working-battery candidates and filters with additional stored trends", () => {
    const tidState = 0x57070000;
    const preTrendState = tidState;
    const simulated =
      simulateRsInitialDewfordTrends(preTrendState);
    const currentTrend = simulated.trends[0];
    const extraTrend = simulated.trends[1];
    const currentPhrase = getDewfordPhraseSignature({
      firstWordIndex: currentTrend.firstWordIndex,
      secondWordGroup: currentTrend.secondWordGroup,
      secondWordIndex: currentTrend.secondWordIndex
    });
    const extraPhrase = getDewfordPhraseSignature({
      firstWordIndex: extraTrend.firstWordIndex,
      secondWordGroup: extraTrend.secondWordGroup,
      secondWordIndex: extraTrend.secondWordIndex
    });
    const withoutExtra = findRsWorkingBatteryCandidates({
      trainerId: 22279,
      phraseSignature: currentPhrase
    });
    const withExtra = findRsWorkingBatteryCandidates({
      trainerId: 22279,
      phraseSignature: currentPhrase,
      additionalPhrases: [extraPhrase]
    });

    expect(
      withoutExtra.filterCounts.statesExamined
    ).toBe(131072);
    expect(
      withExtra.candidates.length
    ).toBeLessThanOrEqual(withoutExtra.candidates.length);
    expect(
      withExtra.filterCounts.uniqueFeebasValues
    ).toBe(withExtra.uniqueValues.length);
  });

  it("dead-battery mode uses the shared phrase simulation and returns three values", () => {
    const simulated =
      simulateRsInitialDewfordTrends(
        0x0004ce72
      );
    const phrase = getDewfordPhraseSignature({
      firstWordIndex:
        simulated.trends[0].firstWordIndex,
      secondWordGroup:
        simulated.trends[0].secondWordGroup,
      secondWordIndex:
        simulated.trends[0].secondWordIndex
    });
    const result = findRsDeadBatteryCandidates({
      trainerId: 22279,
      phraseSignature: phrase,
      candidateCount: 3,
      maxTidSearchAdvances: 100000
    });

    expect(result.bootSeed).toBe(0x05a0);
    expect(result.candidates.length).toBeLessThanOrEqual(3);
    for (const candidate of result.candidates) {
      expect([2, 3]).toContain(candidate.timingGap);
      expect(candidate.value).toMatch(/^[0-9A-F]{4}$/);
    }
  });

  it("shares downstream Route 119 seed-to-tile output across RSE games", () => {
    for (const value of ["88DE", "ABCD", "0000", "FFFF"]) {
      const emerald = calculateSharedRseTilesForGame(
        "emerald",
        value
      ).result.generatedSpotIds;
      const ruby = calculateSharedRseTilesForGame(
        "ruby",
        value
      ).result.generatedSpotIds;
      const sapphire = calculateSharedRseTilesForGame(
        "sapphire",
        value
      ).result.generatedSpotIds;

      expect(ruby).toEqual(emerald);
      expect(sapphire).toEqual(emerald);
      expect(emerald).toEqual(
        calculateRseFeebasFromValue(value).generatedSpotIds
      );
    }
  });

  it("converts working-battery results into a priority overlap summary", () => {
    const simulated =
      simulateRsInitialDewfordTrends(0x57070000);
    const phrase = getDewfordPhraseSignature({
      firstWordIndex:
        simulated.trends[0].firstWordIndex,
      secondWordGroup:
        simulated.trends[0].secondWordGroup,
      secondWordIndex:
        simulated.trends[0].secondWordIndex
    });
    const result = findRsWorkingBatteryCandidates({
      trainerId: 22279,
      phraseSignature: phrase
    });
    const summary = buildTileOverlapSummary(
      result.uniqueValues.map(entry => entry.value)
    );
    const topTiles = filterPriorityTiles(summary.tiles, {
      showMode: "top10"
    });
    const minimumTiles = filterPriorityTiles(summary.tiles, {
      minimumOverlap: summary.maxOverlapCount
    });

    expect(summary.totalCandidateValues).toBe(
      result.uniqueValues.length
    );
    expect(summary.totalUniqueTiles).toBeGreaterThan(0);
    expect(summary.maxOverlapCount).toBeGreaterThan(0);
    expect(topTiles.length).toBeLessThanOrEqual(10);
    expect(
      minimumTiles.every(
        tile => tile.count >= summary.maxOverlapCount
      )
    ).toBe(true);
  });

  it("priority display filters do not alter underlying overlap counts", () => {
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
      "0009",
      "000A"
    ]);
    const beforeCounts = summary.tiles.map(tile => ({
      key: `${tile.x}:${tile.y}`,
      count: tile.count
    }));

    filterPriorityTiles(summary.tiles, {
      showMode: "top25"
    });
    filterPriorityTiles(summary.tiles, {
      showMode: "high"
    });
    filterPriorityTiles(summary.tiles, {
      minimumOverlap: 2
    });

    expect(
      summary.tiles.map(tile => ({
        key: `${tile.x}:${tile.y}`,
        count: tile.count
      }))
    ).toEqual(beforeCounts);
  });
});
