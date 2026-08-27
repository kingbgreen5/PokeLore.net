import {
  describe,
  expect,
  it
} from "vitest";
import bulbasaurChain from "../../public/data/evolutionChains/1.json";
import oddishChain from "../../public/data/evolutionChains/18.json";
import laprasChain from "../../public/data/evolutionChains/65.json";
import eeveeChain from "../../public/data/evolutionChains/67.json";
import feebasChain from "../../public/data/evolutionChains/178.json";
import meowthChain from "../../public/data/evolutionChains/22.json";
import evolutionMethodOverrides from "../../public/data/evolutionMethodOverrides.json";
import {
  buildEvolutionDisplayModel,
  getEvolutionDescriptionText,
  getEvolutionSummaryMeta,
  getEvolutionSummaryText
} from "./evolutionDisplay";

describe("evolution display helpers", () => {
  it("summarizes a linear family from the root for every family member", () => {
    expect(
      getEvolutionSummaryText(
        bulbasaurChain.root,
        {
          currentPokemonName: "ivysaur",
          evolutionMethodOverrides
        }
      )
    ).toBe(
      "Bulbasaur evolves into Ivysaur at level 16, and Ivysaur evolves into Venusaur at level 32."
    );
  });

  it("summarizes single-stage Pokemon without special form mechanics", () => {
    expect(
      getEvolutionSummaryText(
        laprasChain.root,
        {
          currentPokemonName: "lapras",
          evolutionMethodOverrides
        }
      )
    ).toBe(
      "Lapras does not evolve into or from any other Pokémon."
    );
  });

  it("combines small branches into one natural sentence", () => {
    expect(
      getEvolutionSummaryText(
        oddishChain.root,
        {
          currentPokemonName: "oddish",
          evolutionMethodOverrides
        }
      )
    ).toBe(
      "Oddish evolves into Gloom at level 21, and Gloom can then evolve into Vileplume with a Leaf Stone or Bellossom with a Sun Stone."
    );
  });

  it("uses a concise summary for large direct branches", () => {
    expect(
      getEvolutionSummaryMeta()
        .largeBranchThreshold
    ).toBe(4);
    expect(
      getEvolutionSummaryText(
        eeveeChain.root,
        {
          currentPokemonName: "eevee",
          evolutionMethodOverrides
        }
      )
    ).toBe(
      "Eevee has 8 possible evolutions: Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, and Sylveon, with the required method varying by evolution."
    );
  });

  it("uses override methods in summaries and display labels", () => {
    const model =
      buildEvolutionDisplayModel(
        feebasChain.root,
        {
          currentPokemonName:
            "feebas",
          evolutionMethodOverrides
        }
      );
    const [milotic] = model.children;

    expect(
      getEvolutionDescriptionText(
        milotic.node,
        milotic.pokemon,
        evolutionMethodOverrides
      )
    ).toBe(
      "Lvl. up with high beauty / Trade while holding Prism Scale"
    );
    expect(
      getEvolutionSummaryText(
        feebasChain.root,
        {
          currentPokemonName:
            "feebas",
          evolutionMethodOverrides
        }
      )
    ).toBe(
      "Feebas evolves into Milotic by raising its Beauty and leveling up or by trading while holding a Prism Scale."
    );
  });

  it("uses form evolution paths when the family override replaces the default tree", () => {
    expect(
      getEvolutionSummaryText(
        meowthChain.root,
        {
          currentPokemonName:
            "meowth-alola",
          evolutionMethodOverrides
        }
      )
    ).toBe(
      "Alolan Meowth evolves into Alolan Persian by leveling up with high friendship."
    );
  });
});
