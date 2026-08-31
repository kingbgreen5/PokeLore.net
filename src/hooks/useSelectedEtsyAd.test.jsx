import { useState } from "react";
import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen
} from "@testing-library/react";

import { useSelectedEtsyAd } from "./useSelectedEtsyAd";

const ads = [
  {
    id: "first",
    listingId: "listing-1",
    tags: [
      "kanto"
    ],
    img: "/images/etsy/first.webp",
    link: "https://etsy.example/first"
  },
  {
    id: "second",
    listingId: "listing-2",
    tags: [
      "kanto"
    ],
    img: "/images/etsy/second.webp",
    link: "https://etsy.example/second"
  }
];

function SelectedAdProbe({
  pageViewKey,
  random
}) {
  const [renderCount, setRenderCount] =
    useState(0);
  const selectedAd = useSelectedEtsyAd(
    [
      "kanto"
    ],
    {
      ads,
      pageViewKey,
      random
    }
  );

  return (
    <div>
      <output aria-label="selected ad">
        {selectedAd?.id ?? "none"}
      </output>
      <button
        type="button"
        onClick={() =>
          setRenderCount(count => count + 1)
        }
      >
        Rerender {renderCount}
      </button>
    </div>
  );
}

describe("useSelectedEtsyAd", () => {
  afterEach(() => {
    cleanup();
  });

  it("keeps the selected creative stable during a normal React re-render", () => {
    render(
      <SelectedAdProbe
        pageViewKey="/pokemon/bulbasaur"
        random={() => 0.75}
      />
    );

    expect(
      screen.getByLabelText("selected ad")
    ).toHaveTextContent("second");

    fireEvent.click(
      screen.getByRole("button", {
        name: /Rerender/
      })
    );

    expect(
      screen.getByLabelText("selected ad")
    ).toHaveTextContent("second");
  });

  it("selects again for a new page view key", () => {
    const { rerender } = render(
      <SelectedAdProbe
        pageViewKey="/pokemon/bulbasaur"
        random={() => 0.75}
      />
    );

    expect(
      screen.getByLabelText("selected ad")
    ).toHaveTextContent("second");

    rerender(
      <SelectedAdProbe
        pageViewKey="/pokemon/treecko"
        random={() => 0}
      />
    );

    expect(
      screen.getByLabelText("selected ad")
    ).toHaveTextContent("first");
  });
});
