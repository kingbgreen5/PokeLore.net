import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { itemLocationTopics } from "../src/topics/topicMetadata.js";

const SITE_URL = "https://pokelore.net";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const outputPath = path.join(rootDir, "public", "sitemap.xml");

async function readJson(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text);
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function route(pathname) {
  return `${SITE_URL}${pathname === "/" ? "" : pathname}`;
}

function staticRoutes() {
  return [
    "/",
    "/dex-entries",
    "/learnsets",
    "/team-coverage",
    "/single-type-coverage",
    "/moves",
    "/abilities",
    "/items",
    "/locations",
    "/topics",
    "/types"
  ].map(route);
}

function pokemonRoutes(pokemonRouteLookup) {
  return Object.keys(
    pokemonRouteLookup.byName ?? {}
  ).map(pokemonName =>
    route(`/pokemon/${pokemonName}`)
  );
}

function moveRoutes(moves) {
  return Object.keys(moves).map(moveName =>
    route(`/move/${moveName}`)
  );
}

function abilityRoutes(abilities) {
  return Object.keys(abilities).map(abilityName =>
    route(`/ability/${abilityName}`)
  );
}

function itemRoutes(itemsIndex) {
  return itemsIndex.map(item =>
    route(`/item/${item.name}`)
  );
}

function locationRoutes(locationsIndex) {
  return locationsIndex.map(location =>
    route(`/location/${location.name}`)
  );
}

function topicRoutes(pokedexTopics) {
  return [
    ...itemLocationTopics,
    ...(pokedexTopics.topics ?? [])
  ]
    .filter(topic => topic.active)
    .map(topic =>
      route(`/topic/${topic.slug}`)
    );
}

function typeRoutes(pokemonIndex) {
  const types = new Set(
    pokemonIndex.flatMap(
      pokemon => pokemon.types ?? []
    )
  );

  return [...types].map(typeName =>
    route(`/type/${typeName}`)
  );
}

async function buildRoutes() {
  const [
    pokemonRouteLookup,
    pokemonIndex,
    moves,
    abilities,
    itemsIndex,
    locationsIndex,
    pokedexTopics
  ] = await Promise.all([
    readJson(
      path.join(dataDir, "pokemonRoutes.json")
    ),
    readJson(
      path.join(dataDir, "pokemonIndex.json")
    ),
    readJson(path.join(dataDir, "moves.json")),
    readJson(
      path.join(dataDir, "abilities.json")
    ),
    readJson(
      path.join(dataDir, "itemsIndex.json")
    ),
    readJson(
      path.join(dataDir, "locationsIndex.json")
    ),
    readJson(
      path.join(dataDir, "pokedexTopics.json")
    )
  ]);

  return [
    staticRoutes(),
    pokemonRoutes(pokemonRouteLookup),
    moveRoutes(moves),
    abilityRoutes(abilities),
    itemRoutes(itemsIndex),
    locationRoutes(locationsIndex),
    topicRoutes(pokedexTopics),
    typeRoutes(pokemonIndex)
  ].flat();
}

function renderSitemap(urls) {
  const lastmod =
    new Date().toISOString().slice(0, 10);

  const entries = urls
    .map(
      url => `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

async function main() {
  const urls = [...new Set(await buildRoutes())];

  await fs.writeFile(
    outputPath,
    renderSitemap(urls),
    "utf8"
  );

  console.log(
    `Generated sitemap with ${urls.length} URLs at ${outputPath}`
  );
}

main().catch(error => {
  console.error(
    "Failed to generate sitemap:",
    error
  );
  throw error;
});
