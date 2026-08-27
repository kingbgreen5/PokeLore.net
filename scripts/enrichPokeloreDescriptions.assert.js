import assert from "node:assert/strict";
import {
  buildEvolutionStageLookup,
  buildPokemonDescription,
  calculateBaseStatTotal,
  classifyEvolutionStage,
  enrichPokeloreDescriptions,
  formatGeneration,
  formatTypeLabel,
  matchAnalysisEntryToPokemon
} from "./enrichPokeloreDescriptions.js";

const pokemon = {
  bulbasaur: {
    id: 1,
    name: "bulbasaur",
    species: "bulbasaur",
    isDefaultForm: true,
    types: ["grass", "poison"],
    generation: "generation-i",
    stats: {
      hp: 45,
      attack: 49,
      defense: 49,
      specialAttack: 65,
      specialDefense: 65,
      speed: 45
    }
  },
  ivysaur: {
    id: 2,
    name: "ivysaur",
    species: "ivysaur",
    isDefaultForm: true,
    types: ["grass", "poison"],
    generation: "generation-i",
    stats: {
      hp: 60,
      attack: 62,
      defense: 63,
      specialAttack: 80,
      specialDefense: 80,
      speed: 60
    }
  },
  venusaur: {
    id: 3,
    name: "venusaur",
    species: "venusaur",
    isDefaultForm: true,
    types: ["grass", "poison"],
    generation: "generation-i",
    stats: {
      hp: 80,
      attack: 82,
      defense: 83,
      specialAttack: 100,
      specialDefense: 100,
      speed: 80
    }
  },
  pichu: {
    id: 172,
    name: "pichu",
    species: "pichu",
    isDefaultForm: true,
    types: ["electric"],
    generation: "generation-ii",
    stats: {
      hp: 20,
      attack: 40,
      defense: 15,
      specialAttack: 35,
      specialDefense: 35,
      speed: 60
    }
  },
  pikachu: {
    id: 25,
    name: "pikachu",
    species: "pikachu",
    isDefaultForm: true,
    types: ["electric"],
    generation: "generation-i",
    stats: {
      hp: 35,
      attack: 55,
      defense: 40,
      specialAttack: 50,
      specialDefense: 50,
      speed: 90
    }
  },
  raichu: {
    id: 26,
    name: "raichu",
    species: "raichu",
    isDefaultForm: true,
    types: ["electric"],
    generation: "generation-i",
    stats: {
      hp: 60,
      attack: 90,
      defense: 55,
      specialAttack: 90,
      specialDefense: 80,
      speed: 110
    }
  },
  oddish: {
    id: 43,
    name: "oddish",
    species: "oddish",
    isDefaultForm: true,
    types: ["grass", "poison"],
    generation: "generation-i",
    stats: {
      hp: 45,
      attack: 50,
      defense: 55,
      specialAttack: 75,
      specialDefense: 65,
      speed: 30
    }
  },
  gloom: {
    id: 44,
    name: "gloom",
    species: "gloom",
    isDefaultForm: true,
    types: ["grass", "poison"],
    generation: "generation-i",
    stats: {
      hp: 60,
      attack: 65,
      defense: 70,
      specialAttack: 85,
      specialDefense: 75,
      speed: 40
    }
  },
  vileplume: {
    id: 45,
    name: "vileplume",
    species: "vileplume",
    isDefaultForm: true,
    types: ["grass", "poison"],
    generation: "generation-i",
    stats: {
      hp: 75,
      attack: 80,
      defense: 85,
      specialAttack: 110,
      specialDefense: 90,
      speed: 50
    }
  },
  bellossom: {
    id: 182,
    name: "bellossom",
    species: "bellossom",
    isDefaultForm: true,
    types: ["grass"],
    generation: "generation-ii",
    stats: {
      hp: 75,
      attack: 80,
      defense: 95,
      specialAttack: 90,
      specialDefense: 100,
      speed: 50
    }
  },
  eevee: {
    id: 133,
    name: "eevee",
    species: "eevee",
    isDefaultForm: true,
    types: ["normal"],
    generation: "generation-i",
    stats: {
      hp: 55,
      attack: 55,
      defense: 50,
      specialAttack: 45,
      specialDefense: 65,
      speed: 55
    }
  },
  lapras: {
    id: 131,
    name: "lapras",
    species: "lapras",
    isDefaultForm: true,
    types: ["water", "ice"],
    generation: "generation-i",
    stats: {
      hp: 130,
      attack: 85,
      defense: 80,
      specialAttack: 85,
      specialDefense: 95,
      speed: 60
    }
  },
  feebas: {
    id: 349,
    name: "feebas",
    species: "feebas",
    isDefaultForm: true,
    types: ["water"],
    generation: "generation-iii",
    stats: {
      hp: 20,
      attack: 15,
      defense: 20,
      specialAttack: 10,
      specialDefense: 55,
      speed: 80
    }
  },
  milotic: {
    id: 350,
    name: "milotic",
    species: "milotic",
    isDefaultForm: true,
    types: ["water"],
    generation: "generation-iii",
    stats: {
      hp: 95,
      attack: 60,
      defense: 79,
      specialAttack: 100,
      specialDefense: 125,
      speed: 81
    }
  },
  celebi: {
    id: 251,
    name: "celebi",
    species: "celebi",
    isDefaultForm: true,
    types: ["psychic", "grass"],
    generation: "generation-ii",
    stats: {
      hp: 100,
      attack: 100,
      defense: 100,
      specialAttack: 100,
      specialDefense: 100,
      speed: 100
    }
  },
  miraidon: {
    id: 1008,
    name: "miraidon",
    species: "miraidon",
    isDefaultForm: true,
    types: ["electric", "dragon"],
    generation: "generation-ix",
    stats: {
      hp: 100,
      attack: 85,
      defense: 100,
      specialAttack: 135,
      specialDefense: 115,
      speed: 135
    }
  },
  meowth: {
    id: 52,
    name: "meowth",
    species: "meowth",
    isDefaultForm: true,
    types: ["normal"],
    generation: "generation-i",
    stats: {
      hp: 40,
      attack: 45,
      defense: 35,
      specialAttack: 40,
      specialDefense: 40,
      speed: 90
    }
  },
  alolanMeowth: {
    id: 10107,
    name: "meowth-alola",
    species: "meowth",
    isDefaultForm: false,
    types: ["dark"],
    generation: "generation-i",
    stats: {
      hp: 40,
      attack: 35,
      defense: 35,
      specialAttack: 50,
      specialDefense: 40,
      speed: 90
    }
  }
};

const evolutionChains = [
  {
    chainId: 1,
    root: {
      pokemon: { id: 1, name: "bulbasaur" },
      evolvesTo: [
        {
          pokemon: { id: 2, name: "ivysaur" },
          evolvesTo: [
            {
              pokemon: { id: 3, name: "venusaur" },
              evolvesTo: []
            }
          ]
        }
      ]
    }
  },
  {
    chainId: 10,
    root: {
      pokemon: { id: 172, name: "pichu" },
      evolvesTo: [
        {
          pokemon: { id: 25, name: "pikachu" },
          evolvesTo: [
            {
              pokemon: { id: 26, name: "raichu" },
              evolvesTo: []
            }
          ]
        }
      ]
    }
  },
  {
    chainId: 18,
    root: {
      pokemon: { id: 43, name: "oddish" },
      evolvesTo: [
        {
          pokemon: { id: 44, name: "gloom" },
          evolvesTo: [
            {
              pokemon: { id: 45, name: "vileplume" },
              evolvesTo: []
            },
            {
              pokemon: { id: 182, name: "bellossom" },
              evolvesTo: []
            }
          ]
        }
      ]
    }
  },
  {
    chainId: 67,
    root: {
      pokemon: { id: 133, name: "eevee" },
      evolvesTo: [
        {
          pokemon: { id: 134, name: "vaporeon" },
          evolvesTo: []
        },
        {
          pokemon: { id: 135, name: "jolteon" },
          evolvesTo: []
        }
      ]
    }
  },
  {
    chainId: 65,
    root: {
      pokemon: { id: 131, name: "lapras" },
      evolvesTo: []
    }
  },
  {
    chainId: 179,
    root: {
      pokemon: { id: 349, name: "feebas" },
      evolvesTo: [
        {
          pokemon: { id: 350, name: "milotic" },
          evolvesTo: []
        }
      ]
    }
  },
  {
    chainId: 128,
    root: {
      pokemon: { id: 251, name: "celebi" },
      evolvesTo: []
    }
  },
  {
    chainId: 536,
    root: {
      pokemon: { id: 1008, name: "miraidon" },
      evolvesTo: []
    }
  },
  {
    chainId: 22,
    root: {
      pokemon: { id: 52, name: "meowth" },
      varieties: [
        { id: 52, name: "meowth" },
        { id: 10107, name: "meowth-alola" }
      ],
      evolvesTo: []
    }
  }
];

const pokemonList = Object.values(pokemon);

assert.equal(
  classifyEvolutionStage({
    hasPreEvolution: false,
    hasStandardEvolution: true
  }),
  "first"
);
assert.equal(
  classifyEvolutionStage({
    hasPreEvolution: true,
    hasStandardEvolution: true
  }),
  "middle"
);
assert.equal(
  classifyEvolutionStage({
    hasPreEvolution: true,
    hasStandardEvolution: false
  }),
  "final"
);
assert.equal(
  classifyEvolutionStage({
    hasPreEvolution: false,
    hasStandardEvolution: false
  }),
  "single"
);

assert.equal(calculateBaseStatTotal(pokemon.ivysaur), 405);
assert.equal(
  formatGeneration("generation-ix"),
  "Generation IX"
);
assert.equal(
  formatTypeLabel(["grass", "poison"]),
  "Grass/Poison-type"
);
assert.throws(
  () => formatGeneration("generation-x"),
  /Unsupported Pokemon generation/
);
assert.throws(
  () =>
    calculateBaseStatTotal({
      name: "broken",
      stats: { hp: 1 }
    }),
  /Missing numeric attack stat/
);

const stageLookup =
  buildEvolutionStageLookup(evolutionChains);

assert.equal(stageLookup.byId.get(1).stage, "first");
assert.equal(stageLookup.byId.get(2).stage, "middle");
assert.equal(stageLookup.byId.get(3).stage, "final");
assert.equal(stageLookup.byId.get(172).stage, "first");
assert.equal(stageLookup.byId.get(25).stage, "middle");
assert.equal(stageLookup.byId.get(26).stage, "final");
assert.equal(stageLookup.byId.get(43).stage, "first");
assert.equal(stageLookup.byId.get(44).stage, "middle");
assert.equal(stageLookup.byId.get(45).stage, "final");
assert.equal(stageLookup.byId.get(182).stage, "final");
assert.equal(stageLookup.byId.get(133).stage, "first");
assert.equal(stageLookup.byId.get(131).stage, "single");
assert.equal(stageLookup.byId.get(349).stage, "first");
assert.equal(stageLookup.byId.get(251).stage, "single");
assert.equal(stageLookup.byId.get(1008).stage, "single");

assert.equal(
  buildPokemonDescription(
    pokemon.ivysaur,
    "middle",
    "Ivysaur"
  ),
  "Ivysaur is a Grass/Poison-type Pokémon introduced in Generation I and a middle stage of its evolution line, with a base stat total of 405."
);
assert.equal(
  buildPokemonDescription(
    pokemon.lapras,
    "single",
    "Lapras"
  ),
  "Lapras is a Water/Ice-type Pokémon introduced in Generation I, with a base stat total of 535 and no standard evolutions."
);
assert.equal(
  buildPokemonDescription(
    pokemon.pikachu,
    "middle",
    "Pikachu"
  ),
  "Pikachu is an Electric-type Pokémon introduced in Generation I and a middle stage of its evolution line, with a base stat total of 320."
);

assert.equal(
  matchAnalysisEntryToPokemon(
    {
      nationalDexNumber: 52,
      name: "Meowth",
      form: "Alolan"
    },
    pokemonList
  ).name,
  "meowth-alola"
);
assert.equal(
  matchAnalysisEntryToPokemon(
    {
      nationalDexNumber: 52,
      name: "Meowth",
      form: "Kantonian"
    },
    pokemonList
  ).name,
  "meowth"
);
assert.throws(
  () =>
    matchAnalysisEntryToPokemon(
      {
        nationalDexNumber: 9999,
        name: "Missingno"
      },
      pokemonList
    ),
  /Could not match analysis entry/
);

const analysisData = [
  {
    evolutionLine: [1, 2, 3],
    playthrough: "Keep me",
    pokemon: [
      {
        nationalDexNumber: 1,
        name: "Bulbasaur",
        biologyAndBehavior: "Untouched"
      },
      {
        nationalDexNumber: 2,
        name: "Ivysaur",
        description: "Old description",
        biologyAndBehavior: "Also untouched"
      },
      {
        nationalDexNumber: 3,
        name: "Venusaur"
      }
    ]
  },
  {
    nationalDexNumber: 131,
    name: "Lapras",
    competitive: "Standalone prose"
  }
];
const result = enrichPokeloreDescriptions({
  analysisData,
  pokemonList,
  evolutionChains
});

assert.equal(result.total, 4);
assert.deepEqual(result.counts, {
  first: 1,
  middle: 1,
  final: 1,
  single: 1
});
assert.equal(analysisData[0].playthrough, "Keep me");
assert.equal(
  analysisData[0].pokemon[0].biologyAndBehavior,
  "Untouched"
);
assert.match(
  analysisData[0].pokemon[0].description,
  /the first stage/
);
assert.match(
  analysisData[1].description,
  /no standard evolutions/
);

console.log(
  "PokeLore description enrichment tests passed."
);
