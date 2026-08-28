import {
  describe,
  expect,
  it
} from "vitest";
import { formatVersionName } from "./formatVersionName";

describe("formatVersionName", () => {
  it("preserves official mid-word capitalization for Pokemon game names", () => {
    expect(formatVersionName("firered")).toBe(
      "FireRed"
    );
    expect(formatVersionName("leafgreen")).toBe(
      "LeafGreen"
    );
    expect(formatVersionName("heartgold")).toBe(
      "HeartGold"
    );
    expect(formatVersionName("soulsilver")).toBe(
      "SoulSilver"
    );
  });

  it("formats ordinary hyphenated version names", () => {
    expect(formatVersionName("omega-ruby")).toBe(
      "Omega Ruby"
    );
    expect(formatVersionName("black-2")).toBe(
      "Black 2"
    );
  });
});
