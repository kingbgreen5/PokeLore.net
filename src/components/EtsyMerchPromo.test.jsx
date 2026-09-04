import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen
} from "@testing-library/react";

import EtsyMerchPromo from "./EtsyMerchPromo";

const ad = {
  id: "viridian-forest-shirt-v1",
  listingId: "1234567890",
  tags: [
    "kanto",
    "forest"
  ],
  img: "/images/etsy/viridian-forest-shirt.webp",
  link: "https://etsy.example/share-save"
};

describe("EtsyMerchPromo", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders nothing when there is no eligible ad", () => {
    render(
      <EtsyMerchPromo
        ad={null}
        pagePath="/pokemon/bulbasaur"
        placement="pokemon-detail"
      />
    );

    expect(
      screen.queryByLabelText(
        "Pokemon-inspired merchandise"
      )
    ).not.toBeInTheDocument();
  });

  it("hides itself if the configured image fails to load", () => {
    render(
      <EtsyMerchPromo
        ad={ad}
        pagePath="/pokemon/bulbasaur"
        placement="pokemon-detail"
      />
    );

    fireEvent.error(
      screen.getByRole("img")
    );

    expect(
      screen.queryByLabelText(
        "Pokemon-inspired merchandise"
      )
    ).not.toBeInTheDocument();
  });

  it("tracks one impression for one displayed creative across re-renders", () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);

    const { rerender } = render(
      <EtsyMerchPromo
        ad={ad}
        pagePath="/pokemon/bulbasaur"
        placement="pokemon-detail"
      />
    );

    fireEvent.load(
      screen.getByRole("img")
    );

    rerender(
      <EtsyMerchPromo
        ad={ad}
        pagePath="/pokemon/bulbasaur"
        placement="pokemon-detail"
      />
    );

    expect(gtag).toHaveBeenCalledTimes(1);
    expect(gtag).toHaveBeenCalledWith(
      "event",
      "etsy_merch_impression",
      {
        ad_id: ad.id,
        listing_id: ad.listingId,
        page_path: "/pokemon/bulbasaur",
        placement: "pokemon-detail"
      }
    );
  });

  it("tracks clicks without blocking the Etsy link", () => {
    const gtag = vi.fn();
    vi.stubGlobal("gtag", gtag);

    render(
      <EtsyMerchPromo
        ad={ad}
        pagePath="/pokemon/bulbasaur"
        placement="pokemon-detail"
      />
    );

    const link = screen.getByRole("link", {
      name: /Pokemon-inspired Etsy merchandise/
    });

    expect(link).toHaveAttribute(
      "href",
      ad.link
    );
    expect(link).toHaveAttribute(
      "target",
      "_blank"
    );
    expect(link).toHaveAttribute(
      "rel",
      "sponsored noopener"
    );

    fireEvent.click(link);

    expect(gtag).toHaveBeenCalledWith(
      "event",
      "etsy_merch_click",
      {
        ad_id: ad.id,
        listing_id: ad.listingId,
        page_path: "/pokemon/bulbasaur",
        placement: "pokemon-detail"
      }
    );
  });
});
