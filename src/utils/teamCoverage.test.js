import {
  describe,
  expect,
  it
} from "vitest";
import typeChart from "../constants/Types";
import {
  getCoveredDefenseTypes,
  getLevelUpAttackTypePowers,
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

  it("ignores attacking moves below the selected power threshold", () => {
    const learnset = {
      moves: [
        {
          move: "tackle",
          method: "level-up",
          versionGroup: "red-blue"
        },
        {
          move: "body-slam",
          method: "level-up",
          versionGroup: "red-blue"
        },
        {
          move: "water-gun",
          method: "level-up",
          versionGroup: "red-blue"
        }
      ]
    };
    const movesByName = {
      tackle: {
        category: "physical",
        power: 40,
        type: "normal"
      },
      "body-slam": {
        category: "physical",
        power: 85,
        type: "normal"
      },
      "water-gun": {
        category: "special",
        power: 40,
        type: "water"
      }
    };

    expect(
      getLevelUpAttackTypes({
        learnset,
        minMovePower: 50,
        movesByName,
        versionGroup: "red-blue"
      })
    ).toEqual(["normal"]);
  });

  it("records the strongest level-up move power for each attack type", () => {
    const learnset = {
      moves: [
        {
          move: "ember",
          method: "level-up",
          versionGroup: "red-blue"
        },
        {
          move: "flamethrower",
          method: "level-up",
          versionGroup: "red-blue"
        },
        {
          move: "scratch",
          method: "level-up",
          versionGroup: "red-blue"
        }
      ]
    };
    const movesByName = {
      ember: {
        category: "special",
        power: 40,
        type: "fire"
      },
      flamethrower: {
        category: "special",
        power: 90,
        type: "fire"
      },
      scratch: {
        category: "physical",
        power: 40,
        type: "normal"
      }
    };

    expect(
      getLevelUpAttackTypePowers({
        learnset,
        movesByName,
        versionGroup: "red-blue"
      })
    ).toEqual({
      fire: 90,
      normal: 40
    });
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
