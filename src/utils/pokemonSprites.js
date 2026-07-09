const SPRITE_ROOT =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const OFFICIAL_ARTWORK_PATTERN =
  /\/official-artwork\/(\d+)\.png(?:\?.*)?$/;

function getRetryUrl(url) {
  if (!url) {
    return null;
  }

  const separator =
    url.includes("?") ? "&" : "?";

  return `${url}${separator}retry=1`;
}

export function getPokemonSpriteFallbacks(
  pokemon
) {
  const id = Number(pokemon?.id);
  const officialArtworkRetry =
    getRetryUrl(pokemon?.sprite);

  if (!Number.isInteger(id) || id <= 0) {
    return [
      officialArtworkRetry,
      pokemon?.spriteFallback
    ].filter(Boolean);
  }

  return [
    officialArtworkRetry,
    pokemon.spriteFallback,
    `${SPRITE_ROOT}/other/home/${id}.png`,
    `${SPRITE_ROOT}/${id}.png`
  ].filter(
    (url, index, urls) =>
      url &&
      url !== pokemon.sprite &&
      urls.indexOf(url) === index
  );
}

export function getLocalPokemonArtwork(
  pokemon,
  variant = "full"
) {
  const match =
    pokemon?.sprite?.match(
      OFFICIAL_ARTWORK_PATTERN
    );

  if (!match) {
    return null;
  }

  const artworkId = match[1];
  const extension =
    variant === "card" ? "webp" : "png";

  return (
    `/images/pokemon/official/${variant}/` +
    `${artworkId}.${extension}`
  );
}

function uniqueSources(sources) {
  return sources.filter(
    (source, index) =>
      source &&
      sources.indexOf(source) === index
  );
}

export function getPokemonCardSources(
  pokemon
) {
  return uniqueSources([
    getLocalPokemonArtwork(
      pokemon,
      "card"
    ),
    getLocalPokemonArtwork(
      pokemon,
      "full"
    ),
    pokemon?.sprite,
    ...getPokemonSpriteFallbacks(pokemon)
  ]);
}

export function getPokemonDetailSources(
  pokemon
) {
  return uniqueSources([
    getLocalPokemonArtwork(
      pokemon,
      "full"
    ),
    pokemon?.sprite,
    ...getPokemonSpriteFallbacks(pokemon)
  ]);
}

export function advanceSpriteFallback(
  event,
  fallbacks
) {
  const image = event.currentTarget;
  const fallbackIndex = Number(
    image.dataset.fallbackIndex ?? 0
  );
  const nextSource =
    fallbacks[fallbackIndex];

  if (!nextSource) {
    return;
  }

  image.dataset.fallbackIndex =
    String(fallbackIndex + 1);
  image.src = nextSource;
}
