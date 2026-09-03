import {
  describe,
  expect,
  it
} from "vitest";
import {
  formatGameGroupLabel,
  getAcquisitionGameSlug,
  groupAcquisitionByGameFamily
} from "./itemAcquisitionGrouping.js";

function method({
  generation,
  games,
  location = "Test Location"
}) {
  return {
    generation,
    games,
    location,
    method: `Find at ${location}`,
    acquisitionType: "field-item",
    repeatable: false,
    versionExclusive: false,
    requirements: []
  };
}

describe("itemAcquisitionGrouping", () => {
  it("normalizes Pokemon and Pokémon game names to the same slug", () => {
    expect(
      getAcquisitionGameSlug("Pokemon HeartGold")
    ).toBe("heartgold");
    expect(
      getAcquisitionGameSlug("Pokémon HeartGold")
    ).toBe("heartgold");
    expect(
      getAcquisitionGameSlug(
        "Pokémon: Let's Go, Pikachu!"
      )
    ).toBe("lets-go-pikachu");
  });

  it("formats concise natural game-family labels", () => {
    expect(
      formatGameGroupLabel({
        gameSlugs: [
          "ruby",
          "sapphire",
          "emerald"
        ]
      })
    ).toBe("Pokémon Ruby, Sapphire & Emerald");

    expect(
      formatGameGroupLabel({
        gameSlugs: [
          "heartgold",
          "soulsilver"
        ]
      })
    ).toBe("Pokémon HeartGold & SoulSilver");
  });

  it("groups single-game entries under their practical version family", () => {
    const platinum = method({
      generation: 4,
      games: ["Pokémon Platinum"],
      location: "Fuego Ironworks"
    });
    const groups =
      groupAcquisitionByGameFamily([platinum]);

    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe(
      "Pokémon Diamond, Pearl & Platinum"
    );
    expect(groups[0].entries).toEqual([
      platinum
    ]);
  });

  it("keeps remakes separate from same-generation originals", () => {
    const entries = [
      method({
        generation: 4,
        games: [
          "Pokémon HeartGold",
          "Pokémon SoulSilver"
        ],
        location: "Route 36"
      }),
      method({
        generation: 4,
        games: [
          "Pokémon Diamond",
          "Pokémon Pearl"
        ],
        location: "Fuego Ironworks"
      }),
      method({
        generation: 4,
        games: ["Pokémon Platinum"],
        location: "Solaceon Ruins"
      })
    ];
    const groups =
      groupAcquisitionByGameFamily(entries);

    expect(
      groups.map(group => group.label)
    ).toEqual([
      "Pokémon Diamond, Pearl & Platinum",
      "Pokémon HeartGold & SoulSilver"
    ]);
    expect(groups[0].entries).toEqual([
      entries[1],
      entries[2]
    ]);
    expect(groups[1].entries).toEqual([
      entries[0]
    ]);
  });

  it("preserves stable chronological group ordering without alphabetizing entries", () => {
    const entries = [
      method({
        generation: 3,
        games: [
          "Pokemon FireRed",
          "Pokemon LeafGreen"
        ],
        location: "Viridian City"
      }),
      method({
        generation: 3,
        games: [
          "Pokemon Ruby",
          "Pokemon Sapphire",
          "Pokemon Emerald"
        ],
        location: "Route 111"
      }),
      method({
        generation: 3,
        games: [
          "Pokemon Ruby",
          "Pokemon Sapphire",
          "Pokemon Emerald"
        ],
        location: "Route 124"
      })
    ];
    const groups =
      groupAcquisitionByGameFamily(entries);

    expect(
      groups.map(group => group.label)
    ).toEqual([
      "Pokémon Ruby, Sapphire & Emerald",
      "Pokémon FireRed & LeafGreen"
    ]);
    expect(
      groups[0].entries.map(entry => entry.location)
    ).toEqual(["Route 111", "Route 124"]);
  });

  it("does not duplicate records when one entry spans multiple adjacent families", () => {
    const blackWhiteAll = method({
      generation: 5,
      games: [
        "Pokemon Black",
        "Pokemon White",
        "Pokemon Black 2",
        "Pokemon White 2"
      ],
      location: "Nimbasa City"
    });
    const groups =
      groupAcquisitionByGameFamily([
        blackWhiteAll
      ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe(
      "Pokémon Black, White, Black 2 & White 2"
    );
    expect(groups[0].entries).toEqual([
      blackWhiteAll
    ]);
  });
});
