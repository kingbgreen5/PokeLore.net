import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { itemLocationTopics } from "../src/topics/topicMetadata.js";
import {
  isDynamaxCrystalItem,
  isReleasedDynamaxCrystal
} from "../src/utils/dynamaxCrystals.js";

const __filename =
  fileURLToPath(import.meta.url);
const __dirname =
  path.dirname(__filename);
const rootDir =
  path.resolve(__dirname, "..");
const publicDir =
  path.join(rootDir, "public");
const dataDir =
  path.join(publicDir, "data");

const errors = [];
const warnings = [];

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function readJson(filePath) {
  try {
    return JSON.parse(
      fs.readFileSync(filePath, "utf8")
    );
  } catch (error) {
    addError(
      `Invalid JSON: ${path.relative(rootDir, filePath)} (${error.message})`
    );
    return null;
  }
}

function collectJsonFiles(directory) {
  if (!fileExists(directory)) return [];

  return fs
    .readdirSync(directory, {
      withFileTypes: true
    })
    .flatMap(entry => {
      const entryPath =
        path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectJsonFiles(entryPath);
      }

      return entry.name.endsWith(".json")
        ? [entryPath]
        : [];
    });
}

function assertFile(
  filePath,
  context
) {
  if (!fileExists(filePath)) {
    addError(
      `${context}: missing ${path.relative(rootDir, filePath)}`
    );
    return false;
  }

  return true;
}

function normalizePathname(pathname) {
  return decodeURIComponent(pathname)
    .replace(/\/$/, "") || "/";
}

function validateAllJsonParses() {
  const jsonFiles =
    collectJsonFiles(dataDir);

  for (const filePath of jsonFiles) {
    readJson(filePath);
  }

  return jsonFiles.length;
}

function validateItems() {
  const itemsIndexPath =
    path.join(dataDir, "itemsIndex.json");
  const itemsIndex =
    readJson(itemsIndexPath);

  if (!Array.isArray(itemsIndex)) {
    addError(
      "itemsIndex.json must be an array."
    );
    return 0;
  }

  for (const item of itemsIndex) {
    if (!item?.name) {
      addError(
        "itemsIndex.json has an item without a name."
      );
      continue;
    }

    const itemFile =
      path.join(
        dataDir,
        "items",
        `${item.name}.json`
      );

    if (!assertFile(
      itemFile,
      `Item ${item.name}`
    )) {
      continue;
    }

    const itemData =
      readJson(itemFile);

    if (
      itemData &&
      itemData.name !== item.name
    ) {
      addError(
        `Item ${item.name}: detail file name is ${itemData.name}.`
      );
    }
  }

  return itemsIndex.length;
}

function validatePokemonRoutes() {
  const routesPath =
    path.join(dataDir, "pokemonRoutes.json");
  const routes =
    readJson(routesPath);

  if (
    !routes?.byId ||
    !routes?.byName
  ) {
    addError(
      "pokemonRoutes.json must contain byId and byName."
    );
    return 0;
  }

  for (const [id, name] of Object.entries(
    routes.byId
  )) {
    const dataFile =
      path.join(
        dataDir,
        "pokemonData",
        `${id}.json`
      );

    if (!assertFile(
      dataFile,
      `Pokemon route ${id}/${name}`
    )) {
      continue;
    }

    const pokemon =
      readJson(dataFile);

    if (
      pokemon &&
      pokemon.name !== name
    ) {
      addError(
        `Pokemon route ${id}: expected ${name}, found ${pokemon.name}.`
      );
    }

    if (
      String(routes.byName[name]) !== String(id)
    ) {
      addError(
        `Pokemon route ${name}: byName does not point back to ${id}.`
      );
    }
  }

  return Object.keys(routes.byId).length;
}

function validatePokemonEvYields() {
  const pokemonDataDir =
    path.join(dataDir, "pokemonData");
  const requiredStats = [
    "hp",
    "attack",
    "defense",
    "specialAttack",
    "specialDefense",
    "speed"
  ];
  const files = fs
    .readdirSync(pokemonDataDir)
    .filter(file => file.endsWith(".json"));

  for (const file of files) {
    const pokemon =
      readJson(
        path.join(pokemonDataDir, file)
      );

    if (!pokemon) {
      continue;
    }

    if (
      !pokemon.evYield ||
      typeof pokemon.evYield !== "object" ||
      Array.isArray(pokemon.evYield)
    ) {
      addError(
        `Pokemon ${pokemon.name ?? file}: missing evYield object.`
      );
      continue;
    }

    let evYieldTotal = 0;

    for (const stat of requiredStats) {
      const value =
        pokemon.evYield[stat];

      if (!Number.isInteger(value) || value < 0) {
        addError(
          `Pokemon ${pokemon.name ?? file}: evYield.${stat} must be a non-negative integer.`
        );
        continue;
      }

      evYieldTotal += value;
    }

    if (evYieldTotal <= 0) {
      addError(
        `Pokemon ${pokemon.name ?? file}: evYield must include at least one awarded EV.`
      );
    }
  }

  return files.length;
}

function slugifyAbilityName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getPokemonAbilitySlug(ability) {
  return typeof ability === "string"
    ? slugifyAbilityName(ability)
    : slugifyAbilityName(ability?.name);
}

function validateAbilityPokemonRosters() {
  const abilities =
    readJson(
      path.join(dataDir, "abilities.json")
    ) ?? {};
  const routes =
    readJson(
      path.join(dataDir, "pokemonRoutes.json")
    ) ?? {
      byId: {},
      byName: {}
    };

  for (const [
    abilitySlug,
    ability
  ] of Object.entries(abilities)) {
    if (!Array.isArray(ability.pokemon)) {
      addError(
        `Ability ${abilitySlug}: pokemon must be an array.`
      );
      continue;
    }

    for (const pokemonName of ability.pokemon) {
      if (!routes.byName?.[pokemonName]) {
        addError(
          `Ability ${abilitySlug}: Pokemon ${pokemonName} is missing from pokemonRoutes.`
        );
      }
    }
  }

  for (const [
    id,
    routeName
  ] of Object.entries(routes.byId ?? {})) {
    const pokemon =
      readJson(
        path.join(
          dataDir,
          "pokemonData",
          `${id}.json`
        )
      );

    if (!pokemon) {
      continue;
    }

    for (const ability of pokemon.abilities ?? []) {
      const abilitySlug =
        getPokemonAbilitySlug(ability);

      if (!abilities[abilitySlug]) {
        addError(
          `Pokemon ${routeName}: ability ${abilitySlug} is missing from abilities.json.`
        );
        continue;
      }

      if (
        !abilities[abilitySlug].pokemon.includes(
          pokemon.name
        )
      ) {
        addError(
          `Pokemon ${routeName}: ability ${abilitySlug} does not include ${pokemon.name}.`
        );
      }
    }
  }

  return Object.keys(abilities).length;
}

function validateLocations() {
  const indexPath =
    path.join(dataDir, "locationsIndex.json");
  const locations =
    readJson(indexPath);

  if (!Array.isArray(locations)) {
    addWarning(
      "locationsIndex.json is missing or not an array."
    );
    return 0;
  }

  for (const location of locations) {
    if (!location?.name) continue;

    assertFile(
      path.join(
        dataDir,
        "locations",
        `${location.name}.json`
      ),
      `Location ${location.name}`
    );
  }

  return locations.length;
}

function getTopicSlugs() {
  const topicsData =
    readJson(
      path.join(dataDir, "pokedexTopics.json")
    );
  const articleTopicIndex =
    readJson(
      path.join(
        dataDir,
        "topics",
        "topicIndex.json"
      )
    );
  const topics =
    Array.isArray(topicsData?.topics)
      ? topicsData.topics
      : [];
  const articleTopics =
    Array.isArray(articleTopicIndex?.topics)
      ? articleTopicIndex.topics
      : [];

  return new Set(
    [
      ...itemLocationTopics.filter(
        topic => topic.active
      ),
      ...topics.filter(
        topic => topic.active
      ),
      ...articleTopics.filter(
        topic => topic.active !== false
      )
    ]
      .map(topic => topic.slug)
      .filter(Boolean)
  );
}

function validateSitemap() {
  const sitemapPath =
    path.join(publicDir, "sitemap.xml");

  if (!fileExists(sitemapPath)) {
    addWarning(
      "public/sitemap.xml is missing."
    );
    return 0;
  }

  const sitemap =
    fs.readFileSync(sitemapPath, "utf8");
  const urlMatches =
    [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)];
  const sitemapPathnames = new Set(
    urlMatches.map(match =>
      normalizePathname(
        new URL(match[1]).pathname
      )
    )
  );
  const moves =
    readJson(
      path.join(dataDir, "moves.json")
    ) ?? {};
  const abilities =
    readJson(
      path.join(dataDir, "abilities.json")
    ) ?? {};
  const pokemonRoutes =
    readJson(
      path.join(dataDir, "pokemonRoutes.json")
    ) ?? {
      byName: {}
    };
  const pokemonIndex =
    readJson(
      path.join(dataDir, "pokemonIndex.json")
    ) ?? [];
  const itemsIndex =
    readJson(
      path.join(dataDir, "itemsIndex.json")
    ) ?? [];
  const locationsIndex =
    readJson(
      path.join(dataDir, "locationsIndex.json")
    ) ?? [];
  const topicSlugs =
    getTopicSlugs();
  const staticRoutes =
    new Set([
      "/",
      "/abilities",
      "/dex-entries",
      "/dppt-feebas-calculator",
      "/ev-training-routes",
      "/items",
      "/items/dynamax-crystals",
      "/learnsets",
      "/locations",
      "/moves",
      "/news",
      "/rse-feebas-calculator",
      "/single-type-coverage",
      "/team-coverage",
      "/tools",
      "/topics",
      "/types"
    ]);

  function assertSitemapPath(
    pathname,
    context
  ) {
    if (
      !sitemapPathnames.has(
        normalizePathname(pathname)
      )
    ) {
      addError(
        `${context}: missing from sitemap.`
      );
    }
  }

  for (const pathname of staticRoutes) {
    assertSitemapPath(
      pathname,
      `Static route ${pathname}`
    );
  }

  for (const pokemonName of Object.keys(
    pokemonRoutes.byName ?? {}
  )) {
    assertSitemapPath(
      `/pokemon/${pokemonName}`,
      `Pokemon ${pokemonName}`
    );
  }

  for (const moveName of Object.keys(moves)) {
    assertSitemapPath(
      `/move/${moveName}`,
      `Move ${moveName}`
    );
  }

  for (const abilityName of Object.keys(
    abilities
  )) {
    assertSitemapPath(
      `/ability/${abilityName}`,
      `Ability ${abilityName}`
    );
  }

  if (Array.isArray(itemsIndex)) {
    for (const item of itemsIndex) {
      if (
        isDynamaxCrystalItem(item) &&
        !isReleasedDynamaxCrystal(item)
      ) {
        continue;
      }

      if (!item?.name) continue;

      assertSitemapPath(
        `/item/${item.name}`,
        `Item ${item.name}`
      );
    }
  }

  if (Array.isArray(locationsIndex)) {
    for (const location of locationsIndex) {
      if (!location?.name) continue;

      assertSitemapPath(
        `/location/${location.name}`,
        `Location ${location.name}`
      );
    }
  }

  for (const topicSlug of topicSlugs) {
    assertSitemapPath(
      `/topic/${topicSlug}`,
      `Topic ${topicSlug}`
    );
  }

  if (Array.isArray(pokemonIndex)) {
    const typeNames = new Set(
      pokemonIndex.flatMap(
        pokemon => pokemon.types ?? []
      )
    );

    for (const typeName of typeNames) {
      assertSitemapPath(
        `/type/${typeName}`,
        `Type ${typeName}`
      );
    }
  }

  for (const match of urlMatches) {
    const loc = match[1];
    const pathname =
      normalizePathname(
        new URL(loc).pathname
      );

    if (staticRoutes.has(pathname)) {
      continue;
    }

    const [
      empty,
      section,
      slug
    ] = pathname.split("/");

    if (
      empty !== "" ||
      !section ||
      !slug
    ) {
      addError(
        `Sitemap has unsupported URL: ${loc}`
      );
      continue;
    }

    if (section === "item") {
      assertFile(
        path.join(
          dataDir,
          "items",
          `${slug}.json`
        ),
        `Sitemap item ${slug}`
      );
      continue;
    }

    if (section === "pokemon") {
      if (!pokemonRoutes.byName?.[slug]) {
        addError(
          `Sitemap Pokemon ${slug}: missing pokemonRoutes entry.`
        );
      }
      continue;
    }

    if (section === "move") {
      if (!moves[slug]) {
        addError(
          `Sitemap move ${slug}: missing moves.json entry.`
        );
      }
      continue;
    }

    if (section === "ability") {
      if (!abilities[slug]) {
        addError(
          `Sitemap ability ${slug}: missing abilities.json entry.`
        );
      }
      continue;
    }

    if (section === "location") {
      assertFile(
        path.join(
          dataDir,
          "locations",
          `${slug}.json`
        ),
        `Sitemap location ${slug}`
      );
      continue;
    }

    if (section === "topic") {
      if (!topicSlugs.has(slug)) {
        addError(
          `Sitemap topic ${slug}: missing topic source entry.`
        );
      }
      continue;
    }

    if (section === "type") {
      continue;
    }

    addError(
      `Sitemap has unhandled route: ${pathname}`
    );
  }

  return urlMatches.length;
}

const parsedJsonCount =
  validateAllJsonParses();
const itemCount =
  validateItems();
const pokemonRouteCount =
  validatePokemonRoutes();
const pokemonEvYieldCount =
  validatePokemonEvYields();
const abilityCount =
  validateAbilityPokemonRosters();
const locationCount =
  validateLocations();
const sitemapCount =
  validateSitemap();

for (const warning of warnings) {
  console.warn(`Warning: ${warning}`);
}

if (errors.length > 0) {
  console.error(
    `Data integrity check failed with ${errors.length} error(s):`
  );

  for (const error of errors.slice(0, 50)) {
    console.error(`- ${error}`);
  }

  if (errors.length > 50) {
    console.error(
      `...and ${errors.length - 50} more.`
    );
  }

  process.exit(1);
}

console.log(
  [
    "Data integrity check passed:",
    `${parsedJsonCount} JSON files parsed,`,
    `${itemCount} items checked,`,
    `${pokemonRouteCount} Pokemon routes checked,`,
    `${pokemonEvYieldCount} Pokemon EV yields checked,`,
    `${abilityCount} abilities checked,`,
    `${locationCount} locations checked,`,
    `${sitemapCount} sitemap URLs checked.`
  ].join(" ")
);
