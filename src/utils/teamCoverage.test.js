import {
  describe,
  expect,
  it
} from "vitest";
import typeChart from "../constants/Types";
import {
  getCoveredDefenseTypes,
  getLevelUpAttackTypes,
  getMissingDefenseTypes,
  getTypesForVersionGroup,
  isDamagingMove
} from "./teamCoverage";

describe("team coverage helpers", () => {
  it("keeps physical and special moves but ignores status moves", () => {
    expect(
      isDamagingMove({
        category: "physical"
      })
    ).toBe(true);
    expect(
      isDamagingMove({
        category: "special"
      })
    ).toBe(true);
    expect(
      isDamagingMove({
        category: "status"
      })
    ).toBe(false);
  });

  it("collects level-up attacking move types for a version group", () => {
    const learnset = {
      moves: [
        {
          move: "vine-whip",
          method: "level-up",
          versionGroup: "red-blue"
        },
        {
          move: "growth",
          method: "level-up",
          versionGroup: "red-blue"
        },
        {
          move: "solar-beam",
          method: "machine",
          versionGroup: "red-blue"
        },
        {
          move: "bite",
          method: "level-up",
          versionGroup: "gold-silver"
        }
      ]
    };
    const movesByName = {
      "vine-whip": {
        type: "grass",
        category: "physical"
      },
      growth: {
        type: "normal",
        category: "status"
      },
      "solar-beam": {
        type: "grass",
        category: "special"
      },
      bite: {
        type: "dark",
        category: "physical"
      }
    };

    expect(
      getLevelUpAttackTypes({
        learnset,
        movesByName,
        versionGroup: "red-blue"
      })
    ).toEqual(["grass"]);
  });

  it("uses base-game learnsets for DLC version groups", () => {
    const learnset = {
      moves: [
        {
          move: "torch-song",
          method: "level-up",
          versionGroup: "scarlet-violet"
        }
      ]
    };
    const movesByName = {
      "torch-song": {
        type: "fire",
        category: "special"
      }
    };

    expect(
      getLevelUpAttackTypes({
        learnset,
        movesByName,
        versionGroup: "the-teal-mask"
      })
    ).toEqual(["fire"]);
  });

  it("turns attack types into super-effective defense coverage", () => {
    expect(
      getCoveredDefenseTypes({
        attackTypes: ["grass", "dark"],
        typeChart
      })
    ).toEqual([
      "water",
      "ground",
      "psychic",
      "rock",
      "ghost"
    ]);
  });

  it("reports every type as missing when nothing is covered", () => {
    expect(
      getMissingDefenseTypes({
        coveredTypes: []
      })
    ).toHaveLength(18);
  });

  it("excludes Fairy before X/Y", () => {
    expect(
      getTypesForVersionGroup(
        "black-2-white-2"
      )
    ).not.toContain("fairy");
    expect(
      getTypesForVersionGroup("x-y")
    ).toContain("fairy");
  });
});
