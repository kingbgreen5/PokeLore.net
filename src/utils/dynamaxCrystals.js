import {
  DYNAMAX_CRYSTAL_CATEGORY,
  DYNAMAX_CRYSTAL_GUIDE_PATH,
  RELEASED_DYNAMAX_CRYSTAL_COUNT,
  dynamaxCrystalData
} from "../data/dynamaxCrystals.js";

function getItemSlug(itemOrSlug) {
  return typeof itemOrSlug === "string"
    ? itemOrSlug
    : itemOrSlug?.name;
}

function getItemCategoryName(item) {
  return typeof item?.category === "string"
    ? item.category
    : item?.category?.name;
}

export function formatDynamaxPokemonName(slug) {
  return String(slug ?? "")
    .split("-")
    .filter(Boolean)
    .map(
      part =>
        part.charAt(0).toUpperCase() +
        part.slice(1)
    )
    .join(" ");
}

export function formatDynamaxPokemonList(
  pokemonSlugs = []
) {
  const names = pokemonSlugs.map(
    formatDynamaxPokemonName
  );

  if (names.length <= 1) {
    return names[0] ?? "";
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names.slice(0, -1).join(", ")}, and ${
    names[names.length - 1]
  }`;
}

export function getDynamaxCrystalData(itemOrSlug) {
  return (
    dynamaxCrystalData[getItemSlug(itemOrSlug)] ??
    null
  );
}

export function isDynamaxCrystalItem(item) {
  return (
    getItemCategoryName(item) ===
      DYNAMAX_CRYSTAL_CATEGORY ||
    String(item?.name ?? "").startsWith(
      "dynamax-crystal-"
    )
  );
}

export function isReleasedDynamaxCrystal(itemOrSlug) {
  return (
    getDynamaxCrystalData(itemOrSlug)
      ?.releaseStatus === "released"
  );
}

export function isUnusedDynamaxCrystal(item) {
  return (
    isDynamaxCrystalItem(item) &&
    !isReleasedDynamaxCrystal(item)
  );
}

export function getDynamaxCrystalDisplayName(
  itemOrSlug
) {
  return (
    getDynamaxCrystalData(itemOrSlug)
      ?.displayName ??
    (typeof itemOrSlug === "string"
      ? itemOrSlug
      : itemOrSlug?.displayName) ??
    ""
  );
}

export function getReleasedDynamaxCrystals() {
  return Object.entries(dynamaxCrystalData).map(
    ([slug, data]) => ({
      slug,
      ...data
    })
  );
}

export function isUsableFlavorText(text) {
  return (
    Boolean(text) &&
    !/\[VAR\s*\([^)]*\)\]/i.test(text)
  );
}

export function validateReleasedDynamaxCrystals() {
  const releasedSlugs = Object.keys(
    dynamaxCrystalData
  );
  const uniqueSlugs = new Set(releasedSlugs);

  if (
    releasedSlugs.length !==
      RELEASED_DYNAMAX_CRYSTAL_COUNT ||
    uniqueSlugs.size !== releasedSlugs.length
  ) {
    throw new Error(
      `Expected ${RELEASED_DYNAMAX_CRYSTAL_COUNT} released Dynamax Crystals, found ${releasedSlugs.length} entries and ${uniqueSlugs.size} unique slugs.`
    );
  }

  for (const [slug, data] of Object.entries(
    dynamaxCrystalData
  )) {
    if (data.releaseStatus !== "released") {
      throw new Error(
        `${slug} must have releaseStatus "released".`
      );
    }
  }
}

export {
  DYNAMAX_CRYSTAL_CATEGORY,
  DYNAMAX_CRYSTAL_GUIDE_PATH,
  RELEASED_DYNAMAX_CRYSTAL_COUNT,
  dynamaxCrystalData
};
