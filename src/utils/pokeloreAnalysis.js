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
  ["blue plumage", ["blue plumage"]],
  ["busted form", ["busted"]],
  ["caph starmobile", ["standard"]],
  ["chest form", ["standard"]],
  ["complete forme", ["complete"]],
  ["confined", ["standard"]],
  ["cornerstone mask", ["cornerstone mask"]],
  ["crowned shield", ["crowned"]],
  ["crowned sword", ["crowned"]],
  ["core form", ["red"]],
  ["curly form", ["curly", "standard"]],
  ["dawn wings", ["dawn"]],
  ["disguised form", ["disguised"]],
  ["droopy form", ["droopy"]],
  ["dusk mane", ["dusk"]],
  ["eternal flower", ["eternal"]],
  ["family of four", ["family of four"]],
  ["family of three", ["family of three"]],
  ["female", ["female"]],
  ["full belly mode", ["full belly", "standard"]],
  ["galarian", ["galar"]],
  ["galarian standard", ["galar standard", "galarian"]],
  ["galarian zen", ["galar zen"]],
  ["gigantamax", ["gmax", "amped gmax"]],
  ["gigantamax rapid strike style", ["rapid strike gmax"]],
  ["gigantamax single strike style", ["single strike gmax"]],
  ["gorging form", ["gorging"]],
  ["green plumage", ["green plumage"]],
  ["gulping form", ["gulping"]],
  ["hangry mode", ["hangry"]],
  ["hearthflame mask", ["hearthflame mask"]],
  ["hero form", ["hero"]],
  ["hero of many battles", ["standard"]],
  ["hisuian", ["hisui"]],
  ["ice face", ["ice", "standard"]],
  ["ice rider", ["ice"]],
  ["incarnate forme", ["incarnate"]],
  ["low key form", ["low key"]],
  ["male", ["male", "standard"]],
  ["mega baxcalibur", ["mega"]],
  ["mega glimmora", ["mega"]],
  ["mega scovillain", ["mega"]],
  ["mega tatsugiri curly form", ["curly mega"]],
  ["mega tatsugiri droopy form", ["droopy mega"]],
  ["mega tatsugiri stretchy form", ["stretchy mega"]],
  ["meteor form", ["red meteor"]],
  ["navi starmobile", ["standard"]],
  ["neutral mode", ["standard"]],
  ["noice face", ["noice"]],
  ["normal form", ["standard"]],
  ["pa u style", ["pau"]],
  ["paldean", ["paldea"]],
  ["phony form", ["standard"]],
  ["pom pom style", ["pom pom"]],
  ["rapid strike style", ["rapid strike"]],
  ["roaming form", ["roaming"]],
  ["ruchbah starmobile", ["standard"]],
  ["schedar starmobile", ["standard"]],
  ["school form", ["school"]],
  ["segin starmobile", ["standard"]],
  ["sensu style", ["sensu"]],
  ["shadow rider", ["shadow"]],
  ["shield forme", ["shield"]],
  ["single strike style", ["single strike", "standard"]],
  ["solo form", ["solo"]],
  ["stellar form", ["stellar"]],
  ["stereo", ["standard"]],
  ["stretchy form", ["stretchy"]],
  ["supervisor", ["standard"]],
  ["teal mask", ["standard"]],
  ["terastal form", ["terastal"]],
  ["therian forme", ["therian"]],
  ["unovan standard", ["standard", "base"]],
  ["unovan zen", ["zen"]],
  ["wellspring mask", ["wellspring mask"]],
  ["white plumage", ["white plumage"]],
  ["yellow plumage", ["yellow plumage"]],
  ["zero form", ["zero", "standard"]],
  ["zenith", ["standard"]]
]);

const REGIONAL_FORM_SUFFIXES = new Map([
  ["alolan", "-alola"],
  ["galarian", "-galar"],
  ["hisuian", "-hisui"],
  ["paldean", "-paldea"]
]);

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

  if (species && name.startsWith(`${species}-`)) {
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

  const normalizedEntryForm = normalizeForm(entryForm);
  const inferredForm = inferPokemonForm(pokemon);
  const formAliases =
    FORM_ALIASES.get(normalizedEntryForm) ?? [];
  const regionalSuffix = REGIONAL_FORM_SUFFIXES.get(
    normalizedEntryForm
  );

  if (normalizedEntryForm === inferredForm) {
    return 8;
  }

  if (
    regionalSuffix &&
    normalizeText(pokemon?.name).includes(regionalSuffix)
  ) {
    return 8;
  }

  if (formAliases.includes(inferredForm)) {
    return 8;
  }

  if (
    pokemon?.isDefaultForm &&
    DEFAULT_FORM_LABELS.has(normalizedEntryForm)
  ) {
    return 2;
  }

  return 0;
}

function scorePokemonMatch(entry, pokemon, id) {
  const entryDexNumber = Number(entry.nationalDexNumber);
  const entryName = normalizePokemonName(entry.name);
  const entryForm = normalizeForm(entry.form);
  const pokemonName = normalizePokemonName(pokemon?.name);
  const pokemonSpecies = normalizePokemonName(
    pokemon?.species
  );
  let identityScore = 0;

  if (entryDexNumber === id) identityScore += 4;
  if (entryName && entryName === pokemonName) {
    identityScore += 4;
  }
  if (entryName && entryName === pokemonSpecies) {
    identityScore += 2;
  }

  if (!identityScore) return 0;

  let score = identityScore;
  if (entryForm) {
    const formMatchScore = getFormMatchScore(
      entryForm,
      pokemon
    );

    if (!formMatchScore) return 0;
    score += formMatchScore;
  } else if (pokemon?.isDefaultForm) {
    score += 2;
  }

  return score;
}

function findPokemonAnalysis(lineAnalysis, pokemon, id) {
  if (!lineAnalysis?.pokemon?.length) return null;

  if (!pokemon || typeof pokemon !== "object") {
    return lineAnalysis.pokemon.find(
      entry =>
        Number(entry.nationalDexNumber) === id
    );
  }

  return lineAnalysis.pokemon
    .map(entry => ({
      entry,
      score: scorePokemonMatch(entry, pokemon, id)
    }))
    .filter(match => match.score > 0)
    .sort((first, second) => second.score - first.score)[0]
    ?.entry;
}

export function resolvePokeloreAnalysis(
  analyses,
  pokemon
) {
  const id = Number(
    pokemon && typeof pokemon === "object"
      ? pokemon.id
      : pokemon
  );
  const directAnalysis = analyses.find(
    entry =>
      Number(entry.nationalDexNumber) === id
  );

  if (directAnalysis) {
    return directAnalysis;
  }

  const lineAnalysis = analyses.find(entry => {
    if (!Array.isArray(entry.evolutionLine)) {
      return false;
    }

    if (
      entry.evolutionLine.some(
        dexNumber => Number(dexNumber) === id
      )
    ) {
      return true;
    }

    return Boolean(
      pokemon &&
        typeof pokemon === "object" &&
        findPokemonAnalysis(entry, pokemon, id)
    );
  }
  );
  const pokemonAnalysis =
    findPokemonAnalysis(lineAnalysis, pokemon, id);

  if (!lineAnalysis || !pokemonAnalysis) {
    return null;
  }

  return {
    ...pokemonAnalysis,
    evolutionLine: lineAnalysis.evolutionLine,
    linePokemon: lineAnalysis.pokemon,
    playthrough: lineAnalysis.playthrough,
    competitive: lineAnalysis.competitive,
    nuzlocke: lineAnalysis.nuzlocke
  };
}
