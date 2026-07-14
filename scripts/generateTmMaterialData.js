import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatPokemonDisplayName } from "../src/utils/pokemonNames.js";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const ITEMS_DIR = path.join(DATA_DIR, "items");
const POKEMON_DIR = path.join(DATA_DIR, "pokemonData");
const EVOLUTION_CHAINS_DIR = path.join(
  DATA_DIR,
  "evolutionChains"
);
const OUTPUT_FILE = path.join(
  DATA_DIR,
  "tmMaterialDetails.json"
);

const TM_MATERIAL_CATEGORY = "tm-materials";
const DEFAULT_EFFECT =
  "Material accidentally dropped by a Pokemon. It can be used to make TMs.";

function isCosmeticPokemon(name) {
  return (
    name.includes("-mega") ||
    name.includes("-gmax") ||
    name.includes("-totem") ||
    name.includes("-cap")
  );
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, data) {
  await fs.writeFile(
    filePath,
    `${JSON.stringify(data, null, 2)}\n`
  );
}

async function readJsonFiles(directory) {
  const files = (
    await fs.readdir(directory)
  )
    .filter(file => file.endsWith(".json"))
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true
      })
    );

  return Promise.all(
    files.map(file =>
      readJson(path.join(directory, file))
    )
  );
}

function formatList(values) {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} or ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, or ${
    values[values.length - 1]
  }`;
}

function toPokemonSummary(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    displayName: formatPokemonDisplayName(pokemon),
    sprite: pokemon.sprite ?? null,
    types: pokemon.types ?? []
  };
}

function collectChainPokemon(node, pokemonByName, output) {
  if (!node) {
    return;
  }

  const candidates = [
    node.pokemon,
    ...(node.varieties ?? [])
  ];

  for (const candidate of candidates) {
    const pokemon =
      pokemonByName.get(candidate?.name) ??
      candidate;

    if (
      !pokemon?.id ||
      !pokemon?.name ||
      isCosmeticPokemon(pokemon.name) ||
      output.has(pokemon.id)
    ) {
      continue;
    }

    output.set(
      pokemon.id,
      toPokemonSummary(pokemon)
    );
  }

  for (const child of node.evolvesTo ?? []) {
    collectChainPokemon(
      child,
      pokemonByName,
      output
    );
  }
}

function findMaterialPokemon(itemName, pokemonNames) {
  return pokemonNames.find(
    name =>
      itemName === name ||
      itemName.startsWith(`${name}-`)
  );
}

function buildAcquisition({
  displayName,
  relatedPokemon
}) {
  const pokemonNames = relatedPokemon.map(
    pokemon => pokemon.displayName
  );
  const familyList =
    formatList(pokemonNames);

  return [
    {
      generation: 9,
      games: [
        "Pokemon Scarlet",
        "Pokemon Violet"
      ],
      location: "Wild Pokemon",
      method: `Defeat or capture ${familyList} in the wild to receive ${displayName}. TM Material drops are based on the Pokemon's evolutionary line.`,
      acquisitionType: "drop",
      repeatable: true,
      versionExclusive: false,
      requirements: [
        "Find the matching Pokemon or its evolutionary relatives in the wild"
      ],
      relatedPokemon
    }
  ];
}

async function main() {
  const [
    items,
    pokemonRecords
  ] = await Promise.all([
    readJsonFiles(ITEMS_DIR),
    readJsonFiles(POKEMON_DIR)
  ]);

  const pokemonByName = new Map(
    pokemonRecords.map(pokemon => [
      pokemon.name,
      pokemon
    ])
  );
  const pokemonBySpecies = new Map();

  for (const pokemon of pokemonRecords) {
    if (
      !pokemon.species ||
      pokemonBySpecies.has(pokemon.species)
    ) {
      continue;
    }

    pokemonBySpecies.set(
      pokemon.species,
      pokemon
    );
  }
  const pokemonNames = [
    ...new Set(
      pokemonRecords.flatMap(pokemon => [
        pokemon.name,
        pokemon.species
      ])
    )
  ]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const materials = {};
  const unmatched = [];

  for (const item of items) {
    if (
      item.category?.name !== TM_MATERIAL_CATEGORY
    ) {
      continue;
    }

    const pokemonName = findMaterialPokemon(
      item.name,
      pokemonNames
    );
    const matchedPokemon =
      pokemonByName.get(pokemonName) ??
      pokemonBySpecies.get(pokemonName);

    if (!matchedPokemon) {
      unmatched.push(item.name);
      continue;
    }

    const relatedPokemonById = new Map();

    if (matchedPokemon.evolutionChainId) {
      const chainPath = path.join(
        EVOLUTION_CHAINS_DIR,
        `${matchedPokemon.evolutionChainId}.json`
      );
      const chain = await readJson(chainPath);

      collectChainPokemon(
        chain.root,
        pokemonByName,
        relatedPokemonById
      );
    }

    if (relatedPokemonById.size === 0) {
      relatedPokemonById.set(
        matchedPokemon.id,
        toPokemonSummary(matchedPokemon)
      );
    }

    const relatedPokemon = [
      ...relatedPokemonById.values()
    ].sort((a, b) => a.id - b.id);
    const sourcePokemon =
      toPokemonSummary(matchedPokemon);
    const familyList = formatList(
      relatedPokemon.map(
        pokemon => pokemon.displayName
      )
    );

    materials[item.name] = {
      item: item.name,
      displayName: item.displayName,
      category: TM_MATERIAL_CATEGORY,
      effect: DEFAULT_EFFECT,
      shortEffect: `${item.displayName} is a TM crafting material dropped by ${familyList}.`,
      sourcePokemon,
      relatedPokemon,
      acquisition: buildAcquisition({
        displayName: item.displayName,
        relatedPokemon
      }),
      usedFor: []
    };
  }

  if (unmatched.length > 0) {
    throw new Error(
      `Could not match ${unmatched.length} TM materials: ${unmatched.join(", ")}`
    );
  }

  await writeJson(OUTPUT_FILE, {
    schemaVersion: 1,
    description:
      "Generated baseline data for Pokemon Scarlet/Violet TM Materials. Recipes can be added to usedFor when curated recipe data is available.",
    effect: DEFAULT_EFFECT,
    materials
  });

  console.log(
    `Generated ${Object.keys(materials).length} TM material records at ${OUTPUT_FILE}`
  );
}

main().catch(error => {
  console.error(
    "Generating TM material data failed:",
    error
  );
  process.exitCode = 1;
});
