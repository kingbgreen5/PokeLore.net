import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const pokemonIndexPath = path.join(
  dataDir,
  "pokemonIndex.json"
);
const pokemonDataDir = path.join(
  dataDir,
  "pokemonData"
);

function getBaseStatTotal(stats) {
  return Object.values(stats ?? {}).reduce(
    (total, value) =>
      total + Number(value ?? 0),
    0
  );
}

async function enrichPokemonIndexStats() {
  const pokemonIndex = JSON.parse(
    await fs.readFile(
      pokemonIndexPath,
      "utf8"
    )
  );
  const failures = [];

  const enrichedIndex = await Promise.all(
    pokemonIndex.map(async pokemon => {
      try {
        const detailPath = path.join(
          pokemonDataDir,
          `${pokemon.id}.json`
        );
        const details = JSON.parse(
          await fs.readFile(
            detailPath,
            "utf8"
          )
        );

        if (!details.stats) {
          throw new Error(
            "Missing stats in pokemonData file"
          );
        }

        return {
          ...pokemon,
          stats: details.stats,
          baseStatTotal:
            getBaseStatTotal(details.stats)
        };
      } catch (error) {
        failures.push({
          id: pokemon.id,
          name: pokemon.name,
          error: error.message
        });

        return pokemon;
      }
    })
  );

  await fs.writeFile(
    pokemonIndexPath,
    `${JSON.stringify(enrichedIndex, null, 2)}\n`,
    "utf8"
  );

  console.log(
    `Enriched ${enrichedIndex.length - failures.length} Pokémon index entries with stats.`
  );

  if (failures.length) {
    console.warn(
      `Skipped ${failures.length} entries:`
    );
    failures.forEach(failure => {
      console.warn(
        `- #${failure.id} ${failure.name}: ${failure.error}`
      );
    });
  }
}

enrichPokemonIndexStats().catch(error => {
  console.error(
    "Failed to enrich pokemonIndex stats:",
    error
  );
  process.exitCode = 1;
});
