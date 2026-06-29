import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const pokemonDataDir = path.join(dataDir, "pokemonData");
const outputPath = path.join(dataDir, "pokemonRoutes.json");

async function readPokemonFiles() {
  const files = (
    await fs.readdir(pokemonDataDir)
  )
    .filter(file => file.endsWith(".json"))
    .sort(
      (first, second) =>
        Number.parseInt(first, 10) -
        Number.parseInt(second, 10)
    );

  return Promise.all(
    files.map(async file => {
      const filePath = path.join(
        pokemonDataDir,
        file
      );
      const pokemon = JSON.parse(
        await fs.readFile(filePath, "utf8")
      );

      return {
        file,
        id: pokemon.id,
        name: pokemon.name
      };
    })
  );
}

function validatePokemonRouteEntry(entry) {
  if (!Number.isInteger(entry.id)) {
    throw new Error(
      `${entry.file} is missing a numeric id`
    );
  }

  if (
    typeof entry.name !== "string" ||
    !entry.name.trim()
  ) {
    throw new Error(
      `${entry.file} is missing a name`
    );
  }
}

async function generatePokemonRoutes() {
  await fs.mkdir(dataDir, {
    recursive: true
  });

  const entries = await readPokemonFiles();
  const byId = {};
  const byName = {};
  const conflicts = [];

  entries.forEach(entry => {
    validatePokemonRouteEntry(entry);

    const id = String(entry.id);
    const name = entry.name
      .trim()
      .toLowerCase();

    if (byId[id] && byId[id] !== name) {
      conflicts.push(
        `Duplicate id ${id}: ${byId[id]} and ${name}`
      );
    }

    if (
      byName[name] &&
      byName[name] !== entry.id
    ) {
      conflicts.push(
        `Duplicate name ${name}: ${byName[name]} and ${entry.id}`
      );
    }

    byId[id] = name;
    byName[name] = entry.id;
  });

  if (conflicts.length) {
    console.error(
      "Pokemon route conflicts found:"
    );
    conflicts.forEach(conflict =>
      console.error(`- ${conflict}`)
    );
    throw new Error(
      "Cannot generate pokemonRoutes.json with duplicate ids or names"
    );
  }

  const sortedById = Object.fromEntries(
    Object.entries(byId).sort(
      ([first], [second]) =>
        Number(first) - Number(second)
    )
  );
  const sortedByName = Object.fromEntries(
    Object.entries(byName).sort(
      ([first], [second]) =>
        first.localeCompare(second)
    )
  );

  await fs.writeFile(
    outputPath,
    `${JSON.stringify(
      {
        byId: sortedById,
        byName: sortedByName
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `Generated ${entries.length} Pokemon route entries at ${outputPath}`
  );
}

generatePokemonRoutes().catch(error => {
  console.error(
    "Failed to generate Pokemon routes:",
    error
  );
  process.exitCode = 1;
});
