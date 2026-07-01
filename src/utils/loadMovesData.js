async function readJsonUrl(url) {
  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (
    !trimmed.startsWith("{") &&
    !trimmed.startsWith("[")
  ) {
    return null;
  }

  return JSON.parse(text);
}

export async function loadMovesMap() {
  const movesIndex =
    await readJsonUrl(
      "/data/movesIndex.json"
    );

  if (Array.isArray(movesIndex)) {
    return Object.fromEntries(
      movesIndex.map(move => [
        move.name,
        move
      ])
    );
  }

  return (
    (await readJsonUrl(
      "/data/moves.json"
    )) ?? {}
  );
}

export async function loadMoveDetail(
  moveName
) {
  const moveDetail =
    await readJsonUrl(
      `/data/moves/${moveName}.json`
    );

  if (moveDetail) {
    return moveDetail;
  }

  const moves = await loadMovesMap();

  return moves[moveName] ?? null;
}
