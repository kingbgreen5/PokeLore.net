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
