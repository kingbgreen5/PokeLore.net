import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const TOTAL_POKEMON = 1025;

//-----------------------------------------
// Fix __dirname in ES Modules
//-----------------------------------------

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

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Pokémon ${id}`
    );
  }

  return response.json();
}

//-----------------------------------------
// Build Index
//-----------------------------------------

async function buildIndex() {
  const pokemonIndex = [];

  for (
    let id = 1;
    id <= TOTAL_POKEMON;
    id++
  ) {
    try {
      console.log(
        `Fetching Pokémon ${id}...`
      );

      const data =
        await fetchPokemon(id);

      const pokemonEntry = {
        id: data.id,

        name: data.name,

        sprite:
          data.sprites
            .other["official-artwork"]
            .front_default,

        // shinySprite:
        //   data.sprites
        //     .other["official-artwork"]
        //     .front_shiny,

        types: data.types.map(
          type =>
            type.type.name
        )
      };

      pokemonIndex.push(
        pokemonEntry
      );
    } catch (error) {
      console.error(
        `Error with Pokémon ${id}:`,
        error.message
      );
    }
  }

  //-----------------------------------------
  // Ensure output directory exists
  //-----------------------------------------

  const outputDir = path.join(
    __dirname,
    "../public/data"
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {
      recursive: true
    });
  }

  //-----------------------------------------
  // Write JSON
  //-----------------------------------------

  const outputPath = path.join(
    outputDir,
    "pokemonIndex.json"
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      pokemonIndex,
      null,
      2
    )
  );

  console.log(
    "pokemonIndex.json created successfully!"
  );
}

buildIndex();