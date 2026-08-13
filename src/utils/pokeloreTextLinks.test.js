import { describe, expect, it } from "vitest";
import { linkifyPokeloreText } from "./pokeloreTextLinks";

const targets = [
  {
    label: "Swift Swim",
    route: "/ability/swift-swim",
    category: "ability"
  },
  {
    label: "Swift",
    route: "/move/swift",
    category: "move"
  }
];

describe("linkifyPokeloreText", () => {
  it("does not link a shorter target inside an already-used longer target", () => {
    const parts = linkifyPokeloreText(
      "Swift Swim doubles Speed in rain.",
      targets,
      null,
      {
        usedRoutes: new Set(["/ability/swift-swim"])
      }
    );

    expect(parts).toEqual([
      {
        text: "Swift Swim doubles Speed in rain."
      }
    ]);
  });

  it("protects later mentions of a target after linking its first mention", () => {
    const parts = linkifyPokeloreText(
      "Swift Swim helps in rain. Swift Swim returns later. Swift remains a move.",
      targets
    );

    expect(parts).toEqual([
      {
        text: "Swift Swim",
        href: "/ability/swift-swim",
        category: "ability"
      },
      {
        text: " helps in rain. Swift Swim returns later. "
      },
      {
        text: "Swift",
        href: "/move/swift",
        category: "move"
      },
      {
        text: " remains a move."
      }
    ]);
  });
});
