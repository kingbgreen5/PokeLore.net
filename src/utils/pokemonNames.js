const REGIONAL_ADJECTIVES = {
  alola: "Alolan",
  galar: "Galarian",
  hisui: "Hisuian",
  paldea: "Paldean"
};

const REGIONAL_KEYS =
  Object.keys(REGIONAL_ADJECTIVES);

function titleCaseSlug(value = "") {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map(
      word =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function partsMatchAt(
  parts,
  startIndex,
  matchParts
) {
  return matchParts.every(
    (part, index) =>
      parts[startIndex + index] === part
  );
}

function getRegionalIndex(parts) {
  return parts.findIndex(part =>
    REGIONAL_KEYS.includes(part)
  );
}

function isCosmeticCapForm(parts) {
  return parts.includes("cap");
}

function formatMegaName(
  parts,
  species
) {
  const megaIndex =
    parts.indexOf("mega");

  if (megaIndex === -1) {
    return null;
  }

  const speciesParts =
    String(species ?? "")
      .split("-")
      .filter(Boolean);
  const baseParts =
    speciesParts.length > 0 &&
    partsMatchAt(
      parts,
      0,
      speciesParts
    )
      ? speciesParts
      : parts.slice(0, megaIndex);
  const afterMega =
    parts.slice(megaIndex + 1);

  return [
    "Mega",
    titleCaseSlug(baseParts.join("-")),
    titleCaseSlug(afterMega.join("-"))
  ]
    .filter(Boolean)
    .join(" ");
}

export function isRegionalFormKey(
  formKey
) {
  const parts =
    String(formKey)
      .split("-")
      .filter(Boolean);

  if (
    parts.length === 0 ||
    isCosmeticCapForm(parts)
  ) {
    return false;
  }

  return parts.some(part =>
    REGIONAL_KEYS.includes(part)
  );
}

export function getRegionalFormKey(
  pokemon
) {
  if (
    !pokemon ||
    !pokemon.species ||
    pokemon.name === pokemon.species
  ) {
    return null;
  }

  const prefix =
    `${pokemon.species}-`;

  if (
    !pokemon.name.startsWith(prefix)
  ) {
    return null;
  }

  const formKey =
    pokemon.name.slice(prefix.length);

  return isRegionalFormKey(formKey)
    ? formKey
    : null;
}

export function formatPokemonDisplayName(
  pokemonOrName
) {
  const name =
    typeof pokemonOrName === "string"
      ? pokemonOrName
      : pokemonOrName?.name;
  const species =
    typeof pokemonOrName === "string"
      ? null
      : pokemonOrName?.species;
  const parts =
    String(name ?? "")
      .split("-")
      .filter(Boolean);
  const regionalIndex =
    getRegionalIndex(parts);
  const megaName =
    formatMegaName(parts, species);

  if (megaName) {
    return megaName;
  }

  if (
    regionalIndex === -1 ||
    isCosmeticCapForm(parts)
  ) {
    return titleCaseSlug(name);
  }

  const region =
    parts[regionalIndex];
  const adjective =
    REGIONAL_ADJECTIVES[region];
  const speciesParts =
    String(species ?? "")
      .split("-")
      .filter(Boolean);

  if (
    speciesParts.length > 0 &&
    partsMatchAt(
      parts,
      0,
      speciesParts
    )
  ) {
    const beforeRegion =
      parts.slice(
        speciesParts.length,
        regionalIndex
      );
    const afterRegion =
      parts.slice(regionalIndex + 1);
    const baseName =
      titleCaseSlug(species);
    const beforeText =
      titleCaseSlug(
        beforeRegion.join("-")
      );
    const afterText =
      titleCaseSlug(
        afterRegion.join("-")
      );

    return [
      beforeText,
      adjective,
      baseName,
      afterText
    ]
      .filter(Boolean)
      .join(" ");
  }

  const beforeRegion =
    parts.slice(0, regionalIndex);
  const afterRegion =
    parts.slice(regionalIndex + 1);
  const hasTrailingTotem =
    beforeRegion.at(-1) === "totem";
  const baseParts =
    hasTrailingTotem
      ? beforeRegion.slice(0, -1)
      : beforeRegion;
  const prefixParts =
    hasTrailingTotem
      ? ["totem"]
      : [];

  return [
    titleCaseSlug(prefixParts.join("-")),
    adjective,
    titleCaseSlug(baseParts.join("-")),
    titleCaseSlug(afterRegion.join("-"))
  ]
    .filter(Boolean)
    .join(" ");
}
