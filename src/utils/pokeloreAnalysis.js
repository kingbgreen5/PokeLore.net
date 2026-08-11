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

function inferPokemonForm(pokemon) {
  const name = normalizeText(pokemon?.name);

  if (name.includes("-paldea-combat-breed")) {
    return "paldean combat breed";
  }
  if (name.includes("-paldea-blaze-breed")) {
    return "paldean blaze breed";
  }
  if (name.includes("-paldea-aqua-breed")) {
    return "paldean aqua breed";
  }
  if (name.includes("-alola")) return "alolan";
  if (name.includes("-galar")) return "galarian";
  if (name.includes("-hisui")) return "hisuian";
  if (name.includes("-paldea")) return "paldean";

  return "kantonian";
}

function scorePokemonMatch(entry, pokemon, id) {
  const entryDexNumber = Number(entry.nationalDexNumber);
  const entryName = normalizePokemonName(entry.name);
  const entryForm = normalizeText(entry.form);
  const pokemonName = normalizePokemonName(pokemon?.name);
  const pokemonSpecies = normalizePokemonName(
    pokemon?.species
  );
  const inferredForm = inferPokemonForm(pokemon);
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
  if (entryForm && entryForm === inferredForm) score += 8;

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
