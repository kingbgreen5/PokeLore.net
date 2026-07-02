import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename =
  fileURLToPath(import.meta.url);
const __dirname =
  path.dirname(__filename);
const rootDir =
  path.resolve(__dirname, "..");
const dataDir =
  path.join(rootDir, "public", "data");
const itemsDir =
  path.join(dataDir, "items");
const outputDir =
  path.join(dataDir, "pokemonHeldItems");

async function readJson(filePath) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

async function writeJson(filePath, data) {
  await fs.writeFile(
    filePath,
    `${JSON.stringify(data, null, 2)}\n`
  );
}

function addHeldItem(
  pokemonHeldItems,
  item,
  heldEntry
) {
  if (!heldEntry.pokemonId) {
    return;
  }

  const pokemonId =
    String(heldEntry.pokemonId);

  if (!pokemonHeldItems.has(pokemonId)) {
    pokemonHeldItems.set(pokemonId, {
      pokemon: {
        id: heldEntry.pokemonId,
        name: heldEntry.pokemon
      },
      heldItems: []
    });
  }

  pokemonHeldItems
    .get(pokemonId)
    .heldItems.push({
      item: {
        id: item.id,
        name: item.name,
        displayName:
          item.displayName,
        sprite: item.sprite
      },
      versionDetails:
        heldEntry.versionDetails ?? []
    });
}

async function main() {
  const pokemonHeldItems = new Map();
  const files =
    await fs.readdir(itemsDir);

  for (const file of files.filter(file =>
    file.endsWith(".json")
  )) {
    try {
      const item =
        await readJson(
          path.join(itemsDir, file)
        );

      if (!item?.heldByPokemon?.length) {
        continue;
      }

      item.heldByPokemon.forEach(
        heldEntry =>
          addHeldItem(
            pokemonHeldItems,
            item,
            heldEntry
          )
      );
    } catch (error) {
      console.warn(
        `Skipping ${file}: ${error.message}`
      );
    }
  }

  await fs.rm(outputDir, {
    recursive: true,
    force: true
  });
  await fs.mkdir(outputDir, {
    recursive: true
  });

  const records = Array.from(
    pokemonHeldItems.values()
  ).sort(
    (a, b) => a.pokemon.id - b.pokemon.id
  );

  for (const record of records) {
    record.heldItems.sort((a, b) =>
      a.item.displayName.localeCompare(
        b.item.displayName
      )
    );

    await writeJson(
      path.join(
        outputDir,
        `${record.pokemon.id}.json`
      ),
      record
    );
  }

  console.log(
    `Generated held item files for ${records.length} Pokémon.`
  );
}

main().catch(error => {
  console.error(
    "Generating Pokémon held items failed:",
    error
  );
  process.exit(1);
});
