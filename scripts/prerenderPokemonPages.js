import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePokeloreAnalysis } from "../src/utils/pokeloreAnalysis.js";
import {
  pokemonSeoDescription,
  pokemonSeoTitle
} from "../src/seo/seoConfig.js";
import {
  getPokeloreLinePokemonLabels,
  linkifyPokeloreText
} from "../src/utils/pokeloreTextLinks.js";
import {
  formatPokemonDisplayName as formatSitePokemonDisplayName,
  getRegionalFormKey
} from "../src/utils/pokemonNames.js";
import {
  formatDamageMultiplier,
  formatTypeName,
  getDefensiveMatchupGroups
} from "../src/utils/typeEffectiveness.js";
import {
  buildEvolutionDisplayModel,
  collectPokemonSummaries,
  getEvolutionOverride,
  getEvolutionSummaryText,
  getFallbackPokemonSummary,
  getVersionNotes,
  getVisibleFormEvolutionPaths
} from "../src/utils/evolutionDisplay.js";
import {
  getLearnsetCandidateIds,
  getLatestLevelUpLearnsetPreview,
  hasLearnsetMoves
} from "../src/utils/learnsetDisplay.js";
import {
  ALL_ENCOUNTER_VERSIONS,
  filterEncounterLocationsByVersion,
  formatEncounterConditions,
  formatChance,
  formatEncounterLabel,
  formatEncounterLevelRange,
  formatEncounterMethodName,
  formatEncounterSummary,
  formatEncounterVersionName,
  getEncounterSummary,
  getGroupedEncounterVersions,
  getUniqueEncounterRecords,
  getPokemonEncounterCandidateIds,
  hasEncounterLocations
} from "../src/utils/encounterDisplay.js";

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
const movesIndexPath = path.join(
  repoRoot,
  "public",
  "data",
  "movesIndex.json"
);
const pokemonLearnsetsDir = path.join(
  repoRoot,
  "public",
  "data",
  "pokemonLearnsets"
);
const pokemonEncountersDir = path.join(
  repoRoot,
  "public",
  "data",
  "pokemonEncounters"
);
const evolutionChainsDir = path.join(
  repoRoot,
  "public",
  "data",
  "evolutionChains"
);
const evolutionMethodOverridesPath = path.join(
  repoRoot,
  "public",
  "data",
  "evolutionMethodOverrides.json"
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
const typeBadgeSourceDir = path.join(
  repoRoot,
  "src",
  "assets",
  "Type Badges"
);
const typeBadgeDistDir = path.join(
  distDir,
  "assets",
  "type-badges"
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

function escapeJsonForScript(value) {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

function buildMovesMap(movesIndex) {
  if (Array.isArray(movesIndex)) {
    return Object.fromEntries(
      movesIndex.map(move => [
        move.name,
        move
      ])
    );
  }

  return movesIndex ?? {};
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

function getTypeBadgeImagePath(type) {
  return `/assets/type-badges/${String(type).toUpperCase()}.png`;
}

function copyTypeBadgeAssets() {
  fs.mkdirSync(typeBadgeDistDir, {
    recursive: true
  });

  Object.keys(typeColors).forEach(type => {
    const fileName = `${type.toUpperCase()}.png`;
    const sourcePath = path.join(
      typeBadgeSourceDir,
      fileName
    );
    const outputPath = path.join(
      typeBadgeDistDir,
      fileName
    );

    if (!fs.existsSync(sourcePath)) {
      throw new Error(
        `Missing type badge image: ${sourcePath}`
      );
    }

    fs.copyFileSync(sourcePath, outputPath);
  });
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

function buildTypeEffectivenessGroup(
  title,
  matchups
) {
  if (!matchups.length) {
    return "";
  }

  return `
          <section class="prerender-matchup-group">
            <h3>${escapeHtml(title)}</h3>
            <ul>
              ${matchups
                .map(matchup => {
                  const typeName =
                    matchup.typeName ??
                    formatTypeName(
                      matchup.type
                    );
                  const multiplierLabel =
                    matchup.multiplierLabel ??
                    formatDamageMultiplier(
                      matchup.multiplier
                    );

                  return `
                <li>
                  <a href="/type/${escapeHtml(matchup.type)}" aria-label="${escapeHtml(`${typeName} attacking moves deal ${multiplierLabel} damage`)}">
                    <strong>${escapeHtml(multiplierLabel)}</strong>
                    <img src="${escapeHtml(getTypeBadgeImagePath(matchup.type))}" alt="${escapeHtml(`${typeName} type`)}" width="70" height="24" decoding="async">
                  </a>
                </li>`;
                })
                .join("")}
            </ul>
          </section>`;
}

function buildTypeEffectivenessSection(
  pokemon
) {
  const displayName =
    formatSitePokemonDisplayName(pokemon);
  const groups =
    getDefensiveMatchupGroups(
      pokemon.types
    );
  const groupMarkup = [
    buildTypeEffectivenessGroup(
      "Weak To",
      groups.weaknesses
    ),
    buildTypeEffectivenessGroup(
      "Resists",
      groups.resistances
    ),
    buildTypeEffectivenessGroup(
      "Immune To",
      groups.immunities
    )
  ].join("");

  if (!groupMarkup.trim()) {
    return "";
  }

  return `
        <section class="prerender-type-effectiveness" aria-labelledby="prerender-type-effectiveness-heading">
          <h2 id="prerender-type-effectiveness-heading">${escapeHtml(displayName)}'s Weaknesses and Resistances</h2>
          <div class="prerender-matchup-grid">
            ${groupMarkup}
          </div>
        </section>`;
}

function getEvolutionLinkUrl(pokemon) {
  return `/pokemon/${encodeURIComponent(
    pokemon?.name ?? ""
  )}`;
}

function getMethodPartHref(part) {
  if (!part.slug) {
    return null;
  }

  if (part.type === "item") {
    return `/item/${encodeURIComponent(part.slug)}`;
  }

  if (part.type === "move") {
    return `/move/${encodeURIComponent(part.slug)}`;
  }

  if (part.type === "location") {
    return `/location/${encodeURIComponent(part.slug)}`;
  }

  if (part.type === "topic") {
    return `/topic/${encodeURIComponent(part.slug)}`;
  }

  return null;
}

function renderEvolutionMethodPartsHtml(parts) {
  return parts
    .map(part => {
      const text = part.text ?? "";
      const href = getMethodPartHref(part);

      return href
        ? `<a href="${escapeHtml(href)}">${escapeHtml(text)}</a>`
        : escapeHtml(text);
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPrerenderEvolutionCard(
  pokemon
) {
  const displayName =
    formatSitePokemonDisplayName(pokemon);
  const image = getHeroImage(pokemon);

  return `
                <a class="prerender-evolution-card" href="${escapeHtml(getEvolutionLinkUrl(pokemon))}">
                  ${
                    image
                      ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(displayName)}" width="90" height="90" loading="lazy" decoding="async">`
                      : ""
                  }
                  <span>${escapeHtml(displayName)}</span>
                </a>`;
}

function buildEvolutionModelHtml(
  model,
  isRoot = false
) {
  const methodHtml =
    model.methodParts.length > 0
      ? renderEvolutionMethodPartsHtml(
          model.methodParts
        )
      : "";

  return `
              <div class="prerender-evolution-node">
                ${
                  !isRoot && methodHtml
                    ? `<div class="prerender-evolution-method">${methodHtml}<span aria-hidden="true"> ↓</span></div>`
                    : ""
                }
                ${buildPrerenderEvolutionCard(model.pokemon)}
                ${
                  model.note
                    ? `<small class="prerender-evolution-note">${escapeHtml(model.note)}</small>`
                    : ""
                }
                ${
                  model.children.length > 0
                    ? `<div class="prerender-evolution-children">
                        ${model.children
                          .map(child =>
                            buildEvolutionModelHtml(
                              child
                            )
                          )
                          .join("")}
                      </div>`
                    : ""
                }
              </div>`;
}

function buildPrerenderFormEvolutionPaths(
  root,
  paths,
  currentPokemonName
) {
  const pokemonSummaries =
    collectPokemonSummaries(root);
  const visiblePaths =
    getVisibleFormEvolutionPaths(
      paths,
      currentPokemonName
    );

  return visiblePaths
    .map(pathInfo => {
      const basePokemon =
        pokemonSummaries[
          pathInfo.basePokemon
        ] ||
        getFallbackPokemonSummary(
          pathInfo.basePokemon
        );
      const evolvedPokemon =
        pokemonSummaries[
          pathInfo.evolvesTo
        ] ||
        getFallbackPokemonSummary(
          pathInfo.evolvesTo
        );
      const condition =
        pathInfo.displayCondition ||
        pathInfo.condition ||
        "Evolution method varies";
      const versionNotes =
        getVersionNotes(pathInfo);
      const accessibleLabel =
        pathInfo.accessibleLabel ||
        `${formatSitePokemonDisplayName(
          basePokemon
        )} evolves into ${formatSitePokemonDisplayName(
          evolvedPokemon
        )}. ${condition}.`;

      return `
              <section class="prerender-form-evolution-path" aria-label="${escapeHtml(accessibleLabel)}">
                ${buildPrerenderEvolutionCard(basePokemon)}
                <div class="prerender-evolution-method">
                  ${escapeHtml(condition)}
                  <span aria-hidden="true"> ↓</span>
                  ${versionNotes
                    .map(
                      note =>
                        `<small>${escapeHtml(note)}</small>`
                    )
                    .join("")}
                </div>
                ${buildPrerenderEvolutionCard(evolvedPokemon)}
              </section>`;
    })
    .join("");
}

function buildEvolutionSection(
  evolutionChain,
  pokemon,
  evolutionMethodOverrides = {}
) {
  if (!evolutionChain?.root) {
    return "";
  }

  const activeFormKey =
    getRegionalFormKey(pokemon);
  const summaryText =
    getEvolutionSummaryText(
      evolutionChain.root,
      {
        activeFormKey,
        currentPokemonName:
          pokemon.name,
        evolutionMethodOverrides
      }
    );
  const familyEvolutionOverride =
    getEvolutionOverride(
      evolutionChain.root.pokemon?.name,
      evolutionMethodOverrides
    );
  const formEvolutionPaths =
    familyEvolutionOverride
      ?.formEvolutionPaths;
  const useFormEvolutionPaths =
    Boolean(
      familyEvolutionOverride
        ?.replaceDefaultEvolutionDisplay &&
      Array.isArray(formEvolutionPaths) &&
      formEvolutionPaths.length > 0
    );
  const evolutionMarkup =
    useFormEvolutionPaths
      ? buildPrerenderFormEvolutionPaths(
          evolutionChain.root,
          formEvolutionPaths,
          pokemon.name
        )
      : buildEvolutionModelHtml(
          buildEvolutionDisplayModel(
            evolutionChain.root,
            {
              activeFormKey,
              currentPokemonName:
                pokemon.name,
              evolutionMethodOverrides
            }
          ),
          true
        );
  const useHorizontalEvolutionLayout =
    !useFormEvolutionPaths &&
    evolutionChain.root.pokemon?.name !==
      "eevee";

  return `
        <section class="prerender-evolution${useHorizontalEvolutionLayout ? " prerender-evolution-horizontal" : ""}" aria-labelledby="prerender-evolution-heading">
          <h2 id="prerender-evolution-heading">Evolution Chain</h2>
          <p class="prerender-evolution-summary">${escapeHtml(summaryText)}</p>
          <div class="prerender-evolution-tree">
            ${evolutionMarkup}
          </div>
        </section>`;
}

function buildLearnsetRowsHtml(rows) {
  if (!rows.length) {
    return `
          <p>No level-up moves are listed for this version group.</p>`;
  }

  return `
          <table>
            <thead>
              <tr>
                <th scope="col">Level</th>
                <th scope="col">Move</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  row => `
                <tr>
                  <td>${escapeHtml(row.levelLabel)}</td>
                  <td><a href="/move/${escapeHtml(row.move)}">${escapeHtml(row.moveLabel)}</a></td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>`;
}

function buildLearnsetSection(
  pokemon,
  learnset,
  movesData = null
) {
  if (!hasLearnsetMoves(learnset)) {
    return "";
  }

  const displayName =
    formatSitePokemonDisplayName(pokemon);
  const preview =
    getLatestLevelUpLearnsetPreview(
      learnset,
      movesData,
      {
        pokemonId: pokemon.id,
        pokemon: pokemon.name
      }
    );

  return `
        <section class="prerender-learnsets">
          <button type="button" aria-expanded="false" aria-controls="prerender-learnsets-content">
            <h2>Learnsets</h2>
            <p>${escapeHtml(preview.summaryMoveCount)} moves</p>
          </button>
          <div id="prerender-learnsets-content" data-seo-visible="true" class="collapsible-content collapsed">
            <div class="prerender-learnset-preview" data-prerender-learnset="true">
              <h3>${escapeHtml(displayName)} Moves Learned by Level Up</h3>
              ${
                preview.versionLabel
                  ? `<p>${escapeHtml(preview.versionLabel)}</p>`
                  : ""
              }
              ${buildLearnsetRowsHtml(preview.rows)}
            </div>
          </div>
        </section>`;
}

function buildPrerenderLearnsetDataScript(
  pokemon,
  learnset,
  movesData = null
) {
  if (!hasLearnsetMoves(learnset)) {
    return "";
  }

  return `
    <script id="pokelore-prerender-learnset-data" type="application/json">${escapeJsonForScript(getLatestLevelUpLearnsetPreview(learnset, movesData, { pokemonId: pokemon.id, pokemon: pokemon.name }))}</script>`;
}

function buildEncounterRecordHtml(encounter) {
  const parts = [
    formatEncounterMethodName(
      encounter.method
    ),
    formatEncounterLevelRange(encounter),
    formatChance(encounter.chance)
  ].filter(Boolean);
  const conditions =
    formatEncounterConditions(
      encounter.conditions ?? []
    );

  if (conditions) {
    parts.push(conditions);
  }

  return `<li>${escapeHtml(parts.join(" · "))}</li>`;
}

function formatEncounterVersionGroupName(
  versions = []
) {
  return versions
    .map(formatEncounterVersionName)
    .join(", ");
}

function buildEncounterVersionHtml(
  versionGroup
) {
  const summaryText =
    formatEncounterSummary(
      getEncounterSummary(versionGroup)
    );

  return `<section class="prerender-encounter-version"><h4>${escapeHtml(formatEncounterVersionGroupName(versionGroup.versions))}</h4>${
    summaryText
      ? `<p>${escapeHtml(summaryText)}</p>`
      : ""
  }<ul>${getUniqueEncounterRecords(
    versionGroup
  )
    .map(buildEncounterRecordHtml)
    .join("")}</ul></section>`;
}

function buildEncounterAreaHtml(area) {
  return `<section class="prerender-encounter-area"><h3>${escapeHtml(area.displayName ?? area.name)}</h3>${getGroupedEncounterVersions(area)
    .map(buildEncounterVersionHtml)
    .join("")}</section>`;
}

function buildEncounterLocationHtml(
  location
) {
  const summaryText =
    formatEncounterSummary(
      getEncounterSummary(location, {
        allVersions: true
      })
    );
  const locationName =
    location.location?.displayName ??
    location.location?.name;
  const regionName =
    formatEncounterLabel(
      location.location?.region
    );
  const locationSlug =
    location.location?.name;

  return `<details class="prerender-encounter-location"><summary><span><a href="/location/${escapeHtml(locationSlug)}">${escapeHtml(locationName)}</a>${regionName ? ` · ${escapeHtml(regionName)}` : ""}</span>${
    summaryText
      ? `<small>${escapeHtml(summaryText)}</small>`
      : ""
  }</summary>${(location.areas ?? [])
    .map(buildEncounterAreaHtml)
    .join("")}</details>`;
}

function buildWhereToFindSection(
  pokemon,
  encounterData
) {
  const displayName =
    formatSitePokemonDisplayName(pokemon);
  const title = `Where To Find ${displayName}`;
  const locations =
    hasEncounterLocations(encounterData)
      ? filterEncounterLocationsByVersion(
          encounterData,
          ALL_ENCOUNTER_VERSIONS
        )
      : [];
  const summary =
    locations.length > 0
      ? `${locations.length} locations`
      : "No known locations";

  return `<section class="prerender-where-to-find"><button type="button" aria-expanded="false" aria-controls="prerender-where-to-find-content"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(summary)}</p></button><div id="prerender-where-to-find-content" data-seo-visible="true" class="collapsible-content collapsed">${
    locations.length > 0
      ? locations
          .map(buildEncounterLocationHtml)
          .join("")
      : `<p>No encounter location data is available yet.</p>`
  }</div></section>`;
}

function buildPrerenderWhereToFindDataScript(
  pokemon,
  encounterData
) {
  const locations =
    encounterData?.locations ?? [];

  return `
    <script id="pokelore-prerender-where-to-find-data" type="application/json">${escapeJsonForScript({
      pokemonId: pokemon.id,
      pokemon: pokemon.name,
      locationCount: locations.length
    })}</script>`;
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

      .prerender-type-effectiveness {
        box-sizing: border-box;
        margin: 1.5rem auto 0;
        max-width: 900px;
        padding: 0 1rem 1rem;
        width: 100%;
      }

      .prerender-type-effectiveness h2 {
        color: #f3f4f6;
        font-size: 1.25rem;
        font-weight: 500;
        margin: 0 0 0.75rem;
      }

      .prerender-matchup-grid {
        display: grid;
        gap: 0.65rem;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }

      .prerender-matchup-group h3 {
        color: #f3f4f6;
        font-size: 1rem;
        font-weight: 700;
        margin: 0 0 0.5rem;
      }

      .prerender-matchup-group ul {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .prerender-matchup-group a {
        align-items: center;
        color: white;
        display: inline-flex;
        font-size: 0.72rem;
        font-weight: 700;
        gap: 0.35rem;
        justify-content: center;
        text-decoration: none;
      }

      .prerender-matchup-group strong {
        color: #f3f4f6;
      }

      .prerender-matchup-group img {
        display: block;
        height: 1.4rem;
        max-width: 100%;
        object-fit: contain;
        width: auto;
      }

      .collapsible-content {
        transition:
          opacity 0.15s ease,
          max-height 0.15s ease;
      }

      .collapsible-content.collapsed {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        pointer-events: none;
      }

      .collapsible-content.open {
        max-height: none;
        opacity: 1;
        overflow: visible;
      }

      .prerender-evolution {
        box-sizing: border-box;
        margin: 1.5rem auto 0;
        max-width: 980px;
        padding: 0 1rem 1rem;
        width: 100%;
      }

      .prerender-evolution h2 {
        color: #f3f4f6;
        font-size: 1.25rem;
        font-weight: 500;
        margin: 0 0 0.65rem;
      }

      .prerender-evolution-summary {
        color: #9ca3af;
        line-height: 1.55;
        margin: 0 auto 1rem;
        max-width: 44rem;
      }

      .prerender-evolution-tree {
        display: flex;
        justify-content: flex-start;
        overflow-x: auto;
        padding-bottom: 0.5rem;
        width: 100%;
      }

      .prerender-evolution-node {
        align-items: center;
        display: flex;
        flex-direction: column;
        min-width: 135px;
      }

      .prerender-evolution-children {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      .prerender-evolution-method {
        color: #d1d5db;
        font-size: 0.8rem;
        line-height: 1.25;
        margin: 0.75rem 0;
        max-width: 170px;
      }

      .prerender-evolution-method a {
        color: #00cadb;
        font-weight: 700;
        text-decoration: underline;
      }

      .prerender-evolution-method small,
      .prerender-evolution-note {
        display: block;
        font-size: 0.72rem;
        margin-top: 0.25rem;
        opacity: 0.8;
      }

      .prerender-evolution-card {
        align-items: center;
        background: #2c2c2c;
        border: 2px solid #555;
        border-radius: 12px;
        box-sizing: border-box;
        color: inherit;
        display: flex;
        flex-direction: column;
        min-height: 135px;
        padding: 0.25rem;
        text-decoration: none;
        width: 135px;
      }

      .prerender-evolution-card img {
        height: 90px;
        object-fit: contain;
        width: 90px;
      }

      .prerender-evolution-card span {
        color: #f3f4f6;
        font-size: 0.8rem;
        line-height: 1.1;
      }

      @media (min-width: 769px) {
        .prerender-evolution-horizontal .prerender-evolution-tree {
          justify-content: center;
          padding-bottom: 2rem;
        }

        .prerender-evolution-horizontal .prerender-evolution-node {
          align-items: center;
          flex-direction: row;
          gap: 1.75rem;
          min-width: max-content;
        }

        .prerender-evolution-horizontal .prerender-evolution-children {
          align-items: flex-start;
          flex-direction: column;
          gap: 1rem;
        }

        .prerender-evolution-horizontal .prerender-evolution-method {
          flex: 0 0 clamp(130px, 15vw, 220px);
          margin: 0;
          max-width: 220px;
        }

        .prerender-evolution-horizontal .prerender-evolution-method span[aria-hidden="true"] {
          font-size: 0;
        }

        .prerender-evolution-horizontal .prerender-evolution-method span[aria-hidden="true"]::before {
          content: "→";
          font-size: 0.8rem;
        }
      }

      .prerender-form-evolution-path {
        align-items: center;
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin: 0 auto 1rem;
        min-width: max-content;
      }

      .prerender-learnsets,
      .prerender-where-to-find {
        border: 2px solid #706363;
        border-radius: 12px;
        box-sizing: border-box;
        margin: 1rem auto;
        max-width: 900px;
        min-width: 0;
        padding: 0.35rem;
        text-align: left;
        width: 100%;
      }

      .prerender-learnsets button,
      .prerender-where-to-find button {
        align-items: center;
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        display: flex;
        font: inherit;
        justify-content: space-between;
        max-width: 100%;
        min-width: 0;
        padding: 0;
        text-align: left;
        width: 100%;
      }

      .prerender-learnsets h2,
      .prerender-where-to-find h2 {
        align-items: center;
        color: #00cadb;
        display: inline-flex;
        font-size: 1.5rem;
        gap: 0.5rem;
        margin: 0.83rem 0;
      }

      .prerender-learnsets button h2::before,
      .prerender-where-to-find button h2::before {
        border-left: 0.38rem solid transparent;
        border-right: 0.38rem solid transparent;
        border-top: 0.55rem solid currentColor;
        content: "";
        display: inline-block;
        height: 0;
        width: 0;
      }

      .prerender-learnsets button p,
      .prerender-where-to-find button p {
        margin: 1rem 0;
      }

      .prerender-learnset-preview {
        margin-top: 1rem;
      }

      .prerender-learnset-preview h3 {
        color: #f3f4f6;
        font-size: 1rem;
        margin: 0 0 0.5rem;
      }

      .prerender-learnset-preview table {
        border-collapse: collapse;
        font-size: 0.82rem;
        width: 100%;
      }

      .prerender-learnset-preview th,
      .prerender-learnset-preview td {
        border-bottom: 1px solid #555;
        padding: 0.35rem 0.45rem;
      }

      .prerender-learnset-preview a {
        color: #00cadb;
        font-weight: 700;
        text-decoration: none;
      }

      .prerender-encounter-location {
        border: 1px solid #555;
        border-radius: 8px;
        margin-top: 0.75rem;
        padding: 0.85rem;
      }

      .prerender-encounter-location summary {
        cursor: pointer;
        font-weight: 700;
      }

      .prerender-encounter-location summary span,
      .prerender-encounter-location summary small {
        display: block;
      }

      .prerender-encounter-location summary small {
        font-size: 0.82rem;
        font-weight: 400;
        margin-top: 0.25rem;
        opacity: 0.8;
      }

      .prerender-encounter-location a {
        color: #00cadb;
        font-weight: 700;
        text-decoration: none;
      }

      .prerender-encounter-area {
        margin-top: 0.85rem;
      }

      .prerender-encounter-area h3,
      .prerender-encounter-version h4 {
        color: #f3f4f6;
        margin: 0.5rem 0;
      }

      .prerender-encounter-area h3 {
        font-size: 1rem;
      }

      .prerender-encounter-version h4 {
        font-size: 0.92rem;
      }

      .prerender-encounter-version p {
        font-size: 0.82rem;
        margin: 0 0 0.4rem;
        opacity: 0.85;
      }

      .prerender-encounter-version ul {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        list-style: none;
        margin: 0;
        padding: 0;
      }

      .prerender-encounter-version li {
        border: 1px solid #555;
        border-radius: 999px;
        font-size: 0.78rem;
        padding: 0.25rem 0.55rem;
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
  pokeloreLinkTargets,
  evolutionChain = null,
  evolutionMethodOverrides = {},
  learnset = null,
  movesData = null,
  encounterData = null
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
        ${buildTypeEffectivenessSection(
          pokemon
        )}
        ${buildEvolutionSection(
          evolutionChain,
          pokemon,
          evolutionMethodOverrides
        )}
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
        ${buildLearnsetSection(
          pokemon,
          learnset,
          movesData
        )}
        ${buildWhereToFindSection(
          pokemon,
          encounterData
        )}
      </main>
    </div>`;
}

function injectHeadTags(
  html,
  pokemon,
  routeName,
  heroImage,
  learnset = null,
  movesData = null,
  encounterData = null
) {
  const title = pokemonSeoTitle(pokemon);
  const description =
    pokemonSeoDescription(pokemon);
  const canonical = `https://pokelore.net/pokemon/${routeName}`;
  const tags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <link rel="canonical" href="${escapeHtml(canonical)}">
    <link rel="preload" as="image" href="${escapeHtml(heroImage)}" fetchpriority="high">
    ${buildCriticalCss()}
    ${buildPrerenderLearnsetDataScript(
      pokemon,
      learnset,
      movesData
    )}
    ${buildPrerenderWhereToFindDataScript(
      pokemon,
      encounterData
    )}
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
  pokeloreLinkTargets,
  evolutionChain,
  evolutionMethodOverrides,
  learnset,
  movesData,
  encounterData
) {
  const heroImage = getHeroImage(pokemon);
  const shell = buildPokemonShell(
    pokemon,
    routeName,
    bannerAssets,
    pokeloreAnalyses,
    pokeloreLinkTargets,
    evolutionChain,
    evolutionMethodOverrides,
    learnset,
    movesData,
    encounterData
  );
  const html = injectHeadTags(
    template,
    pokemon,
    routeName,
    heroImage,
    learnset,
    movesData,
    encounterData
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
  const movesData = buildMovesMap(
    readJson(movesIndexPath)
  );
  const evolutionMethodOverrides = readJson(
    evolutionMethodOverridesPath
  );
  const evolutionChainCache = new Map();
  const learnsetCache = new Map();
  const encounterCache = new Map();
  const bannerAssets = findBannerAssets();

  removeNumericPokemonStaticRoutes();
  copyTypeBadgeAssets();

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
    let evolutionChain = null;

    if (pokemon.evolutionChainId) {
      if (
        !evolutionChainCache.has(
          pokemon.evolutionChainId
        )
      ) {
        const chainPath = path.join(
          evolutionChainsDir,
          `${pokemon.evolutionChainId}.json`
        );

        evolutionChainCache.set(
          pokemon.evolutionChainId,
          fs.existsSync(chainPath)
            ? readJson(chainPath)
            : null
        );
      }

      evolutionChain =
        evolutionChainCache.get(
          pokemon.evolutionChainId
        );
    }
    let learnset = null;

    for (const candidateId of getLearnsetCandidateIds(
      pokemon
    )) {
      if (!learnsetCache.has(candidateId)) {
        const learnsetPath = path.join(
          pokemonLearnsetsDir,
          `${candidateId}.json`
        );

        learnsetCache.set(
          candidateId,
          fs.existsSync(learnsetPath)
            ? readJson(learnsetPath)
            : null
        );
      }

      learnset =
        learnsetCache.get(candidateId);

      if (hasLearnsetMoves(learnset)) {
        break;
      }
    }

    let encounterData = null;

    for (const candidateId of getPokemonEncounterCandidateIds(
      pokemon
    )) {
      if (!encounterCache.has(candidateId)) {
        const encounterPath = path.join(
          pokemonEncountersDir,
          `${candidateId}.json`
        );

        encounterCache.set(
          candidateId,
          fs.existsSync(encounterPath)
            ? readJson(encounterPath)
            : null
        );
      }

      encounterData =
        encounterCache.get(candidateId);

      if (hasEncounterLocations(encounterData)) {
        break;
      }
    }

    writePokemonPage(
      template,
      routeName,
      pokemon,
      bannerAssets,
      pokeloreAnalyses,
      pokeloreLinkTargets,
      evolutionChain,
      evolutionMethodOverrides,
      learnset,
      movesData,
      encounterData
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export {
  buildPokemonShell,
  buildEvolutionSection,
  buildLearnsetSection,
  buildWhereToFindSection,
  buildTypeEffectivenessSection,
  copyTypeBadgeAssets,
  injectHeadTags
};
