// to run this script,        node scripts/fetchPokemonData.js       in project root


import axios from "axios";
import fs from "fs";

const BASE_URL = "https://pokeapi.co/api/v2";

async function fetchPokemonSpeciesList() {
  const response = await axios.get(
    `${BASE_URL}/pokemon-species?limit=2000`
  );

  return response.data.results;
}

async function fetchSpeciesData(url) {
  const response = await axios.get(url);
  return response.data;
}

async function main() {
  try {
    console.log("Fetching species list...");

    const speciesList = await fetchPokemonSpeciesList();

    console.log(`Found ${speciesList.length} species`);

    const allEntries = [];

    for (const species of speciesList) {
      console.log(`Fetching ${species.name}...`);

      const data = await fetchSpeciesData(species.url);

      const englishEntries = data.flavor_text_entries
        .filter(entry => entry.language.name === "en")
        .map(entry => ({
          pokemon: data.name,
          version: entry.version.name,
          text: entry.flavor_text
            .replace(/\f/g, " ")
            .replace(/\n/g, " ")
            .trim()
        }));

      allEntries.push(...englishEntries);
    }

    fs.writeFileSync(
      "./public/data/dexEntries.json",
      JSON.stringify(allEntries, null, 2)
    );

    console.log("dexEntries.json created successfully!");
  } catch (error) {
    console.error(error);
  }
}

main();