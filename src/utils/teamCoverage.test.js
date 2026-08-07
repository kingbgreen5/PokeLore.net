import {
  describe,
  expect,
  it
} from "vitest";
import typeChart from "../constants/Types";
import {
  DEFAULT_TEAM_RECOMMENDATION_WEIGHTS,
  getCoveredDefenseTypes,
  getDefensiveCoverageTypes,
  getLevelUpAttackTypePowers,
  getLevelUpAttackTypes,
  getMissingDefenseTypes,
  getTeamRecommendationScore,
  getTeamDefensiveCoverageTypes,
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

  it("finds attack types resisted or blocked by a Pokemon typing", () => {
    expect(
      getDefensiveCoverageTypes({
        defenseTypes: ["ghost"],
        typeChart
      })
    ).toEqual([
      "normal",
      "fighting",
      "poison",
      "bug"
    ]);
  });

  it("does not count dual-type matchups that become neutral", () => {
    expect(
      getDefensiveCoverageTypes({
        defenseTypes: [
          "water",
          "flying"
        ],
        typeChart
      })
    ).not.toContain("electric");
  });

  it("combines defensive coverage across team members", () => {
    expect(
      getTeamDefensiveCoverageTypes({
        teamTypeSets: [
          ["fire"],
          ["ground"]
        ],
        typeChart
      })
    ).toEqual([
      "fire",
      "electric",
      "grass",
      "ice",
      "poison",
      "bug",
      "rock",
      "steel",
      "fairy"
    ]);
  });

  it("scores custom team recommendations from coverage and playthrough flags", () => {
    expect(
      getTeamRecommendationScore({
        weights:
          DEFAULT_TEAM_RECOMMENDATION_WEIGHTS,
        pokemon: {
          baseStatTotal: 500,
          missingHits: [
            "water",
            "ground"
          ],
          missingDefensiveHits: [
            "electric"
          ],
          playthroughFlags: {
            inRegionalDex: true,
            tier: "A",
            tradeEvolution: true
          }
        }
      }).total
    ).toBeCloseTo(1.1);
  });

  it("recomputes generated playthrough flags with current weights", () => {
    expect(
      getTeamRecommendationScore({
        weights: {
          ...DEFAULT_TEAM_RECOMMENDATION_WEIGHTS,
          notRegionalDex: -1,
          regionalDex: 2
        },
        pokemon: {
          baseStatTotal: 400,
          missingHits: [],
          missingDefensiveHits: [],
          playthroughScore: {
            total: 0.2,
            parts: {
              regionalDex: 0.5,
              notRegionalDex: 0,
              tradeEvolution: 0,
              tier: 0,
              bst: -0.3
            },
            flags: {
              inRegionalDex: false,
              tier: null,
              tradeEvolution: false
            }
          }
        }
      }).parts
    ).toMatchObject({
      bst: -0.3,
      notRegionalDex: -1,
      playthrough: -1.3,
      regionalDex: 0
    });
  });

  it("uses generated tier flags when local playthrough tier is empty", () => {
    expect(
      getTeamRecommendationScore({
        weights:
          DEFAULT_TEAM_RECOMMENDATION_WEIGHTS,
        pokemon: {
          baseStatTotal: 500,
          missingHits: [],
          missingDefensiveHits: [],
          playthroughFlags: {
            inRegionalDex: true,
            tier: null,
            tradeEvolution: false
          },
          playthroughScore: {
            flags: {
              inRegionalDex: true,
              tier: "S",
              tradeEvolution: false
            }
          }
        }
      }).parts.tier
    ).toBeCloseTo(0.3);
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
