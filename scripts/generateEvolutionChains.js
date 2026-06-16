import axios from "axios";
import fs from "fs";
import path from "path";

const BASE_URL =
  "https://pokeapi.co/api/v2";

const OUTPUT_DIR =
  "./public/data/evolutionChains";

const pokemonIndex =
  JSON.parse(
    fs.readFileSync(
      "./public/data/pokemonIndex.json",
      "utf8"
    )
  );


function getPokemonInfo(id) {

  return pokemonIndex.find(
    pokemon => pokemon.id === id
  );

}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(
    OUTPUT_DIR,
    { recursive: true }
  );
}

//----------------------------------------
// Get Pokémon ID from species URL
//----------------------------------------

function getIdFromUrl(url) {
  return Number(
    url
      .split("/")
      .filter(Boolean)
      .pop()
  );
}

//----------------------------------------
// Recursive Chain Builder
//----------------------------------------

function buildNode(chainNode) {

  const details =
    chainNode.evolution_details?.[0] ||
    {};


const pokemonId =
  getIdFromUrl(
    chainNode.species.url
  );

const pokemonInfo =
  getPokemonInfo(
    pokemonId
  );






  return {


pokemon: {

  id: pokemonId,

  name:
    chainNode.species.name,

  sprite:
    pokemonInfo?.sprite ||

    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,

  types:
    pokemonInfo?.types || []

},

    trigger:
      details.trigger?.name ||
      null,

    minLevel:
      details.min_level,

    item:
      details.item?.name ||
      null,

    heldItem:
      details.held_item?.name ||
      null,

    knownMove:
      details.known_move?.name ||
      null,

    knownMoveType:
      details.known_move_type?.name ||
      null,

    minHappiness:
      details.min_happiness,

    minBeauty:
      details.min_beauty,

    minAffection:
      details.min_affection,

    gender:
      details.gender,

    location:
      details.location?.name ||
      null,

    timeOfDay:
      details.time_of_day ||
      null,

    tradeSpecies:
      details.trade_species?.name ||
      null,

    partySpecies:
      details.party_species?.name ||
      null,

    partyType:
      details.party_type?.name ||
      null,

    turnUpsideDown:
      details.turn_upside_down,

    relativePhysicalStats:
      details.relative_physical_stats,

    needsOverworldRain:
      details.needs_overworld_rain,

    evolvesTo:
      chainNode.evolves_to.map(
        buildNode
      )

  };
}

//----------------------------------------
// Main
//----------------------------------------

async function main() {

  try {

    console.log(
      "Fetching evolution chain list..."
    );

    const response =
      await axios.get(
        `${BASE_URL}/evolution-chain?limit=1000`
      );

    const chains =
      response.data.results;

    console.log(
      `Found ${chains.length} chains`
    );

    for (const chain of chains) {

      const chainId =
        getIdFromUrl(
          chain.url
        );

      console.log(
        `Chain ${chainId}`
      );

      const chainResponse =
        await axios.get(
          chain.url
        );

      const tree =
        buildNode(
          chainResponse.data.chain
        );

      fs.writeFileSync(

        path.join(
          OUTPUT_DIR,
          `${chainId}.json`
        ),

        JSON.stringify(
          {
            chainId,
            root: tree
          },
          null,
          2
        )

      );
    }

    console.log(
      "Evolution chains complete!"
    );

  } catch (error) {

    console.error(error);

  }
}

main();