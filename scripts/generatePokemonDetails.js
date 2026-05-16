import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const TOTAL_POKEMON = 1025;

const __filename = fileURLToPath(
  import.meta.url
);

const __dirname = path.dirname(
  __filename
);

//-----------------------------------------
// Fetch Pokémon
//-----------------------------------------

async function fetchPokemon(id) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${id}`
  );

  return response.json();
}

//-----------------------------------------
// Fetch Species
//-----------------------------------------

async function fetchSpecies(id) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon-species/${id}`
  );

  return response.json();
}

//-----------------------------------------
// Extract Stats
//-----------------------------------------

function buildStats(statsArray) {
  return {
    hp: statsArray.find(
      s => s.stat.name === "hp"
    )?.base_stat,

    attack: statsArray.find(
      s =>
        s.stat.name === "attack"
    )?.base_stat,

    defense: statsArray.find(
      s =>
        s.stat.name === "defense"
    )?.base_stat,

    specialAttack:
      statsArray.find(
        s =>
          s.stat.name ===
          "special-attack"
      )?.base_stat,

    specialDefense:
      statsArray.find(
        s =>
          s.stat.name ===
          "special-defense"
      )?.base_stat,

    speed: statsArray.find(
      s =>
        s.stat.name === "speed"
    )?.base_stat
  };
}

//-----------------------------------------
// Build Pokémon Files
//-----------------------------------------

async function buildPokemonFiles() {
  const outputDir = path.join(
    __dirname,
    "../public/data/pokemonData"
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
      recursive: true
    });
  }

  for (
    let id = 1;
    id <= TOTAL_POKEMON;
    id++
  ) {
    try {
      console.log(
        `Building Pokémon ${id}...`
      );

      const pokemon =
        await fetchPokemon(id);

      const species =
        await fetchSpecies(id);

      //-----------------------------------------
      // Build Clean Object
      //-----------------------------------------

      const pokemonData = {
        id: pokemon.id,

        name: pokemon.name,

        sprite:
          pokemon.sprites.other[
            "official-artwork"
          ].front_default,

        types: pokemon.types.map(
          type =>
            type.type.name
        ),

        abilities:
          pokemon.abilities.map(
            ability =>
              ability.ability.name
          ),

        catchRate:
          species.capture_rate,

        stats: buildStats(
          pokemon.stats
        )
      };

      //-----------------------------------------
      // Save JSON
      //-----------------------------------------

      const outputPath =
        path.join(
          outputDir,
          `${id}.json`
        );

      fs.writeFileSync(
        outputPath,
        JSON.stringify(
          pokemonData,
          null,
          2
        )
      );
    } catch (error) {
      console.error(
        `Error building Pokémon ${id}:`,
        error.message
      );
    }
  }

  console.log(
    "All Pokémon detail files created!"
  );
}

buildPokemonFiles();