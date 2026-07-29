import {
  describe,
  expect,
  it
} from "vitest";
import {
  calculateReadingTime,
  countArticleWords
} from "./articleReadingTime";

describe("article reading time", () => {
  it("counts relevant block text", () => {
    const article = {
      title: "Title words",
      sections: [
        {
          type: "paragraph",
          text: "One two three"
        },
        {
          type: "list",
          items: ["Four five", "Six"]
        },
        {
          type: "comparison",
          items: [
            {
              label: "Seven",
              text: "Eight nine"
            }
          ]
        }
      ]
    };

    expect(countArticleWords(article)).toBe(11);
    expect(calculateReadingTime(article)).toBe(1);
  });
});
