import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import bulbasaur from "../../public/data/pokemonData/1.json";
import mew from "../../public/data/pokemonData/151.json";
import chikorita from "../../public/data/pokemonData/152.json";
import celebi from "../../public/data/pokemonData/251.json";
import treecko from "../../public/data/pokemonData/252.json";
import deoxys from "../../public/data/pokemonData/386.json";
import turtwig from "../../public/data/pokemonData/387.json";
import arceus from "../../public/data/pokemonData/493.json";
import victini from "../../public/data/pokemonData/494.json";
import genesect from "../../public/data/pokemonData/649.json";
import chespin from "../../public/data/pokemonData/650.json";
import volcanion from "../../public/data/pokemonData/721.json";
import rowlet from "../../public/data/pokemonData/722.json";
import melmetal from "../../public/data/pokemonData/809.json";
import grookey from "../../public/data/pokemonData/810.json";
import enamorus from "../../public/data/pokemonData/905.json";
import sprigatito from "../../public/data/pokemonData/906.json";
import miraidon from "../../public/data/pokemonData/1008.json";
import charizardMegaX from "../../public/data/pokemonData/10034.json";
import {
  getEligibleEtsyAds,
  getEtsyPageTags,
  getEtsyUrlTags,
  getPokemonRegionTag,
  selectEtsyAd
} from "./etsyMerch";

const displayableAdBase = {
  id: "test-ad",
  listingId: "listing-1",
  img: "/images/etsy/test.webp",
  link: "https://etsy.example/listing"
};

describe("Etsy merchandise tagging", () => {
  it.each([
    [
      bulbasaur,
      "kanto"
    ],
    [
      mew,
      "kanto"
    ],
    [
      chikorita,
      "johto"
    ],
    [
      celebi,
      "johto"
    ],
    [
      treecko,
      "hoenn"
    ],
    [
      deoxys,
      "hoenn"
    ],
    [
      turtwig,
      "sinnoh"
    ],
    [
      arceus,
      "sinnoh"
    ],
    [
      victini,
      "unova"
    ],
    [
      genesect,
      "unova"
    ],
    [
      chespin,
      "kalos"
    ],
    [
      volcanion,
      "kalos"
    ],
    [
      rowlet,
      "alola"
    ],
    [
      melmetal,
      "alola"
    ],
    [
      grookey,
      "galar"
    ],
    [
      enamorus,
      "galar"
    ],
    [
      sprigatito,
      "paldea"
    ],
    [
      miraidon,
      "paldea"
    ]
  ])(
    "maps %s to its expected region",
    (pokemon, expectedRegion) => {
      expect(
        getPokemonRegionTag(pokemon)
      ).toBe(expectedRegion);
    }
  );

  it("uses species generation before high form IDs for regional forms", () => {
    expect(
      getPokemonRegionTag(charizardMegaX)
    ).toBe("kanto");
  });

  it("derives Pokemon page tags from structured Pokemon data", () => {
    expect(
      getEtsyPageTags({
        pathname: "/pokemon/bulbasaur",
        pokemon: bulbasaur
      })
    ).toEqual(
      expect.arrayContaining([
        "pokemon",
        "bulbasaur",
        "kanto",
        "grass",
        "poison"
      ])
    );
  });

  it("supplements page tags with exact URL targeting rules", () => {
    expect(
      getEtsyPageTags({
        pathname: "/rse-feebas-calculator"
      })
    ).toEqual([
      "feebas",
      "milotic",
      "hoenn",
      "fishing"
    ]);
  });

  it("supports URL prefix targeting without matching sibling paths", () => {
    const options = {
      exactTags: {},
      prefixTags: [
        {
          prefix: "/location/",
          tags: [
            "location",
            "kanto"
          ]
        }
      ]
    };

    expect(
      getEtsyUrlTags(
        "/location/viridian-forest",
        options
      )
    ).toEqual([
      "location",
      "kanto"
    ]);
    expect(
      getEtsyUrlTags(
        "/locations",
        options
      )
    ).toEqual([]);
  });
});

describe("Etsy merchandise matching", () => {
  it("matches ads that share a meaningful targeting tag", () => {
    expect(
      getEligibleEtsyAds(
        [
          "kanto",
          "grass"
        ],
        [
          {
            ...displayableAdBase,
            tags: [
              "kanto",
              "forest"
            ]
          }
        ]
      )
    ).toHaveLength(1);
  });

  it("does not match ads with unrelated tags", () => {
    expect(
      getEligibleEtsyAds(
        [
          "hoenn",
          "water"
        ],
        [
          {
            ...displayableAdBase,
            tags: [
              "kanto",
              "forest"
            ]
          }
        ]
      )
    ).toEqual([]);
  });

  it("does not let generic structural tags make every Pokemon ad eligible", () => {
    expect(
      getEligibleEtsyAds(
        [
          "pokemon"
        ],
        [
          {
            ...displayableAdBase,
            tags: [
              "pokemon"
            ]
          }
        ]
      )
    ).toEqual([]);
  });

  it("ignores disabled sample ads and empty results", () => {
    expect(
      getEligibleEtsyAds(
        [
          "kanto"
        ],
        [
          {
            ...displayableAdBase,
            disabled: true,
            tags: [
              "kanto"
            ]
          }
        ]
      )
    ).toEqual([]);
  });

  it("selects one eligible creative with injectable randomness", () => {
    const ads = [
      {
        ...displayableAdBase,
        id: "first",
        tags: [
          "kanto"
        ]
      },
      {
        ...displayableAdBase,
        id: "second",
        tags: [
          "kanto"
        ]
      }
    ];

    expect(
      selectEtsyAd(
        [
          "kanto"
        ],
        {
          ads,
          random: vi.fn(() => 0.75)
        }
      )?.id
    ).toBe("second");
  });
});

