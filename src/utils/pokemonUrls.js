export const POKEMON_ROUTE_PREFIX = "/pokemon/";

export function normalizePokemonIdentifier(identifier) {
  try {
    return decodeURIComponent(
      String(identifier ?? "")
    )
      .trim()
      .toLowerCase();
  } catch {
    return String(identifier ?? "")
      .trim()
      .toLowerCase();
  }
}

export function isNumericPokemonIdentifier(identifier) {
  return /^\d+$/.test(
    String(identifier ?? "").trim()
  );
}

export function getPokemonSlug(pokemon) {
  if (!pokemon) {
    return null;
  }

  if (typeof pokemon === "string") {
    const identifier =
      normalizePokemonIdentifier(pokemon);

    return identifier &&
      !isNumericPokemonIdentifier(identifier)
      ? identifier
      : null;
  }

  const slug =
    pokemon.slug ??
    pokemon.name ??
    pokemon.species ??
    null;

  return slug
    ? normalizePokemonIdentifier(slug)
    : null;
}

export function getPokemonUrl(
  pokemon,
  search = ""
) {
  const slug = getPokemonSlug(pokemon);

  return slug
    ? `${POKEMON_ROUTE_PREFIX}${slug}${search}`
    : null;
}

export function resolvePokemonRouteIdentifier(
  identifier,
  routes
) {
  const normalizedIdentifier =
    normalizePokemonIdentifier(identifier);

  if (!normalizedIdentifier) {
    return {
      status: "not-found"
    };
  }

  if (
    isNumericPokemonIdentifier(
      normalizedIdentifier
    )
  ) {
    const canonicalName =
      routes?.byId?.[normalizedIdentifier];

    return canonicalName
      ? {
          status: "redirect",
          slug: canonicalName,
          id: Number(normalizedIdentifier)
        }
      : {
          status: "not-found"
        };
  }

  const pokemonId =
    routes?.byName?.[normalizedIdentifier];

  if (!pokemonId) {
    return {
      status: "not-found"
    };
  }

  if (
    normalizedIdentifier !==
    String(identifier ?? "").trim()
  ) {
    return {
      status: "redirect",
      slug: normalizedIdentifier,
      id: pokemonId
    };
  }

  return {
    status: "found",
    slug: normalizedIdentifier,
    id: pokemonId
  };
}
