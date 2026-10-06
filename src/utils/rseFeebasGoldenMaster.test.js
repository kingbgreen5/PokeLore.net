import { describe, expect, it } from "vitest";
import goldenMaster from "../test/fixtures/feebas/rseGoldenMaster.json";
import {
  GBA_SAVE_SIZE,
  GEN3_FEEBAS_SAVE_PROFILES,
  SECTOR_CHECKSUM_OFFSET,
  SECTOR_COUNTER_OFFSET,
  SECTOR_ID_OFFSET,
  SECTOR_SIGNATURE,
  SECTOR_SIGNATURE_OFFSET,
  SECTOR_SIZE,
  SECTORS_PER_SLOT,
  calculateGen3SaveChecksum,
  parseEmeraldSave,
  parseRubySapphireSave
} from "./emeraldSaveParser";
import {
  findEmeraldFeebasValueCandidates,
  findExactFeebasValueInPredictionStream,
  getDewfordPhraseSignature
} from "./emeraldFeebasRecovery";
import {
  RSE_FEEBAS_GRID_HEIGHT,
  RSE_FEEBAS_GRID_WIDTH,
  RSE_FEEBAS_MAPPED_SPOT_COUNT,
  RSE_FEEBAS_SPOT_COUNT,
  calculateRseFeebasFromValue,
  getRoute119FeebasCoordinateForSpotId,
  normalizeFeebasValue,
  route119FeebasAudit
} from "./rseFeebasCalculator";
import { getPlayerFacingLocationsForSpotId } from "./rseFeebasDisplayRules";
import { getUniqueReachableTiles } from "./rseFeebasPublicCalculator";

function writeU16LE(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
}

function writeU32LE(bytes, offset, value) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >>> 8) & 0xff;
  bytes[offset + 2] = (value >>> 16) & 0xff;
  bytes[offset + 3] = (value >>> 24) & 0xff;
}

function buildSyntheticSave({ profile, counter, trainerId, feebasValue }) {
  const layout = GEN3_FEEBAS_SAVE_PROFILES[profile === "emerald" ? "emerald" : "rubySapphire"];
  const save = new Uint8Array(GBA_SAVE_SIZE);
  const value = Number.parseInt(feebasValue, 16);
  for (let logicalId = 0; logicalId < SECTORS_PER_SLOT; logicalId += 1) {
    const sector = new Uint8Array(SECTOR_SIZE);
    if (logicalId === 0) writeU16LE(sector, 0x0a, trainerId);
    if (logicalId === 3) writeU16LE(sector, layout.feebasSectorOffset, value);
    writeU16LE(sector, SECTOR_ID_OFFSET, logicalId);
    writeU16LE(sector, SECTOR_CHECKSUM_OFFSET, calculateGen3SaveChecksum(sector, layout.sectorDataSizes[logicalId]));
    writeU32LE(sector, SECTOR_SIGNATURE_OFFSET, SECTOR_SIGNATURE);
    writeU32LE(sector, SECTOR_COUNTER_OFFSET, counter);
    save.set(sector, logicalId * SECTOR_SIZE);
  }
  return save;
}

describe("RSE Feebas production golden master", () => {
  it.each(goldenMaster.seedCases)("preserves generated spots and coordinates for $value", fixture => {
    const result = calculateRseFeebasFromValue(fixture.value);
    expect(result.generatedSpotIds).toEqual(fixture.spotIds);
    if (fixture.coordinates) {
      expect(result.coordinates.map(({ spotId, x, y }) => ({ spotId, x, y }))).toEqual(fixture.coordinates);
    }
    if (fixture.duplicateSpotIds) {
      expect(result.duplicateSpotIds).toEqual(fixture.duplicateSpotIds);
      expect(getUniqueReachableTiles(result).tiles).toHaveLength(fixture.reachableTileCount);
    }
    if (fixture.underBridgeSpotId) {
      expect(getPlayerFacingLocationsForSpotId(fixture.underBridgeSpotId)).toHaveLength(fixture.underBridgeDisplayTileCount);
    }
  });

  it.each(goldenMaster.invalidFeebasValues)("preserves validation for '$value'", fixture => {
    expect(normalizeFeebasValue(fixture.value)).toMatchObject({ valid: false, error: fixture.error });
  });

  it("preserves Emerald prediction and exact-search results", () => {
    const phrase = getDewfordPhraseSignature(goldenMaster.emeraldPrediction.phrase);
    const prediction = findEmeraldFeebasValueCandidates({ trainerId: goldenMaster.emeraldPrediction.trainerId, phraseSignature: phrase });
    expect(prediction.candidates.map(({ value, decimal, scanAdvance, trendRandOffset }) => ({ value, decimal, scanAdvance, trendRandOffset }))).toEqual(goldenMaster.emeraldPrediction.candidates);
    const exact = findExactFeebasValueInPredictionStream({ trainerId: goldenMaster.emeraldPrediction.trainerId, phraseSignature: phrase, exactValue: goldenMaster.emeraldPrediction.exactSearch.value, maxCandidateMatches: goldenMaster.emeraldPrediction.exactSearch.maxCandidateMatches });
    expect(exact).toMatchObject({ exactValueFound: true, firstMatchingCandidateRank: goldenMaster.emeraldPrediction.exactSearch.firstMatchingCandidateRank });
    expect(exact.firstMatch.scanAdvance).toBe(goldenMaster.emeraldPrediction.exactSearch.scanAdvance);
  });

  it.each(goldenMaster.saveCases)("preserves synthetic $profile save extraction", fixture => {
    const parse = fixture.profile === "emerald" ? parseEmeraldSave : parseRubySapphireSave;
    expect(parse(buildSyntheticSave(fixture))).toMatchObject({ valid: true, profile: fixture.profile, trainerId: fixture.trainerId, feebasValue: { value: fixture.feebasValue, offset: fixture.offset }, directSectorSanity: { sectorOffset: fixture.sectorOffset, matches: true } });
  });

  it("preserves parser rejection for wrong-size and malformed saves", () => {
    expect(parseEmeraldSave(new Uint8Array(1))).toMatchObject({ valid: false, unsupportedFormat: true });
    expect(parseRubySapphireSave(new Uint8Array(GBA_SAVE_SIZE))).toMatchObject({ valid: false, unsupportedFormat: false, selectedSlot: null });
  });

  it("preserves Route 119 dimensions, complete-map audit, and sentinels", () => {
    expect({ gridWidth: RSE_FEEBAS_GRID_WIDTH, gridHeight: RSE_FEEBAS_GRID_HEIGHT, internalSpotCount: RSE_FEEBAS_SPOT_COUNT, mappedSpotCount: RSE_FEEBAS_MAPPED_SPOT_COUNT }).toEqual({ gridWidth: goldenMaster.map.gridWidth, gridHeight: goldenMaster.map.gridHeight, internalSpotCount: goldenMaster.map.internalSpotCount, mappedSpotCount: goldenMaster.map.mappedSpotCount });
    expect(route119FeebasAudit.valid).toBe(true);
    for (const sentinel of goldenMaster.map.sentinels) expect(getRoute119FeebasCoordinateForSpotId(sentinel.spotId)).toMatchObject(sentinel);
  });
});
