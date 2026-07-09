import {
  describe,
  expect,
  it
} from "vitest";
import {
  advanceSpriteFallback,
  getPokemonCardSources,
  getPokemonDetailSources,
  getPokemonSpriteFallbacks,
} from "./pokemonSprites";

describe("pokemon sprite fallbacks", () => {
  it("builds Home and standard sprite fallbacks", () => {
    expect(
      getPokemonSpriteFallbacks({
        id: 25,
        sprite: "official.png"
      })
    ).toEqual([
      "official.png?retry=1",
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/25.png",
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
    ]);
  });

  it("advances through each fallback once", () => {
    const image = {
      dataset: {},
      src: "official.png"
    };
    const event = {
      currentTarget: image
    };

    advanceSpriteFallback(
      event,
      ["home.png", "sprite.png"]
    );
    expect(image.src).toBe("home.png");

    advanceSpriteFallback(
      event,
      ["home.png", "sprite.png"]
    );
    expect(image.src).toBe("sprite.png");

    advanceSpriteFallback(
      event,
      ["home.png", "sprite.png"]
    );
    expect(image.src).toBe("sprite.png");
  });

  it("prefers local card and detail artwork", () => {
    const pokemon = {
      id: 25,
      sprite:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
    };

    expect(
      getPokemonCardSources(pokemon).slice(
        0,
        3
      )
    ).toEqual([
      "/images/pokemon/official/card/25.webp",
      "/images/pokemon/official/full/25.png",
      pokemon.sprite
    ]);

    expect(
      getPokemonDetailSources(
        pokemon
      ).slice(0, 2)
    ).toEqual([
      "/images/pokemon/official/full/25.png",
      pokemon.sprite
    ]);
  });
});
