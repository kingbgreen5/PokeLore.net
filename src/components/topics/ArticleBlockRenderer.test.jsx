import {
  describe,
  expect,
  it
} from "vitest";
import {
  render,
  screen
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ArticleBlockRenderer from "./ArticleBlockRenderer";

describe("ArticleBlockRenderer", () => {
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
});
