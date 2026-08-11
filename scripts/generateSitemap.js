import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { itemLocationTopics } from "../src/topics/topicMetadata.js";
import {
  DYNAMAX_CRYSTAL_GUIDE_PATH,
  isDynamaxCrystalItem,
  isReleasedDynamaxCrystal,
  validateReleasedDynamaxCrystals
} from "../src/utils/dynamaxCrystals.js";

const SITE_URL = "https://pokelore.net";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "public", "data");
const outputPath = path.join(rootDir, "public", "sitemap.xml");
const newsSitemapOutputPath = path.join(
  rootDir,
  "public",
  "news-sitemap.xml"
);

async function readJson(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text);
}

async function readJsonIfExists(filePath, fallback) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }

    throw error;
  }
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
    "/dppt-feebas-calculator",
    "/single-type-coverage",
    "/moves",
    "/abilities",
    "/items",
    DYNAMAX_CRYSTAL_GUIDE_PATH,
    "/locations",
    "/news",
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
  return itemsIndex
    .filter(
      item =>
        !isDynamaxCrystalItem(item) ||
        isReleasedDynamaxCrystal(item)
    )
    .map(item =>
      route(`/item/${item.name}`)
    );
}

function locationRoutes(locationsIndex) {
  return locationsIndex.map(location =>
    route(`/location/${location.name}`)
  );
}

function topicRoutes(
  pokedexTopics,
  articleTopicIndex
) {
  return [
    ...itemLocationTopics.filter(
      topic => topic.active
    ),
    ...(pokedexTopics.topics ?? []).filter(
      topic => topic.active
    ),
    ...(articleTopicIndex.topics ?? []).filter(
      topic => topic.active !== false
    )
  ]
    .map(topic =>
      route(`/topic/${topic.slug}`)
    );
}

function newsRoutes(newsIndex) {
  return (newsIndex.articles ?? [])
    .filter(
      article =>
        article.contentType === "news" &&
        article.active !== false
    )
    .map(article =>
      route(`/news/${article.slug}`)
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
    pokedexTopics,
    articleTopicIndex,
    newsIndex
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
    ),
    readJson(
      path.join(
        dataDir,
        "topics",
        "topicIndex.json"
      )
    ),
    readJsonIfExists(
      path.join(dataDir, "news", "newsIndex.json"),
      {
        articles: []
      }
    )
  ]);

  return [
    staticRoutes(),
    pokemonRoutes(pokemonRouteLookup),
    moveRoutes(moves),
    abilityRoutes(abilities),
    itemRoutes(itemsIndex),
    locationRoutes(locationsIndex),
    topicRoutes(
      pokedexTopics,
      articleTopicIndex
    ),
    newsRoutes(newsIndex),
    typeRoutes(pokemonIndex)
  ].flat();
}

async function buildNewsSitemapArticles() {
  const newsIndex = await readJsonIfExists(
    path.join(dataDir, "news", "newsIndex.json"),
    {
      articles: []
    }
  );
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;

  return (newsIndex.articles ?? []).filter(article => {
    if (
      article.contentType !== "news" ||
      article.active === false ||
      !article.publishedAt
    ) {
      return false;
    }

    const publishedTime = new Date(
      article.publishedAt
    ).getTime();

    return (
      !Number.isNaN(publishedTime) &&
      publishedTime >= cutoff
    );
  });
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

function renderNewsSitemap(articles) {
  const entries = articles
    .map(
      article => `  <url>
    <loc>${escapeXml(route(`/news/${article.slug}`))}</loc>
    <news:news>
      <news:publication>
        <news:name>PokéLore</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(article.publishedAt)}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>
`;
}

async function main() {
  validateReleasedDynamaxCrystals();

  const urls = [...new Set(await buildRoutes())];

  await fs.writeFile(
    outputPath,
    renderSitemap(urls),
    "utf8"
  );

  const newsArticles =
    await buildNewsSitemapArticles();

  await fs.writeFile(
    newsSitemapOutputPath,
    renderNewsSitemap(newsArticles),
    "utf8"
  );

  console.log(
    `Generated sitemap with ${urls.length} URLs at ${outputPath}`
  );
  console.log(
    `Generated news sitemap with ${newsArticles.length} URLs at ${newsSitemapOutputPath}`
  );
}

main().catch(error => {
  console.error(
    "Failed to generate sitemap:",
    error
  );
  throw error;
});
