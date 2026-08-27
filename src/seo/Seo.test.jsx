import {
  afterEach,
  describe,
  expect,
  it
} from "vitest";
import {
  cleanup,
  render,
  waitFor
} from "@testing-library/react";
import Seo from "./Seo.jsx";
import { pokemonSeo } from "./seoConfig.js";
import pikachu from "../../public/data/pokemonData/25.json";

describe("Seo", () => {
  afterEach(() => {
    cleanup();
    document.head.innerHTML = "";
    document.title = "";
  });

  it("renders Pokemon SEO title and description metadata", async () => {
    const seo = pokemonSeo(pikachu);

    render(<Seo {...seo} />);

    await waitFor(() =>
      expect(document.title).toBe(seo.title)
    );

    expect(
      document.head
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content")
    ).toBe(seo.title);
    expect(
      document.head
        .querySelector('meta[name="twitter:title"]')
        ?.getAttribute("content")
    ).toBe(seo.title);
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute("content")
    ).toBe(seo.description);
    expect(
      document.head
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content")
    ).toBe(seo.description);
    expect(
      document.head
        .querySelector('meta[name="twitter:description"]')
        ?.getAttribute("content")
    ).toBe(seo.description);
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href")
    ).toBe("https://pokelore.net/pokemon/pikachu");
    expect(
      document.head
        .querySelector('meta[name="robots"]')
        ?.getAttribute("content")
    ).toBe("max-image-preview:large");
  });
});
