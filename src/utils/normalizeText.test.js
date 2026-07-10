import {
  describe,
  expect,
  it
} from "vitest";
import {
  normalizeDisplayData,
  normalizeDisplayText,
  normalizeFlavorText
} from "./normalizeText";

describe("normalizeDisplayText", () => {
  it("repairs known Pokemon display mojibake", () => {
    expect(
      normalizeDisplayText(
        "Pok?mon HeartGold at Pok?athlon Dome"
      )
    ).toBe(
      "Pokémon HeartGold at Pokéathlon Dome"
    );

    expect(
      normalizeDisplayText(
        "PokÃ©mon SoulSilver · PokÃ©athlon"
      )
    ).toBe(
      "Pokémon SoulSilver · Pokéathlon"
    );
  });

  it("normalizes nested display data", () => {
    expect(
      normalizeDisplayData({
        games: ["Pok?mon HeartGold"],
        location: {
          displayName: "Pok?athlon Dome"
        }
      })
    ).toEqual({
      games: ["Pokémon HeartGold"],
      location: {
        displayName: "Pokéathlon Dome"
      }
    });
  });

  it("removes soft-hyphen word-break artifacts", () => {
    expect(
      normalizeFlavorText(
        "It can win by gnaw\u00ad ing, grow\u00ad ing, and search\u00ad es."
      )
    ).toBe(
      "It can win by gnawing, growing, and searches."
    );
  });
});
