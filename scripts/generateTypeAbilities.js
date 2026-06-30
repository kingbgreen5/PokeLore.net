import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const POKEMON_DATA_DIR = path.join(
  DATA_DIR,
  "pokemonData"
);
const OUTPUT_FILE = path.join(
  DATA_DIR,
  "typeAbilities.json"
);

function slugify(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function displayNameFromSlug(slug) {
  return String(slug ?? "")
    .split("-")
    .map(
      (word, index) =>
        index > 0 &&
        ["of", "and", "or"].includes(word)
          ? word
          :
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

async function readJson(filePath) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

function normalizeAbility(ability) {
  if (typeof ability === "string") {
    return {
      name: slugify(ability),
      displayName: ability,
      hidden: false,
      slot: null
    };
  }

  const displayName =
    ability.displayName ??
    ability.name ??
    "";

  return {
    name:
      ability.slug ??
      slugify(displayName),
    displayName:
      displayNameFromSlug(
        slugify(displayName)
      ),
    hidden: Boolean(ability.hidden),
    slot: ability.slot ?? null
  };
}

function serializeAbility({
  abilitySlug,
  abilityDetails,
  pokemon
}) {
  const sortedPokemon = pokemon.sort(
    (a, b) => a.id - b.id
  );

  return {
    name: abilitySlug,
    displayName:
      displayNameFromSlug(abilitySlug),
    shortEffect:
      abilityDetails?.shortEffect ?? null,
    generation:
      abilityDetails?.generation ?? null,
    pokemonCount: sortedPokemon.length,
    hiddenPokemonCount:
      sortedPokemon.filter(
        entry => entry.hidden
      ).length,
    pokemon: sortedPokemon
  };
}

async function main() {
  const [
    pokemonIndex,
    abilities
  ] = await Promise.all([
    readJson(
      path.join(DATA_DIR, "pokemonIndex.json")
    ),
    readJson(
      path.join(DATA_DIR, "abilities.json")
    )
  ]);

  const typeAbilityMap = new Map();

  for (const pokemon of pokemonIndex) {
    const pokemonData = await readJson(
      path.join(
        POKEMON_DATA_DIR,
        `${pokemon.id}.json`
      )
    );

    for (const ability of pokemonData.abilities ?? []) {
      const normalized =
        normalizeAbility(ability);

      for (const type of pokemon.types ?? []) {
        if (!typeAbilityMap.has(type)) {
          typeAbilityMap.set(type, new Map());
        }

        const abilityMap =
          typeAbilityMap.get(type);

        if (
          !abilityMap.has(normalized.name)
        ) {
          abilityMap.set(normalized.name, []);
        }

        abilityMap
          .get(normalized.name)
          .push({
            id: pokemon.id,
            name: pokemon.name,
            sprite: pokemon.sprite,
            types: pokemon.types,
            hidden: normalized.hidden
          });
      }
    }
  }

  const output = {};

  for (const [
    type,
    abilityMap
  ] of typeAbilityMap) {
    output[type] = [...abilityMap.entries()]
      .map(([abilitySlug, pokemon]) =>
        serializeAbility({
          abilitySlug,
          abilityDetails:
            abilities[abilitySlug],
          pokemon
        })
      )
      .sort((a, b) =>
        a.displayName.localeCompare(
          b.displayName
        )
      );
  }

  await fs.writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(output, null, 2)}\n`
  );

  console.log(
    `Generated type abilities for ${Object.keys(output).length} types at ${OUTPUT_FILE}`
  );
}

main().catch(error => {
  console.error(
    "Generating type abilities failed:",
    error
  );
  process.exitCode = 1;
});
