// // to run this script,        node scripts/fetchPokemonData.js       in project root


// import axios from "axios";
// import fs from "fs";

// const BASE_URL = "https://pokeapi.co/api/v2";

// async function fetchPokemonSpeciesList() {
//   const response = await axios.get(
//     `${BASE_URL}/pokemon-species?limit=2000`
//   );

//   return response.data.results;
// }

// async function fetchSpeciesData(url) {
//   const response = await axios.get(url);
//   return response.data;
// }

// async function main() {
//   try {
//     console.log("Fetching species list...");

//     const speciesList = await fetchPokemonSpeciesList();

//     console.log(`Found ${speciesList.length} species`);

//     const allEntries = [];

//     for (const species of speciesList) {
//       console.log(`Fetching ${species.name}...`);

//       const data = await fetchSpeciesData(species.url);

//       const englishEntries = data.flavor_text_entries
//         .filter(entry => entry.language.name === "en")
//         .map(entry => ({
//           pokemon: data.name,
//           version: entry.version.name,
//           text: entry.flavor_text
//             .replace(/\f/g, " ")
//             .replace(/\n/g, " ")
//             .trim()
//         }));

//       allEntries.push(...englishEntries);
//     }

//     fs.writeFileSync(
//       "./public/data/dexEntries.json",
//       JSON.stringify(allEntries, null, 2)
//     );

//     console.log("dexEntries.json created successfully!");
//   } catch (error) {
//     console.error(error);
//   }
// }

// main();


// Run with:
// node scripts/fetchPokemonData.js


// This script fetches detailed Pokémon data from the PokéAPI and saves it as individual JSON files in the public/data/pokemonData directory. 
// It includes information such as types, abilities, stats, evolution chain ID, and English Pokédex entries for each Pokémon.

// import axios from "axios";
// import fs from "fs";

// const BASE_URL =
//   "https://pokeapi.co/api/v2";

// const OUTPUT_DIR =
//   "./public/data/pokemonData";

// const TOTAL_POKEMON =
//   1025;


//   function sleep(ms) {
//   return new Promise(
//     resolve =>
//       setTimeout(resolve, ms)
//   );
// }

// async function main() {

//   if (
//     !fs.existsSync(
//       OUTPUT_DIR
//     )
//   ) {
//     fs.mkdirSync(
//       OUTPUT_DIR,
//       { recursive: true }
//     );
//   }

//   for (
//     let id = 1;
//     id <= TOTAL_POKEMON;
//     id++
//   ) {

//     try {

//       console.log(
//         `Fetching #${id}`
//       );

//       //-----------------------------------
//       // Pokemon Endpoint
//       //-----------------------------------

//       const pokemonResponse =
//         await axios.get(
//           `${BASE_URL}/pokemon/${id}`
//         );

//       const pokemon =
//         pokemonResponse.data;

//       //-----------------------------------
//       // Species Endpoint
//       //-----------------------------------

//       const speciesResponse =
//         await axios.get(
//           pokemon.species.url
//         );

//       const species =
//         speciesResponse.data;

//       //-----------------------------------
//       // Evolution Chain ID
//       //-----------------------------------

//       const chainId =
//         Number(
//           species
//             .evolution_chain
//             .url
//             .split("/")
//             .filter(Boolean)
//             .pop()
//         );

//       //-----------------------------------
//       // English Dex Entries
//       //-----------------------------------

//       const dexEntries =

//         species
//           .flavor_text_entries

//           .filter(
//             entry =>
//               entry.language.name ===
//               "en"
//           )

//           .map(
//             entry => ({
//               version:
//                 entry.version.name,

//               text:
//                 entry.flavor_text

//                   .replace(
//                     /\f/g,
//                     " "
//                   )

//                   .replace(
//                     /\n/g,
//                     " "
//                   )

//                   .trim()
//             })
//           );

//       //-----------------------------------
//       // Build File
//       //-----------------------------------

//       const pokemonData = {

//         id:
//           pokemon.id,

//         name:
//           pokemon.name,

//         sprite:

//           pokemon.sprites.other
//             ["official-artwork"]
//             .front_default,

//         types:

//           pokemon.types.map(
//             type =>
//               type.type.name
//           ),

//         abilities:

//           pokemon.abilities.map(
//             ability =>
//               ability.ability.name
//           ),

//         catchRate:
//           species.capture_rate,

//         stats: {

//           hp:
//             pokemon.stats.find(
//               stat =>
//                 stat.stat.name ===
//                 "hp"
//             ).base_stat,

//           attack:
//             pokemon.stats.find(
//               stat =>
//                 stat.stat.name ===
//                 "attack"
//             ).base_stat,

//           defense:
//             pokemon.stats.find(
//               stat =>
//                 stat.stat.name ===
//                 "defense"
//             ).base_stat,

//           specialAttack:
//             pokemon.stats.find(
//               stat =>
//                 stat.stat.name ===
//                 "special-attack"
//             ).base_stat,

//           specialDefense:
//             pokemon.stats.find(
//               stat =>
//                 stat.stat.name ===
//                 "special-defense"
//             ).base_stat,

//           speed:
//             pokemon.stats.find(
//               stat =>
//                 stat.stat.name ===
//                 "speed"
//             ).base_stat
//         },

//         evolutionChainId:
//           chainId,

//         dexEntries:
//           dexEntries
//       };

//       //-----------------------------------
//       // Save File
//       //-----------------------------------

//       fs.writeFileSync(

//         `${OUTPUT_DIR}/${id}.json`,

//         JSON.stringify(
//           pokemonData,
//           null,
//           2
//         )

//       );

//       //-----------------------------------
//       // Avoid API Rate Limits
//       //-----------------------------------

//       await sleep(100);

//     } catch (error) {

//       console.error(
//         `Failed on #${id}`
//       );

//       console.error(
//         error.message
//       );
//     }
//   }

//   console.log(
//     "Finished generating Pokémon files."
//   );
// }

// main();


// Run with:
// node scripts/fetchPokemonData.js

import axios from "axios";
import fs from "fs";

const BASE_URL =
  "https://pokeapi.co/api/v2";

const OUTPUT_DIR =
  "./public/data/pokemonData";

const INDEX_FILE =
  "./public/data/pokemonIndex.json";

function sleep(ms) {
  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );
}

//-----------------------------------------
// Condense Dex Entries
//-----------------------------------------

function condenseDexEntries(
  flavorTextEntries
) {

  const englishEntries =

    flavorTextEntries

      .filter(
        entry =>
          entry.language.name ===
          "en"
      )

      .map(
        entry => ({
          version:
            entry.version.name,

          text:
            entry.flavor_text

              .replace(/\f/g, " ")

              .replace(/\n/g, " ")

              .replace(/\r/g, " ")

              .replace(/\s+/g, " ")

              .trim()
        })
      );

  const grouped = {};

  for (
    const entry
    of englishEntries
  ) {

    if (
      !grouped[
        entry.text
      ]
    ) {

      grouped[
        entry.text
      ] = {

        versions: [],

        text:
          entry.text
      };
    }

    grouped[
      entry.text
    ].versions.push(
      entry.version
    );
  }

  return Object.values(
    grouped
  );
}

//-----------------------------------------
// Get Pokemon ID From URL
//-----------------------------------------

function getPokemonIdFromUrl(
  url
) {

  return Number(

    url
      .split("/")
      .filter(Boolean)
      .pop()

  );

}

//-----------------------------------------
// Main
//-----------------------------------------

async function main() {

  try {

    //-------------------------------------
    // Ensure Output Folder Exists
    //-------------------------------------

    if (
      !fs.existsSync(
        OUTPUT_DIR
      )
    ) {

      fs.mkdirSync(
        OUTPUT_DIR,
        {
          recursive: true
        }
      );
    }

    //-------------------------------------
    // Load Index
    //-------------------------------------

    const pokemonIndex =

      JSON.parse(

        fs.readFileSync(
          INDEX_FILE,
          "utf8"
        )

      );

    console.log(
      `Found ${pokemonIndex.length} Pokémon`
    );

    //-------------------------------------
    // Loop Through Pokémon
    //-------------------------------------

    for (
      const pokemonEntry
      of pokemonIndex
    ) {

      const id =
        pokemonEntry.id;

      try {

        console.log(
          `Fetching #${id}...`
        );

        //---------------------------------
        // Pokemon Endpoint
        //---------------------------------

        const pokemonResponse =

          await axios.get(

            `${BASE_URL}/pokemon/${id}`

          );

        const pokemon =
          pokemonResponse.data;

        //---------------------------------
        // Species Endpoint
        //---------------------------------

        const speciesResponse =

          await axios.get(
            pokemon.species.url
          );

        const species =
          speciesResponse.data;

        //---------------------------------
        // Evolution Chain ID
        //---------------------------------

        const evolutionChainId =

          Number(

            species
              .evolution_chain
              .url

              .split("/")

              .filter(Boolean)

              .pop()

          );

        //---------------------------------
        // Varieties / Forms
        //---------------------------------

        const varieties = [];

        for (
          const variety
          of species.varieties
        ) {

          const varietyId =

            getPokemonIdFromUrl(
              variety.pokemon.url
            );

          varieties.push({

            id:
              varietyId,

            name:
              variety.pokemon.name,

            isDefault:
              variety.is_default

          });
        }

        //---------------------------------
        // English Genus
        //---------------------------------

        const genus =

          species.genera.find(
            genus =>
              genus.language.name ===
              "en"
          )?.genus || null;

        //---------------------------------
        // Build Object
        //---------------------------------

        const pokemonData = {

          //---------------------------------
          // Basic
          //---------------------------------

          id:
            pokemon.id,

          name:
            pokemon.name,

          species:
            species.name,

          //---------------------------------
          // Display
          //---------------------------------

          sprite:

            pokemon.sprites.other[
              "official-artwork"
            ].front_default,

          genus,

          //---------------------------------
          // Physical Data
          //---------------------------------

          height:
            pokemon.height,

          weight:
            pokemon.weight,

          //---------------------------------
          // Battle Data
          //---------------------------------

          baseExperience:
            pokemon.base_experience,

          types:

            pokemon.types.map(
              type =>
                type.type.name
            ),

          abilities:

            pokemon.abilities.map(
              ability =>
                ability.ability.name
            ),

          stats: {

            hp:

              pokemon.stats.find(
                stat =>
                  stat.stat.name ===
                  "hp"
              ).base_stat,

            attack:

              pokemon.stats.find(
                stat =>
                  stat.stat.name ===
                  "attack"
              ).base_stat,

            defense:

              pokemon.stats.find(
                stat =>
                  stat.stat.name ===
                  "defense"
              ).base_stat,

            specialAttack:

              pokemon.stats.find(
                stat =>
                  stat.stat.name ===
                  "special-attack"
              ).base_stat,

            specialDefense:

              pokemon.stats.find(
                stat =>
                  stat.stat.name ===
                  "special-defense"
              ).base_stat,

            speed:

              pokemon.stats.find(
                stat =>
                  stat.stat.name ===
                  "speed"
              ).base_stat
          },

          //---------------------------------
          // Species Data
          //---------------------------------

          catchRate:
            species.capture_rate,

          generation:
            species.generation?.name,

          color:
            species.color?.name,

          shape:
            species.shape?.name,

          habitat:
            species.habitat?.name,

          genderRate:
            species.gender_rate,

          hatchCounter:
            species.hatch_counter,

          isBaby:
            species.is_baby,

          isLegendary:
            species.is_legendary,

          isMythical:
            species.is_mythical,

          //---------------------------------
          // Evolution
          //---------------------------------

          evolutionChainId,

          //---------------------------------
          // Forms
          //---------------------------------

          varieties,

          //---------------------------------
          // Dex Entries
          //---------------------------------

          dexEntries:

            condenseDexEntries(
              species.flavor_text_entries
            )
        };

        //---------------------------------
        // Save File
        //---------------------------------

        fs.writeFileSync(

          `${OUTPUT_DIR}/${id}.json`,

          JSON.stringify(
            pokemonData,
            null,
            2
          )

        );

        //---------------------------------
        // Rate Limit Protection
        //---------------------------------

        await sleep(100);

      } catch (error) {

        console.error(
          `Failed on #${id}`
        );

        console.error(
          error.message
        );
      }
    }

    console.log(
      "Finished generating Pokémon data."
    );

  } catch (error) {

    console.error(
      "Script failed:"
    );

    console.error(error);
  }
}

main();
