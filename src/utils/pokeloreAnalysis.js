export function resolvePokeloreAnalysis(
  analyses,
  pokemonId
) {
  const id = Number(pokemonId);
  const directAnalysis = analyses.find(
    entry =>
      Number(entry.nationalDexNumber) === id
  );

  if (directAnalysis) {
    return directAnalysis;
  }

  const lineAnalysis = analyses.find(
    entry =>
      Array.isArray(entry.evolutionLine) &&
      entry.evolutionLine.some(
        dexNumber => Number(dexNumber) === id
      )
  );
  const pokemonAnalysis =
    lineAnalysis?.pokemon?.find(
      entry =>
        Number(entry.nationalDexNumber) === id
    );

  if (!lineAnalysis || !pokemonAnalysis) {
    return null;
  }

  return {
    ...pokemonAnalysis,
    playthrough: lineAnalysis.playthrough,
    competitive: lineAnalysis.competitive,
    nuzlocke: lineAnalysis.nuzlocke
  };
}
