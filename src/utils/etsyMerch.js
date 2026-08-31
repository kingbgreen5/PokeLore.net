import { etsyAds } from "../data/etsyAds";
import {
  etsyUrlTagPrefixes,
  etsyUrlTags
} from "../data/etsyUrlTags";

export const GENERIC_ETSY_TAGS = new Set([
  "ad",
  "article",
  "location",
  "merch",
  "merchandise",
  "page",
  "pokemon",
  "promo",
  "tool"
]);

const GENERATION_REGION_TAGS = {
  "generation-i": "kanto",
  "generation-ii": "johto",
  "generation-iii": "hoenn",
  "generation-iv": "sinnoh",
  "generation-v": "unova",
  "generation-vi": "kalos",
  "generation-vii": "alola",
  "generation-viii": "galar",
  "generation-ix": "paldea"
};

const NATIONAL_DEX_REGION_RANGES = [
  {
    max: 151,
    region: "kanto"
  },
  {
    max: 251,
    region: "johto"
  },
  {
    max: 386,
    region: "hoenn"
  },
  {
    max: 493,
    region: "sinnoh"
  },
  {
    max: 649,
    region: "unova"
  },
  {
    max: 721,
    region: "kalos"
  },
  {
    max: 809,
    region: "alola"
  },
  {
    max: 905,
    region: "galar"
  },
  {
    max: Infinity,
    region: "paldea"
  }
];

export function normalizeEtsyTag(tag) {
  return String(tag ?? "")
    .trim()
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueNormalizedTags(tags) {
  return Array.from(
    new Set(
      (tags ?? [])
        .map(normalizeEtsyTag)
        .filter(Boolean)
    )
  );
}

export function getPokemonRegionTag(pokemonOrId) {
  if (
    pokemonOrId &&
    typeof pokemonOrId === "object"
  ) {
    const generationRegion =
      GENERATION_REGION_TAGS[
        normalizeEtsyTag(pokemonOrId.generation)
      ];

    if (generationRegion) {
      return generationRegion;
    }
  }

  const nationalDexId =
    typeof pokemonOrId === "object"
      ? Number(pokemonOrId?.id)
      : Number(pokemonOrId);

  if (!Number.isFinite(nationalDexId)) {
    return null;
  }

  return NATIONAL_DEX_REGION_RANGES.find(
    range => nationalDexId <= range.max
  )?.region ?? null;
}

export function getEtsyPokemonTags(pokemon) {
  if (!pokemon) {
    return [];
  }

  return uniqueNormalizedTags([
    "pokemon",
    pokemon.name,
    pokemon.species,
    getPokemonRegionTag(pokemon),
    ...(pokemon.types ?? [])
  ]);
}

function normalizePathname(pathname) {
  if (!pathname) {
    return "/";
  }

  const normalizedPath =
    String(pathname).split(/[?#]/)[0] || "/";

  return normalizedPath.length > 1
    ? normalizedPath.replace(/\/+$/g, "")
    : normalizedPath;
}

export function getEtsyUrlTags(
  pathname,
  {
    exactTags = etsyUrlTags,
    prefixTags = etsyUrlTagPrefixes
  } = {}
) {
  const normalizedPath =
    normalizePathname(pathname);
  const tags = [
    ...(exactTags[normalizedPath] ?? [])
  ];

  for (const rule of prefixTags ?? []) {
    const rulePrefix =
      rule?.prefix &&
      normalizePathname(rule.prefix);

    if (
      rulePrefix &&
      (normalizedPath === rulePrefix ||
        normalizedPath.startsWith(
          `${rulePrefix}/`
        ))
    ) {
      tags.push(...(rule.tags ?? []));
    }
  }

  return uniqueNormalizedTags(tags);
}

export function getEtsyPageTags({
  pathname,
  pokemon
} = {}) {
  return uniqueNormalizedTags([
    ...getEtsyPokemonTags(pokemon),
    ...getEtsyUrlTags(pathname)
  ]);
}

export function getMeaningfulEtsyTags(
  tags,
  genericTags = GENERIC_ETSY_TAGS
) {
  return uniqueNormalizedTags(tags).filter(
    tag => !genericTags.has(tag)
  );
}

export function isDisplayableEtsyAd(ad) {
  return Boolean(
    ad &&
      !ad.disabled &&
      ad.id &&
      ad.listingId &&
      Array.isArray(ad.tags) &&
      ad.tags.length > 0 &&
      ad.img &&
      ad.link
  );
}

export function getEligibleEtsyAds(
  pageTags,
  ads = etsyAds
) {
  const meaningfulPageTags = new Set(
    getMeaningfulEtsyTags(pageTags)
  );

  if (meaningfulPageTags.size === 0) {
    return [];
  }

  return (ads ?? []).filter(ad => {
    if (!isDisplayableEtsyAd(ad)) {
      return false;
    }

    const meaningfulAdTags =
      getMeaningfulEtsyTags(ad.tags);

    return meaningfulAdTags.some(tag =>
      meaningfulPageTags.has(tag)
    );
  });
}

export function selectEtsyAd(
  pageTags,
  {
    ads = etsyAds,
    random = Math.random
  } = {}
) {
  const eligibleAds =
    getEligibleEtsyAds(pageTags, ads);

  if (eligibleAds.length === 0) {
    return null;
  }

  const selectedIndex = Math.min(
    eligibleAds.length - 1,
    Math.floor(random() * eligibleAds.length)
  );

  return eligibleAds[selectedIndex];
}

function getEtsyMerchEventPayload({
  ad,
  pagePath,
  placement
}) {
  return {
    ad_id: ad.id,
    listing_id: ad.listingId,
    page_path: pagePath,
    placement
  };
}

export function trackEtsyMerchEvent(
  eventName,
  {
    ad,
    pagePath,
    placement
  }
) {
  if (
    typeof window === "undefined" ||
    typeof window.gtag !== "function" ||
    !ad
  ) {
    return false;
  }

  try {
    window.gtag(
      "event",
      eventName,
      getEtsyMerchEventPayload({
        ad,
        pagePath,
        placement
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function trackEtsyMerchClick(args) {
  return trackEtsyMerchEvent(
    "etsy_merch_click",
    args
  );
}

export function trackEtsyMerchImpression(args) {
  return trackEtsyMerchEvent(
    "etsy_merch_impression",
    args
  );
}
