// This script generates individual learnset JSON files for each Pokémon based on the data in learnsets.json and pokemonIndex.json.


// import fs from "fs";

// const learnsets =
//   JSON.parse(
//     fs.readFileSync(
//       "./public/data/learnsets.json",
//       "utf8"
//     )
//   );

// const pokemonIndex =
//   JSON.parse(
//     fs.readFileSync(
//       "./public/data/pokemonIndex.json",
//       "utf8"
//     )
//   );

// const OUTPUT_DIR =
//   "./public/data/pokemonLearnsets";

// if (
//   !fs.existsSync(
//     OUTPUT_DIR
//   )
// ) {
//   fs.mkdirSync(
//     OUTPUT_DIR,
//     { recursive: true }
//   );
// }

// for (
//   const pokemon
//   of pokemonIndex
// ) {

//   const learnset =
//     learnsets.find(
//       entry =>
//         entry.pokemon ===
//         pokemon.name
//     );

//   if (!learnset)
//     continue;

//   fs.writeFileSync(

//     `${OUTPUT_DIR}/${pokemon.id}.json`,

//     JSON.stringify(
//       learnset,
//       null,
//       2
//     )

//   );

//   console.log(
//     `Saved ${pokemon.name}`
//   );
// }

// console.log(
//   "Learnsets complete."
// );


// Run with:
// node scripts/generatePokemonLearnsets.js

import fs from "fs";

const LEARNSETS_FILE =
  "./public/data/learnsets.json";

const INDEX_FILE =
  "./public/data/pokemonIndex.json";

const OUTPUT_DIR =
  "./public/data/pokemonLearnsets";

async function main() {

  try {

    //-------------------------------------
    // Create Folder
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
    // Load Data
    //-------------------------------------

    const learnsets =

      JSON.parse(
        fs.readFileSync(
          LEARNSETS_FILE,
          "utf8"
        )
      );

    const pokemonIndex =

      JSON.parse(
        fs.readFileSync(
          INDEX_FILE,
          "utf8"
        )
      );

    //-------------------------------------
    // Create Name → ID Map
    //-------------------------------------

    const idMap = {};

    for (
      const pokemon
      of pokemonIndex
    ) {

      idMap[
        pokemon.name
      ] = pokemon.id;

    }

    //-------------------------------------
    // Write Individual Files
    //-------------------------------------

    let count = 0;

    for (
      const learnset
      of learnsets
    ) {

      const id =

        idMap[
          learnset.pokemon
        ];

      if (!id) {

        console.warn(
          `No ID found for ${learnset.pokemon}`
        );

        continue;
      }

      fs.writeFileSync(

        `${OUTPUT_DIR}/${id}.json`,

        JSON.stringify(
          learnset,
          null,
          2
        )

      );

      count++;

      console.log(
        `Saved ${id}.json (${learnset.pokemon})`
      );
    }

    console.log(
      `Finished. Created ${count} learnset files.`
    );

  } catch (error) {

    console.error(
      "Failed:"
    );

    console.error(error);
  }
}

main();