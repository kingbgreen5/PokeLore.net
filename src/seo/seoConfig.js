import { formatPokemonDisplayName }
from "../utils/pokemonNames.js";
import { getPokemonUrl }
from "../utils/pokemonUrls.js";
import {
  DYNAMAX_CRYSTAL_GUIDE_PATH,
  formatDynamaxPokemonList,
  getDynamaxCrystalData,
  getDynamaxCrystalDisplayName,
  isDynamaxCrystalItem
} from "../utils/dynamaxCrystals.js";
import { getFossilItemData } from "../data/fossilItems.js";

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

export function absoluteUrl(value = "") {
  if (!value) return "";

  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return "";
  }
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
  const title =
    "PokéLore.net | Pokémon Pokédex, Tools & Game Guides";
  const description =
    "PokéLore.net is a Pokémon Pokédex and game resource with stats, moves, evolutions, weaknesses, encounter locations, game analysis, team building, EV training tools, Feebas calculators, and more.";
  const canonical = `${SITE_URL}/`;

  return {
    title,
    description,
    canonical,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: canonical,
      name: SITE_NAME,
      alternateName: [
        "PokéLore.net",
        "PokeLore.net"
      ]
    }
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
    `Pokémon Team Builder & Type Coverage Calculator | ${SITE_NAME}`;
  const description =
    "Build a Pokémon playthrough team for any game. Check offensive coverage, weaknesses, resistances, learnset levels and TM moves, then find suggested teammates that fill your team's gaps.";
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
          name: "Pokémon Team Builder & Type Coverage Calculator",
          url: canonical,
          applicationCategory:
            "GameApplication",
          operatingSystem: "Any",
          browserRequirements:
            "Requires JavaScript",
          description,
          featureList: [
            "Choose a Pokémon game version for playthrough team building.",
            "Build a six-Pokémon party and calculate offensive type coverage.",
            "Check team weaknesses, resistances, and immunities.",
            "Filter learnset coverage by move power, learned level, and TM moves.",
            "Identify missing offensive and defensive coverage.",
            "Suggest available teammates that fill the team's gaps.",
            "Sort suggestions with PokeLore Suggested, coverage, stats, or National Dex number.",
            "Filter suggested teammates by legendary and trade evolution availability."
          ],
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

export function toolsSeo() {
  return {
    title: `Pokemon Tools and Calculators | ${SITE_NAME}`,
    description:
      "Use Pokemon tools for team coverage, EV training routes, Feebas tiles, and single type coverage planning.",
    canonical: pageUrl("/tools")
  };
}

export function evTrainingRoutesSeo() {
  const title =
    "Best Pokémon EV Training Locations Calculator | PokéLore";
  const description =
    "Find the best Pokémon EV training locations by game. Compare routes for HP, Attack, Defense, Sp. Atk, Sp. Def, and Speed EVs, plus Power Item tips.";
  const canonical = pageUrl(
    "/ev-training-routes"
  );
  const toolId =
    `${canonical}#ev-training-routes-tool`;

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
            "@id": toolId
          }
        },
        {
          "@type": "WebApplication",
          "@id": toolId,
          name: "Best Pokémon EV Training Locations Calculator",
          url: canonical,
          applicationCategory:
            "GameApplication",
          operatingSystem: "Any",
          browserRequirements:
            "Requires JavaScript",
          description,
          featureList: [
            "Choose a Pokemon stat to train.",
            "Choose a Pokemon game version.",
            "Show the top ten wild encounter locations for the selected EV stat.",
            "Compare matching encounter chance, clean target-only chance, and expected EV per encounter.",
            "List the wild Pokemon contributing to each route score."
          ],
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
          featureList: [
            "Choose a Pokemon game version and defensive type.",
            "Find available Pokemon with level-up moves that hit the selected type super-effectively.",
            "Sort suggestions by National Dex number.",
            "Sort suggestions by broad type coverage.",
            "Prioritize suggestions with direct selected-type coverage.",
            "Sort suggestions by highest base stat total.",
            "Sort suggestions by HP, Attack, Defense, Special Attack, Special Defense, or Speed."
          ],
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
  const crystalData =
    getDynamaxCrystalData(item);
  const fossilData =
    getFossilItemData(slug);
  const isDynamaxCrystal =
    typeof item === "string"
      ? Boolean(crystalData) ||
        item.startsWith("dynamax-crystal-")
      : isDynamaxCrystalItem(item);

  if (isDynamaxCrystal) {
    const crystalName =
      getDynamaxCrystalDisplayName(item) ||
      name;
    const image =
      typeof item === "string"
        ? undefined
        : item?.sprite ?? undefined;

    if (
      crystalData?.releaseStatus === "released"
    ) {
      const pokemonList =
        formatDynamaxPokemonList(
          crystalData.raidPokemon
        );

      return {
        title: `${crystalName} Dynamax Crystal Location and Raid | ${SITE_NAME}`,
        description: `Learn what the ${crystalName} Dynamax Crystal does, how it was originally obtained, and how it activates a ${crystalData.raidType} Max Raid Battle featuring ${pokemonList} in Pokemon Sword and Shield.`,
        canonical: pageUrl(`/item/${slug}`),
        image
      };
    }

    return {
      title: `${crystalName} Dynamax Crystal - Unused Item Data | ${SITE_NAME}`,
      description: `${crystalName} is an unused Dynamax Crystal found in Pokemon Sword and Shield's game data. It was never officially distributed and cannot be obtained normally.`,
      canonical: pageUrl(`/item/${slug}`),
      image,
      robots: "noindex, follow"
    };
  }

  if (fossilData) {
    const restoredPokemonNames =
      fossilData.restoredPokemon
        .map(pokemon => pokemon.displayName)
        .join(", ");
    const primaryRestoredPokemon =
      fossilData.restoredPokemon[
        fossilData.restoredPokemon.length - 1
      ]?.displayName ??
      fossilData.restoredPokemon[0]
        ?.displayName;
    const titleTarget =
      fossilData.restoredPokemon.length > 1
        ? primaryRestoredPokemon
        : restoredPokemonNames;
    const isGalarFossil =
      slug?.startsWith("fossilized-");

    return {
      title: isGalarFossil
        ? `${name} Location, Combinations & Galar Fossil Guide | ${SITE_NAME}`
        : `${name} Location, Revival & ${titleTarget} Guide | ${SITE_NAME}`,
      description: isGalarFossil
        ? `Learn where to find ${name}, which Galar fossil Pokemon it can restore, and how it connects to ${restoredPokemonNames} in Pokemon Sword and Shield.`
        : `Find every ${name} location, learn where to revive it, and see how it connects to ${restoredPokemonNames} across Pokemon games.`,
      canonical: pageUrl(`/item/${slug}`),
      image:
        typeof item === "string"
          ? undefined
          : item?.sprite ?? undefined
    };
  }

  if (
    typeof item !== "string" &&
    item?.acquisition?.length > 0
  ) {
    return {
      title: `${name} Locations, Uses & Details | ${SITE_NAME}`,
      description: `Find ${name} locations across Pokemon games, plus acquisition methods, requirements, repeatable sources, effects, uses, and game-specific details.`,
      canonical: pageUrl(`/item/${slug}`),
      image:
        typeof item === "string"
          ? undefined
          : item?.sprite ?? undefined
    };
  }

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

export function dynamaxCrystalsGuideSeo() {
  return {
    title: `Dynamax Crystals Guide: All Released Crystal Raids | ${SITE_NAME}`,
    description:
      "Learn how Dynamax Crystals work in Pokemon Sword and Shield, how to use them at Watchtower Lair, and which 12 crystals were officially released.",
    canonical: pageUrl(DYNAMAX_CRYSTAL_GUIDE_PATH)
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

export function newsArchiveSeo() {
  return {
    title: `Pokemon News | ${SITE_NAME}`,
    description:
      "Read the latest Pokemon news, official updates, analysis, and carefully labeled rumors from PokeLore.",
    canonical: pageUrl("/news")
  };
}

export function newsSeo(article) {
  const canonical = pageUrl(`/news/${article?.slug}`);
  const description =
    article?.excerpt ||
    article?.subtitle ||
    "Read the latest Pokemon news on PokeLore.";
  const image =
    absoluteUrl(
      article?.hero?.src ||
        article?.thumbnail ||
        article?.hero?.thumbnail
    ) || undefined;
  const keywords = Array.isArray(article?.tags)
    ? article.tags
    : [];
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article?.title,
    description,
    image: image ? [image] : undefined,
    datePublished: article?.publishedAt,
    dateModified:
      article?.updatedAt || article?.publishedAt,
    author: article?.author
      ? {
          "@type": "Person",
          name: article.author
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonical
    },
    articleSection:
      article?.category || undefined,
    keywords:
      keywords.length > 0
        ? keywords
        : undefined
  };

  Object.keys(structuredData).forEach(key => {
    if (structuredData[key] === undefined) {
      delete structuredData[key];
    }
  });

  return {
    title: `${article?.title ?? "Pokemon News"} | ${SITE_NAME}`,
    description,
    canonical,
    image,
    type: "article",
    articlePublishedTime: article?.publishedAt,
    articleModifiedTime:
      article?.updatedAt || article?.publishedAt,
    structuredData
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
        topic?.excerpt ??
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

export function pokemonSeoTitle(pokemon) {
  const name =
    formatPokemonDisplayName(pokemon);

  return `${name} Pokédex: Stats, Moves, Evolution & Analysis | ${SITE_NAME}`;
}

export function pokemonSeoDescription(pokemon) {
  const name =
    formatPokemonDisplayName(pokemon);

  return `${name} stats, moves, weaknesses, evolution, locations, Pokédex entries, plus playthrough, competitive and Nuzlocke analysis—all in one place.`;
}

export function pokemonSeo(pokemon) {
  const name =
    formatPokemonDisplayName(pokemon);
  const canonical =
    pageUrl(getPokemonUrl(pokemon) ?? "/");
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
  const structuredDataDescription =
    `Explore ${name}'s stats, moves, abilities, evolution details, type matchups, locations, and size chart.${sizeDescription}`;
  const description =
    pokemonSeoDescription(pokemon);
  const title =
    pokemonSeoTitle(pokemon);
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
          description:
            structuredDataDescription,
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
          description:
            structuredDataDescription,
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
