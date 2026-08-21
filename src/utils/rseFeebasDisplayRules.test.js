import {
  describe,
  expect,
  it
} from "vitest";
import canonicalMappingFixture from "../test/fixtures/feebas/rseRoute119CanonicalMapping.json";
import {
  RSE_FEEBAS_REJECTED_SPOT_IDS,
  advanceFeebasRng,
  calculateRseFeebasFromValue,
  formatUint16Hex,
  getRoute119FeebasCoordinateForSpotId
} from "./rseFeebasCalculator";
import {
  RSE_UNDER_BRIDGE_DISPLAY_COORDINATES,
  RSE_UNDER_BRIDGE_SPOT_ID,
  RSE_UNREACHABLE_SPOT_IDS,
  getPlayerFacingLocationsForSpotId,
  getPlayerFacingLocationsForSpotIds
} from "./rseFeebasDisplayRules";

function fixtureCoordinate(spotId) {
  return canonicalMappingFixture.find(
    entry => entry.spotId === spotId
  );
}

function firstGeneratedSpotId(seed) {
  return advanceFeebasRng(seed).spotId;
}

describe("rseFeebasDisplayRules", () => {
  it("hides inaccessible generated spot IDs without making them rerolls", () => {
    const firstResultSeedBySpotId = new Map([
      [105, 414],
      [119, 336],
      [144, 41],
      [296, 339],
      [297, 22],
      [298, 182]
    ]);

    expect(RSE_FEEBAS_REJECTED_SPOT_IDS).toEqual([
      1,
      2,
      3
    ]);

    for (const spotId of RSE_UNREACHABLE_SPOT_IDS) {
      expect(
        getPlayerFacingLocationsForSpotId(spotId)
      ).toEqual([]);
      expect(
        getRoute119FeebasCoordinateForSpotId(spotId)
      ).toMatchObject(fixtureCoordinate(spotId));
      expect(
        firstGeneratedSpotId(
          firstResultSeedBySpotId.get(spotId)
        )
      ).toBe(spotId);
    }
  });

  it("displays spot ID 132 as ten under-bridge positions", () => {
    const locations = getPlayerFacingLocationsForSpotId(
      RSE_UNDER_BRIDGE_SPOT_ID
    );

    expect(firstGeneratedSpotId(98)).toBe(132);
    expect(
      getRoute119FeebasCoordinateForSpotId(132)
    ).toMatchObject(fixtureCoordinate(132));
    expect(locations).toHaveLength(10);
    expect(
      locations.map(({ x, y }) => ({ x, y }))
    ).toEqual(RSE_UNDER_BRIDGE_DISPLAY_COORDINATES);
    expect(locations).not.toContainEqual(
      expect.objectContaining(fixtureCoordinate(132))
    );
  });

  it("keeps ordinary IDs displaying their frozen canonical coordinates", () => {
    [
      27,
      113,
      205,
      366,
      438,
      445,
      104,
      106,
      118,
      120,
      131,
      133,
      143,
      145,
      295,
      299
    ].forEach(spotId => {
      expect(
        getPlayerFacingLocationsForSpotId(spotId)
      ).toEqual([
        expect.objectContaining(
          fixtureCoordinate(spotId)
        )
      ]);
    });
  });

  it("resolves mixed internal results into player-facing locations", () => {
    const locations = getPlayerFacingLocationsForSpotIds([
      27,
      119,
      132,
      144,
      205,
      445
    ]);

    expect(locations).toHaveLength(13);
    expect(
      locations.filter(location => location.sourceSpotId === 27)
    ).toHaveLength(1);
    expect(
      locations.filter(location => location.sourceSpotId === 119)
    ).toHaveLength(0);
    expect(
      locations.filter(location => location.sourceSpotId === 132)
    ).toHaveLength(10);
    expect(
      locations.filter(location => location.sourceSpotId === 144)
    ).toHaveLength(0);
    expect(
      locations.filter(location => location.sourceSpotId === 205)
    ).toHaveLength(1);
    expect(
      locations.filter(location => location.sourceSpotId === 445)
    ).toHaveLength(1);
  });

  it("keeps 88DE stable through internal and display layers", () => {
    const result = calculateRseFeebasFromValue("88DE");
    const locations = getPlayerFacingLocationsForSpotIds(
      result.generatedSpotIds
    );

    expect(result.generatedSpotIds).toEqual([
      27,
      438,
      205,
      366,
      113,
      445
    ]);
    expect(
      result.coordinates.map(({ spotId, x, y }) => ({
        spotId,
        x,
        y
      }))
    ).toEqual([
      { spotId: 27, x: 18, y: 14 },
      { spotId: 438, x: 17, y: 94 },
      { spotId: 205, x: 32, y: 43 },
      { spotId: 366, x: 10, y: 90 },
      { spotId: 113, x: 27, y: 28 },
      { spotId: 445, x: 12, y: 95 }
    ]);
    expect(
      locations.map(({ sourceSpotId, x, y }) => ({
        spotId: sourceSpotId,
        x,
        y
      }))
    ).toEqual(
      result.coordinates.map(({ spotId, x, y }) => ({
        spotId,
        x,
        y
      }))
    );
  });

  it("keeps ID 152 as an ordinary canonical display coordinate", () => {
    expect(
      getPlayerFacingLocationsForSpotId(152)
    ).toEqual([
      expect.objectContaining({
        spotId: 152,
        x: 30,
        y: 32
      })
    ]);
    expect(formatUint16Hex(152)).toBe("0x0098");
  });
});
