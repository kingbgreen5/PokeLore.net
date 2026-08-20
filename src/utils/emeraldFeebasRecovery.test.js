import {
  describe,
  expect,
  it
} from "vitest";
import {
  calculateRseFeebasFromValue,
  RSE_FEEBAS_RNG_INCREMENT
} from "./rseFeebasCalculator";
import {
  EMERALD_MIN_TREND_SEARCH_ADVANCES,
  EMERALD_NORMAL_RNG_INCREMENT,
  EMERALD_PARITY_CANDIDATE_COUNT,
  findExactFeebasValueInPredictionStream,
  advanceEmeraldRng,
  advanceEmeraldRngBy,
  findEmeraldFeebasValueCandidates,
  formatFeebasValue,
  getDewfordPhraseSignature,
  getEmeraldEasyChatAudit,
  getFeebasRandOffsetForTrend,
  getUpper16,
  matchDewfordPhraseAtState,
  normalizeTrainerId
} from "./emeraldFeebasRecovery";

const RNG_FIXTURES = [
  {
    stateBefore: 0,
    stateAfter: 0x00006073,
    upper16: 0x0000
  },
  {
    stateBefore: 1,
    stateAfter: 0x41c6aee0,
    upper16: 0x41c6
  },
  {
    stateBefore: 12345,
    stateAfter: 0xd3dc46b8,
    upper16: 0xd3dc
  },
  {
    stateBefore: 32767,
    stateAfter: 0xe5709206,
    upper16: 0xe570
  },
  {
    stateBefore: 65535,
    stateAfter: 0x0ca71206,
    upper16: 0x0ca7
  },
  {
    stateBefore: 0xffffffff,
    stateAfter: 0xbe3a1206,
    upper16: 0xbe3a
  }
];

describe("emeraldFeebasRecovery", () => {
  it("advances Emerald normal RNG with increment 24691", () => {
    expect(EMERALD_NORMAL_RNG_INCREMENT).toBe(24691);
    expect(RSE_FEEBAS_RNG_INCREMENT).toBe(12345);

    for (const fixture of RNG_FIXTURES) {
      const stateAfter = advanceEmeraldRng(
        fixture.stateBefore
      );

      expect(stateAfter).toBe(fixture.stateAfter);
      expect(getUpper16(stateAfter)).toBe(
        fixture.upper16
      );
    }
  });

  it("advances by an explicit count without mutating calibration state", () => {
    expect(advanceEmeraldRngBy(0, 0)).toBe(0);
    expect(advanceEmeraldRngBy(0, 1)).toBe(
      0x00006073
    );
    expect(advanceEmeraldRngBy(1, 1)).toBe(
      0x41c6aee0
    );
  });

  it("normalizes decimal Trainer IDs only", () => {
    expect(normalizeTrainerId("00042")).toMatchObject({
      valid: true,
      trainerId: 42,
      paddedTrainerId: "00042"
    });
    expect(normalizeTrainerId("FFFF").valid).toBe(
      false
    );
    expect(normalizeTrainerId("65536").valid).toBe(
      false
    );
  });

  it("audits Emerald Easy Chat group counts", () => {
    expect(getEmeraldEasyChatAudit()).toMatchObject({
      valid: true,
      counts: {
        conditions: 69,
        lifestyle: 45,
        hobbies: 54
      }
    });
  });

  it("builds phrase signatures from internal indexes", () => {
    expect(
      getDewfordPhraseSignature({
        firstWordIndex: 0,
        secondWordGroup: "lifestyle",
        secondWordIndex: 0
      })
    ).toMatchObject({
      firstWordText: "HOT",
      firstWordIndex: 0,
      firstGroupSize: 69,
      secondWordText: "CHORES",
      secondWordGroup: "lifestyle",
      secondWordGroupBit: 1,
      secondWordIndex: 0,
      secondGroupSize: 45
    });

    expect(
      getDewfordPhraseSignature({
        firstWordIndex: 20,
        secondWordGroup: "hobbies",
        secondWordIndex: 20
      })
    ).toMatchObject({
      firstWordText: "LATE",
      secondWordText: "WALK",
      secondWordGroupBit: 0,
      secondGroupSize: 54
    });
  });

  it("matches phrase states by condition modulo, group bit, and second-word modulo", () => {
    const signature = getDewfordPhraseSignature({
      firstWordIndex: 0,
      secondWordGroup: "lifestyle",
      secondWordIndex: 0
    });
    const match = matchDewfordPhraseAtState(
      0x4a1fc470,
      signature
    );

    expect(match).toMatchObject({
      matches: true,
      firstWordModulo: 0,
      secondWordGroupBit: 1,
      secondWordModulo: 0
    });

    expect(
      matchDewfordPhraseAtState(
        0x4a1fc471,
        signature
      ).matches
    ).toBe(false);
  });

  it("derives trend rand offsets from +4 and +5 branch tests", () => {
    expect(
      getFeebasRandOffsetForTrend(0x0000000b)
    ).toMatchObject({
      test1: 4,
      test2: 2,
      trendRandOffset: 6
    });
    expect(
      getFeebasRandOffsetForTrend(0x00000000)
    ).toMatchObject({
      test1: 78,
      test2: 60,
      trendRandOffset: 7
    });
    expect(
      getFeebasRandOffsetForTrend(0x00000003)
    ).toMatchObject({
      test1: 66,
      test2: 96,
      trendRandOffset: 8
    });
  });

  it("searches from Trainer ID after 700 skips and returns five ordered candidates", () => {
    const signature = getDewfordPhraseSignature({
      firstWordIndex: 0,
      secondWordGroup: "lifestyle",
      secondWordIndex: 0
    });
    const result = findEmeraldFeebasValueCandidates({
      trainerId: 0,
      phraseSignature: signature
    });

    expect(result.minimumAdvances).toBe(
      EMERALD_MIN_TREND_SEARCH_ADVANCES
    );
    expect(result.candidateCount).toBe(
      EMERALD_PARITY_CANDIDATE_COUNT
    );
    expect(result.candidates).toHaveLength(5);
    expect(result.candidates).toEqual([
      expect.objectContaining({
        candidateNumber: 1,
        value: "EA44",
        decimal: 59972,
        scanAdvance: 23920,
        firstWordStateHex: "0x4A1FC470",
        trendRandOffset: 7,
        test1: 56,
        test2: 31
      }),
      expect.objectContaining({
        candidateNumber: 2,
        value: "44BC",
        decimal: 17596,
        scanAdvance: 24262,
        firstWordStateHex: "0x74FA12AE",
        trendRandOffset: 7
      }),
      expect.objectContaining({
        candidateNumber: 3,
        value: "2D24",
        decimal: 11556,
        scanAdvance: 45907,
        firstWordStateHex: "0x77222525",
        trendRandOffset: 7
      }),
      expect.objectContaining({
        candidateNumber: 4,
        value: "54E4",
        decimal: 21732,
        scanAdvance: 47362,
        firstWordStateHex: "0xF4778C6A",
        trendRandOffset: 6
      }),
      expect.objectContaining({
        candidateNumber: 5,
        value: "FC71",
        decimal: 64625,
        scanAdvance: 47615,
        firstWordStateHex: "0xCAF523A1",
        trendRandOffset: 7
      })
    ]);
  });

  it("does not dedupe repeated Feebas values", () => {
    const signature = getDewfordPhraseSignature({
      firstWordIndex: 0,
      secondWordGroup: "lifestyle",
      secondWordIndex: 0
    });
    const result = findEmeraldFeebasValueCandidates({
      trainerId: 0,
      phraseSignature: signature,
      candidateCount: 12
    });
    const values = result.candidates.map(
      candidate => candidate.value
    );

    expect(values).toHaveLength(12);
    expect(values.length).toBe(
      result.candidates.length
    );
  });

  it("feeds candidates into the validated RSE downstream calculator", () => {
    const signature = getDewfordPhraseSignature({
      firstWordIndex: 0,
      secondWordGroup: "lifestyle",
      secondWordIndex: 0
    });
    const result = findEmeraldFeebasValueCandidates({
      trainerId: 0,
      phraseSignature: signature
    });

    for (const candidate of result.candidates) {
      expect(candidate.value).toBe(
        formatFeebasValue(candidate.decimal)
      );
      const downstream =
        calculateRseFeebasFromValue(candidate.value);
      expect(downstream.generatedSpotIds).toHaveLength(
        6
      );
      expect(
        downstream.generatedSpotIds.every(
          spotId => spotId >= 4
        )
      ).toBe(true);
      expect(downstream.coordinates).toHaveLength(6);
      expect(
        downstream.coordinates.every(
          tile => tile.feebasSelectable
        )
      ).toBe(true);
    }
  });

  it("extended search preserves the ordinary first-five candidate stream", () => {
    const signature = getDewfordPhraseSignature({
      firstWordIndex: 0,
      secondWordGroup: "lifestyle",
      secondWordIndex: 0
    });
    const ordinary = findEmeraldFeebasValueCandidates({
      trainerId: 0,
      phraseSignature: signature
    });
    const extended =
      findExactFeebasValueInPredictionStream({
        trainerId: 0,
        phraseSignature: signature,
        exactValue: "9305",
        maxCandidateMatches: 6
      });

    expect(
      extended.candidates
        .slice(0, 5)
        .map(candidate => candidate.value)
    ).toEqual(
      ordinary.candidates.map(
        candidate => candidate.value
      )
    );
  });

  it("extended search continues past candidate five and reports exact rank", () => {
    const signature = getDewfordPhraseSignature({
      firstWordIndex: 0,
      secondWordGroup: "lifestyle",
      secondWordIndex: 0
    });
    const extended =
      findExactFeebasValueInPredictionStream({
        trainerId: 0,
        phraseSignature: signature,
        exactValue: "9305",
        maxCandidateMatches: 6
      });

    expect(extended).toMatchObject({
      exactValue: "9305",
      exactValueFound: true,
      firstMatchingCandidateRank: 6
    });
    expect(extended.firstMatch).toMatchObject({
      rank: 6,
      value: "9305",
      scanAdvance: 48139,
      firstWordStateHex: "0x69ED783D",
      trendRandOffset: 7
    });
  });

  it("accepts FFFF as a legitimate exact 16-bit value", () => {
    const signature = getDewfordPhraseSignature({
      firstWordIndex: 0,
      secondWordGroup: "lifestyle",
      secondWordIndex: 0
    });
    const extended =
      findExactFeebasValueInPredictionStream({
        trainerId: 0,
        phraseSignature: signature,
        exactValue: "FFFF",
        maxCandidateMatches: 3
      });

    expect(extended.exactValue).toBe("FFFF");
    expect(extended.exactDecimal).toBe(65535);
    expect(extended.exactValueFound).toBe(false);
    expect(extended.phraseMatchesExamined).toBe(3);
  });

  it("returns a diagnostic not-found result without changing downstream calculation", () => {
    const signature = getDewfordPhraseSignature({
      firstWordIndex: 0,
      secondWordGroup: "lifestyle",
      secondWordIndex: 0
    });
    const extended =
      findExactFeebasValueInPredictionStream({
        trainerId: 0,
        phraseSignature: signature,
        exactValue: "FFFF",
        maxCandidateMatches: 1
      });
    const downstream =
      calculateRseFeebasFromValue("FFFF");

    expect(extended).toMatchObject({
      exactValueFound: false,
      firstMatchingCandidateRank: null,
      phraseMatchesExamined: 1
    });
    expect(downstream.generatedSpotIds).toEqual([
      109,
      132,
      61,
      106,
      386,
      99
    ]);
  });
});
