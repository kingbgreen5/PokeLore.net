import axios from "axios";
import fs from "fs";

const BASE_URL = "https://pokeapi.co/api/v2";

async function fetchMoveList() {
  const response = await axios.get(
    `${BASE_URL}/move?limit=2000`
  );

  return response.data.results;
}

async function fetchMoveData(url) {
  const response = await axios.get(url);
  return response.data;
}

async function main() {
  try {
    console.log("Fetching move list...");

    const moveList = await fetchMoveList();

    console.log(`Found ${moveList.length} moves`);

    const moves = {};

    for (const move of moveList) {
      console.log(`Fetching ${move.name}...`);

      const data = await fetchMoveData(move.url);

      // Get latest English description
      const englishEffect = data.effect_entries.find(
        entry => entry.language.name === "en"
      );

      moves[data.name] = {
        type: data.type?.name || null,
        power: data.power,
        accuracy: data.accuracy,
        pp: data.pp,
        description: englishEffect
          ? englishEffect.short_effect.replace(/\n/g, " ")
          : null
      };
    }

    fs.writeFileSync(
      "./public/data/moves.json",
      JSON.stringify(moves, null, 2)
    );

    console.log("moves.json created successfully!");
  } catch (error) {
    console.error(error);
  }
}

main();