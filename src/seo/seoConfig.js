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

function heightToInches(height) {
  return Math.round((height / 10) * 39.3701);
}

function formatFeetInches(totalInches) {
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet}' ${inches}"`;
}

function formatMeters(height) {
  return `${(Number(height) / 10).toFixed(1)} m`;
}

function formatKilograms(weight) {
  return `${(Number(weight) / 10).toFixed(1)} kg`;
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

export function teamCoverageSeo() {
  const title =
    `Team Coverage Calculator | ${SITE_NAME}`;
  const description =
    "Use the Team Coverage Calculator to build a Pokemon party, choose a game, and see which opposing types your team can hit for super-effective damage with their Level-Up learnset.";
  const canonical = pageUrl(
    "/team-coverage"
  );
  const calculatorId =
    `${canonical}#team-coverage-calculator`;

  return {
    title,
    description,
    canonical,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: title,
          description,
          mainEntity: {
            "@id": calculatorId
          }
        },
        {
          "@type": "WebApplication",
          "@id": calculatorId,
          name: "Team Coverage Calculator",
          url: canonical,
          applicationCategory:
            "GameApplication",
          operatingSystem: "Any",
          browserRequirements:
            "Requires JavaScript",
          description,
          isAccessibleForFree: true,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD"
          }
        }
      ]
    }
  };
}

export function singleTypeCoverageSeo() {
  const title =
    `Single Type Coverage Calculator | ${SITE_NAME}`;
  const description =
    "Use the Single Type Coverage Calculator to choose a Pokemon game and defensive type, then find available Pokemon with level-up moves that hit that type for super-effective damage.";
  const canonical = pageUrl(
    "/single-type-coverage"
  );
  const calculatorId =
    `${canonical}#single-type-coverage-calculator`;

  return {
    title,
    description,
    canonical,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: title,
          description,
          mainEntity: {
            "@id": calculatorId
          }
        },
        {
          "@type": "WebApplication",
          "@id": calculatorId,
          name: "Single Type Coverage Calculator",
          url: canonical,
          applicationCategory:
            "GameApplication",
          operatingSystem: "Any",
          browserRequirements:
            "Requires JavaScript",
          description,
          isAccessibleForFree: true,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD"
          }
        }
      ]
    }
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
    title: `Pokémon Topics, Item Locations & Lore Guides | ${SITE_NAME}`,
    description:
      "Explore curated Pokémon topics, item-location guides, habitats, behavior, rarity, danger, and Pokédex lore.",
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
  const canonical =
    pageUrl(`/pokemon/${pokemon?.name}`);
  const dexNumber =
    pokemon?.id
      ? String(pokemon.id).padStart(3, "0")
      : null;
  const dexSuffix =
    pokemon?.isDefaultForm && dexNumber
      ? ` — #${dexNumber}`
      : "";
  const heightInches =
    Number.isFinite(Number(pokemon?.height))
      ? heightToInches(pokemon.height)
      : null;
  const heightEnglish =
    heightInches
      ? formatFeetInches(heightInches)
      : null;
  const heightMetric =
    Number.isFinite(Number(pokemon?.height))
      ? formatMeters(pokemon.height)
      : null;
  const weightMetric =
    Number.isFinite(Number(pokemon?.weight))
      ? formatKilograms(pokemon.weight)
      : null;
  const typeNames =
    Array.isArray(pokemon?.types)
      ? pokemon.types
          .map(type =>
            typeof type === "string"
              ? formatName(type)
              : formatName(type?.type?.name ?? type?.name)
          )
          .filter(Boolean)
      : [];
  const sizeDescription =
    heightEnglish && heightMetric
      ? ` ${name} is listed at ${heightEnglish} (${heightMetric}) with an in-chart visual size comparison.`
      : "";
  const description =
    pokemon?.isDefaultForm && pokemon?.id
      ? `Explore ${name}'s stats, moves, abilities, evolution details, type matchups, locations, National Pokédex number ${pokemon.id}, and size chart.${sizeDescription}`
      : `Explore ${name}'s stats, moves, abilities, evolution details, type matchups, locations, and size chart.${sizeDescription}`;
  const title =
    `${name} Stats, Moves, Abilities, Locations, and Size Chart | ${SITE_NAME}${dexSuffix}`;
  const pokemonId =
    `${canonical}#pokemon`;
  const sizeComparisonId =
    `${canonical}#size-comparison`;
  const additionalProperty = [
    pokemon?.id
      ? {
          "@type": "PropertyValue",
          name: "National Pokédex number",
          value: pokemon.id
        }
      : null,
    typeNames.length > 0
      ? {
          "@type": "PropertyValue",
          name: "Pokémon type",
          value: typeNames.join(", ")
        }
      : null,
    heightEnglish && heightMetric
      ? {
          "@type": "PropertyValue",
          name: "Listed height",
          value: `${heightEnglish} (${heightMetric})`
        }
      : null,
    weightMetric
      ? {
          "@type": "PropertyValue",
          name: "Listed weight",
          value: weightMetric
        }
      : null
  ].filter(Boolean);

  return {
    title,
    description,
    canonical,
    image: pokemon?.sprite ?? undefined,
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: title,
          description,
          mainEntity: {
            "@id": pokemonId
          },
          hasPart: {
            "@id": sizeComparisonId
          },
          breadcrumb: {
            "@id": `${canonical}#breadcrumb`
          }
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${canonical}#breadcrumb`,
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: SITE_NAME,
              item: SITE_URL
            },
            {
              "@type": "ListItem",
              position: 2,
              name,
              item: canonical
            }
          ]
        },
        {
          "@type": "Thing",
          "@id": pokemonId,
          name,
          identifier: pokemon?.id
            ? `National Pokédex #${pokemon.id}`
            : undefined,
          image: pokemon?.sprite ?? undefined,
          description,
          height:
            heightEnglish && heightMetric
              ? `${heightEnglish} (${heightMetric})`
              : undefined,
          weight: weightMetric,
          additionalProperty
        },
        {
          "@type": "CreativeWork",
          "@id": sizeComparisonId,
          name: `${name} size comparison`,
          about: {
            "@id": pokemonId
          },
          description:
            heightEnglish && heightMetric
              ? `${name} is listed at ${heightEnglish} (${heightMetric}). The page includes a visual Pokémon size comparison.`
              : `The page includes a visual Pokémon size comparison for ${name}.`,
          isPartOf: {
            "@id": `${canonical}#webpage`
          }
        }
      ]
    }
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
