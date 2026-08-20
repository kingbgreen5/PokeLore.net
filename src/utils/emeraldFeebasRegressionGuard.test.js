import {
  describe,
  expect,
  it
} from "vitest";
import emeraldFixture from "../test/fixtures/feebas/emerald.json";
import {
  EMERALD_FEEBAS_SECTOR_OFFSET,
  EMERALD_FEEBAS_VALUE_OFFSET
} from "./emeraldSaveParser";
import {
  EMERALD_MIN_TREND_SEARCH_ADVANCES,
  EMERALD_NORMAL_RNG_INCREMENT,
  findEmeraldFeebasValueCandidates,
  getDewfordPhraseSignature
} from "./emeraldFeebasRecovery";
import {
  RSE_FEEBAS_FIRST_MAPPED_SPOT_ID,
  RSE_FEEBAS_MAPPED_SPOT_COUNT,
  RSE_FEEBAS_REJECTED_SPOT_IDS,
  RSE_FEEBAS_RNG_INCREMENT,
  RSE_FEEBAS_SPOT_COUNT,
  calculateRseFeebasFromValue,
  route119FeebasAudit
} from "./rseFeebasCalculator";

describe("Emerald Feebas Regression Guard", () => {
  it("locks stable Emerald constants and Route 119 dataset shape", () => {
    expect(EMERALD_NORMAL_RNG_INCREMENT).toBe(24691);
    expect(RSE_FEEBAS_RNG_INCREMENT).toBe(12345);
    expect(EMERALD_FEEBAS_VALUE_OFFSET).toBe(0x2e6a);
    expect(EMERALD_FEEBAS_SECTOR_OFFSET).toBe(0x0f6a);
    expect(RSE_FEEBAS_SPOT_COUNT).toBe(447);
    expect(RSE_FEEBAS_MAPPED_SPOT_COUNT).toBe(444);
    expect(RSE_FEEBAS_FIRST_MAPPED_SPOT_ID).toBe(4);
    expect(RSE_FEEBAS_REJECTED_SPOT_IDS).toEqual([
      1,
      2,
      3
    ]);
    expect(route119FeebasAudit.valid).toBe(true);
    expect(route119FeebasAudit.uniqueSpotIds).toBe(444);
  });

  it("keeps the validated Emerald TID 22279 TIRED / DIET candidate list", () => {
    const signature = getDewfordPhraseSignature({
      firstWordIndex:
        emeraldFixture.storedTrend.firstIndex,
      secondWordGroup: "hobbies",
      secondWordIndex:
        emeraldFixture.storedTrend.secondIndex
    });
    const result = findEmeraldFeebasValueCandidates({
      trainerId: emeraldFixture.trainerId,
      phraseSignature: signature,
      minimumAdvances:
        EMERALD_MIN_TREND_SEARCH_ADVANCES
    });

    expect(signature.phrase).toBe("TIRED / DIET");
    expect(
      result.candidates.map(candidate => candidate.value)
    ).toEqual(emeraldFixture.predictedCandidates);
    expect(result.candidates[0].value).toBe(
      emeraldFixture.exactFeebasValue
    );
  });

  it("keeps 88DE mapped to validated Route 119 spot IDs and coordinates", () => {
    const result = calculateRseFeebasFromValue(
      emeraldFixture.exactFeebasValue
    );

    expect(result.generatedSpotIds).toEqual(
      emeraldFixture.spotIds
    );
    expect(
      result.coordinates.map(tile => ({
        spotId: tile.spotId,
        x: tile.x,
        y: tile.y
      }))
    ).toEqual(emeraldFixture.coordinates);
  });
});
