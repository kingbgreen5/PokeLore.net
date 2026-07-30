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
const pokemonStatsCsvUrl =
  "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_stats.csv";

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const isDryRun =
  args.has("--dry-run") || !shouldWrite;

const statKeyMap = {
  hp: "hp",
  attack: "attack",
  defense: "defense",
  "special-attack": "specialAttack",
  "special-defense": "specialDefense",
  speed: "speed"
};

async function fetchPokemonStatsCsv() {
  const response = await fetch(
    pokemonStatsCsvUrl
  );

  if (!response.ok) {
    throw new Error(
      `PokeAPI CSV returned ${response.status}`
    );
  }

  return response.text();
}

function createEmptyEvYield() {
  return {
    hp: 0,
    attack: 0,
    defense: 0,
    specialAttack: 0,
    specialDefense: 0,
    speed: 0
  };
}

function parsePokemonStatsCsv(csvText) {
  const evYieldsByPokemonId = new Map();
  const lines = csvText
    .trim()
    .split(/\r?\n/);

  for (const line of lines.slice(1)) {
    const [
      pokemonId,
      statId,
      ,
      effort
    ] = line.split(",");
    const statName = Object.keys(
      statKeyMap
    )[Number(statId) - 1];
    const statKey =
      statKeyMap[statName];

    if (!statKey) {
      continue;
    }

    if (
      !evYieldsByPokemonId.has(pokemonId)
    ) {
      evYieldsByPokemonId.set(
        pokemonId,
        createEmptyEvYield()
      );
    }

    evYieldsByPokemonId.get(
      pokemonId
    )[statKey] = Number(
      effort ?? 0
    );
  }

  return evYieldsByPokemonId;
}

function evYieldsMatch(current, next) {
  return (
    JSON.stringify(current) ===
    JSON.stringify(next)
  );
}

async function updatePokemonEvYields() {
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
      ? "Running EV yield update in dry-run mode."
      : "Running EV yield update in write mode."
  );

  const evYieldsByPokemonId =
    parsePokemonStatsCsv(
      await fetchPokemonStatsCsv()
    );

  for (const fileName of files) {
    const filePath =
      path.join(pokemonDataDir, fileName);

    try {
      const pokemon = JSON.parse(
        await fs.readFile(filePath, "utf8")
      );

      if (!pokemon?.id) {
        throw new Error(
          "Pokemon file is missing id"
        );
      }

      const nextEvYield =
        evYieldsByPokemonId.get(
          String(pokemon.id)
        );

      if (!nextEvYield) {
        throw new Error(
          `Missing EV yield data for Pokemon ${pokemon.id}`
        );
      }

      summary.checked += 1;

      if (
        evYieldsMatch(
          pokemon.evYield,
          nextEvYield
        )
      ) {
        summary.unchanged += 1;
        continue;
      }

      summary.changed += 1;

      console.log(
        `#${pokemon.id} ${pokemon.name}: ${JSON.stringify(
          pokemon.evYield ?? null
        )} -> ${JSON.stringify(nextEvYield)}`
      );

      if (!isDryRun) {
        pokemon.evYield = nextEvYield;
        await fs.writeFile(
          filePath,
          `${JSON.stringify(pokemon, null, 2)}\n`
        );
        summary.written += 1;
      }
    } catch (error) {
      summary.failed += 1;
      failures.push(
        `${fileName}: ${error.message}`
      );
      console.error(
        `Failed ${fileName}: ${error.message}`
      );
    }
  }

  console.log(
    JSON.stringify(summary, null, 2)
  );

  if (failures.length) {
    process.exitCode = 1;
  }
}

updatePokemonEvYields().catch(error => {
  console.error(
    "Failed to update Pokemon EV yields:",
    error
  );
  process.exitCode = 1;
});
