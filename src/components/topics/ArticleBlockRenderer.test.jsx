import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  render,
  screen,
  waitFor
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ArticleBlockRenderer from "./ArticleBlockRenderer";

describe("ArticleBlockRenderer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders internal markdown-style links", () => {
    render(
      <MemoryRouter>
        <ArticleBlockRenderer
          block={{
            id: "block-1",
            type: "paragraph",
            text: "Read about [Greninja](/pokemon/greninja)."
          }}
        />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", {
      name: "Greninja"
    });

    expect(link).toHaveAttribute(
      "href",
      "/pokemon/greninja"
    );
  });

  it("renders external links inside callouts", () => {
    render(
      <MemoryRouter>
        <ArticleBlockRenderer
          block={{
            id: "block-1",
            type: "callout",
            text: "Read this [Guide](https://www.reddit.com/r/pokemon/comments/lettfp/generation_3_feebas_guide_also_applies_to_gen_4/)."
          }}
        />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", {
      name: "Guide"
    });

    expect(link).toHaveAttribute(
      "href",
      "https://www.reddit.com/r/pokemon/comments/lettfp/generation_3_feebas_guide_also_applies_to_gen_4/"
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders unknown block types safely", () => {
    render(
      <MemoryRouter>
        <ArticleBlockRenderer
          block={{
            id: "block-1",
            type: "unknown-type"
          }}
        />
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        "Unsupported article block: unknown-type"
      )
    ).toBeInTheDocument();
  });

  it("renders item card grid blocks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 511,
                name: "blue-scarf",
                displayName: "Blue Scarf",
                categoryDisplayName: "Scarves",
                shortEffect: "Raises Beauty.",
                sprite: "/items/blue-scarf.png"
              }
            ])
        })
      )
    );

    render(
      <MemoryRouter>
        <ArticleBlockRenderer
          block={{
            id: "block-1",
            type: "item-card-grid",
            title: "Related Items",
            itemSlugs: ["blue-scarf"],
            cardSize: "compact"
          }}
        />
      </MemoryRouter>
    );

    await waitFor(() =>
      expect(
        screen.getByRole("link", {
          name: /Blue Scarf/
        })
      ).toHaveAttribute("href", "/item/blue-scarf")
    );
  });
});
