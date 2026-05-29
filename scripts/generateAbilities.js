import fs from "fs/promises";

const TOTAL_ABILITIES = 400;

async function generateAbilities() {

  const abilities = {};

  for (
    let id = 1;
    id <= TOTAL_ABILITIES;
    id++
  ) {

    try {

      console.log(
        `Fetching ability ${id}...`
      );

      const response = await fetch(
        `https://pokeapi.co/api/v2/ability/${id}`
      );

      if (!response.ok) {
        console.log(
          `Skipping ability ${id}`
        );
        continue;
      }

      const data =
        await response.json();

      //-----------------------------------------
      // English Effect Entry
      //-----------------------------------------

      const englishEffect =
        data.effect_entries.find(
          entry =>
            entry.language.name ===
            "en"
        );

      //-----------------------------------------
      // English Flavor Text
      //-----------------------------------------

      const englishFlavor =
        data.flavor_text_entries.find(
          entry =>
            entry.language.name ===
            "en"
        );

      //-----------------------------------------
      // Pokémon List
      //-----------------------------------------

      const pokemonList =
        data.pokemon.map(
          entry =>
            entry.pokemon.name
        );

      //-----------------------------------------
      // Build Ability Object
      //-----------------------------------------

      abilities[data.name] = {

        name: data.name,

        shortEffect:
          englishFlavor?.flavor_text
            ?.replace(/\n/g, " ")
            ?.replace(/\f/g, " ")
          || "No description.",

        effect:
          englishEffect?.effect
            ?.replace(/\n/g, " ")
            ?.replace(/\f/g, " ")
          || "No effect description.",

        generation:
          data.generation.name,

        pokemon: pokemonList
      };

    } catch (error) {

      console.error(
        `Failed ability ${id}:`,
        error.message
      );

    }
  }

  //-----------------------------------------
  // Save JSON
  //-----------------------------------------

  await fs.writeFile(
    "./public/data/abilities.json",
    JSON.stringify(
      abilities,
      null,
      2
    )
  );

  console.log(
    "abilities.json generated!"
  );
}

generateAbilities();