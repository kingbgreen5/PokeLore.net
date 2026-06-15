const fs = require("fs");

async function fetchEvolutionChains() {
  const evolutions = {};

  // Current National Dex size
  const MAX_POKEMON = 1025;

  for (let id = 1; id <= MAX_POKEMON; id++) {
    try {
      console.log(`Loading Pokémon ${id}...`);

      //-----------------------------------------
      // Species
      //-----------------------------------------

      const speciesResponse =
        await fetch(
          `https://pokeapi.co/api/v2/pokemon-species/${id}`
        );

      const species =
        await speciesResponse.json();

      //-----------------------------------------
      // Evolution Chain
      //-----------------------------------------

      const chainResponse =
        await fetch(
          species.evolution_chain.url
        );

      const chainData =
        await chainResponse.json();

      //-----------------------------------------
      // Parse Chain
      //-----------------------------------------

      const chain = [];

      function walkChain(node) {

       const speciesId = Number(
  node.species.url
    .split("/")
    .filter(Boolean)
    .pop()
);

chain.push({
  id: speciesId,

  name: node.species.name,

  trigger:
    node.evolution_details?.[0]
      ?.trigger?.name || null,

  level:
    node.evolution_details?.[0]
      ?.min_level || null,

  item:
    node.evolution_details?.[0]
      ?.item?.name || null,

  friendship:
    node.evolution_details?.[0]
      ?.min_happiness || null
});

        node.evolves_to.forEach(
          child =>
            walkChain(child)
        );
      }

      walkChain(
        chainData.chain
      );

      evolutions[id] = {
        chain
      };

    } catch (error) {
      console.error(
        `Failed Pokémon ${id}`,
        error
      );
    }
  }

  fs.writeFileSync(
    "./public/data/evolutions.json",
    JSON.stringify(
      evolutions,
      null,
      2
    )
  );

  console.log(
    "Evolution file complete!"
  );
}

fetchEvolutionChains();