import {
  describe,
  expect,
  it
} from "vitest";
import {
  formatDamageMultiplier,
  getDefensiveMatchupGroups,
  getDefensiveMatchups
} from "./typeEffectiveness.js";
import charizardMegaX from "../../public/data/pokemonData/10034.json";

function multipliersByType(matchups) {
  return Object.fromEntries(
    matchups.map(matchup => [
      matchup.type,
      matchup.multiplier
    ])
  );
}

describe("type effectiveness helpers", () => {
  it("calculates single-type defensive matchups", () => {
    const groups =
      getDefensiveMatchupGroups([
        "electric"
      ]);

    expect(
      multipliersByType(groups.weaknesses)
    ).toEqual({
      ground: 2
    });
    expect(
      multipliersByType(groups.resistances)
    ).toEqual({
      electric: 0.5,
      flying: 0.5,
      steel: 0.5
    });
    expect(groups.immunities).toEqual([]);
  });

  it("combines dual-type defensive matchups", () => {
    const groups =
      getDefensiveMatchupGroups([
        "grass",
        "poison"
      ]);

    expect(
      multipliersByType(groups.weaknesses)
    ).toEqual({
      fire: 2,
      flying: 2,
      ice: 2,
      psychic: 2
    });
    expect(
      multipliersByType(groups.resistances)
    ).toEqual({
      grass: 0.25,
      electric: 0.5,
      fairy: 0.5,
      fighting: 0.5,
      water: 0.5
    });
  });

  it("captures 4x weaknesses", () => {
    const groups =
      getDefensiveMatchupGroups([
        "water",
        "flying"
      ]);

    expect(
      groups.fourTimesWeaknesses
    ).toMatchObject([
      {
        type: "electric",
        multiplier: 4
      }
    ]);
  });

  it("captures quarter resistances", () => {
    const groups =
      getDefensiveMatchupGroups([
        "grass",
        "poison"
      ]);

    expect(
      groups.quarterResistances
    ).toMatchObject([
      {
        type: "grass",
        multiplier: 0.25
      }
    ]);
  });

  it("captures immunities", () => {
    const groups =
      getDefensiveMatchupGroups([
        "water",
        "flying"
      ]);

    expect(
      groups.immunities
    ).toMatchObject([
      {
        type: "ground",
        multiplier: 0
      }
    ]);
  });

  it("handles normal 1x matchups when requested", () => {
    const normalMatchup =
      getDefensiveMatchups(
        ["electric"],
        {
          includeNeutral: true
        }
      ).find(
        matchup => matchup.type === "normal"
      );

    expect(normalMatchup).toMatchObject({
      type: "normal",
      multiplier: 1,
      multiplierLabel: "1×"
    });
    expect(
      getDefensiveMatchups([
        "electric"
      ]).some(
        matchup => matchup.type === "normal"
      )
    ).toBe(false);
  });

  it("uses canonical form-specific types", () => {
    const groups =
      getDefensiveMatchupGroups(
        charizardMegaX.types
      );

    expect(charizardMegaX.types).toEqual([
      "fire",
      "dragon"
    ]);
    expect(
      multipliersByType(groups.weaknesses)
    ).toMatchObject({
      dragon: 2,
      ground: 2,
      rock: 2
    });
    expect(
      groups.immunities
    ).toEqual([]);
  });

  it("formats exact multiplier labels", () => {
    expect(formatDamageMultiplier(4)).toBe(
      "4×"
    );
    expect(formatDamageMultiplier(2)).toBe(
      "2×"
    );
    expect(formatDamageMultiplier(1)).toBe(
      "1×"
    );
    expect(formatDamageMultiplier(0.5)).toBe(
      "½×"
    );
    expect(formatDamageMultiplier(0.25)).toBe(
      "¼×"
    );
    expect(formatDamageMultiplier(0)).toBe(
      "0×"
    );
  });
});
