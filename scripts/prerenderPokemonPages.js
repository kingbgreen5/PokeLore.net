import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePokeloreAnalysis } from "../src/utils/pokeloreAnalysis.js";
import {
  getPokeloreLinePokemonLabels,
  linkifyPokeloreText
} from "../src/utils/pokeloreTextLinks.js";

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const indexPath = path.join(distDir, "index.html");
const pokemonDataDir = path.join(
  repoRoot,
  "public",
  "data",
  "pokemonData"
);
const routesPath = path.join(
  repoRoot,
  "public",
  "data",
  "pokemonRoutes.json"
);
const pokeloreAnalysisPath = path.join(
  repoRoot,
  "public",
  "data",
  "PokeloreAnalysis.json"
);
const pokeloreLinkTargetsPath = path.join(
  repoRoot,
  "public",
  "data",
  "pokeloreLinkTargets.json"
);
const pokemonDistDir = path.join(
  distDir,
  "pokemon"
);
const detailImageDir = path.join(
  repoRoot,
  "public",
  "images",
  "pokemon",
  "official",
  "detail"
);

const OFFICIAL_ARTWORK_PATTERN =
  /\/official-artwork\/(\d+)\.png(?:\?.*)?$/;
const RAW_SPRITE_PREFIX =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";

const typeColors = {
  bug: "#a8b820",
  dark: "#705848",
  dragon: "#7038f8",
  electric: "#f8d030",
  fairy: "#ee99ac",
  fighting: "#c03028",
  fire: "#f08030",
  flying: "#a890f0",
  ghost: "#705898",
  grass: "#78c850",
  ground: "#e0c068",
  ice: "#98d8d8",
  normal: "#a8a878",
  poison: "#a040a0",
  psychic: "#f85888",
  rock: "#b8a038",
  steel: "#b8b8d0",
  water: "#6890f0"
};

function readJson(filePath) {
  return JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );
}

function isNumericPokemonRouteResource(entryName) {
  return (
    /^\d+$/.test(entryName) ||
    /^\d+\.html$/.test(entryName)
  );
}

function findNumericPokemonStaticRoutes() {
  if (!fs.existsSync(pokemonDistDir)) {
    return [];
  }

  return fs
    .readdirSync(pokemonDistDir, {
      withFileTypes: true
    })
    .filter(entry =>
      isNumericPokemonRouteResource(entry.name)
    )
    .map(entry =>
      path.join(pokemonDistDir, entry.name)
    );
}

function removeNumericPokemonStaticRoutes() {
  findNumericPokemonStaticRoutes().forEach(
    routePath => {
      fs.rmSync(routePath, {
        force: true,
        recursive: true
      });
    }
  );
}

function assertNoNumericPokemonStaticRoutes() {
  const numericRoutes =
    findNumericPokemonStaticRoutes();

  if (numericRoutes.length === 0) {
    return;
  }

  throw new Error(
    [
      "Legacy numeric Pokemon static route detected:",
      ...numericRoutes.map(routePath =>
        path.relative(repoRoot, routePath)
      ),
      "",
      "Pokemon static routes must use canonical name slugs."
    ].join("\n")
  );
}

function assertCanonicalPrerenderRoutes(routes) {
  const pokemonRouteNames = Object.keys(
    routes.byName ?? {}
  );
  const numericRouteNames =
    pokemonRouteNames.filter(routeName =>
      /^\d+$/.test(routeName)
    );

  if (numericRouteNames.length > 0) {
    throw new Error(
      [
        "Numeric Pokemon prerender routes detected:",
        ...numericRouteNames
          .slice(0, 20)
          .map(routeName => `/pokemon/${routeName}`),
        numericRouteNames.length > 20
          ? `...and ${numericRouteNames.length - 20} more`
          : null,
        "",
        "Pokemon prerender routes must use canonical name slugs."
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return {
    total: pokemonRouteNames.length,
    nameBased: pokemonRouteNames.length,
    numeric: numericRouteNames.length
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function capitalizeWord(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatName(name) {
  return String(name ?? "")
    .split("-")
    .map(capitalizeWord)
    .join(" ");
}

function formatPokemonDisplayName(pokemon) {
  return (
    pokemon.displayName ??
    pokemon.formDisplayName ??
    formatName(pokemon.name)
  );
}

function formatHeightEnglish(height) {
  const totalInches = Math.round(
    (height / 10) * 39.3701
  );
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet}' ${inches}"`;
}

function formatHeightMetric(height) {
  return `${(height / 10).toFixed(1)} m`;
}

function formatWeightEnglish(weight) {
  const pounds = (weight / 10) * 2.20462;
  return `${pounds.toFixed(1)} lbs`;
}

function formatWeightMetric(weight) {
  return `${(weight / 10).toFixed(1)} kg`;
}

function formatFactValue(value) {
  return escapeHtml(
    value || "Currently Unknown"
  );
}

function renderLinkedTextHtml(parts) {
  return parts
    .flatMap(part =>
      String(part.text)
        .split(/(\n{2,})/)
        .filter(Boolean)
        .map(segment => {
          if (/^\n{2,}$/.test(segment)) {
            return "<br><br>";
          }

          return part.href
            ? `<a href="${escapeHtml(part.href)}">${escapeHtml(segment)}</a>`
            : escapeHtml(segment);
        })
    )
    .join("");
}

function applySelectedVariety(
  pokemonData,
  routeName
) {
  const selectedVariety =
    pokemonData.varieties?.find(
      variety => variety.name === routeName
    );

  if (!selectedVariety) {
    return pokemonData;
  }

  return {
    ...pokemonData,
    name: selectedVariety.name,
    id: selectedVariety.id,
    isDefaultForm:
      selectedVariety.isDefault,
    sprite:
      selectedVariety.sprite ??
      pokemonData.sprite,
    spriteFallback:
      selectedVariety.spriteFallback,
    types:
      selectedVariety.types ??
      pokemonData.types
  };
}

function getHeroImage(pokemon) {
  const match =
    pokemon.sprite?.match(
      OFFICIAL_ARTWORK_PATTERN
    );

  if (match) {
    const artworkId = match[1];
    const detailPath = path.join(
      detailImageDir,
      `${artworkId}.webp`
    );

    if (fs.existsSync(detailPath)) {
      return `/images/pokemon/official/detail/${artworkId}.webp`;
    }

    return `/images/pokemon/official/full/${artworkId}.png`;
  }

  if (
    pokemon.sprite?.startsWith(
      RAW_SPRITE_PREFIX
    )
  ) {
    const relativePath = pokemon.sprite
      .slice(RAW_SPRITE_PREFIX.length)
      .split("?", 1)[0]
      .split("/")
      .map(segment =>
        encodeURIComponent(
          decodeURIComponent(segment)
        )
      )
      .join("/");

    return `/images/pokemon/special/${relativePath}`;
  }

  return pokemon.sprite ?? "";
}

function findBannerAssets() {
  const assetsDir = path.join(
    distDir,
    "assets"
  );
  const files = fs.existsSync(assetsDir)
    ? fs.readdirSync(assetsDir)
    : [];

  function findAsset(prefix, extension) {
    const file = files.find(
      candidate =>
        candidate.startsWith(prefix) &&
        candidate.endsWith(extension)
    );

    return file ? `/assets/${file}` : "";
  }

  return {
    banner360: findAsset("Banner-360-", ".webp"),
    banner640: findAsset("Banner-640-", ".webp"),
    banner900: findAsset("Banner-900-", ".webp"),
    bannerFallback:
      findAsset("Banner-900-", ".png") ||
      findAsset("Banner-", ".png")
  };
}

function buildTypeBadges(types) {
  return (types ?? [])
    .map(type => {
      const color =
        typeColors[type] ?? "#777";

      return `
        <a class="prerender-type" href="/type/${escapeHtml(type)}" style="background:${color}">
          ${escapeHtml(type.toUpperCase())}
        </a>`;
    })
    .join("");
}

function buildAbilities(abilities) {
  return (abilities ?? [])
    .map(ability => {
      const abilityName =
        typeof ability === "string"
          ? ability
          : ability.name;
      const slug = String(abilityName)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");

      return `
        <a class="prerender-link-pill" href="/ability/${escapeHtml(slug)}">
          ${escapeHtml(formatName(abilityName))}
        </a>`;
    })
    .join("");
}

function buildStats(stats = {}) {
  const statRows = [
    ["HP", stats.hp],
    ["Attack", stats.attack],
    ["Defense", stats.defense],
    ["Sp. Atk", stats.specialAttack],
    ["Sp. Def", stats.specialDefense],
    ["Speed", stats.speed]
  ];

  return statRows
    .map(([label, value]) => {
      const numericValue =
        Number(value) || 0;
      const width = Math.min(
        100,
        Math.round((numericValue / 255) * 100)
      );

      return `
        <div class="prerender-stat">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(numericValue)}</strong>
          <i><b style="width:${width}%"></b></i>
        </div>`;
    })
    .join("");
}

function buildEvYield(evYield = {}) {
  const statRows = [
    ["HP", evYield.hp],
    ["Attack", evYield.attack],
    ["Defense", evYield.defense],
    ["Sp. Atk", evYield.specialAttack],
    ["Sp. Def", evYield.specialDefense],
    ["Speed", evYield.speed]
  ];

  const entries = statRows
    .filter(([, value]) => Number(value) > 0)
    .map(
      ([label, value]) =>
        `${Number(value)} ${label}`
    );

  if (!entries.length) {
    return "";
  }

  return `
          <p class="prerender-ev-yield">
            EV Yield: <strong>${escapeHtml(entries.join(", "))}</strong>
          </p>`;
}

function buildPrerenderArticle(
  heading,
  body,
  linkTargets,
  pokemon,
  excludedPokemonLabels,
  usedRoutes
) {
  if (!body) return "";

  const linkedBody = linkifyPokeloreText(
    body,
    linkTargets,
    pokemon,
    {
      excludedPokemonLabels,
      usedRoutes
    }
  );

  return `
          <article class="prerender-analysis-card">
            <h3>${escapeHtml(heading)}</h3>
            <p>${renderLinkedTextHtml(linkedBody)}</p>
          </article>`;
}

function buildBiologicalFacts(pokemon) {
  const facts = [
    ["Species", pokemon.genus],
    [
      "Height",
      `${formatHeightEnglish(pokemon.height)} (${formatHeightMetric(pokemon.height)})`
    ],
    [
      "Weight",
      `${formatWeightEnglish(pokemon.weight)} (${formatWeightMetric(pokemon.weight)})`
    ],
    [
      "Habitat",
      pokemon.habitat
        ? formatName(pokemon.habitat)
        : "Currently Unknown"
    ],
    ["Color", formatName(pokemon.color)],
    ["Body Style", formatName(pokemon.shape)]
  ];

  return facts
    .map(
      ([label, value]) => `
          <div class="prerender-biology-fact">
            <strong>${escapeHtml(label)}</strong>
            <span>${formatFactValue(value)}</span>
          </div>`
    )
    .join("");
}

function buildPokeloreSections(
  pokemon,
  analysis,
  linkTargets
) {
  if (!analysis) return "";

  const displayName =
    formatPokemonDisplayName(pokemon);
  const excludedPokemonLabels =
    getPokeloreLinePokemonLabels(analysis);
  const usedLinkRoutes = new Set();
  const usageContent = [
    buildPrerenderArticle(
      `Using ${displayName} in a Playthrough`,
      analysis.playthrough,
      linkTargets,
      pokemon,
      excludedPokemonLabels,
      usedLinkRoutes
    ),
    buildPrerenderArticle(
      `${displayName} in Competitive Pokemon`,
      analysis.competitive,
      linkTargets,
      pokemon,
      excludedPokemonLabels,
      usedLinkRoutes
    ),
    buildPrerenderArticle(
      `${displayName} in Nuzlockes`,
      analysis.nuzlocke,
      linkTargets,
      pokemon,
      excludedPokemonLabels,
      usedLinkRoutes
    )
  ].join("");

  return `
        <details class="prerender-collapsible">
          <summary>${escapeHtml(displayName)} Playthrough, Competitive, and Nuzlocke Usage</summary>
          ${usageContent}
        </details>
        <details class="prerender-collapsible">
          <summary>${escapeHtml(displayName)} Biology and Behavior</summary>
          ${buildPrerenderArticle(
            `${displayName} Biology and Behavior`,
            analysis.biologyAndBehavior,
            linkTargets,
            pokemon,
            excludedPokemonLabels,
            usedLinkRoutes
          )}
          <section class="prerender-analysis-card">
            <h3>${escapeHtml(displayName)} Biological Data</h3>
            <div class="prerender-biology-grid">
              ${buildBiologicalFacts(pokemon)}
            </div>
          </section>
        </details>`;
}

function buildPokemonDescriptionSection(
  pokemon,
  analysis,
  linkTargets
) {
  const description =
    analysis?.description?.trim();

  if (!description) return "";

  const displayName =
    formatPokemonDisplayName(pokemon);
  const excludedPokemonLabels =
    getPokeloreLinePokemonLabels(analysis);
  const linkedDescription =
    linkifyPokeloreText(
      description,
      linkTargets,
      pokemon,
      {
        excludedPokemonLabels,
        usedRoutes: new Set()
      }
    );

  return `
        <section class="prerender-description-card" aria-label="${escapeHtml(displayName)}'s Description">
          <p>${renderLinkedTextHtml(linkedDescription)}</p>
        </section>`;
}

function getFirstDexEntry(pokemon) {
  return pokemon.dexEntries?.[0]?.text ?? "";
}

function buildCriticalCss() {
  return `
    <style data-pokelore-prerender>
      #root {
        background: #16171d;
        color: #9ca3af;
        font-family: system-ui, "Segoe UI", Roboto, sans-serif;
      }

      .prerender-shell {
        box-sizing: border-box;
        min-height: 100svh;
        padding: 1.25rem 1rem 2rem;
        text-align: center;
      }

      .prerender-banner {
        display: block;
        margin: 0 auto 0.85rem;
        max-width: 900px;
        text-decoration: none;
        width: 90%;
      }

      .prerender-banner img {
        display: block;
        height: auto;
        width: 100%;
      }

      .prerender-nav {
        display: grid;
        gap: 0.85rem;
        justify-items: center;
        margin-bottom: 1.25rem;
      }

      .prerender-search,
      .prerender-menu {
        background: #2c2c2c;
        border: 2px solid #555;
        border-radius: 12px;
        box-sizing: border-box;
        color: white;
        font: inherit;
      }

      .prerender-search {
        max-width: 520px;
        padding: 0.65rem 0.9rem;
        width: 100%;
      }

      .prerender-menu {
        font-weight: 700;
        min-width: 190px;
        padding: 0.55rem 0.85rem;
      }

      .prerender-hero {
        display: grid;
        justify-items: center;
        margin: 0 auto;
        max-width: 540px;
      }

      .prerender-hero-img {
        color: transparent;
        font-size: 0;
        height: 250px;
        object-fit: contain;
        width: 250px;
      }

      .prerender-hero h1 {
        color: #f3f4f6;
        font-size: clamp(2.25rem, 8vw, 3.5rem);
        font-weight: 500;
        line-height: 1.1;
        margin: 1rem 0 0.8rem;
      }

      .prerender-types,
      .prerender-abilities {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
        margin-bottom: 1rem;
      }

      .prerender-type,
      .prerender-link-pill {
        border-radius: 999px;
        box-sizing: border-box;
        color: white;
        display: inline-flex;
        font-size: 0.8rem;
        font-weight: 800;
        line-height: 1;
        min-width: 4.75rem;
        padding: 0.52rem 0.85rem;
        text-decoration: none;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.28);
      }

      .prerender-link-pill {
        background: transparent;
        color: rgb(0, 202, 219);
        display: inline-block;
        font-size: 1rem;
        font-weight: 500;
      }

      .prerender-stats {
        margin: 0.5rem auto 0;
        max-width: 360px;
        width: 100%;
      }

      .prerender-stats h2 {
        color: #f3f4f6;
        font-size: 1.25rem;
        font-weight: 500;
        margin: 0 0 0.65rem;
      }

      .prerender-stat {
        align-items: center;
        display: grid;
        gap: 0.5rem;
        grid-template-columns: 5rem 2.5rem 1fr;
        margin: 0.25rem 0;
        text-align: left;
      }

      .prerender-stat strong {
        color: #f3f4f6;
        font-weight: 600;
        text-align: right;
      }

      .prerender-stat i {
        background: #30333b;
        border-radius: 999px;
        display: block;
        height: 0.45rem;
        overflow: hidden;
      }

      .prerender-stat b {
        background: #f08030;
        display: block;
        height: 100%;
      }

      .prerender-ev-yield {
        color: #f3f4f6;
        font-size: 0.95rem;
        margin: 0.15rem 0 0.55rem;
      }

      .prerender-entry {
        font-size: 0.95rem;
        margin: 1rem auto 0;
        max-width: 520px;
        opacity: 0.86;
      }

      .prerender-description-card {
        box-sizing: border-box;
        margin: 0 auto 1rem;
        max-width: 42rem;
        text-align: left;
        width: 100%;
      }

      .prerender-description-card p {
        font-size: 0.9rem;
        line-height: 1.6;
        margin: 0;
      }

      .prerender-description-card a {
        color: #00cadb;
        font-weight: 600;
        text-decoration: none;
      }

      .prerender-collapsible {
        border: 2px solid #706363;
        border-radius: 12px;
        box-sizing: border-box;
        margin: 1rem auto 0;
        max-width: 900px;
        padding: 0.75rem;
        text-align: left;
        width: 100%;
      }

      .prerender-collapsible summary {
        color: #f3f4f6;
        cursor: pointer;
        font-size: 1.35rem;
        font-weight: 500;
      }

      .prerender-analysis-card {
        background: #202020;
        border: 1px solid #555;
        border-radius: 8px;
        margin-top: 1rem;
        padding: 1rem;
      }

      .prerender-analysis-card h3 {
        color: #fab856;
        font-size: 1.15rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
      }

      .prerender-analysis-card p {
        line-height: 1.65;
        margin: 0;
      }

      .prerender-analysis-card a {
        color: #00cadb;
        font-weight: 600;
        text-decoration: none;
      }

      .prerender-biology-grid {
        display: grid;
        gap: 0.75rem;
        grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      }

      .prerender-biology-fact {
        background: #17171d;
        border: 1px solid #555;
        border-radius: 8px;
        padding: 0.85rem 1rem;
      }

      .prerender-biology-fact strong {
        color: #fab856;
        display: block;
        font-size: 0.8rem;
        margin-bottom: 0.25rem;
      }
    </style>`;
}

function buildBannerMarkup(assets) {
  if (!assets.bannerFallback) {
    return "";
  }

  const webpSources = [
    assets.banner360 &&
      `${assets.banner360} 360w`,
    assets.banner640 &&
      `${assets.banner640} 640w`,
    assets.banner900 &&
      `${assets.banner900} 900w`
  ]
    .filter(Boolean)
    .join(", ");

  return `
    <a class="prerender-banner" href="/">
      <picture>
        ${
          webpSources
            ? `<source type="image/webp" srcset="${escapeHtml(webpSources)}" sizes="(max-width: 720px) 90vw, 900px">`
            : ""
        }
        <img src="${escapeHtml(assets.bannerFallback)}" alt="Banner" width="900" height="224" decoding="async">
      </picture>
    </a>`;
}

function buildPokemonShell(
  pokemon,
  routeName,
  bannerAssets,
  pokeloreAnalyses,
  pokeloreLinkTargets
) {
  const displayName =
    formatPokemonDisplayName(pokemon);
  const heroImage = getHeroImage(pokemon);
  const dexNumber = String(pokemon.id).padStart(
    4,
    "0"
  );
  const dexEntry = getFirstDexEntry(pokemon);
  const pokeloreAnalysis =
    resolvePokeloreAnalysis(
      pokeloreAnalyses,
      pokemon
    );

  return `
    <div class="prerender-shell">
      ${buildBannerMarkup(bannerAssets)}
      <nav class="prerender-nav" aria-label="Site navigation preview">
        <input class="prerender-search" type="search" placeholder="Search Pokemon, items, moves, locations..." aria-label="Search" disabled>
        <button class="prerender-menu" type="button">Menu: Pokemon</button>
      </nav>
      <main class="prerender-hero">
        ${buildPokemonDescriptionSection(
          pokemon,
          pokeloreAnalysis,
          pokeloreLinkTargets
        )}
        <img class="prerender-hero-img" src="${escapeHtml(heroImage)}" alt="${escapeHtml(displayName)}" width="250" height="250" fetchpriority="high" loading="eager" decoding="async">
        <h1>${escapeHtml(displayName)}</h1>
        <p>#${escapeHtml(dexNumber)}</p>
        <div class="prerender-types">${buildTypeBadges(pokemon.types)}</div>
        <div class="prerender-abilities">${buildAbilities(pokemon.abilities)}</div>
        <section class="prerender-stats" aria-label="Base stats">
          <h2>Base Stats</h2>
          ${buildEvYield(pokemon.evYield)}
          ${buildStats(pokemon.stats)}
        </section>
        ${
          dexEntry
            ? `<p class="prerender-entry">${escapeHtml(dexEntry)}</p>`
            : ""
        }
        ${buildPokeloreSections(
          pokemon,
          pokeloreAnalysis,
          pokeloreLinkTargets
        )}
      </main>
    </div>`;
}

function injectHeadTags(
  html,
  pokemon,
  routeName,
  heroImage
) {
  const displayName =
    formatPokemonDisplayName(pokemon);
  const title = `${displayName} - PokeLore`;
  const description = `${displayName} Pokemon details, type matchups, base stats, abilities, evolutions, locations, and learnsets.`;
  const canonical = `https://pokelore.net/pokemon/${routeName}`;
  const tags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <link rel="preload" as="image" href="${escapeHtml(heroImage)}" fetchpriority="high">
    ${buildCriticalCss()}
  `;

  return html
    .replace(
      /<title>.*?<\/title>/,
      ""
    )
    .replace(
      /<\/head>/,
      `${tags}\n  </head>`
    );
}

function writePokemonPage(
  template,
  routeName,
  pokemon,
  bannerAssets,
  pokeloreAnalyses,
  pokeloreLinkTargets
) {
  const heroImage = getHeroImage(pokemon);
  const shell = buildPokemonShell(
    pokemon,
    routeName,
    bannerAssets,
    pokeloreAnalyses,
    pokeloreLinkTargets
  );
  const html = injectHeadTags(
    template,
    pokemon,
    routeName,
    heroImage
  ).replace(
    '<div id="root"></div>',
    `<div id="root">${shell}</div>`
  );
  const routeDir = path.join(
    distDir,
    "pokemon",
    routeName
  );

  fs.mkdirSync(routeDir, {
    recursive: true
  });
  fs.writeFileSync(
    path.join(routeDir, "index.html"),
    html
  );
}

function main() {
  if (!fs.existsSync(indexPath)) {
    throw new Error(
      "dist/index.html not found. Run this after vite build."
    );
  }

  const template = fs.readFileSync(
    indexPath,
    "utf8"
  );
  const routes = readJson(routesPath);
  const routeAudit =
    assertCanonicalPrerenderRoutes(routes);
  const pokeloreAnalyses = readJson(
    pokeloreAnalysisPath
  );
  const pokeloreLinkTargets = readJson(
    pokeloreLinkTargetsPath
  );
  const bannerAssets = findBannerAssets();

  removeNumericPokemonStaticRoutes();

  let written = 0;

  for (const [
    routeName,
    pokemonId
  ] of Object.entries(routes.byName ?? {})) {
    const dataPath = path.join(
      pokemonDataDir,
      `${pokemonId}.json`
    );

    if (!fs.existsSync(dataPath)) {
      continue;
    }

    const pokemonData = readJson(dataPath);
    const pokemon = applySelectedVariety(
      pokemonData,
      routeName
    );

    writePokemonPage(
      template,
      routeName,
      pokemon,
      bannerAssets,
      pokeloreAnalyses,
      pokeloreLinkTargets
    );
    written++;
  }

  console.log(
    `Prerendered ${written} Pokemon detail pages.`
  );
  console.log(
    [
      "Pokemon prerender route audit:",
      `total=${routeAudit.total}`,
      `nameBased=${routeAudit.nameBased}`,
      `numeric=${routeAudit.numeric}`
    ].join(" ")
  );

  assertNoNumericPokemonStaticRoutes();
}

main();
