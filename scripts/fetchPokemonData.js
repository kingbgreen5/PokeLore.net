// Run with:
// node scripts/fetchPokemonData.js

import axios from "axios";
import fs from "fs";
import { normalizeFlavorText } from "../src/utils/normalizeText.js";

const BASE_URL =
  "https://pokeapi.co/api/v2";

const OUTPUT_DIR =
  "./public/data/pokemonData";

const INDEX_FILE =
  "./public/data/pokemonIndex.json";

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function getPokemonIdFromUrl(url) {
  return Number(
    url
      .split("/")
      .filter(Boolean)
      .pop()
  );
}

function getSprite(pokemon) {
  return (
    pokemon.sprites?.other?.[
      "official-artwork"
    ]?.front_default ??
    pokemon.sprites?.other?.home
      ?.front_default ??
    pokemon.sprites?.front_default ??
    null
  );
}

function getStat(pokemon, statName) {
  return pokemon.stats.find(
    stat =>
      stat.stat.name === statName
  )?.base_stat ?? 0;
}

function condenseDexEntries(
  flavorTextEntries
) {
  const englishEntries =
    flavorTextEntries
      .filter(
        entry =>
          entry.language.name === "en"
      )
      .map(entry => ({
        version: entry.version.name,
        text: normalizeFlavorText(
          entry.flavor_text
        )
      }));

  const grouped = {};

  for (const entry of englishEntries) {
    if (!grouped[entry.text]) {
      grouped[entry.text] = {
        versions: [],
        text: entry.text
      };
    }

    grouped[entry.text].versions.push(
      entry.version
    );
  }

  return Object.values(grouped);
}

async function fetchPokemon(identifier) {
  const response =
    await axios.get(
      `${BASE_URL}/pokemon/${identifier}`
    );

  return response.data;
}

async function fetchSpeciesFromPokemon(
  pokemon
) {
  const response =
    await axios.get(
      pokemon.species.url
    );

  return response.data;
}

function buildVarietySummary(
  variety,
  pokemon
) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    isDefault: variety.is_default,
    sprite: getSprite(pokemon),
    types: pokemon.types.map(
      type => type.type.name
    )
  };
}

const MANUAL_VARIETY_SUMMARIES = {
  frillish: [
    {
      id: 592,
      name: "frillish-female",
      isDefault: false,
      sprite:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/female/592.svg",
      spriteFallback:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/female/592.png",
      types: ["water", "ghost"]
    }
  ],
  jellicent: [
    {
      id: 593,
      name: "jellicent-female",
      isDefault: false,
      sprite:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/female/593.svg",
      spriteFallback:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/female/593.png",
      types: ["water", "ghost"]
    }
  ]
};

function applyManualVarietySummaries(
  speciesName,
  varieties
) {
  const manualVarieties =
    MANUAL_VARIETY_SUMMARIES[
      speciesName
    ] ?? [];
  const existingNames = new Set(
    varieties.map(variety => variety.name)
  );

  return [
    ...varieties,
    ...manualVarieties.filter(
      variety =>
        !existingNames.has(variety.name)
    )
  ];
}

function buildPokemonData({
  pokemon,
  species,
  variety,
  varieties
}) {
  const evolutionChainId = Number(
    species.evolution_chain.url
      .split("/")
      .filter(Boolean)
      .pop()
  );

  const genus =
    species.genera.find(
      entry =>
        entry.language.name === "en"
    )?.genus ?? null;

  return {
    id: pokemon.id,
    name: pokemon.name,
    species: species.name,
    isDefaultForm: variety.is_default,
    sprite: getSprite(pokemon),
    genus,
    height: pokemon.height,
    weight: pokemon.weight,
    baseExperience:
      pokemon.base_experience,
    types: pokemon.types.map(
      type => type.type.name
    ),
    abilities: pokemon.abilities.map(
      ability =>
        ability.ability.name
    ),
    stats: {
      hp: getStat(pokemon, "hp"),
      attack: getStat(
        pokemon,
        "attack"
      ),
      defense: getStat(
        pokemon,
        "defense"
      ),
      specialAttack: getStat(
        pokemon,
        "special-attack"
      ),
      specialDefense: getStat(
        pokemon,
        "special-defense"
      ),
      speed: getStat(
        pokemon,
        "speed"
      )
    },
    catchRate: species.capture_rate,
    generation:
      species.generation?.name ?? null,
    color: species.color?.name ?? null,
    shape: species.shape?.name ?? null,
    habitat:
      species.habitat?.name ?? null,
    genderRate: species.gender_rate,
    hatchCounter:
      species.hatch_counter,
    isBaby: species.is_baby,
    isLegendary:
      species.is_legendary,
    isMythical:
      species.is_mythical,
    evolutionChainId,
    varieties,
    dexEntries: condenseDexEntries(
      species.flavor_text_entries
    )
  };
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, {
      recursive: true
    });
  }

  const pokemonIndex = JSON.parse(
    fs.readFileSync(
      INDEX_FILE,
      "utf8"
    )
  );

  console.log(
    `Found ${pokemonIndex.length} National Dex Pokémon`
  );

  let savedCount = 0;

  for (const pokemonEntry of pokemonIndex) {
    try {
      console.log(
        `Fetching species for #${pokemonEntry.id} ${pokemonEntry.name}...`
      );

      const defaultPokemon =
        await fetchPokemon(
          pokemonEntry.id
        );

      const species =
        await fetchSpeciesFromPokemon(
          defaultPokemon
        );

      const fetchedVarieties = [];

      for (const variety of species.varieties) {
        try {
          const varietyId =
            getPokemonIdFromUrl(
              variety.pokemon.url
            );

          const pokemon =
            await fetchPokemon(
              varietyId
            );

          fetchedVarieties.push({
            variety,
            pokemon
          });

          await sleep(80);
        } catch (error) {
          console.error(
            `Failed to fetch variety ${variety.pokemon.name}: ${error.message}`
          );
        }
      }

      const varieties =
        applyManualVarietySummaries(
          species.name,
          fetchedVarieties.map(
            ({ variety, pokemon }) =>
              buildVarietySummary(
                variety,
                pokemon
              )
          )
        );

      for (const {
        variety,
        pokemon
      } of fetchedVarieties) {
        try {
          const pokemonData =
            buildPokemonData({
              pokemon,
              species,
              variety,
              varieties
            });

          fs.writeFileSync(
            `${OUTPUT_DIR}/${pokemon.id}.json`,
            JSON.stringify(
              pokemonData,
              null,
              2
            )
          );

          savedCount++;

          console.log(
            `Saved ${pokemon.id}.json (${pokemon.name})`
          );
        } catch (error) {
          console.error(
            `Failed to save ${pokemon.name}: ${error.message}`
          );
        }
      }

      await sleep(120);
    } catch (error) {
      console.error(
        `Failed on #${pokemonEntry.id} ${pokemonEntry.name}: ${error.message}`
      );
    }
  }

  console.log(
    `Finished generating ${savedCount} Pokémon data files.`
  );
}

main();
