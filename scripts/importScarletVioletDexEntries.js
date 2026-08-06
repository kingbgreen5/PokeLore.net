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
const DEX_ENTRIES_PATH = path.join(
  DATA_DIR,
  "dexEntries.json"
);
const CONDENSED_ENTRIES_PATH = path.join(
  DATA_DIR,
  "condensedEntries.json"
);

async function readJson(filePath) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

async function writeJsonIfChanged(filePath, data) {
  const next = `${JSON.stringify(data, null, 2)}\n`;
  let current = null;

  try {
    current = await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  if (next === current) {
    return false;
  }

  await fs.writeFile(filePath, next);
  return true;
}

function normalizeSourceEntry(entry) {
  return {
    version: String(entry.version ?? "").trim(),
    text: normalizeFlavorText(entry.text)
  };
}

function condenseEntries(entries) {
  const grouped = new Map();

  for (const entry of entries) {
    if (!entry.text || !entry.version) {
      continue;
    }

    if (!grouped.has(entry.text)) {
      grouped.set(entry.text, {
        versions: [],
        text: entry.text
      });
    }

    const group = grouped.get(entry.text);

    if (!group.versions.includes(entry.version)) {
      group.versions.push(entry.version);
    }
  }

  return Array.from(grouped.values());
}

function mergeCondensedEntries(
  existingEntries,
  sourceEntries
) {
  const sourceVersions = new Set(
    sourceEntries.map(entry => entry.version)
  );
  const flattenedEntries = [];

  for (const entry of existingEntries ?? []) {
    for (const version of entry.versions ?? []) {
      if (sourceVersions.has(version)) {
        continue;
      }

      flattenedEntries.push({
        version,
        text: entry.text
      });
    }
  }

  flattenedEntries.push(...sourceEntries);

  return condenseEntries(flattenedEntries);
}

function mergeDexEntries(
  dexEntries,
  pokemonName,
  sourceEntries
) {
  const sourceByVersion = new Map(
    sourceEntries.map(entry => [
      entry.version,
      entry.text
    ])
  );
  const seenVersions = new Set();
  const nextEntries = dexEntries.map(entry => {
    if (entry.pokemon !== pokemonName) {
      return entry;
    }

    if (!sourceByVersion.has(entry.version)) {
      return entry;
    }

    seenVersions.add(entry.version);
    return {
      ...entry,
      text: sourceByVersion.get(entry.version)
    };
  });

  for (const entry of sourceEntries) {
    if (seenVersions.has(entry.version)) {
      continue;
    }

    nextEntries.push({
      pokemon: pokemonName,
      version: entry.version,
      text: entry.text
    });
  }

  return nextEntries;
}

function mergeCondensedTopLevelEntries(
  condensedEntries,
  pokemonName,
  sourceEntries
) {
  const sourceVersions = new Set(
    sourceEntries.map(entry => entry.version)
  );
  const pokemonEntries = [];
  let insertedPokemonEntries = false;
  let foundPokemonEntries = false;

  for (const entry of condensedEntries) {
    if (entry.pokemon === pokemonName) {
      foundPokemonEntries = true;

      for (const version of entry.versions ?? []) {
        if (sourceVersions.has(version)) {
          continue;
        }

        pokemonEntries.push({
          version,
          text: entry.text
        });
      }
    }
  }

  pokemonEntries.push(...sourceEntries);
  const nextPokemonEntries = condenseEntries(
    pokemonEntries
  ).map(entry => ({
    pokemon: pokemonName,
    ...entry
  }));
  const nextEntries = [];

  for (const entry of condensedEntries) {
    if (entry.pokemon !== pokemonName) {
      nextEntries.push(entry);
      continue;
    }

    if (insertedPokemonEntries) {
      continue;
    }

    nextEntries.push(...nextPokemonEntries);
    insertedPokemonEntries = true;
  }

  if (!foundPokemonEntries) {
    nextEntries.push(...nextPokemonEntries);
  }

  return nextEntries;
}

async function main() {
  const sourcePath = process.argv[2];

  if (!sourcePath) {
    throw new Error(
      "Usage: node scripts/importScarletVioletDexEntries.js <scarlet-violet-entries.json>"
    );
  }

  const source = await readJson(sourcePath);

  if (!Array.isArray(source.pokemon)) {
    throw new Error(
      "Expected source JSON to contain a pokemon array."
    );
  }

  let dexEntries = await readJson(DEX_ENTRIES_PATH);
  let condensedEntries = await readJson(
    CONDENSED_ENTRIES_PATH
  );
  let detailFilesChanged = 0;
  let pokemonProcessed = 0;
  let sourceEntriesProcessed = 0;

  for (const sourcePokemon of source.pokemon) {
    const nationalDex = Number(
      sourcePokemon.nationalDex
    );
    const sourceEntries = (
      sourcePokemon.entries ?? []
    )
      .filter(entry => entry.language === "en")
      .map(normalizeSourceEntry)
      .filter(entry => entry.version && entry.text);

    if (!nationalDex || sourceEntries.length === 0) {
      continue;
    }

    const pokemonDataPath = path.join(
      POKEMON_DATA_DIR,
      `${nationalDex}.json`
    );
    const pokemonData = await readJson(
      pokemonDataPath
    );
    const pokemonName =
      pokemonData.species ?? pokemonData.name;
    const nextPokemonData = {
      ...pokemonData,
      dexEntries: mergeCondensedEntries(
        pokemonData.dexEntries ?? [],
        sourceEntries
      )
    };

    if (
      await writeJsonIfChanged(
        pokemonDataPath,
        nextPokemonData
      )
    ) {
      detailFilesChanged += 1;
    }

    dexEntries = mergeDexEntries(
      dexEntries,
      pokemonName,
      sourceEntries
    );
    condensedEntries =
      mergeCondensedTopLevelEntries(
        condensedEntries,
        pokemonName,
        sourceEntries
      );

    pokemonProcessed += 1;
    sourceEntriesProcessed += sourceEntries.length;
  }

  const dexEntriesChanged =
    await writeJsonIfChanged(
      DEX_ENTRIES_PATH,
      dexEntries
    );
  const condensedEntriesChanged =
    await writeJsonIfChanged(
      CONDENSED_ENTRIES_PATH,
      condensedEntries
    );

  console.log(
    JSON.stringify(
      {
        pokemonProcessed,
        sourceEntriesProcessed,
        detailFilesChanged,
        dexEntriesChanged,
        condensedEntriesChanged
      },
      null,
      2
    )
  );
}

main().catch(error => {
  console.error(
    "Importing Scarlet/Violet Pokédex entries failed:",
    error
  );
  process.exitCode = 1;
});
