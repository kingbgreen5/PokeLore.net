import { describe, expect, it } from "vitest";
import goldenMaster from "../test/fixtures/feebas/dpptGoldenMaster.json";
import {
  calculateDpptFeebasResults,
  calculateDpptFeebasResultsFromSeed
} from "./dpptFeebasCalculator";
import {
  calculateDpptGreatMarshResults
} from "./dpptGreatMarsh";
import {
  DPPT_RAW_SAVE_SIZE,
  DPPT_SAVE_LAYOUTS,
  calculateCrc16Ccitt,
  parseDpptSave,
  parseDpptSaveFile
} from "./dpptSaveParser";
import {
  DPPT_FEEBAS_GRID_HEIGHT,
  DPPT_FEEBAS_GRID_WIDTH,
  DPPT_FEEBAS_TOTAL_GRID_SQUARES,
  dpptFeebasAudit,
  dpptFeebasExcludedGridCells,
  dpptFeebasTiles,
  getFeebasTileByIndex
} from "./dpptFeebasTiles";

function projectCandidate(candidate) {
  return {
    groupSeedUnsigned: candidate.groupSeedUnsigned,
    indexes: candidate.indexes,
    results: candidate.results.map(result => ({
      resultNumber: result.resultNumber,
      index: result.index,
      group: result.group,
      indexWithinGroup: result.indexWithinGroup,
      x: result.x,
      y: result.y
    }))
  };
}

function coordinateChecksum(tiles) {
  let hash = 0x811c9dc5;
  for (const tile of tiles) {
    for (const value of [tile.index, tile.x, tile.y, tile.group]) {
      hash ^= value;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return `0x${hash.toString(16).padStart(8, "0")}`;
}

function buildSyntheticSave({ game, slotIndex, saveCounter, feebasSeed }) {
  const layout = DPPT_SAVE_LAYOUTS.find(entry => entry.game === game);
  const buffer = new ArrayBuffer(DPPT_RAW_SAVE_SIZE);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const blockStart = slotIndex * 0x40000;
  const footerStart = blockStart + layout.generalBlockSize - 0x14;

  view.setUint32(blockStart + layout.feebasSeedOffset, feebasSeed, true);
  view.setUint32(footerStart, 1, true);
  view.setUint32(footerStart + 4, saveCounter, true);
  view.setUint32(footerStart + 8, layout.generalBlockSize, true);
  view.setUint16(
    footerStart + 0x12,
    calculateCrc16Ccitt(bytes, blockStart, footerStart),
    true
  );
  return buffer;
}

describe("DPPt Feebas production golden master", () => {
  it.each(goldenMaster.seedCases)(
    "preserves exact Feebas indexes and coordinate mapping for seed $seed",
    fixture => {
      const candidate = calculateDpptFeebasResultsFromSeed(fixture.seed).candidates[0];
      expect(candidate.indexes).toEqual(fixture.indexes);
      expect(candidate.results.map(result => getFeebasTileByIndex(result.index))).toEqual(
        candidate.results.map(({ index, x, y }) => ({ ...getFeebasTileByIndex(index), x, y }))
      );
    }
  );

  it.each(goldenMaster.lotteryCases)(
    "preserves lottery result $yesterdayLottery -> $todayLottery",
    fixture => {
      const result = calculateDpptFeebasResults(fixture.yesterdayLottery, fixture.todayLottery);
      expect(result.valid).toBe(fixture.valid);
      expect(result.candidateCount ?? 0).toBe(fixture.candidateCount);
      expect(result.errors).toEqual(fixture.errors ?? []);
      expect(result.candidates.map(candidate => candidate.indexes)).toEqual(fixture.candidateIndexes ?? []);
      if (fixture.candidateSeeds) {
        expect(result.candidates.map(candidate => candidate.groupSeedUnsigned)).toEqual(fixture.candidateSeeds);
      }
    }
  );

  it.each(goldenMaster.invalidLotteryCases)(
    "preserves validation error for $yesterdayLottery / $todayLottery",
    fixture => {
      const result = calculateDpptFeebasResults(fixture.yesterdayLottery, fixture.todayLottery);
      expect(result).toMatchObject({ valid: false, errors: fixture.errors });
      expect(result.candidates).toEqual([]);
    }
  );

  it.each(goldenMaster.greatMarshCases)("preserves Great Marsh result for seed $seed", fixture => {
    const result = calculateDpptGreatMarshResults(fixture.seed);
    expect(result.areaValues).toEqual(fixture.areaValues);
    expect(result.platinum.map(entry => entry.pokemonId)).toEqual(fixture.platinum);
    expect(result.diamondPearl.map(entry => entry.pokemonId)).toEqual(fixture.diamondPearl);
  });

  it.each(goldenMaster.saveCases)("preserves synthetic $game save parsing", fixture => {
    expect(parseDpptSave(buildSyntheticSave(fixture))).toMatchObject({
      valid: true,
      game: fixture.game,
      saveBlockIndex: fixture.slotIndex,
      saveCounter: fixture.saveCounter,
      feebasSeed: fixture.feebasSeed
    });
  });

  it.each(goldenMaster.parserErrors)("preserves parser error $kind", async fixture => {
    let result;
    if (fixture.kind === "no-file") {
      result = await parseDpptSaveFile(null);
    } else if (fixture.kind === "wrong-extension") {
      result = await parseDpptSaveFile({ name: "save.bin" });
    } else if (fixture.kind === "read-failure") {
      result = await parseDpptSaveFile({
        name: "save.sav",
        arrayBuffer: async () => {
          throw new Error("read failed");
        }
      });
    } else if (fixture.kind === "non-buffer") {
      result = parseDpptSave({});
    } else if (fixture.kind === "wrong-size") {
      result = parseDpptSave(new ArrayBuffer(1));
    } else {
      result = parseDpptSave(new ArrayBuffer(DPPT_RAW_SAVE_SIZE));
    }
    expect(result).toMatchObject({
      valid: false,
      errorCode: fixture.errorCode,
      message: fixture.message
    });
  });

  it("preserves map dimensions, fishability, orientation, and tile-to-cell mapping", () => {
    expect({
      gridWidth: DPPT_FEEBAS_GRID_WIDTH,
      gridHeight: DPPT_FEEBAS_GRID_HEIGHT,
      totalGridSquares: DPPT_FEEBAS_TOTAL_GRID_SQUARES,
      fishableTiles: dpptFeebasTiles.length,
      excludedCells: dpptFeebasExcludedGridCells.length,
      coordinateChecksum: coordinateChecksum(dpptFeebasTiles)
    }).toEqual({
      gridWidth: goldenMaster.map.gridWidth,
      gridHeight: goldenMaster.map.gridHeight,
      totalGridSquares: goldenMaster.map.totalGridSquares,
      fishableTiles: goldenMaster.map.fishableTiles,
      excludedCells: goldenMaster.map.excludedCells,
      coordinateChecksum: goldenMaster.map.coordinateChecksum
    });
    expect(dpptFeebasAudit.valid).toBe(true);
    for (const sentinel of goldenMaster.map.sentinels) {
      expect(getFeebasTileByIndex(sentinel.index)).toMatchObject(sentinel);
    }
  });

  it("keeps raw structured candidate output available for future wrapper-to-core deep equality", () => {
    const result = calculateDpptFeebasResults("01234", "65432");
    expect(result.candidates.map(projectCandidate)).toHaveLength(1);
  });
});
