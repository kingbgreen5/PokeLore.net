import {
  describe,
  expect,
  it
} from "vitest";
import {
  homeSeo,
  pokemonSeo,
  pokemonSeoDescription,
  pokemonSeoTitle
} from "./seoConfig.js";
import bulbasaur from "../../public/data/pokemonData/1.json";
import pikachu from "../../public/data/pokemonData/25.json";
import lapras from "../../public/data/pokemonData/131.json";
import celebi from "../../public/data/pokemonData/251.json";
import feebas from "../../public/data/pokemonData/349.json";
import miraidon from "../../public/data/pokemonData/1008.json";

const representativePokemon = [
  {
    slug: "bulbasaur",
    pokemon: bulbasaur,
    title:
      "Bulbasaur Pokédex: Stats, Moves, Evolution & Analysis | PokéLore",
    description:
      "Bulbasaur stats, moves, weaknesses, evolution, locations, Pokédex entries, plus playthrough, competitive and Nuzlocke analysis—all in one place."
  },
  {
    slug: "pikachu",
    pokemon: pikachu,
    title:
      "Pikachu Pokédex: Stats, Moves, Evolution & Analysis | PokéLore",
    description:
      "Pikachu stats, moves, weaknesses, evolution, locations, Pokédex entries, plus playthrough, competitive and Nuzlocke analysis—all in one place."
  },
  {
    slug: "lapras",
    pokemon: lapras,
    title:
      "Lapras Pokédex: Stats, Moves, Evolution & Analysis | PokéLore",
    description:
      "Lapras stats, moves, weaknesses, evolution, locations, Pokédex entries, plus playthrough, competitive and Nuzlocke analysis—all in one place."
  },
  {
    slug: "celebi",
    pokemon: celebi,
    title:
      "Celebi Pokédex: Stats, Moves, Evolution & Analysis | PokéLore",
    description:
      "Celebi stats, moves, weaknesses, evolution, locations, Pokédex entries, plus playthrough, competitive and Nuzlocke analysis—all in one place."
  },
  {
    slug: "feebas",
    pokemon: feebas,
    title:
      "Feebas Pokédex: Stats, Moves, Evolution & Analysis | PokéLore",
    description:
      "Feebas stats, moves, weaknesses, evolution, locations, Pokédex entries, plus playthrough, competitive and Nuzlocke analysis—all in one place."
  },
  {
    slug: "miraidon",
    pokemon: miraidon,
    title:
      "Miraidon Pokédex: Stats, Moves, Evolution & Analysis | PokéLore",
    description:
      "Miraidon stats, moves, weaknesses, evolution, locations, Pokédex entries, plus playthrough, competitive and Nuzlocke analysis—all in one place."
  }
];

describe("pokemonSeo", () => {
  it("uses the canonical homepage SEO metadata and WebSite schema", () => {
    const seo = homeSeo();

    expect(seo.title).toBe(
      "PokéLore.net | Pokémon Pokédex, Tools & Game Guides"
    );
    expect(seo.description).toBe(
      "PokéLore.net is a Pokémon Pokédex and game resource with stats, moves, evolutions, weaknesses, encounter locations, game analysis, team building, EV training tools, Feebas calculators, and more."
    );
    expect(seo.canonical).toBe(
      "https://pokelore.net/"
    );
    expect(seo.structuredData).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: "https://pokelore.net/",
      name: "PokéLore.net",
      alternateName: [
        "PokéLore",
        "pokelore.net"
      ]
    });
  });

  it("uses the canonical Pokemon detail title template", () => {
    representativePokemon.forEach(
      ({
        pokemon,
        title
      }) => {
        expect(
          pokemonSeoTitle(pokemon)
        ).toBe(title);
        expect(
          pokemonSeo(pokemon).title
        ).toBe(title);
      }
    );
  });

  it("uses the canonical Pokemon detail meta description template", () => {
    representativePokemon.forEach(
      ({
        pokemon,
        description
      }) => {
        expect(
          pokemonSeoDescription(pokemon)
        ).toBe(description);
        expect(
          pokemonSeo(pokemon).description
        ).toBe(description);
      }
    );
  });

  it("keeps canonical URLs and robots behavior unchanged", () => {
    representativePokemon.forEach(
      ({
        slug,
        pokemon
      }) => {
        const seo = pokemonSeo(pokemon);

        expect(seo.canonical).toBe(
          `https://pokelore.net/pokemon/${slug}`
        );
        expect(seo.robots).toBeUndefined();
      }
    );
  });

  it("keeps structured data descriptions on the existing detail-data wording", () => {
    const seo = pokemonSeo(pikachu);

    expect(
      seo.structuredData["@graph"][0].description
    ).toBe(
      "Explore Pikachu's stats, moves, abilities, evolution details, type matchups, locations, and size chart. Pikachu is listed at 1' 4\" (0.4 m) with an in-chart visual size comparison."
    );
    expect(
      seo.structuredData["@graph"][2].description
    ).toBe(
      "Explore Pikachu's stats, moves, abilities, evolution details, type matchups, locations, and size chart. Pikachu is listed at 1' 4\" (0.4 m) with an in-chart visual size comparison."
    );
  });
});
