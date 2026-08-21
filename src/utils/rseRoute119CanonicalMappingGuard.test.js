import {
  describe,
  expect,
  it
} from "vitest";
import canonicalMappingFixture from "../test/fixtures/feebas/rseRoute119CanonicalMapping.json";
import {
  getRoute119FeebasCoordinateForSpotId,
  route119FeebasTiles
} from "./rseFeebasCalculator";

describe("RSE Route 119 Canonical Mapping Guard", () => {
  it("keeps the entire canonical internal mapping frozen", () => {
    expect(route119FeebasTiles).toHaveLength(444);
    expect(canonicalMappingFixture).toHaveLength(444);
    expect(route119FeebasTiles[0].spotId).toBe(4);
    expect(route119FeebasTiles.at(-1).spotId).toBe(447);

    const currentMapping = route119FeebasTiles.map(
      ({ spotId, x, y }) => ({
        spotId,
        x,
        y
      })
    );

    expect(currentMapping).toEqual(canonicalMappingFixture);
  });

  it("keeps boundary-adjacent spot IDs from being renumbered", () => {
    [
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
      const expected = canonicalMappingFixture.find(
        entry => entry.spotId === spotId
      );

      expect(
        getRoute119FeebasCoordinateForSpotId(spotId)
      ).toMatchObject(expected);
    });
  });
});
