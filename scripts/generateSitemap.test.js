import assert from "node:assert/strict";
import {
  describe,
  expect,
  it
} from "vitest";
import {
  ITEM_DETAIL_LASTMOD,
  POKEMON_DETAIL_LASTMOD,
  itemRoutes,
  pokemonRoutes,
  renderSitemap,
  sitemapLoc,
  validateSitemapUrls
} from "./generateSitemap.js";

function extractUrlBlocks(xml) {
  return [...xml.matchAll(/<url>\s*<loc>(.*?)<\/loc>\s*<lastmod>(.*?)<\/lastmod>\s*<\/url>/g)].map(
    ([, loc, lastmod]) => ({
      loc,
      lastmod
    })
  );
}

const pokemonRouteLookup = {
  byName: {
    bulbasaur: 1,
    pikachu: 25,
    feebas: 349,
    miraidon: 1008
  },
  byId: {
    1: "bulbasaur",
    25: "pikachu",
    349: "feebas",
    1008: "miraidon"
  }
};

describe("generateSitemap", () => {
  it("builds canonical item entries with a stable content-update lastmod", () => {
    const itemEntries = itemRoutes([
      {
        name: "fire-stone"
      },
      {
        name: "macho-brace"
      },
      {
        name: "dynamax-crystal-and15",
        category: {
          name: "dynamax-crystals"
        }
      },
      {
        name: "dynamax-crystal-aql7235",
        category: {
          name: "dynamax-crystals"
        }
      }
    ]);

    expect(
      itemEntries.map(sitemapLoc)
    ).toEqual([
      "https://pokelore.net/item/fire-stone",
      "https://pokelore.net/item/macho-brace",
      "https://pokelore.net/item/dynamax-crystal-and15"
    ]);
    expect(
      itemEntries.every(
        entry =>
          entry.lastmod === ITEM_DETAIL_LASTMOD
      )
    ).toBe(true);

    const sitemap = renderSitemap(
      [
        "https://pokelore.net/moves",
        ...itemEntries
      ],
      {
        defaultLastmod: "2099-12-31"
      }
    );
    const blocks = extractUrlBlocks(sitemap);

    expect(
      blocks.find(block => block.loc === "https://pokelore.net/moves")?.lastmod
    ).toBe("2099-12-31");
    expect(
      blocks.find(block => block.loc === "https://pokelore.net/item/fire-stone")?.lastmod
    ).toBe(ITEM_DETAIL_LASTMOD);
  });

  it("builds canonical Pokemon entries with a stable content-update lastmod", () => {
    const pokemonEntries =
      pokemonRoutes(pokemonRouteLookup);

    expect(
      pokemonEntries.map(sitemapLoc)
    ).toEqual([
      "https://pokelore.net/pokemon/bulbasaur",
      "https://pokelore.net/pokemon/pikachu",
      "https://pokelore.net/pokemon/feebas",
      "https://pokelore.net/pokemon/miraidon"
    ]);

    expect(
      pokemonEntries.map(entry => entry.lastmod)
    ).toEqual([
      POKEMON_DETAIL_LASTMOD,
      POKEMON_DETAIL_LASTMOD,
      POKEMON_DETAIL_LASTMOD,
      POKEMON_DETAIL_LASTMOD
    ]);
    expect(
      pokemonEntries.every(entry =>
        !/\/pokemon\/[0-9]+(?:[/?#]|$)/.test(
          sitemapLoc(entry)
        )
      )
    ).toBe(true);
    expect(
      pokemonEntries.every(entry =>
        !sitemapLoc(entry).endsWith("/")
      )
    ).toBe(true);
  });

  it("keeps Pokemon lastmod deterministic without overwriting unrelated routes", () => {
    const pokemonEntries =
      pokemonRoutes(pokemonRouteLookup);
    const sitemap = renderSitemap(
      [
        "https://pokelore.net/moves",
        ...pokemonEntries
      ],
      {
        defaultLastmod: "2099-12-31"
      }
    );
    const blocks = extractUrlBlocks(sitemap);

    expect(
      blocks.find(block => block.loc === "https://pokelore.net/moves")?.lastmod
    ).toBe("2099-12-31");
    expect(
      blocks.find(block => block.loc === "https://pokelore.net/pokemon/pikachu")?.lastmod
    ).toBe(POKEMON_DETAIL_LASTMOD);
    expect(
      blocks.find(block => block.loc === "https://pokelore.net/pokemon/feebas")?.lastmod
    ).toBe(POKEMON_DETAIL_LASTMOD);
    expect(
      blocks.find(block => block.loc === "https://pokelore.net/pokemon/miraidon")?.lastmod
    ).toBe(POKEMON_DETAIL_LASTMOD);

    const futureSitemap = renderSitemap(
      pokemonEntries,
      {
        defaultLastmod: "2035-04-12"
      }
    );

    expect(
      extractUrlBlocks(futureSitemap).every(
        block => block.lastmod === POKEMON_DETAIL_LASTMOD
      )
    ).toBe(true);
  });

  it("rejects numeric Pokemon sitemap URLs", () => {
    assert.throws(
      () =>
        validateSitemapUrls([
          "https://pokelore.net/pokemon/25"
        ]),
      /numeric Pokemon URLs/
    );
  });
});
