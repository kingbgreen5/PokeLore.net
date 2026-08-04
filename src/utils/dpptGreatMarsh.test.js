import {
  describe,
  expect,
  it
} from "vitest";
import {
  advanceDailyGroupSeed,
  calculateDpptFeebasResults,
  calculateDpptFeebasResultsFromSeed,
  createValidationPairFromSeed
} from "./dpptFeebasCalculator";
import {
  calculateDpptGreatMarshCandidateResults,
  calculateDpptGreatMarshResults,
  DPPT_GREAT_MARSH_GAME_TABLES,
  getDpptGreatMarshAreaValues
} from "./dpptGreatMarsh";
import {
  DPPT_GREAT_MARSH_VALIDATION_CASES
} from "../data/feebas/dpptGreatMarshPokemon";

function packAreaValues(values) {
  const [
    area1,
    area2,
    area3,
    area4,
    area5,
    area6
  ] = values;

  return (
    ((area1 & 0x1f) << 0) |
    ((area2 & 0x1f) << 5) |
    ((area3 & 0x1f) << 10) |
    ((area4 & 0x1f) << 15) |
    ((area5 & 0x1f) << 20) |
    ((area6 & 0x1f) << 25)
  ) >>> 0;
}

describe("dpptGreatMarsh", () => {
  it("handles a zero unsigned seed", () => {
    expect(getDpptGreatMarshAreaValues(0x00000000)).toEqual([
      0,
      0,
      0,
      0,
      0,
      0
    ]);
  });

  it("extracts six 5-bit fields from an unsigned 32-bit seed", () => {
    const expectedValues = [24, 19, 21, 8, 3, 9];
    const seed = packAreaValues(expectedValues);

    expect(seed).toBe(0x12345678);
    expect(getDpptGreatMarshAreaValues(seed)).toEqual(
      expectedValues
    );
  });

  it("keeps area order from Area 1 through Area 6", () => {
    const expectedValues = [1, 2, 3, 4, 5, 6];

    expect(
      getDpptGreatMarshAreaValues(packAreaValues(expectedValues))
    ).toEqual(expectedValues);
  });

  it("ignores the top two unused bits", () => {
    const baseValues = [7, 8, 9, 10, 11, 12];
    const baseSeed = packAreaValues(baseValues);

    expect(
      getDpptGreatMarshAreaValues(baseSeed | 0xc0000000)
    ).toEqual(baseValues);
  });

  it("treats 0xFFFFFFFF as unsigned six max-value fields", () => {
    expect(getDpptGreatMarshAreaValues(0xffffffff)).toEqual([
      31,
      31,
      31,
      31,
      31,
      31
    ]);
  });

  it("normalizes signed-looking seeds without using absolute values", () => {
    expect(getDpptGreatMarshAreaValues(-1)).toEqual([
      31,
      31,
      31,
      31,
      31,
      31
    ]);
  });

  it("ships complete Diamond/Pearl and Platinum value tables", () => {
    expect(DPPT_GREAT_MARSH_GAME_TABLES.platinum.pokemonIds).toHaveLength(32);
    expect(DPPT_GREAT_MARSH_GAME_TABLES.diamondPearl.pokemonIds).toHaveLength(32);
    expect(DPPT_GREAT_MARSH_GAME_TABLES.platinum.pokemonIds).toEqual([
      454,
      352,
      352,
      455,
      451,
      453,
      195,
      452,
      451,
      453,
      195,
      115,
      46,
      452,
      102,
      102,
      451,
      453,
      451,
      455,
      193,
      285,
      46,
      115,
      316,
      357,
      316,
      285,
      451,
      455,
      453,
      114
    ]);
    expect(DPPT_GREAT_MARSH_GAME_TABLES.diamondPearl.pokemonIds).toEqual([
      453,
      451,
      455,
      453,
      451,
      455,
      55,
      453,
      451,
      455,
      315,
      397,
      454,
      452,
      102,
      55,
      397,
      453,
      451,
      455,
      193,
      285,
      46,
      115,
      316,
      315,
      397,
      453,
      451,
      455,
      315,
      55
    ]);
  });

  it("maps a mixed seed into both version tables", () => {
    const result = calculateDpptGreatMarshResults(0x12345678);

    expect(result.areaValues).toEqual([24, 19, 21, 8, 3, 9]);
    expect(result.platinum.map(entry => entry.pokemonId)).toEqual([
      316,
      455,
      285,
      451,
      455,
      453
    ]);
    expect(
      result.diamondPearl.map(entry => entry.pokemonId)
    ).toEqual([316, 455, 285, 451, 453, 455]);
  });

  it("keeps duplicate Pokemon in separate Great Marsh areas", () => {
    const result = calculateDpptGreatMarshResults(
      packAreaValues([0, 3, 7, 17, 27, 30])
    );

    expect(result.diamondPearl).toHaveLength(6);
    expect(
      result.diamondPearl.map(entry => entry.pokemonId)
    ).toEqual([453, 453, 453, 453, 453, 315]);
    expect(
      result.diamondPearl.map(entry => entry.area)
    ).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("keeps two candidate seeds separate", () => {
    const feebasResult =
      calculateDpptFeebasResults("61249", "33671");
    const marshResults =
      calculateDpptGreatMarshCandidateResults(
        feebasResult.candidates
      );

    expect(marshResults).toHaveLength(2);
    expect(
      marshResults.map(candidate => ({
        candidateNumber: candidate.candidateNumber,
        groupSeedUnsigned: candidate.groupSeedUnsigned,
        areaValues: candidate.results.areaValues
      }))
    ).toEqual([
      {
        candidateNumber: 1,
        groupSeedUnsigned: 0xbd71aa22,
        areaValues: [2, 17, 10, 3, 23, 30]
      },
      {
        candidateNumber: 2,
        groupSeedUnsigned: 0x47ee3606,
        areaValues: [6, 16, 13, 28, 30, 3]
      }
    ]);
  });

  it("returns identical Marsh results from uploaded-save and equivalent lottery seeds", () => {
    const yesterdaySeed = 0xa26e0c2b;
    const todaySeed = advanceDailyGroupSeed(yesterdaySeed);
    const pair = createValidationPairFromSeed(yesterdaySeed);
    const fromSave = calculateDpptFeebasResultsFromSeed(todaySeed);
    const fromLottery = calculateDpptFeebasResults(
      pair.yesterdayLottery,
      pair.todayLottery
    );

    expect(
      calculateDpptGreatMarshCandidateResults(fromSave.candidates)[0]
        .results
    ).toEqual(
      calculateDpptGreatMarshCandidateResults(
        fromLottery.candidates
      )[0].results
    );
  });

  it.each(DPPT_GREAT_MARSH_VALIDATION_CASES)(
    "matches validation fixture $source",
    fixture => {
      const result =
        calculateDpptGreatMarshResults(fixture.groupSeed);

      expect(result.areaValues).toEqual(
        fixture.expectedAreaValues
      );
      expect(result.platinum.map(entry => entry.pokemonId)).toEqual(
        fixture.expectedPlatinumPokemonIds
      );
      expect(
        result.diamondPearl.map(entry => entry.pokemonId)
      ).toEqual(fixture.expectedDiamondPearlPokemonIds);
    }
  );
});
