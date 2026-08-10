import {
  describe,
  expect,
  it
} from "vitest";
import {
  matchesDexEntrySearch,
  parseDexEntrySearchQuery
} from "./dexEntrySearch";

describe("parseDexEntrySearchQuery", () => {
  it("uses exact word mode when the query is wrapped in quotes", () => {
    expect(
      parseDexEntrySearchQuery('"Sea"')
    ).toEqual({
      exactWord: true,
      term: "sea"
    });
  });

  it("uses exact word mode when the toggle is enabled", () => {
    expect(
      parseDexEntrySearchQuery("Sea", true)
    ).toEqual({
      exactWord: true,
      term: "sea"
    });
  });
});

describe("matchesDexEntrySearch", () => {
  it("keeps broad search as substring matching", () => {
    expect(
      matchesDexEntrySearch(
        "It searches wide areas for food.",
        "sea"
      )
    ).toBe(true);
  });

  it("does not match prefixes or tails in exact word mode", () => {
    expect(
      matchesDexEntrySearch(
        "It searches wide areas for food.",
        "sea",
        true
      )
    ).toBe(false);
  });

  it("matches a standalone exact word", () => {
    expect(
      matchesDexEntrySearch(
        "It drifts through the sea searching for prey.",
        "sea",
        true
      )
    ).toBe(true);
  });
});
