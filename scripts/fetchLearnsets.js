import axios from "axios";
import fs from "fs";

const BASE_URL = "https://pokeapi.co/api/v2";

async function fetchPokemonList() {
  const response = await axios.get(
    `${BASE_URL}/pokemon?limit=2000`
  );

  return response.data.results;
}

async function fetchPokemonData(url) {
  const response = await axios.get(url);
  return response.data;
}

async function main() {
  try {
    console.log("Fetching Pokémon list...");

    const pokemonList = await fetchPokemonList();

    console.log(`Found ${pokemonList.length} Pokémon`);

    const learnsets = [];

    for (const pokemon of pokemonList) {
      console.log(`Fetching ${pokemon.name}...`);

      const data = await fetchPokemonData(pokemon.url);

      const moves = [];

      for (const moveEntry of data.moves) {
        const moveName = moveEntry.move.name;

        for (const detail of moveEntry.version_group_details) {
          moves.push({
            move: moveName,
            method: detail.move_learn_method.name,
            level: detail.level_learned_at,
            versionGroup: detail.version_group.name
          });
        }
      }

      learnsets.push({
        pokemon: data.name,
        moves
      });
    }

    fs.writeFileSync(
      "./public/data/learnsets.json",
      JSON.stringify(learnsets, null, 2)
    );

    console.log("learnsets.json created successfully!");
  } catch (error) {
    console.error(error);
  }
}

main();