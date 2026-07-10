import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeFlavorText } from "../src/utils/normalizeText.js";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const POKEMON_DATA_DIR = path.join(
  DATA_DIR,
  "pokemonData"
);
const MOVES_DIR = path.join(DATA_DIR, "moves");

async function readJson(filePath) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

async function writeJsonIfChanged(filePath, data) {
  const next = `${JSON.stringify(data, null, 2)}\n`;
  const current = await fs.readFile(
    filePath,
    "utf8"
  );

  if (next === current) {
    return false;
  }

  await fs.writeFile(filePath, next);
  return true;
}

function normalizeEntryList(entries) {
  let changed = false;
  const normalizedEntries = entries.map(entry => {
    if (typeof entry?.text !== "string") {
      return entry;
    }

    const text = normalizeFlavorText(entry.text);

    if (text === entry.text) {
      return entry;
    }

    changed = true;
    return {
      ...entry,
      text
    };
  });

  return {
    changed,
    entries: normalizedEntries
  };
}

function normalizeNestedText(value) {
  if (typeof value === "string") {
    return normalizeFlavorText(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeNestedText);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        normalizeNestedText(entry)
      ])
    );
  }

  return value;
}

async function normalizeTopLevelEntries(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const data = await readJson(filePath);
  const result = normalizeEntryList(data);

  if (!result.changed) {
    return false;
  }

  await writeJsonIfChanged(filePath, result.entries);
  return true;
}

async function normalizePokemonDataFiles() {
  const files = (
    await fs.readdir(POKEMON_DATA_DIR)
  ).filter(file => file.endsWith(".json"));
  let changedCount = 0;

  for (const file of files) {
    const filePath = path.join(
      POKEMON_DATA_DIR,
      file
    );
    const data = await readJson(filePath);

    if (!Array.isArray(data.dexEntries)) {
      continue;
    }

    const result = normalizeEntryList(
      data.dexEntries
    );

    if (!result.changed) {
      continue;
    }

    await writeJsonIfChanged(filePath, {
      ...data,
      dexEntries: result.entries
    });
    changedCount += 1;
  }

  return changedCount;
}

async function normalizePokedexTopics() {
  const filePath = path.join(
    DATA_DIR,
    "pokedexTopics.json"
  );
  const data = await readJson(filePath);
  const normalized = normalizeNestedText(data);

  return writeJsonIfChanged(filePath, normalized);
}

async function normalizeJsonFile(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  const data = await readJson(filePath);
  const normalized = normalizeNestedText(data);

  return writeJsonIfChanged(filePath, normalized);
}

async function normalizeJsonDirectory(dirPath) {
  const files = (
    await fs.readdir(dirPath)
  ).filter(file => file.endsWith(".json"));
  let changedCount = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const data = await readJson(filePath);
    const normalized = normalizeNestedText(data);

    if (
      await writeJsonIfChanged(
        filePath,
        normalized
      )
    ) {
      changedCount += 1;
    }
  }

  return changedCount;
}

async function main() {
  const changed = {
    dexEntries: await normalizeTopLevelEntries(
      "dexEntries.json"
    ),
    condensedEntries:
      await normalizeTopLevelEntries(
        "condensedEntries.json"
      ),
    pokemonData:
      await normalizePokemonDataFiles(),
    pokedexTopics: await normalizePokedexTopics(),
    abilities: await normalizeJsonFile(
      "abilities.json"
    ),
    typeAbilities: await normalizeJsonFile(
      "typeAbilities.json"
    ),
    moves: await normalizeJsonDirectory(
      MOVES_DIR
    )
  };

  console.log(
    "Normalized Pokédex entry text:",
    changed
  );
}

main().catch(error => {
  console.error(
    "Normalizing Pokédex entries failed:",
    error
  );
  process.exitCode = 1;
});
