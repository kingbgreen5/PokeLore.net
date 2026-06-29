import { formatPokemonDisplayName }
from "../utils/pokemonNames";

export const SITE_NAME = "PokéLore";
export const SITE_URL = "https://pokelore.net";

export function formatName(value = "") {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function pageUrl(path = "/") {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

export function defaultSeo() {
  return {
    title: `${SITE_NAME} | Pokémon Lore Database`,
    description:
      "Explore Pokémon, moves, abilities, learnsets, type matchups, evolutions, and Pokédex entries.",
    canonical: SITE_URL
  };
}

export function homeSeo() {
  return {
    title: `${SITE_NAME} | Search Pokémon Lore, Moves, Abilities & Learnsets`,
    description:
      "Search Pokémon by name, National Dex number, or type and explore detailed Pokémon data.",
    canonical: SITE_URL
  };
}

export function dexEntriesSeo() {
  return {
    title: `Pokédex Entries Database | ${SITE_NAME}`,
    description:
      "Search Pokédex entries across Pokémon games by keyword, Pokémon, and version.",
    canonical: pageUrl("/dex-entries")
  };
}

export function learnsetsSeo() {
  return {
    title: `Pokémon Learnsets Database | ${SITE_NAME}`,
    description:
      "Search Pokémon learnsets and view the moves each Pokémon can learn across games.",
    canonical: pageUrl("/learnsets")
  };
}

export function movesSeo() {
  return {
    title: `Pokémon Moves Database | ${SITE_NAME}`,
    description:
      "Search Pokémon moves by name, type, category, power, accuracy, PP, and effect.",
    canonical: pageUrl("/moves")
  };
}

export function moveSeo(moveName) {
  const name = formatName(moveName);

  return {
    title: `${name} Move Guide | ${SITE_NAME}`,
    description: `View ${name}'s type, power, accuracy, PP, effect, and which Pokémon can learn it.`,
    canonical: pageUrl(`/move/${moveName}`)
  };
}

export function abilitiesSeo() {
  return {
    title: `Pokémon Abilities Database | ${SITE_NAME}`,
    description:
      "Search Pokémon abilities and view their effects, descriptions, generations, and matching Pokémon.",
    canonical: pageUrl("/abilities")
  };
}

export function abilitySeo(abilityName) {
  const name = formatName(abilityName);

  return {
    title: `${name} Ability Guide | ${SITE_NAME}`,
    description: `View the ${name} ability effect, description, and Pokémon that can have this ability.`,
    canonical: pageUrl(`/ability/${abilityName}`)
  };
}

export function itemsSeo() {
  return {
    title: `Pokémon Items Database | ${SITE_NAME}`,
    description:
      "Search Pokémon items by name, pocket, category, effect, and acquisition details.",
    canonical: pageUrl("/items")
  };
}

export function itemSeo(item) {
  const slug =
    typeof item === "string" ? item : item?.name;
  const name =
    typeof item === "string"
      ? formatName(item)
      : item?.displayName ?? formatName(item?.name);
  const effect =
    typeof item === "string"
      ? null
      : item?.shortEffect || item?.effect;

  return {
    title: `${name} Item Guide | ${SITE_NAME}`,
    description:
      effect ??
      `View ${name}'s effect, category, cost, flavor text, acquisition methods, and related Pokémon.`,
    canonical: pageUrl(`/item/${slug}`),
    image:
      typeof item === "string"
        ? undefined
        : item?.sprite ?? undefined
  };
}

export function locationsSeo() {
  return {
    title: `Pokémon Locations & Wild Encounters | ${SITE_NAME}`,
    description:
      "Search Pokémon locations by region and explore wild encounters by area, game version, method, level range, and chance.",
    canonical: pageUrl("/locations")
  };
}

export function topicsSeo() {
  return {
    title: `Pokédex Lore Topics | ${SITE_NAME}`,
    description:
      "Explore curated Pokémon lore topics built from official Pokédex entry text, including habitats, behavior, rarity, danger, and mystery.",
    canonical: pageUrl("/topics")
  };
}

export function topicSeo(topic) {
  const slug =
    typeof topic === "string"
      ? topic
      : topic?.slug;
  const title =
    typeof topic === "string"
      ? `${formatName(topic)} | ${SITE_NAME}`
      : topic?.seoTitle ??
        `${topic?.title ?? "Pokédex Topic"} | ${SITE_NAME}`;
  const description =
    typeof topic === "string"
      ? "Explore Pokémon grouped by official Pokédex entry text."
      : topic?.seoDescription ??
        topic?.shortDescription ??
        "Explore Pokémon grouped by official Pokédex entry text.";

  return {
    title,
    description,
    canonical: pageUrl(`/topic/${slug}`)
  };
}

export function locationSeo(location) {
  const slug =
    typeof location === "string"
      ? location
      : location?.name;
  const name =
    typeof location === "string"
      ? formatName(location)
      : location?.displayName ??
        formatName(location?.name);
  const region =
    typeof location === "string"
      ? null
      : location?.region?.displayName;

  return {
    title: `${name} Pokémon Encounters | ${SITE_NAME}`,
    description: `View Pokémon encounters in ${name}${region ? ` in ${region}` : ""}, grouped by area, version, encounter method, level range, and chance.`,
    canonical: pageUrl(`/location/${slug}`)
  };
}

export function pokemonSeo(pokemon) {
  const name =
    formatPokemonDisplayName(pokemon);
  const dexNumber =
    pokemon?.id
      ? String(pokemon.id).padStart(3, "0")
      : null;
  const dexSuffix =
    pokemon?.isDefaultForm && dexNumber
      ? ` — Pokédex #${dexNumber}`
      : "";

  return {
    title: `${name} Stats, Moves, Abilities & Locations | ${SITE_NAME}${dexSuffix}`,
    description: pokemon?.isDefaultForm && pokemon?.id
      ? `Explore ${name}'s base stats, abilities, moves, evolution details, type matchups, encounter locations, and National Pokédex number ${pokemon.id}.`
      : `Explore ${name}'s base stats, abilities, moves, evolution details, type matchups, and encounter locations.`,
    canonical: pageUrl(`/pokemon/${pokemon?.name}`),
    image: pokemon?.sprite ?? undefined
  };
}

export function typesSeo() {
  return {
    title: `Pokémon Types, Matchups, Moves & Weaknesses | ${SITE_NAME}`,
    description:
      "Browse Pokémon types and explore strengths, weaknesses, type matchups, Pokémon, and moves.",
    canonical: pageUrl("/types")
  };
}

export function typeSeo(typeName) {
  const name = formatName(typeName);

  return {
    title: `${name} Type Pokémon, Moves, Strengths & Weaknesses | ${SITE_NAME}`,
    description: `Explore ${name}-type Pokémon, moves, strengths, weaknesses, and type matchups.`,
    canonical: pageUrl(`/type/${typeName}`)
  };
}
