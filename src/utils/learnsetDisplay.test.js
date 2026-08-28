import {
  describe,
  expect,
  it
} from "vitest";
import bulbasaurLearnset from "../../public/data/pokemonLearnsets/1.json";
import pikachuLearnset from "../../public/data/pokemonLearnsets/25.json";
import eeveeLearnset from "../../public/data/pokemonLearnsets/133.json";
import laprasLearnset from "../../public/data/pokemonLearnsets/131.json";
import celebiLearnset from "../../public/data/pokemonLearnsets/251.json";
import feebasLearnset from "../../public/data/pokemonLearnsets/349.json";
import miraidonLearnset from "../../public/data/pokemonLearnsets/1008.json";
import meowthAlolaLearnset from "../../public/data/pokemonLearnsets/10107.json";
import movesIndex from "../../public/data/movesIndex.json";
import {
  condenseDuplicateLearnsetMoves,
  formatVersionGroupName,
  getLatestLevelUpLearnsetPreview,
  getLearnsetCandidateIds,
  getLearnsetMovesForMethod,
  getLearnsetMovesForVersion,
  getLearnsetVersionGroups,
  getSelectedLearnsetVersionGroup,
  hasLearnsetMoves
} from "./learnsetDisplay";

const movesData = Object.fromEntries(
  movesIndex.map(move => [
    move.name,
    move
  ])
);

describe("learnset display helpers", () => {
  it("selects the newest version group present in each Pokemon's learnset", () => {
    expect(
      getLatestLevelUpLearnsetPreview(
        pikachuLearnset,
        movesData
      ).versionGroup
    ).toBe("scarlet-violet");
    expect(
      getLatestLevelUpLearnsetPreview(
        eeveeLearnset,
        movesData
      ).versionGroup
    ).toBe("scarlet-violet");
    expect(
      getLatestLevelUpLearnsetPreview(
        feebasLearnset,
        movesData
      ).versionGroup
    ).toBe("scarlet-violet");
    expect(
      getLatestLevelUpLearnsetPreview(
        celebiLearnset,
        movesData
      ).versionGroup
    ).toBe(
      "brilliant-diamond-shining-pearl"
    );
    expect(
      getLatestLevelUpLearnsetPreview(
        miraidonLearnset,
        movesData
      ).versionGroup
    ).toBe("scarlet-violet");
  });

  it("uses the existing version group ordering and selected-version fallback", () => {
    expect(
      getLearnsetVersionGroups(
        celebiLearnset
      ).at(-1)
    ).toBe(
      "brilliant-diamond-shining-pearl"
    );
    expect(
      getSelectedLearnsetVersionGroup(
        celebiLearnset,
        "the-indigo-disk"
      )
    ).toBe("all");
    expect(
      formatVersionGroupName(
        "scarlet-violet"
      )
    ).toBe("Scarlet Violet");
  });

  it("filters level-up moves for the latest version without Machine, Tutor, or Egg rows", () => {
    const preview =
      getLatestLevelUpLearnsetPreview(
        pikachuLearnset,
        movesData
      );
    const latestMoves =
      getLearnsetMovesForVersion(
        pikachuLearnset,
        preview.versionGroup
      );

    expect(preview.rows).toHaveLength(20);
    expect(
      preview.rows.map(row => row.move)
    ).toContain("thunderbolt");
    expect(
      latestMoves.filter(
        move =>
          move.method === "machine"
      ).length
    ).toBeGreaterThan(0);
    expect(
      preview.rows.every(row =>
        latestMoves.some(
          move =>
            move.move === row.move &&
            move.level === row.level &&
            move.method ===
              "level-up"
        )
      )
    ).toBe(true);
  });

  it("condenses duplicate move and level rows and sorts by level", () => {
    const learnset = {
      moves: [
        {
          move: "tackle",
          method: "level-up",
          level: 5,
          versionGroup:
            "scarlet-violet"
        },
        {
          move: "tackle",
          method: "level-up",
          level: 5,
          versionGroup:
            "scarlet-violet"
        },
        {
          move: "growl",
          method: "level-up",
          level: 1,
          versionGroup:
            "scarlet-violet"
        },
        {
          move: "tackle",
          method: "level-up",
          level: 1,
          versionGroup:
            "scarlet-violet"
        }
      ]
    };

    expect(
      condenseDuplicateLearnsetMoves(
        learnset.moves
      )
    ).toHaveLength(3);
    expect(
      getLearnsetMovesForMethod(
        learnset,
        {
          versionGroup:
            "scarlet-violet",
          method: "level-up"
        }
      ).map(move => `${move.level}:${move.move}`)
    ).toEqual([
      "1:growl",
      "1:tackle",
      "5:tackle"
    ]);
  });

  it("preserves representative latest level-up rows and move labels", () => {
    expect(
      getLatestLevelUpLearnsetPreview(
        bulbasaurLearnset,
        movesData
      ).rows.slice(0, 3)
    ).toEqual([
      {
        level: 1,
        levelLabel: "1",
        move: "tackle",
        moveLabel: "Tackle"
      },
      {
        level: 1,
        levelLabel: "1",
        move: "growl",
        moveLabel: "Growl"
      },
      {
        level: 3,
        levelLabel: "3",
        move: "vine-whip",
        moveLabel: "Vine Whip"
      }
    ]);
    expect(
      getLatestLevelUpLearnsetPreview(
        eeveeLearnset,
        movesData
      ).rows.find(
        row =>
          row.move ===
          "baby-doll-eyes"
      )?.moveLabel
    ).toBe("Baby-Doll Eyes");
    expect(
      getLatestLevelUpLearnsetPreview(
        laprasLearnset,
        movesData
      ).rows.at(-1).move
    ).toBe("sheer-cold");
    expect(
      getLatestLevelUpLearnsetPreview(
        feebasLearnset,
        movesData
      ).rows.map(row => row.move)
    ).toEqual([
      "splash",
      "tackle",
      "flail"
    ]);
    expect(
      getLatestLevelUpLearnsetPreview(
        miraidonLearnset,
        movesData
      ).rows.at(-1)
    ).toMatchObject({
      level: 98,
      move: "hyper-beam"
    });
    expect(
      getLatestLevelUpLearnsetPreview(
        meowthAlolaLearnset,
        movesData
      ).rows.at(-1)
    ).toMatchObject({
      level: 44,
      move: "play-rough"
    });
  });

  it("does not fall back to an older version when the newest version has no level-up rows", () => {
    const preview =
      getLatestLevelUpLearnsetPreview({
        id: 999,
        pokemon: "testmon",
        moves: [
          {
            move: "tackle",
            method: "level-up",
            level: 1,
            versionGroup:
              "sword-shield"
          },
          {
            move: "protect",
            method: "machine",
            level: 0,
            versionGroup:
              "scarlet-violet"
          }
        ]
      });

    expect(preview.versionGroup).toBe(
      "scarlet-violet"
    );
    expect(preview.rows).toEqual([]);
  });

  it("uses form learnsets first and default species learnsets as fallback candidates", () => {
    expect(
      getLearnsetCandidateIds({
        id: 10205,
        name: "eevee-gmax",
        species: "eevee",
        varieties: [
          {
            id: 133,
            name: "eevee",
            isDefault: true
          },
          {
            id: 10205,
            name: "eevee-gmax"
          }
        ]
      })
    ).toEqual([10205, 133]);

    expect(
      hasLearnsetMoves({
        id: 10205,
        pokemon: "eevee-gmax",
        moves: []
      })
    ).toBe(false);
    expect(
      hasLearnsetMoves(eeveeLearnset)
    ).toBe(true);
  });

  it("can stamp a reused learnset preview with the page Pokemon identity", () => {
    expect(
      getLatestLevelUpLearnsetPreview(
        eeveeLearnset,
        movesData,
        {
          pokemonId: 10205,
          pokemon: "eevee-gmax"
        }
      )
    ).toMatchObject({
      pokemonId: 10205,
      pokemon: "eevee-gmax",
      versionGroup: "scarlet-violet"
    });
  });
});
