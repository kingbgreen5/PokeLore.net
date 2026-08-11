import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const pokemonDataDir = path.join(
  rootDir,
  "public",
  "data",
  "pokemonData"
);

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const isDryRun =
  args.has("--dry-run") || !shouldWrite;

function formatAbilityName(name) {
  return String(name)
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function abilityListsMatch(
  currentAbilities,
  nextAbilities
) {
  return (
    JSON.stringify(currentAbilities) ===
    JSON.stringify(nextAbilities)
  );
}

async function fetchPokemon(id) {
  const response = await fetch(
    `https://pokeapi.co/api/v2/pokemon/${id}`
  );

  if (!response.ok) {
    throw new Error(
      `PokéAPI returned ${response.status}`
    );
  }

  return response.json();
}

function getUpdatedAbilities(pokeApiPokemon) {
  if (!Array.isArray(pokeApiPokemon.abilities)) {
    throw new Error(
      "PokéAPI response is missing abilities"
    );
  }

  return [...pokeApiPokemon.abilities]
    .sort(
      (first, second) =>
        first.slot - second.slot
    )
    .map(ability => {
      if (!ability.ability?.name) {
        throw new Error(
          "PokéAPI ability entry is missing a name"
        );
      }

      return {
        name: formatAbilityName(
          ability.ability.name
        ),
        // Hidden Ability status must come from PokéAPI's
        // is_hidden boolean. Do not infer it from list position.
        hidden: Boolean(ability.is_hidden),
        slot: ability.slot
      };
    });
}

async function readPokemonFile(fileName) {
  const filePath = path.join(
    pokemonDataDir,
    fileName
  );
  const rawContent = await fs.readFile(
    filePath,
    "utf8"
  );

  return {
    filePath,
    pokemon: JSON.parse(rawContent)
  };
}

async function writePokemonFile(
  filePath,
  pokemon
) {
  await fs.writeFile(
    filePath,
    `${JSON.stringify(pokemon, null, 2)}\n`
  );
}

async function updatePokemonAbilities() {
  const files = (
    await fs.readdir(pokemonDataDir)
  )
    .filter(file => file.endsWith(".json"))
    .sort(
      (first, second) =>
        Number.parseInt(first, 10) -
        Number.parseInt(second, 10)
    );

  const summary = {
    checked: 0,
    changed: 0,
    written: 0,
    unchanged: 0,
    failed: 0
  };
  const failures = [];

  console.log(
    isDryRun
      ? "Running ability update in dry-run mode."
      : "Running ability update in write mode."
  );

  for (const fileName of files) {
    let id = path.basename(
      fileName,
      ".json"
    );

    try {
      const fileData =
        await readPokemonFile(fileName);
      const filePath = fileData.filePath;
      const pokemon = fileData.pokemon;
      id = pokemon.id ?? id;

      if (!pokemon?.id) {
        throw new Error(
          "Pokémon file is missing id"
        );
      }

      const pokeApiPokemon =
        await fetchPokemon(pokemon.id);
      const nextAbilities =
        getUpdatedAbilities(
          pokeApiPokemon
        );

      summary.checked += 1;

      if (
        abilityListsMatch(
          pokemon.abilities,
          nextAbilities
        )
      ) {
        summary.unchanged += 1;
        continue;
      }

      summary.changed += 1;

      console.log(
        `#${pokemon.id} ${pokemon.name}: ${JSON.stringify(
          pokemon.abilities
        )} -> ${JSON.stringify(
          nextAbilities
        )}`
      );

      if (!isDryRun) {
        pokemon.abilities = nextAbilities;
        await writePokemonFile(
          filePath,
          pokemon
        );
        summary.written += 1;
      }
    } catch (error) {
      summary.failed += 1;
      failures.push({
        id,
        fileName,
        error: error.message
      });

      console.error(
        `Skipping ${fileName} (${id}): ${error.message}`
      );
    }
  }

  console.log("\nAbility update summary:");
  console.log(
    `Checked: ${summary.checked}`
  );
  console.log(
    `Changed: ${summary.changed}`
  );
  console.log(
    `Written: ${summary.written}`
  );
  console.log(
    `Unchanged: ${summary.unchanged}`
  );
  console.log(
    `Failed: ${summary.failed}`
  );

  if (failures.length) {
    console.log("\nFailures:");
    failures.forEach(failure => {
      console.log(
        `- ${failure.fileName} (${failure.id}): ${failure.error}`
      );
    });
  }

  if (isDryRun) {
    console.log(
      "\nNo files were written. Run with --write to apply changes."
    );
  }
}

updatePokemonAbilities().catch(error => {
  console.error(
    "Ability update failed:",
    error
  );
  process.exitCode = 1;
});
