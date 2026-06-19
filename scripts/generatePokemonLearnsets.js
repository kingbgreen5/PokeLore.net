// Run after pokemonData has been generated:
// node scripts/generatePokemonLearnsets.js

import axios from "axios";
import fs from "fs";
import path from "path";

const BASE_URL =
  "https://pokeapi.co/api/v2";

const POKEMON_DATA_DIR =
  "./public/data/pokemonData";

const OUTPUT_DIR =
  "./public/data/pokemonLearnsets";

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function buildMoves(pokemon) {
  const moves = [];

  for (const moveEntry of pokemon.moves) {
    for (const detail of moveEntry
      .version_group_details) {
      moves.push({
        move: moveEntry.move.name,
        method:
          detail.move_learn_method.name,
        level:
          detail.level_learned_at,
        versionGroup:
          detail.version_group.name
      });
    }
  }

  return moves;
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, {
      recursive: true
    });
  }

  const pokemonFiles =
    fs.readdirSync(POKEMON_DATA_DIR)
      .filter(file =>
        file.endsWith(".json")
      )
      .sort(
        (a, b) =>
          Number(
            path.basename(a, ".json")
          ) -
          Number(
            path.basename(b, ".json")
          )
      );

  console.log(
    `Found ${pokemonFiles.length} pokemonData files.`
  );

  let savedCount = 0;

  for (const file of pokemonFiles) {
    const localPokemon = JSON.parse(
      fs.readFileSync(
        path.join(
          POKEMON_DATA_DIR,
          file
        ),
        "utf8"
      )
    );

    try {
      console.log(
        `Fetching learnset for ${localPokemon.id} ${localPokemon.name}...`
      );

      const response =
        await axios.get(
          `${BASE_URL}/pokemon/${localPokemon.id}`
        );

      const pokemon = response.data;

      const learnset = {
        id: pokemon.id,
        pokemon: pokemon.name,
        species:
          localPokemon.species ??
          pokemon.species.name,
        moves: buildMoves(pokemon)
      };

      fs.writeFileSync(
        `${OUTPUT_DIR}/${pokemon.id}.json`,
        JSON.stringify(
          learnset,
          null,
          2
        )
      );

      savedCount++;

      console.log(
        `Saved ${pokemon.id}.json (${pokemon.name})`
      );

      await sleep(80);
    } catch (error) {
      console.error(
        `Failed learnset for ${localPokemon.id} ${localPokemon.name}: ${error.message}`
      );
    }
  }

  console.log(
    `Finished generating ${savedCount} learnset files.`
  );
}

main();
