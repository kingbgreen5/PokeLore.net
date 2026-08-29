import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatPokemonDisplayName } from "../src/utils/pokemonNames.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_ANALYSIS_PATH = path.join(
  repoRoot,
  "public",
  "data",
  "PokeloreAnalysis.json"
);
const DEFAULT_POKEMON_DATA_DIR = path.join(
  repoRoot,
  "public",
  "data",
  "pokemonData"
);
const DEFAULT_EVOLUTION_CHAINS_DIR = path.join(
  repoRoot,
  "public",
  "data",
  "evolutionChains"
);

const STAT_KEYS = [
  "hp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed"
];

const GENERATION_LABELS = {
  "generation-i": "Generation I",
  "generation-ii": "Generation II",
  "generation-iii": "Generation III",
  "generation-iv": "Generation IV",
  "generation-v": "Generation V",
  "generation-vi": "Generation VI",
  "generation-vii": "Generation VII",
  "generation-viii": "Generation VIII",
  "generation-ix": "Generation IX"
};

const DEFAULT_FORM_LABELS = new Set([
  "base",
  "standard",
  "default",
  "alolan",
  "kantonian",
  "johtonian",
  "hoennian",
  "sinnohan",
  "unovan",
  "kalosian"
]);

const FORM_ALIASES = new Map([
  ["10 forme", ["10"]],
  ["50 forme", ["50"]],
  ["active mode", ["standard"]],
  ["alolan", ["alola"]],
  ["amped form", ["standard", "amped"]],
  ["antique form", ["standard"]],
  ["baile style", ["baile"]],
  ["blade forme", ["blade"]],
  ["complete forme", ["complete"]],
  ["confined", ["standard"]],
  ["disguised form", ["disguised"]],
  ["dawn wings", ["dawn"]],
  ["dusk mane", ["dusk"]],
  ["eternal flower", ["eternal"]],
  ["gigantamax", ["gmax", "amped gmax"]],
  ["galarian", ["galar"]],
  ["gorging form", ["gorging"]],
  ["gulping form", ["gulping"]],
  ["gigantamax single strike style", ["single strike gmax"]],
  ["gigantamax rapid strike style", ["rapid strike gmax"]],
  ["hisuian", ["hisui"]],
  ["hero of many battles", ["standard"]],
  ["ice face", ["ice", "standard"]],
  ["ice rider", ["ice"]],
  ["incarnate forme", ["incarnate"]],
  ["low key form", ["low key"]],
  ["core form", ["red"]],
  ["meteor form", ["red meteor"]],
  ["crowned shield", ["crowned"]],
  ["crowned sword", ["crowned"]],
  ["neutral mode", ["standard"]],
  ["noice face", ["noice"]],
  ["pa u style", ["pau"]],
  ["paldean", ["paldea"]],
  ["phony form", ["standard"]],
  ["pom pom style", ["pom pom"]],
  ["shield forme", ["shield"]],
  ["sensu style", ["sensu"]],
  ["school form", ["school"]],
  ["busted form", ["busted"]],
  ["rapid strike style", ["rapid strike"]],
  ["full belly mode", ["full belly", "standard"]],
  ["hangry mode", ["hangry"]],
  ["shadow rider", ["shadow"]],
  ["single strike style", ["single strike", "standard"]],
  ["solo form", ["solo"]],
  ["therian forme", ["therian"]],
  ["zenith", ["standard"]],
  ["unovan standard", ["standard", "base"]],
  ["unovan zen", ["zen"]],
  ["galarian standard", ["galar standard", "galarian"]],
  ["galarian zen", ["galar zen"]]
]);

const REGIONAL_FORM_SUFFIXES = new Map([
  ["alolan", "-alola"],
  ["galarian", "-galar"],
  ["hisuian", "-hisui"],
  ["paldean", "-paldea"]
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizePokemonName(value) {
  return normalizeText(value)
    .replace(/-(alola|galar|hisui|paldea)$/, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeForm(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleCase(value) {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

export function calculateBaseStatTotal(pokemon) {
  if (!pokemon?.stats) {
    throw new Error(
      `Missing stats for ${pokemon?.name ?? "unknown Pokemon"}.`
    );
  }

  return STAT_KEYS.reduce((total, key) => {
    const value = Number(pokemon.stats[key]);

    if (!Number.isFinite(value)) {
      throw new Error(
        `Missing numeric ${key} stat for ${pokemon.name}.`
      );
    }

    return total + value;
  }, 0);
}

export function formatGeneration(generation) {
  const label = GENERATION_LABELS[generation];

  if (!label) {
    throw new Error(
      `Unsupported Pokemon generation "${generation}".`
    );
  }

  return label;
}

export function formatTypeLabel(types) {
  if (!Array.isArray(types) || types.length === 0) {
    throw new Error("Pokemon is missing types.");
  }

  return `${types.map(titleCase).join("/")}-type`;
}

function getTypeArticle(typeLabel) {
  return /^[aeiou]/i.test(typeLabel) ? "an" : "a";
}

export function classifyEvolutionStage({
  hasPreEvolution,
  hasStandardEvolution
}) {
  if (hasPreEvolution && hasStandardEvolution) {
    return "middle";
  }
  if (hasPreEvolution) {
    return "final";
  }
  if (hasStandardEvolution) {
    return "first";
  }
  return "single";
}

function walkEvolutionNode(
  node,
  visitor,
  parent = null
) {
  if (!node?.pokemon) return;

  visitor(node, parent);

  for (const child of node.evolvesTo ?? []) {
    walkEvolutionNode(child, visitor, node);
  }
}

export function buildEvolutionStageLookup(evolutionChains) {
  const byId = new Map();
  const bySpecies = new Map();

  for (const chain of evolutionChains) {
    walkEvolutionNode(chain.root, (node, parent) => {
      const stage = classifyEvolutionStage({
        hasPreEvolution: Boolean(parent),
        hasStandardEvolution:
          Array.isArray(node.evolvesTo) &&
          node.evolvesTo.length > 0
      });
      const id = Number(node.pokemon.id);
      const speciesKey = normalizePokemonName(
        node.pokemon.name
      );
      const record = {
        stage,
        chainId: chain.chainId,
        pokemonId: id,
        speciesKey
      };

      byId.set(id, record);
      bySpecies.set(speciesKey, record);

      for (const variety of node.varieties ?? []) {
        const varietyId = Number(variety.id);
        const varietyKey = normalizePokemonName(
          variety.name
        );

        byId.set(varietyId, {
          ...record,
          pokemonId: varietyId,
          speciesKey: varietyKey
        });
        bySpecies.set(varietyKey, {
          ...record,
          pokemonId: varietyId,
          speciesKey: varietyKey
        });
      }
    });
  }

  return {
    byId,
    bySpecies
  };
}

function getEvolutionStageForPokemon(
  pokemon,
  stageLookup
) {
  const directStage = stageLookup.byId.get(
    Number(pokemon.id)
  );

  if (directStage) return directStage.stage;

  const speciesStage = stageLookup.bySpecies.get(
    normalizePokemonName(pokemon.species)
  );

  if (speciesStage) return speciesStage.stage;

  throw new Error(
    `Could not classify evolution stage for ${pokemon.name}.`
  );
}

function inferPokemonForm(pokemon) {
  const name = normalizeText(pokemon?.name);
  const species = normalizeText(pokemon?.species);

  if (name.includes("-paldea-combat-breed")) {
    return "paldean combat breed";
  }
  if (name.includes("-paldea-blaze-breed")) {
    return "paldean blaze breed";
  }
  if (name.includes("-paldea-aqua-breed")) {
    return "paldean aqua breed";
  }
  if (name.includes("-bloodmoon")) return "bloodmoon";

  if (
    species &&
    name.startsWith(`${species}-`)
  ) {
    return normalizeForm(
      name
        .slice(species.length + 1)
        .replace(/^alola\b/, "alolan")
        .replace(/^galar\b/, "galarian")
        .replace(/^hisui\b/, "hisuian")
        .replace(/^paldea\b/, "paldean")
    );
  }

  if (name.includes("-alola")) return "alolan";
  if (name.includes("-galar")) return "galarian";
  if (name.includes("-hisui")) return "hisuian";
  if (name.includes("-paldea")) return "paldean";

  return "standard";
}

function getFormMatchScore(entryForm, pokemon) {
  if (!entryForm) return 0;

  const normalizedEntryForm =
    normalizeForm(entryForm);
  const inferredForm = inferPokemonForm(pokemon);
  const formAliases =
    FORM_ALIASES.get(normalizedEntryForm) ?? [];
  const regionalSuffix = REGIONAL_FORM_SUFFIXES.get(
    normalizedEntryForm
  );

  if (normalizedEntryForm === inferredForm) {
    return 12;
  }

  if (
    regionalSuffix &&
    normalizeText(pokemon?.name).includes(regionalSuffix)
  ) {
    return 12;
  }

  if (formAliases.includes(inferredForm)) {
    return 12;
  }

  if (
    pokemon.isDefaultForm &&
    DEFAULT_FORM_LABELS.has(normalizedEntryForm)
  ) {
    return 2;
  }

  return 0;
}

function scorePokemonMatch(
  entry,
  pokemon,
  defaultIdBySpecies
) {
  const entryDexNumber = Number(entry.nationalDexNumber);
  const entryName = normalizePokemonName(entry.name);
  const pokemonName = normalizePokemonName(pokemon.name);
  const pokemonSpecies = normalizePokemonName(
    pokemon.species
  );
  const defaultSpeciesId = defaultIdBySpecies.get(
    pokemonSpecies
  );
  const entryForm = normalizeForm(entry.form);
  let score = 0;

  if (entryDexNumber === Number(pokemon.id)) {
    score += 8;
  }

  if (entryDexNumber === defaultSpeciesId) {
    score += 6;
  }

  if (entryName && entryName === pokemonName) {
    score += 4;
  }

  if (entryName && entryName === pokemonSpecies) {
    score += 3;
  }

  if (!score) return 0;

  if (entryForm) {
    const formMatchScore = getFormMatchScore(
      entryForm,
      pokemon
    );

    if (!formMatchScore) return 0;
    score += formMatchScore;
  } else if (pokemon.isDefaultForm) {
    score += 2;
  }

  return score;
}

export function buildPokemonIndexes(pokemonList) {
  const defaultIdBySpecies = new Map();

  for (const pokemon of pokemonList) {
    if (pokemon.isDefaultForm) {
      defaultIdBySpecies.set(
        normalizePokemonName(pokemon.species),
        Number(pokemon.id)
      );
    }
  }

  return {
    defaultIdBySpecies
  };
}

export function matchAnalysisEntryToPokemon(
  entry,
  pokemonList,
  pokemonIndexes = buildPokemonIndexes(pokemonList)
) {
  const matches = pokemonList
    .map(pokemon => ({
      pokemon,
      score: scorePokemonMatch(
        entry,
        pokemon,
        pokemonIndexes.defaultIdBySpecies
      )
    }))
    .filter(match => match.score > 0)
    .sort((first, second) => second.score - first.score);

  const best = matches[0];

  if (!best) {
    throw new Error(
      `Could not match analysis entry ${entry.name} #${entry.nationalDexNumber}.`
    );
  }

  if (
    matches[1] &&
    matches[1].score === best.score
  ) {
    throw new Error(
      `Ambiguous Pokemon match for ${entry.name} #${entry.nationalDexNumber}: ${best.pokemon.name} and ${matches[1].pokemon.name}.`
    );
  }

  return best.pokemon;
}

export function buildPokemonDescription(
  pokemon,
  stage,
  displayName = formatPokemonDisplayName(pokemon)
) {
  const typeLabel = formatTypeLabel(pokemon.types);
  const typeArticle = getTypeArticle(typeLabel);
  const generationLabel = formatGeneration(
    pokemon.generation
  );
  const baseStatTotal =
    calculateBaseStatTotal(pokemon);

  if (stage === "single") {
    return `${displayName} is ${typeArticle} ${typeLabel} Pokémon introduced in ${generationLabel}, with a base stat total of ${baseStatTotal} and no standard evolutions.`;
  }

  const stageText = {
    first: "the first stage",
    middle: "a middle stage",
    final: "a final stage"
  }[stage];

  if (!stageText) {
    throw new Error(
      `Unsupported evolution stage "${stage}" for ${displayName}.`
    );
  }

  return `${displayName} is ${typeArticle} ${typeLabel} Pokémon introduced in ${generationLabel} and ${stageText} of its evolution line, with a base stat total of ${baseStatTotal}.`;
}

function getIndividualAnalysisEntries(analysisData) {
  return analysisData.flatMap((record, recordIndex) => {
    const pokemonEntries = Array.isArray(record.pokemon)
      ? record.pokemon
      : [record];

    return pokemonEntries
      .map((entry, pokemonIndex) => ({
        record,
        entry,
        recordIndex,
        pokemonIndex
      }))
      .filter(({ entry }) =>
        Number.isFinite(Number(entry?.nationalDexNumber))
      );
  });
}

function validateDescription({
  description,
  displayName,
  pokemon,
  stage
}) {
  const generationLabel = formatGeneration(
    pokemon.generation
  );
  const typeLabel = formatTypeLabel(pokemon.types);
  const baseStatTotal =
    calculateBaseStatTotal(pokemon);

  if (!description.trim()) {
    throw new Error(
      `Generated empty description for ${displayName}.`
    );
  }

  for (const expected of [
    displayName,
    typeLabel,
    generationLabel,
    String(baseStatTotal)
  ]) {
    if (!description.includes(expected)) {
      throw new Error(
        `Description for ${displayName} is missing "${expected}".`
      );
    }
  }

  const stageNeedles = {
    first: "the first stage",
    middle: "a middle stage",
    final: "a final stage",
    single: "no standard evolutions"
  };

  if (!description.includes(stageNeedles[stage])) {
    throw new Error(
      `Description for ${displayName} is missing the ${stage} classification.`
    );
  }

  if (/\b(undefined|null|NaN)\b|\{[^}]+\}/.test(description)) {
    throw new Error(
      `Description for ${displayName} contains an unresolved value.`
    );
  }
}

export function enrichPokeloreDescriptions({
  analysisData,
  pokemonList,
  evolutionChains
}) {
  const stageLookup =
    buildEvolutionStageLookup(evolutionChains);
  const pokemonIndexes =
    buildPokemonIndexes(pokemonList);
  const counts = {
    first: 0,
    middle: 0,
    final: 0,
    single: 0
  };
  const updatedEntries = [];

  for (const { entry } of getIndividualAnalysisEntries(
    analysisData
  )) {
    const pokemon = matchAnalysisEntryToPokemon(
      entry,
      pokemonList,
      pokemonIndexes
    );
    const stage = getEvolutionStageForPokemon(
      pokemon,
      stageLookup
    );
    const displayName =
      formatPokemonDisplayName(pokemon);
    const description = buildPokemonDescription(
      pokemon,
      stage,
      displayName
    );

    validateDescription({
      description,
      displayName,
      pokemon,
      stage
    });

    entry.description = description;
    counts[stage] += 1;
    updatedEntries.push({
      nationalDexNumber: entry.nationalDexNumber,
      analysisName: entry.name,
      pokemonName: pokemon.name,
      displayName,
      stage,
      description
    });
  }

  return {
    analysisData,
    counts,
    updatedEntries,
    total: updatedEntries.length
  };
}

function loadJsonDirectory(directory) {
  return fs
    .readdirSync(directory)
    .filter(fileName => fileName.endsWith(".json"))
    .sort((first, second) =>
      first.localeCompare(second, undefined, {
        numeric: true
      })
    )
    .map(fileName =>
      readJson(path.join(directory, fileName))
    );
}

function parseArgs(argv) {
  return {
    write: argv.includes("--write")
  };
}

export function runEnrichment({
  analysisPath = DEFAULT_ANALYSIS_PATH,
  pokemonDataDir = DEFAULT_POKEMON_DATA_DIR,
  evolutionChainsDir = DEFAULT_EVOLUTION_CHAINS_DIR,
  write = false
} = {}) {
  const analysisData = readJson(analysisPath);
  const pokemonList = loadJsonDirectory(pokemonDataDir);
  const evolutionChains = loadJsonDirectory(
    evolutionChainsDir
  );
  const result = enrichPokeloreDescriptions({
    analysisData,
    pokemonList,
    evolutionChains
  });

  if (write) {
    fs.writeFileSync(
      analysisPath,
      `${JSON.stringify(result.analysisData, null, 2)}\n`
    );
  }

  return {
    ...result,
    wrote: write,
    analysisPath
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = runEnrichment({
    write: args.write
  });

  console.log(
    `${args.write ? "Updated" : "Validated"} ${result.total} PokeLore analysis descriptions.`
  );
  console.log(
    `first=${result.counts.first}, middle=${result.counts.middle}, final=${result.counts.final}, single=${result.counts.single}`
  );
  console.log(
    args.write
      ? `Wrote ${path.relative(repoRoot, result.analysisPath)}.`
      : "Dry run only. Re-run with --write to update the JSON file."
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === __filename
) {
  main();
}
