import axios from "axios";
import fs from "fs";
import path from "path";

const BASE_URL =
  "https://pokeapi.co/api/v2";

const OUTPUT_DIR =
  "./public/data/evolutionChains";

const POKEMON_DATA_DIR =
  "./public/data/pokemonData";

const pokemonBySpecies =
  loadPokemonBySpecies();

function toSummary(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    isDefault:
      pokemon.isDefaultForm,
    sprite: pokemon.sprite,
    types: pokemon.types || []
  };
}

function loadPokemonBySpecies() {
  const grouped = {};

  const files =
    fs.readdirSync(POKEMON_DATA_DIR)
      .filter(file =>
        file.endsWith(".json")
      );

  for (const file of files) {
    const pokemon = JSON.parse(
      fs.readFileSync(
        path.join(
          POKEMON_DATA_DIR,
          file
        ),
        "utf8"
      )
    );

    if (!pokemon.species) {
      continue;
    }

    if (!grouped[pokemon.species]) {
      grouped[pokemon.species] = [];
    }

    grouped[pokemon.species].push(
      toSummary(pokemon)
    );
  }

  for (const varieties of Object.values(
    grouped
  )) {
    varieties.sort(
      (a, b) =>
        Number(b.isDefault) -
          Number(a.isDefault) ||
        a.id - b.id
    );
  }

  return grouped;
}

function getSpeciesVarieties(speciesName) {
  return pokemonBySpecies[
    speciesName
  ] || [];
}

function getDefaultPokemon(
  speciesName,
  fallbackId
) {
  const varieties =
    getSpeciesVarieties(speciesName);

  return (
    varieties.find(
      variety => variety.isDefault
    ) ||
    varieties[0] || {
      id: fallbackId,
      name: speciesName,
      isDefault: true,
      sprite:
        `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${fallbackId}.png`,
      types: []
    }
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

const varieties =
  getSpeciesVarieties(
    chainNode.species.name
  );

const defaultPokemon =
  getDefaultPokemon(
    chainNode.species.name,
    pokemonId
  );





  return {


pokemon: {

  id: defaultPokemon.id,

  name:
    defaultPokemon.name,

  sprite:
    defaultPokemon.sprite,

  types:
    defaultPokemon.types || []

},

    varieties,

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

    useMove:
      details.move?.name ||
      null,

    requiredMoveUses:
      details.required_move_uses ||
      details.move_uses ||
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
