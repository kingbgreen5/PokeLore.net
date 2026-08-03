import {
  describe,
  expect,
  it
} from "vitest";
import {
  DPPT_FEEBAS_SUGGESTED_VALIDATION_PAIRS,
  advanceDailyGroupSeed,
  calculateDpptFeebasResults,
  calculateDpptFeebasResultsFromSeed,
  calculateFeebasIndexesFromSeed,
  createRandomValidationPair,
  createValidationPairFromSeed,
  formatLotteryNumber,
  generateLotteryNumberFromSeed,
  parseLotteryNumber,
  recoverDpptGroupSeed,
  toInt32,
  validateLotteryNumber
} from "./dpptFeebasCalculator";
import validationCases from "../data/feebas/dpptFeebasValidationCases.json";
import { dpptFeebasAudit } from "./dpptFeebasTiles";

describe("dpptFeebasCalculator", () => {
  it("accepts 00000 without losing the displayed form", () => {
    expect(validateLotteryNumber("00000")).toEqual({
      valid: true,
      error: null
    });
    expect(parseLotteryNumber("00000")).toBe(0);
    expect(formatLotteryNumber(0)).toBe("00000");
  });

  it("keeps 01234 as five valid characters", () => {
    expect("01234").toHaveLength(5);
    expect(validateLotteryNumber("01234").valid).toBe(
      true
    );
    expect(parseLotteryNumber("01234")).toBe(1234);
  });

  it("rejects non-digit input", () => {
    expect(validateLotteryNumber("12a34")).toMatchObject({
      valid: false
    });
  });

  it.each(["", "1234", "123456"])(
    "rejects invalid length %s",
    value => {
      expect(validateLotteryNumber(value)).toMatchObject({
        valid: false
      });
    }
  );

  it("recovers the expected daily seed for an internal round-trip pair", () => {
    const yesterdaySeed = 0x12345678;
    const todaySeed = advanceDailyGroupSeed(yesterdaySeed);
    const yesterdayLottery = formatLotteryNumber(
      generateLotteryNumberFromSeed(yesterdaySeed)
    );
    const todayLottery = formatLotteryNumber(
      generateLotteryNumberFromSeed(todaySeed)
    );
    const candidates = recoverDpptGroupSeed(
      yesterdayLottery,
      todayLottery
    );

    expect(yesterdayLottery).toBe("02929");
    expect(todayLottery).toBe("14879");
    expect(
      candidates.map(candidate => candidate.groupSeedUnsigned)
    ).toContain(todaySeed);
  });

  it("creates a validation pair from a known yesterday seed", () => {
    const pair =
      createValidationPairFromSeed(0xa26e0c2b);

    expect(pair).toMatchObject({
      yesterdayLottery: "01234",
      todayLottery: "65432",
      yesterdaySeedHex: "0xA26E0C2B",
      todaySeedHex: "0x731ACFF8",
      profile: "negative yesterday seed, positive today seed"
    });
    expect(
      calculateDpptFeebasResults(
        pair.yesterdayLottery,
        pair.todayLottery
      ).valid
    ).toBe(true);
  });

  it("ships suggested validation pairs that all recover at least one candidate", () => {
    expect(
      DPPT_FEEBAS_SUGGESTED_VALIDATION_PAIRS.length
    ).toBeGreaterThanOrEqual(12);

    for (const pair of DPPT_FEEBAS_SUGGESTED_VALIDATION_PAIRS) {
      expect(validateLotteryNumber(pair.yesterdayLottery).valid).toBe(
        true
      );
      expect(validateLotteryNumber(pair.todayLottery).valid).toBe(
        true
      );
      expect(
        calculateDpptFeebasResults(
          pair.yesterdayLottery,
          pair.todayLottery
        ).candidates.length
      ).toBeGreaterThan(0);
    }
  });

  it("creates deterministic random validation pairs when random is injected", () => {
    const pair = createRandomValidationPair(() => 0);

    expect(pair).toMatchObject({
      label: "Random pair",
      yesterdayLottery: "00000",
      todayLottery: "16838",
      yesterdaySeedHex: "0x00000000",
      todaySeedHex: "0x00000001"
    });
  });

  it("uses raw unsigned seed bytes for Feebas indexes", () => {
    const result =
      calculateFeebasIndexesFromSeed(0x80000000);

    expect(result.groupSeedSigned).toBe(-2147483648);
    expect(result.absoluteSeed).toBe(2147483648);
    expect(result.bytes).toEqual([128, 0, 0, 0]);
    expect(result.indexes).toEqual([128, 132, 264, 396]);
    expect(result.signedAbsoluteBytes).toEqual([128, 0, 0, 0]);
    expect(result.signedAbsoluteIndexes).toEqual([
      128,
      132,
      264,
      396
    ]);
    expect(result.hasSignedAbsoluteAlternate).toBe(false);
  });

  it("calculates public Feebas results directly from a group seed", () => {
    const result =
      calculateDpptFeebasResultsFromSeed(0x80000000);

    expect(result.valid).toBe(true);
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].indexes).toEqual([
      128,
      132,
      264,
      396
    ]);
    expect(result.candidates[0].results).toHaveLength(4);
  });

  it("exposes a signed-absolute legacy alternate for negative non-INT_MIN seeds", () => {
    const result =
      calculateFeebasIndexesFromSeed(0xa36d6b76);

    expect(result.groupSeedSigned).toBeLessThan(0);
    expect(result.indexes).toEqual([31, 241, 371, 514]);
    expect(result.signedAbsoluteIndexes).toEqual([
      92,
      146,
      280,
      402
    ]);
    expect(result.hasSignedAbsoluteAlternate).toBe(true);
  });

  it("puts each produced index in the expected 132-tile group", () => {
    const result =
      calculateDpptFeebasResults("02929", "14879");
    const candidate = result.candidates.find(
      entry =>
        entry.groupSeedUnsigned ===
        advanceDailyGroupSeed(0x12345678)
    );

    expect(candidate).toBeTruthy();
    expect(candidate.indexes[0]).toBeGreaterThanOrEqual(0);
    expect(candidate.indexes[0]).toBeLessThanOrEqual(131);
    expect(candidate.indexes[1]).toBeGreaterThanOrEqual(132);
    expect(candidate.indexes[1]).toBeLessThanOrEqual(263);
    expect(candidate.indexes[2]).toBeGreaterThanOrEqual(264);
    expect(candidate.indexes[2]).toBeLessThanOrEqual(395);
    expect(candidate.indexes[3]).toBeGreaterThanOrEqual(396);
    expect(candidate.indexes[3]).toBeLessThanOrEqual(527);
  });

  it("resolves every produced index to exactly one coordinate", () => {
    const result =
      calculateDpptFeebasResults("02929", "14879");

    expect(result.valid).toBe(true);
    for (const candidate of result.candidates) {
      expect(candidate.results).toHaveLength(4);
      expect(
        candidate.results.every(entry =>
          Number.isInteger(entry.x)
        )
      ).toBe(true);
      expect(
        candidate.results.every(entry =>
          Number.isInteger(entry.y)
        )
      ).toBe(true);
    }
  });

  it.each(
    validationCases.filter(
      testCase =>
        testCase.externalVisualMatch ===
        "matches-external"
    )
  )(
    "matches externally confirmed visual case $name",
    testCase => {
      const result = calculateDpptFeebasResults(
        testCase.yesterdayLottery,
        testCase.todayLottery
      );

      expect(result.valid).toBe(true);
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].indexes).toEqual(
        testCase.expectedIndexes
      );
      expect(
        result.candidates[0].results.map(entry => ({
          resultNumber: entry.resultNumber,
          index: entry.index,
          x: entry.x,
          y: entry.y
        }))
      ).toEqual(testCase.expectedCoordinates);
    }
  );

  it("reports impossible or inconsistent lottery pairs", () => {
    const result =
      calculateDpptFeebasResults("00000", "00002");

    expect(result.valid).toBe(false);
    expect(result.candidates).toEqual([]);
    expect(result.errors[0]).toContain("No DPPt");
  });

  it("rejects five-digit values outside the generated 16-bit range", () => {
    const result =
      calculateDpptFeebasResults("99999", "00000");

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("65535");
  });

  it("handles signed display values without losing unsigned seed identity", () => {
    const seed = 0xf88a4c81;
    const result = calculateFeebasIndexesFromSeed(seed);

    expect(result.groupSeedSigned).toBe(toInt32(seed));
    expect(result.groupSeedUnsigned).toBe(seed);
    expect(result.seedHex).toBe("0xF88A4C81");
    expect(result.hasSignedAbsoluteAlternate).toBe(true);
  });

  it("confirms the completed dataset has exactly 84 excluded cells", () => {
    expect(dpptFeebasAudit.excludedGridCells).toBe(84);
    expect(dpptFeebasAudit.valid).toBe(true);
  });
});
